import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { EstablishmentApi } from '../infrastructure/establishment-api.js';
import { EstablishmentAssembler } from '../infrastructure/establishment.assembler.js';
import { OperatorAssembler } from '../infrastructure/operator.assembler.js';
import { isMockMode } from '../../shared/infrastructure/mocks/mock-config.js';
import { MockApi } from '../../shared/infrastructure/mocks/mock-api.service.js';

const establishmentApi = new EstablishmentApi();

const useEstablishmentStore = defineStore('establishment', () => {
    const establishments = ref([]);
    const operators = ref([]);
    const errors = ref([]);
    const establishmentsLoaded = ref(false);
    const operatorsLoaded = ref(false);

    const establishmentsCount = computed(() => (
        establishmentsLoaded.value ? establishments.value.length : 0
    ));

    const operatorsCount = computed(() => (
        operatorsLoaded.value ? operators.value.length : 0
    ));

    async function fetchEstablishmentsAsync() {
        try {
            const response = isMockMode()
                ? await MockApi.getEstablishments()
                : await establishmentApi.getEstablishments();
            establishments.value = EstablishmentAssembler.toEntitiesFromResponse(response);
            establishmentsLoaded.value = true;
            return establishments.value;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.getEstablishments();
                establishments.value = EstablishmentAssembler.toEntitiesFromResponse(fallback);
                establishmentsLoaded.value = true;
                return establishments.value;
            }
            return [];
        }
    }

    function fetchEstablishments() {
        fetchEstablishmentsAsync();
    }

    async function fetchOperatorsAsync() {
        try {
            const response = isMockMode()
                ? await MockApi.getOperators()
                : await establishmentApi.getOperators();
            operators.value = OperatorAssembler.toEntitiesFromResponse(response);
            operatorsLoaded.value = true;
            return operators.value;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.getOperators();
                operators.value = OperatorAssembler.toEntitiesFromResponse(fallback);
                operatorsLoaded.value = true;
                return operators.value;
            }
            return [];
        }
    }

    function fetchOperators() {
        fetchOperatorsAsync();
    }

    async function createEstablishmentAsync(payload) {
        try {
            const response = isMockMode()
                ? await MockApi.createEstablishment(payload)
                : await establishmentApi.createEstablishment(payload);
            const created = EstablishmentAssembler.toEntityFromResource(response.data);
            establishments.value = [...establishments.value, created];
            establishmentsLoaded.value = true;
            return created;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const response = await MockApi.createEstablishment(payload);
                const created = EstablishmentAssembler.toEntityFromResource(response.data);
                establishments.value = [...establishments.value, created];
                return created;
            }
            throw error;
        }
    }

    function getEstablishmentById(id) {
        const idNum = parseInt(id, 10);
        return establishments.value.find((establishment) => establishment.id === idNum);
    }

    function getOperatorById(id) {
        const idNum = parseInt(id, 10);
        return operators.value.find((operator) => operator.id === idNum);
    }

    async function createOperatorAsync(payload) {
        try {
            const response = isMockMode()
                ? await MockApi.createOperator(payload)
                : await establishmentApi.createOperator(payload);
            const created = OperatorAssembler.toEntityFromResource(response.data);
            operators.value = [...operators.value, created];
            operatorsLoaded.value = true;
            return created;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const response = await MockApi.createOperator(payload);
                const created = OperatorAssembler.toEntityFromResource(response.data);
                operators.value = [...operators.value, created];
                return created;
            }
            throw error;
        }
    }

    async function updateOperatorAsync(payload) {
        try {
            const response = isMockMode()
                ? await MockApi.updateOperator(payload.id, payload)
                : await establishmentApi.updateOperator(payload);
            const updated = OperatorAssembler.toEntityFromResource(response.data);
            const index = operators.value.findIndex((o) => o.id === updated.id);
            if (index !== -1) operators.value[index] = updated;
            return updated;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const response = await MockApi.updateOperator(payload.id, payload);
                const updated = OperatorAssembler.toEntityFromResource(response.data);
                const index = operators.value.findIndex((o) => o.id === updated.id);
                if (index !== -1) operators.value[index] = updated;
                return updated;
            }
            throw error;
        }
    }

    /**
     * Assigns one or more operator users to an establishment (creates or updates /operators).
     * @param {{ userIds: number[], establishmentId: number|string }} params
     */
    async function assignOperatorsToEstablishmentAsync({ userIds, establishmentId }) {
        const estId = Number(establishmentId);
        const results = [];
        for (const userId of userIds) {
            const uid = Number(userId);
            const existing = operators.value.find((o) => Number(o.users_id) === uid);
            if (existing) {
                const updated = await updateOperatorAsync({
                    id: existing.id,
                    users_id: existing.users_id,
                    establishment_id: estId,
                    alerts_answered: existing.alerts_answered,
                    schedule: existing.schedule,
                });
                results.push(updated);
            } else {
                const created = await createOperatorAsync({
                    users_id: uid,
                    establishment_id: estId,
                    alerts_answered: 0,
                    schedule: 'Mañana 06:00-14:00',
                });
                results.push(created);
            }
        }
        return results;
    }

    return {
        establishments,
        operators,
        errors,
        establishmentsLoaded,
        operatorsLoaded,
        establishmentsCount,
        operatorsCount,
        fetchEstablishments,
        fetchEstablishmentsAsync,
        fetchOperators,
        fetchOperatorsAsync,
        createEstablishmentAsync,
        getEstablishmentById,
        getOperatorById,
        createOperatorAsync,
        updateOperatorAsync,
        assignOperatorsToEstablishmentAsync,
    };
});

export default useEstablishmentStore;
