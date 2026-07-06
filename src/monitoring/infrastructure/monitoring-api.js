import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const devicesEndpointPath =
    import.meta.env.VITE_MONITORING_ENDPOINT_PATH || '/devices';

/**
 * Infrastructure gateway for the Monitoring bounded context.
 *
 * @class MonitoringApi
 * @extends BaseApi
 */
export class MonitoringApi extends BaseApi {
    #devicesEndpoint;

    constructor() {
        super(import.meta.env.VITE_MEDITRACK_SENSOR_DV_API);
        this.#devicesEndpoint = new BaseEndpoint(this, devicesEndpointPath);
    }

    getDevices() {
        return this.#devicesEndpoint.getAll();
    }

    getDeviceById(id) {
        return this.#devicesEndpoint.getById(id);
    }

    createDevice(resource) {
        const establishmentId = resource.establishment_id;
        const { establishment_id: _estId, ...body } = resource;
        return this.http.post(`/establishments/${establishmentId}/devices`, body);
    }

    updateDevice(resource) {
        return this.#devicesEndpoint.update(resource.id, resource);
    }

    updateSensorData(id, sensorData, establishmentId) {
        if (establishmentId) {
            return this.http.put(`/establishments/${establishmentId}/devices/${id}/sensor-data`, sensorData);
        }
        return this.#devicesEndpoint.http.put(`${devicesEndpointPath}/${id}/sensor-data`, sensorData);
    }

    deleteDevice(id, establishmentId) {
        if (establishmentId) {
            return this.http.delete(`/establishments/${establishmentId}/devices/${id}`);
        }
        return this.#devicesEndpoint.delete(id);
    }
}
