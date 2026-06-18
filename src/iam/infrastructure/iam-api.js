import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH || '/users';
const adminsEndpointPath = import.meta.env.VITE_ADMINS_ENDPOINT_PATH || '/admins';

/**
 * Infrastructure gateway for the IAM bounded context.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    #usersEndpoint;
    #adminsEndpoint;

    constructor() {
        super(import.meta.env.VITE_MEDITRACK_SENSOR_US_AD_API);
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
        this.#adminsEndpoint = new BaseEndpoint(this, adminsEndpointPath);
    }

    getUsers() {
        return this.#usersEndpoint.getAll();
    }

    getUserById(id) {
        return this.#usersEndpoint.getById(id);
    }

    createUser(resource) {
        return this.#usersEndpoint.create(resource);
    }

    updateUser(resource) {
        return this.#usersEndpoint.update(resource.id, resource);
    }

    deleteUser(id) {
        return this.#usersEndpoint.delete(id);
    }

    getAdmins() {
        return this.#adminsEndpoint.getAll();
    }

    getAdminById(id) {
        return this.#adminsEndpoint.getById(id);
    }

    createAdmin(resource) {
        return this.#adminsEndpoint.create(resource);
    }

    updateAdmin(resource) {
        return this.#adminsEndpoint.update(resource.id, resource);
    }

    deleteAdmin(id) {
        return this.#adminsEndpoint.delete(id);
    }
}