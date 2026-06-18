import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const subscriptionsEndpointPath =
    import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH || '/subscriptions';

/**
 * Infrastructure gateway for the Subscriptions bounded context.
 *
 * @class SubscriptionsApi
 * @extends BaseApi
 */
export class SubscriptionsApi extends BaseApi {
    #subscriptionsEndpoint;

    constructor() {
        super(import.meta.env.VITE_MEDITRACK_SENSOR_SUB_EST_API);
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsEndpointPath);
    }

    /**
     * @returns {Promise<import('axios').AxiosResponse<Array<Object>|Object>>}
     */
    getSubscriptions() {
        return this.#subscriptionsEndpoint.getAll();
    }

    /**
     * @param {number|string} id
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    getSubscriptionById(id) {
        return this.#subscriptionsEndpoint.getById(id);
    }

    /**
     * @param {Object} resource
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    createSubscription(resource) {
        return this.#subscriptionsEndpoint.create(resource);
    }

    /**
     * @param {Object} resource
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    updateSubscription(resource) {
        return this.#subscriptionsEndpoint.update(resource.id, resource);
    }

    /**
     * @param {number|string} id
     * @returns {Promise<import('axios').AxiosResponse<void>>}
     */
    deleteSubscription(id) {
        return this.#subscriptionsEndpoint.delete(id);
    }
}
