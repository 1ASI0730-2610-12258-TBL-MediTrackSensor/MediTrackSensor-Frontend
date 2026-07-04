/**
 * Application service store for the Monitoring bounded context.
 *
 * @module useMonitoringStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { MonitoringApi } from '../infrastructure/monitoring-api.js';
import { DeviceAssembler } from '../infrastructure/device.assembler.js';
import { Device } from '../domain/model/device.entity.js';
import { isMockMode } from '../../shared/infrastructure/mocks/mock-config.js';
import { MockApi } from '../../shared/infrastructure/mocks/mock-api.service.js';

const monitoringApi = new MonitoringApi();

/** Generates realistic random sensor readings based on medication type */
function generateSensorReading(typeOfMedication) {
    const r = (min, max, dec = 1) => parseFloat((min + Math.random() * (max - min)).toFixed(dec));
    const doorStatuses = ['Open', 'Closed'];
    const door = doorStatuses[Math.floor(Math.random() * doorStatuses.length)];

    // Ranges vary by medication type
    switch (String(typeOfMedication).toLowerCase()) {
        case 'refrigerated':
            return { temperature: r(2, 8), humidity: r(40, 60), light_intensity: r(0, 50), air_quality: r(350, 420), vibration: r(0.01, 0.08, 3), atmospheric_pressure: r(1010, 1015), suspended_particles: r(5, 15), door_status: door };
        case 'biological':
            return { temperature: r(-20, -15), humidity: r(20, 35), light_intensity: r(0, 30), air_quality: r(380, 450), vibration: r(0.00, 0.03, 3), atmospheric_pressure: r(1008, 1013), suspended_particles: r(3, 10), door_status: door };
        case 'controlled':
            return { temperature: r(15, 25), humidity: r(35, 55), light_intensity: r(100, 300), air_quality: r(400, 500), vibration: r(0.05, 0.15, 3), atmospheric_pressure: r(1005, 1015), suspended_particles: r(10, 30), door_status: door };
        default: // General
            return { temperature: r(18, 28), humidity: r(30, 60), light_intensity: r(50, 400), air_quality: r(350, 500), vibration: r(0.02, 0.12, 3), atmospheric_pressure: r(1005, 1020), suspended_particles: r(5, 25), door_status: door };
    }
}

const useMonitoringStore = defineStore('monitoring', () => {
    /** @type {import('vue').Ref<Device[]>} */
    const devices = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);
    const devicesLoaded = ref(false);
    /** @type {number|null} Interval ID for sensor simulation */
    let simulationInterval = null;

    const devicesCount = computed(() =>
        devicesLoaded.value ? devices.value.length : 0,
    );

    function fetchDevices() {
        monitoringApi.getDevices().then((response) => {
            devices.value = DeviceAssembler.toEntitiesFromResponse(response);
            devicesLoaded.value = true;
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    async function fetchDevicesAsync() {
        try {
            const response = isMockMode()
                ? await MockApi.getDevices()
                : await monitoringApi.getDevices();
            devices.value = DeviceAssembler.toEntitiesFromResponse(response);
            devicesLoaded.value = true;
            return devices.value;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.getDevices();
                devices.value = DeviceAssembler.toEntitiesFromResponse(fallback);
                devicesLoaded.value = true;
                return devices.value;
            }
            return [];
        }
    }

    function getDeviceById(id) {
        const idNum = parseInt(id, 10);
        return devices.value.find((d) => d.id === idNum);
    }

    function addDevice(device) {
        monitoringApi.createDevice(device).then((response) => {
            const entity = DeviceAssembler.toEntityFromResource(response.data);
            devices.value.push(entity);
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    async function createDeviceAsync(device) {
        try {
            const response = isMockMode()
                ? await MockApi.createDevice(device)
                : await monitoringApi.createDevice(device);
            const entity = DeviceAssembler.toEntityFromResource(
                isMockMode() ? response.data : response.data,
            );
            devices.value.push(entity);
            return entity;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.createDevice(device);
                const entity = DeviceAssembler.toEntityFromResource(fallback.data);
                devices.value.push(entity);
                return entity;
            }
            throw error;
        }
    }

    function updateDevice(device) {
        monitoringApi.updateDevice(device).then((response) => {
            const updated = DeviceAssembler.toEntityFromResource(response.data);
            const index = devices.value.findIndex((d) => d.id === updated.id);
            if (index !== -1) devices.value[index] = updated;
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    async function deleteDeviceAsync(device) {
        try {
            if (!isMockMode()) {
                await monitoringApi.deleteDevice(device.id);
            }
            const index = devices.value.findIndex((d) => d.id === device.id);
            if (index !== -1) devices.value.splice(index, 1);
            return true;
        } catch (error) {
            errors.value.push(error);
            throw error;
        }
    }

    function deleteDevice(device) {
        monitoringApi.deleteDevice(device.id).then(() => {
            const index = devices.value.findIndex((d) => d.id === device.id);
            if (index !== -1) devices.value.splice(index, 1);
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    /** Sends one round of random sensor data for all loaded devices */
    async function pushSimulatedReadings() {
        if (!devices.value.length) return;
        await Promise.allSettled(
            devices.value.map(async (device) => {
                try {
                    const reading = generateSensorReading(device.type_of_medication);
                    await monitoringApi.updateSensorData(device.id, reading);
                    // Update local state so the UI reflects the new values
                    const idx = devices.value.findIndex((d) => d.id === device.id);
                    if (idx !== -1) {
                        devices.value[idx] = { ...devices.value[idx], sensor_reading: reading };
                    }
                } catch {
                    // non-fatal — next tick will retry
                }
            }),
        );
    }

    /**
     * Starts a simulation loop that sends random sensor data every `intervalMs` ms.
     * Call stopSimulation() to stop it.
     * @param {number} [intervalMs=10000] - Interval in milliseconds (default 10s)
     */
    function startSimulation(intervalMs = 10000) {
        if (simulationInterval !== null) return; // already running
        pushSimulatedReadings(); // send immediately on start
        simulationInterval = setInterval(pushSimulatedReadings, intervalMs);
    }

    function stopSimulation() {
        if (simulationInterval !== null) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
    }

    return {
        devices,
        errors,
        devicesLoaded,
        devicesCount,
        fetchDevices,
        fetchDevicesAsync,
        getDeviceById,
        addDevice,
        createDeviceAsync,
        updateDevice,
        deleteDevice,
        deleteDeviceAsync,
        pushSimulatedReadings,
        startSimulation,
        stopSimulation,
    };
});

export default useMonitoringStore;
