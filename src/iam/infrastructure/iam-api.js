import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH || '/users';
const adminsEndpointPath = import.meta.env.VITE_ADMINS_ENDPOINT_PATH || '/admins';
const operatorsEndpointPath = import.meta.env.VITE_OPERATORS_ENDPOINT_PATH || '/operators';
const signInEndpointPath = import.meta.env.VITE_SIGNIN_ENDPOINT_PATH || '/users/sign-in';

/**
 * Infrastructure gateway for the IAM bounded context.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    #usersEndpoint;
    #adminsEndpoint;
    #operatorsEndpoint;

    constructor() {
        super(import.meta.env.VITE_MEDITRACK_SENSOR_US_AD_API);
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
        this.#adminsEndpoint = new BaseEndpoint(this, adminsEndpointPath);
        this.#operatorsEndpoint = new BaseEndpoint(this, operatorsEndpointPath);
    }

    /**
     * Authenticates a user against the sign-in endpoint.
     * @param {import('../domain/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
     * @returns {Promise<import('axios').AxiosResponse<Object>>} HTTP response with `{ user, token }`.
     */
    signIn(signInCommand) {
        return this.http.post(signInEndpointPath, {
            email: signInCommand.email,
            password: signInCommand.password,
        });
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

    getOperators() {
        return this.#operatorsEndpoint.getAll();
    }
}