/**
 * Application service store for the Logistics bounded context.
 *
 * @module useLogisticsStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { LogisticsApi } from '../infrastructure/logistics-api.js';
import { TransportAssembler } from '../infrastructure/transport.assembler.js';
import { Transport } from '../domain/model/transport.entity.js';
import { isMockMode } from '../../shared/infrastructure/mocks/mock-config.js';
import { MockApi } from '../../shared/infrastructure/mocks/mock-api.service.js';

const logisticsApi = new LogisticsApi();

/** Generates realistic random sensor readings based on medication type */
function generateSensorReading(typeOfMedication) {
    const r = (min, max, dec = 1) => parseFloat((min + Math.random() * (max - min)).toFixed(dec));
    const door = Math.random() < 0.15 ? 'Open' : 'Closed';
    switch (String(typeOfMedication).toLowerCase()) {
        case 'refrigerated':
            return { temperature: r(2, 8), humidity: r(40, 60), light_intensity: r(0, 50), air_quality: r(350, 420), vibration: r(0.01, 0.08, 3), atmospheric_pressure: r(1010, 1015), suspended_particles: r(5, 15), door_status: door };
        case 'biological':
            return { temperature: r(-20, -15), humidity: r(20, 35), light_intensity: r(0, 30), air_quality: r(380, 450), vibration: r(0.00, 0.03, 3), atmospheric_pressure: r(1008, 1013), suspended_particles: r(3, 10), door_status: door };
        case 'controlled':
            return { temperature: r(15, 25), humidity: r(35, 55), light_intensity: r(100, 300), air_quality: r(400, 500), vibration: r(0.05, 0.15, 3), atmospheric_pressure: r(1005, 1015), suspended_particles: r(10, 30), door_status: door };
        default:
            return { temperature: r(18, 28), humidity: r(30, 60), light_intensity: r(50, 400), air_quality: r(350, 500), vibration: r(0.02, 0.12, 3), atmospheric_pressure: r(1005, 1020), suspended_particles: r(5, 25), door_status: door };
    }
}

const useLogisticsStore = defineStore('logistics', () => {
    /** @type {import('vue').Ref<Transport[]>} */
    const transports = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);
    const transportsLoaded = ref(false);
    let simulationInterval = null;

    const transportsCount = computed(() =>
        transportsLoaded.value ? transports.value.length : 0,
    );

    function fetchTransports() {
        logisticsApi.getTransports().then((response) => {
            transports.value = TransportAssembler.toEntitiesFromResponse(response);
            transportsLoaded.value = true;
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    async function fetchTransportsAsync() {
        try {
            const response = isMockMode()
                ? await MockApi.getTransports()
                : await logisticsApi.getTransports();
            transports.value = TransportAssembler.toEntitiesFromResponse(response);
            transportsLoaded.value = true;
            return transports.value;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.getTransports();
                transports.value = TransportAssembler.toEntitiesFromResponse(fallback);
                transportsLoaded.value = true;
                return transports.value;
            }
            return [];
        }
    }

    function getTransportById(id) {
        const idNum = parseInt(id, 10);
        return transports.value.find((t) => t.id === idNum);
    }

    function addTransport(transport) {
        logisticsApi.createTransport(transport).then((response) => {
            const entity = TransportAssembler.toEntityFromResource(response.data);
            transports.value.push(entity);
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    async function createTransportAsync(transport) {
        try {
            const response = isMockMode()
                ? await MockApi.createTransport(transport)
                : await logisticsApi.createTransport(transport);
            const entity = TransportAssembler.toEntityFromResource(response.data);
            transports.value.push(entity);
            return entity;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.createTransport(transport);
                const entity = TransportAssembler.toEntityFromResource(fallback.data);
                transports.value.push(entity);
                return entity;
            }
            throw error;
        }
    }

    function updateTransport(transport) {
        logisticsApi.updateTransport(transport).then((response) => {
            const updated = TransportAssembler.toEntityFromResource(response.data);
            const index = transports.value.findIndex((t) => t.id === updated.id);
            if (index !== -1) transports.value[index] = updated;
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    function deleteTransport(transport) {
        logisticsApi.deleteTransport(transport.id).then(() => {
            const index = transports.value.findIndex((t) => t.id === transport.id);
            if (index !== -1) transports.value.splice(index, 1);
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    async function pushSimulatedReadings() {
        if (!transports.value.length) return;
        await Promise.allSettled(
            transports.value.map(async (transport) => {
                try {
                    const reading = generateSensorReading(transport.type_of_medication);
                    await logisticsApi.updateSensorData(transport.id, reading);
                    const idx = transports.value.findIndex((t) => t.id === transport.id);
                    if (idx !== -1) transports.value[idx] = { ...transports.value[idx], ...reading };
                } catch { /* non-fatal */ }
            }),
        );
    }

    function startSimulation(intervalMs = 10000) {
        if (simulationInterval !== null) return;
        pushSimulatedReadings();
        simulationInterval = setInterval(pushSimulatedReadings, intervalMs);
    }

    function stopSimulation() {
        if (simulationInterval !== null) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
    }

    return {
        transports,
        errors,
        transportsLoaded,
        transportsCount,
        fetchTransports,
        fetchTransportsAsync,
        getTransportById,
        addTransport,
        createTransportAsync,
        updateTransport,
        deleteTransport,
        pushSimulatedReadings,
        startSimulation,
        stopSimulation,
    };
});

export default useLogisticsStore;
