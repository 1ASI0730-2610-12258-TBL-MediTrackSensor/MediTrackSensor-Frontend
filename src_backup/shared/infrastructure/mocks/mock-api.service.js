/**
 * Simula respuestas HTTP para desarrollo sin backend.
 * @module mock-api.service
 */
import { mockOk, withMockDelay } from './mock-config.js';
import {
    addMockDevice,
    addMockEstablishment,
    addMockOperator,
    addMockTransport,
    cloneMockList,
    mockDb,
    updateMockOperator,
} from './mock-database.js';

export const MockApi = {
    getUsers: () => withMockDelay(mockOk(cloneMockList(mockDb.users))),
    getAdmins: () => withMockDelay(mockOk(cloneMockList(mockDb.admins))),
    getEstablishments: () => withMockDelay(mockOk(cloneMockList(mockDb.establishments))),
    getOperators: () => withMockDelay(mockOk(cloneMockList(mockDb.operators))),
    getDevices: () => withMockDelay(mockOk(cloneMockList(mockDb.devices))),
    getTransports: () => withMockDelay(mockOk(cloneMockList(mockDb.transports))),
    getSubscriptions: () => withMockDelay(mockOk(cloneMockList(mockDb.subscriptions))),
    createEstablishment: (resource) =>
        withMockDelay(mockOk(addMockEstablishment(resource))),
    createDevice: (resource) => withMockDelay(mockOk(addMockDevice(resource))),
    createTransport: (resource) => withMockDelay(mockOk(addMockTransport(resource))),
    createOperator: (resource) => withMockDelay(mockOk(addMockOperator(resource))),
    updateOperator: (id, resource) => withMockDelay(mockOk(updateMockOperator(id, resource))),
};
