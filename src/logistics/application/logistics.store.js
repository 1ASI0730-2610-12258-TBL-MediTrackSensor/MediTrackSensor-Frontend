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

const useLogisticsStore = defineStore('logistics', () => {
    /** @type {import('vue').Ref<Transport[]>} */
    const transports = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);
    const transportsLoaded = ref(false);

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
    };
});

export default useLogisticsStore;
