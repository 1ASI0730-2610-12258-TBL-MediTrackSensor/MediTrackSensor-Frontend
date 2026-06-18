import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const establishmentsEndpointPath =
    import.meta.env.VITE_ESTABLISHMENT_ENDPOINT_PATH || '/establishments';
const operatorsEndpointPath = import.meta.env.VITE_OPERATOR_ENDPOINT_PATH || '/operators';

/**
 * Infrastructure gateway for the Establishment bounded context.
 *
 * @class EstablishmentApi
 * @extends BaseApi
 */
export class EstablishmentApi extends BaseApi {
    #establishmentsEndpoint;
    #operatorsEndpoint;

    constructor() {
        super(import.meta.env.VITE_MEDITRACK_SENSOR_SUB_EST_API);
        this.#establishmentsEndpoint = new BaseEndpoint(this, establishmentsEndpointPath);
        this.#operatorsEndpoint = new BaseEndpoint(this, operatorsEndpointPath);
    }

    getEstablishments() {
        return this.#establishmentsEndpoint.getAll();
    }

    getEstablishmentById(id) {
        return this.#establishmentsEndpoint.getById(id);
    }

    createEstablishment(resource) {
        return this.#establishmentsEndpoint.create(resource);
    }

    updateEstablishment(resource) {
        return this.#establishmentsEndpoint.update(resource.id, resource);
    }

    deleteEstablishment(id) {
        return this.#establishmentsEndpoint.delete(id);
    }

    getOperators() {
        return this.#operatorsEndpoint.getAll();
    }

    getOperatorById(id) {
        return this.#operatorsEndpoint.getById(id);
    }

    createOperator(resource) {
        return this.#operatorsEndpoint.create(resource);
    }

    updateOperator(resource) {
        return this.#operatorsEndpoint.update(resource.id, resource);
    }

    incrementOperatorAlert(id) {
        return this.#operatorsEndpoint.http.put(`${operatorsEndpointPath}/${id}/alert-answered`);
    }

    deleteOperator(id) {
        return this.#operatorsEndpoint.delete(id);
    }
}