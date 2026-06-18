/**
 * Application service store for the Subscriptions bounded context.
 *
 * @module useSubscriptionsStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api.js';
import { SubscriptionAssembler } from '../infrastructure/subscription.assembler.js';
import { Subscription } from '../domain/model/subscription.entity.js';
import { isMockMode } from '../../shared/infrastructure/mocks/mock-config.js';
import { MockApi } from '../../shared/infrastructure/mocks/mock-api.service.js';

const subscriptionsApi = new SubscriptionsApi();

const useSubscriptionsStore = defineStore('subscriptions', () => {
    /** @type {import('vue').Ref<Subscription[]>} */
    const subscriptions = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);
    const subscriptionsLoaded = ref(false);

    const subscriptionsCount = computed(() =>
        subscriptionsLoaded.value ? subscriptions.value.length : 0,
    );

    function fetchSubscriptions() {
        subscriptionsApi.getSubscriptions().then((response) => {
            subscriptions.value = SubscriptionAssembler.toEntitiesFromResponse(response);
            subscriptionsLoaded.value = true;
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    async function fetchSubscriptionsAsync() {
        try {
            const response = isMockMode()
                ? await MockApi.getSubscriptions()
                : await subscriptionsApi.getSubscriptions();
            subscriptions.value = SubscriptionAssembler.toEntitiesFromResponse(response);
            subscriptionsLoaded.value = true;
            return subscriptions.value;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.getSubscriptions();
                subscriptions.value = SubscriptionAssembler.toEntitiesFromResponse(fallback);
                subscriptionsLoaded.value = true;
                return subscriptions.value;
            }
            return [];
        }
    }

    function getSubscriptionById(id) {
        const idNum = parseInt(id, 10);
        return subscriptions.value.find((s) => s.id === idNum);
    }

    function addSubscription(subscription) {
        subscriptionsApi.createSubscription(subscription).then((response) => {
            const entity = SubscriptionAssembler.toEntityFromResource(response.data);
            subscriptions.value.push(entity);
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    function updateSubscription(subscription) {
        subscriptionsApi.updateSubscription(subscription).then((response) => {
            const updated = SubscriptionAssembler.toEntityFromResource(response.data);
            const index = subscriptions.value.findIndex((s) => s.id === updated.id);
            if (index !== -1) subscriptions.value[index] = updated;
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    function deleteSubscription(subscription) {
        subscriptionsApi.deleteSubscription(subscription.id).then(() => {
            const index = subscriptions.value.findIndex((s) => s.id === subscription.id);
            if (index !== -1) subscriptions.value.splice(index, 1);
        }).catch((error) => {
            errors.value.push(error);
        });
    }

    // ── Plan context (sessionStorage) ─────────────────────────────────────────

    const PLAN_CONTEXT_KEY = 'meditrack_plan_context';

    function readPlanContext() {
        try {
            const raw = sessionStorage.getItem(PLAN_CONTEXT_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function writePlanContext(ctx) {
        sessionStorage.setItem(PLAN_CONTEXT_KEY, JSON.stringify(ctx));
    }

    function apiPlanToCatalogId(apiPlan) {
        return Subscription.apiPlanToCatalogId(apiPlan);
    }

    return {
        subscriptions,
        errors,
        subscriptionsLoaded,
        subscriptionsCount,
        fetchSubscriptions,
        fetchSubscriptionsAsync,
        getSubscriptionById,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        readPlanContext,
        writePlanContext,
        apiPlanToCatalogId,
    };
});

export default useSubscriptionsStore;
