import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const transportsEndpointPath =
    import.meta.env.VITE_LOGISTICS_ENDPOINT_PATH || '/transports';

/**
 * Infrastructure gateway for the Logistics bounded context.
 *
 * @class LogisticsApi
 * @extends BaseApi
 */
export class LogisticsApi extends BaseApi {
    #transportsEndpoint;

    constructor() {
        super(import.meta.env.VITE_MEDITRACK_SENSOR_OP_TR_API);
        this.#transportsEndpoint = new BaseEndpoint(this, transportsEndpointPath);
    }

    getTransports() {
        return this.#transportsEndpoint.getAll();
    }

    getTransportById(id) {
        return this.#transportsEndpoint.getById(id);
    }

    createTransport(resource) {
        return this.#transportsEndpoint.create(resource);
    }

    updateTransport(resource) {
        return this.#transportsEndpoint.update(resource.id, resource);
    }

    deleteTransport(id) {
        return this.#transportsEndpoint.delete(id);
    }
}
