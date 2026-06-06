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

const useMonitoringStore = defineStore('monitoring', () => {
    /** @type {import('vue').Ref<Device[]>} */
    const devices = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);
    const devicesLoaded = ref(false);

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

    function deleteDevice(device) {
        monitoringApi.deleteDevice(device.id).then(() => {
            const index = devices.value.findIndex((d) => d.id === device.id);
            if (index !== -1) devices.value.splice(index, 1);
        }).catch((error) => {
            errors.value.push(error);
        });
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
    };
});

export default useMonitoringStore;