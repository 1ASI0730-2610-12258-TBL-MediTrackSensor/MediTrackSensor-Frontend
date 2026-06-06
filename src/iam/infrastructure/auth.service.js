/**
 * IAM auth orchestration (login, register, logout).
 * @module auth.service
 */
import {
    writeAuthSession,
    clearRegistrationFlow,
    readPendingRegistration,
    writePendingRegistration,
    readPendingPlan,
    writePendingPlan,
} from './auth-session.js';
import { Subscription } from '../../subscriptions/domain/model/subscription.entity.js';
import { isMockMode } from '../../shared/infrastructure/mocks/mock-config.js';
import { findMockUserByEmail, mockDb } from '../../shared/infrastructure/mocks/mock-database.js';

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function displayNameFromEmail(email) {
    const local = normalizeEmail(email).split('@')[0] || 'Usuario';
    return local.charAt(0).toUpperCase() + local.slice(1);
}

function buildHealthEntitySession(email, mockUser = null) {
    const admin = mockDb.admins[0];
    return {
        userId: mockUser?.id ?? null,
        email: normalizeEmail(email),
        name: mockUser?.name ?? displayNameFromEmail(email),
        role: 'ADMIN',
        segment: 'health-entity',
        adminId: admin?.id ?? null,
        entityCode: admin?.entity_code ?? mockUser?.entity_code ?? null,
        entityName: admin?.entity_name ?? null,
        plan: 'PROFESSIONAL',
    };
}

function buildOperationalStaffSession(email, mockUser = null) {
    const operator = mockDb.operators.find((op) => Number(op.users_id) === Number(mockUser?.id));
    return {
        userId: mockUser?.id ?? null,
        email: normalizeEmail(email),
        name: mockUser?.name ?? displayNameFromEmail(email),
        role: 'OPERATOR',
        segment: 'operational-staff',
        operatorId: operator?.id ?? null,
        establishmentId: operator?.establishment_id ?? null,
        entityCode: mockUser?.entity_code ?? mockDb.admins[0]?.entity_code ?? null,
        notAssigned: !operator?.establishment_id,
    };
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function loginHealthEntity(email, password) {
    if (!normalizeEmail(email) || !password) {
        return { ok: false, error: 'invalidCredentials' };
    }

    if (isMockMode()) {
        const mockUser = findMockUserByEmail(email);
        if (mockUser && mockUser.password !== password) {
            return { ok: false, error: 'invalidCredentials' };
        }
        const session = buildHealthEntitySession(email, mockUser);
        writeAuthSession(session);
        localStorage.setItem('userRole', 'health-entity');
        return { ok: true, session };
    }

    const session = buildHealthEntitySession(email);
    writeAuthSession(session);
    localStorage.setItem('userRole', 'health-entity');
    return { ok: true, session };
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function loginOperationalStaff(email, password) {
    if (!normalizeEmail(email) || !password) {
        return { ok: false, error: 'invalidCredentials' };
    }

    if (isMockMode()) {
        const mockUser = findMockUserByEmail(email);
        if (mockUser && mockUser.password !== password) {
            return { ok: false, error: 'invalidCredentials' };
        }
        const session = buildOperationalStaffSession(email, mockUser);
        writeAuthSession(session);
        localStorage.setItem('userRole', 'operational-staff');
        if (session.notAssigned) {
            return {
                ok: true,
                notAssigned: true,
                adminContact: mockDb.admins[0]?.entity_name ?? 'Administrador',
                session,
            };
        }
        return { ok: true, session, notAssigned: false };
    }

    const session = buildOperationalStaffSession(email);
    writeAuthSession(session);
    localStorage.setItem('userRole', 'operational-staff');
    return { ok: true, session, notAssigned: false };
}

export async function startHealthEntityRegistration(form) {
    if (!form?.name || !form?.email || !form?.password || !form?.entityName) {
        return { ok: false, error: 'required' };
    }

    writePendingRegistration({
        segment: 'health-entity',
        name: form.name,
        email: form.email,
        password: form.password,
        entityName: form.entityName,
    });
    return { ok: true };
}

export function saveRegistrationPlan(catalogPlanId) {
    writePendingPlan({
        catalogPlanId,
        planApiValue: Subscription.catalogIdToApiPlan(catalogPlanId),
        flow: 'registration',
    });
}

export async function completeHealthEntityRegistration(payment) {
    const validation = Subscription.validatePayment(payment);
    if (!validation.valid) {
        return { ok: false, errors: validation.errors };
    }

    const pending = readPendingRegistration();
    const plan = readPendingPlan();
    if (!pending || pending.segment !== 'health-entity') {
        return { ok: false, error: 'missingRegistration' };
    }
    if (!plan?.planApiValue) {
        return { ok: false, error: 'missingPlan' };
    }

    clearRegistrationFlow();
    return { ok: true, email: pending.email };
}

export async function registerOperationalStaff(form) {
    const code = String(form.entityCode || '').trim().toUpperCase();
    if (!form?.name || !form?.email || !form?.password) {
        return { ok: false, error: 'required' };
    }
    if (!code) return { ok: false, error: 'entityCodeRequired' };

    if (isMockMode()) {
        const admin = mockDb.admins.find((a) => a.entity_code === code);
        if (!admin) return { ok: false, error: 'invalidEntityCode' };
        return { ok: true, entityName: admin.entity_name };
    }

    return { ok: true, entityName: code };
}

export function logout() {
    clearRegistrationFlow();
    writeAuthSession(null);
    localStorage.removeItem('userRole');
}

export { readAuthSession } from './auth-session.js';
