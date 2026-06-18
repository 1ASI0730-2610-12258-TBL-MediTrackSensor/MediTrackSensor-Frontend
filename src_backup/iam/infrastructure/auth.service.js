/**
 * IAM auth orchestration (login, register, logout).
 * When VITE_USE_MOCKS=false, calls the real MediTrackSensor backend.
 * @module auth.service
 */
import axios from 'axios';
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

const baseURL =
    import.meta.env.VITE_MEDITRACK_SENSOR_US_AD_API ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:5000/api/v1';

/** Raw Axios instance (no auth interceptor needed — we ARE the auth layer here) */
const authHttp = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function displayNameFromEmail(email) {
    const local = normalizeEmail(email).split('@')[0] || 'Usuario';
    return local.charAt(0).toUpperCase() + local.slice(1);
}

// ─── Mock helpers ────────────────────────────────────────────────────────────

function buildHealthEntitySession(email, mockUser = null, extra = {}) {
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
        ...extra,
    };
}

function buildOperationalStaffSession(email, mockUser = null, extra = {}) {
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
        ...extra,
    };
}

// ─── Real API helpers ─────────────────────────────────────────────────────────

/**
 * Calls POST /users/sign-in and returns a normalised session object.
 * @param {string} email
 * @param {string} password
 * @param {'health-entity'|'operational-staff'} segment
 */
async function signInReal(email, password, segment) {
    const response = await authHttp.post('/users/sign-in', { email, password });
    const { user, token } = response.data;

    const backendRole = String(user.role ?? '').toLowerCase(); // 'admin' | 'operator'

    if (segment === 'health-entity' && backendRole !== 'admin') {
        return { ok: false, error: 'invalidCredentials' };
    }
    if (segment === 'operational-staff' && backendRole !== 'operator') {
        return { ok: false, error: 'invalidCredentials' };
    }

    const session = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: backendRole.toUpperCase(),
        segment,
        token,
        adminId: null,
        entityCode: null,
        entityName: null,
        operatorId: null,
        establishmentId: null,
        notAssigned: true,
    };

    // For admins: resolve adminId + entityCode from /admins
    if (backendRole === 'admin') {
        try {
            const adminsResp = await authHttp.get('/admins', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const admins = adminsResp.data ?? [];
            const admin = admins.find((a) => Number(a.user_id ?? a.users_id) === Number(user.id));
            if (admin) {
                session.adminId = admin.id;
                session.entityCode = admin.entity_code;
                session.entityName = admin.entity_name;
            }
        } catch {
            // non-critical — profile loads lazily in iam.store
        }
    }

    // For operators: resolve operatorId + establishmentId from /operators
    if (backendRole === 'operator') {
        try {
            const opsResp = await authHttp.get('/operators', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const ops = opsResp.data ?? [];
            const op = ops.find((o) => Number(o.users_id) === Number(user.id));
            if (op) {
                session.operatorId = op.id;
                session.establishmentId = op.establishment_id ?? null;
                session.notAssigned = !op.establishment_id;
            }
        } catch {
            // non-critical
        }
    }

    return { ok: true, session };
}

// ─── Public API ───────────────────────────────────────────────────────────────

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

    try {
        const result = await signInReal(normalizeEmail(email), password, 'health-entity');
        if (!result.ok) return result;
        writeAuthSession(result.session);
        localStorage.setItem('userRole', 'health-entity');
        return { ok: true, session: result.session };
    } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 400) return { ok: false, error: 'invalidCredentials' };
        return { ok: false, error: 'networkError' };
    }
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

    try {
        const result = await signInReal(normalizeEmail(email), password, 'operational-staff');
        if (!result.ok) return result;
        writeAuthSession(result.session);
        localStorage.setItem('userRole', 'operational-staff');
        return { ok: true, session: result.session, notAssigned: result.session.notAssigned };
    } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 400) return { ok: false, error: 'invalidCredentials' };
        return { ok: false, error: 'networkError' };
    }
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

    if (!isMockMode()) {
        try {
            // 1. Create user (Admin role)
            const today = new Date().toISOString().split('T')[0];
            const userResp = await authHttp.post('/users', {
                name: pending.name,
                dni: '00000000',          // placeholder — user updates in profile
                email: pending.email,
                phone: '',
                job_title: 'Administrador',
                entry_date: today,
                role: 'Admin',
                password: pending.password,
                photo: '',
            });
            const userId = userResp.data.id;

            // 2. Create admin profile
            const entityCode = `ENT-${userId}`;
            await authHttp.post('/admins', {
                entity_name: pending.entityName,
                entity_code: entityCode,
                schedule: '',
                user_id: userId,
            });
        } catch (err) {
            console.error('Registration failed:', err?.response?.data ?? err.message);
            return { ok: false, error: 'registrationFailed' };
        }
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

    try {
        // Validate entity code exists
        const adminsResp = await authHttp.get('/admins');
        const admins = adminsResp.data ?? [];
        const matchedAdmin = admins.find((a) => a.entity_code === code);
        if (!matchedAdmin) return { ok: false, error: 'invalidEntityCode' };

        // Create user (Operator role)
        const today = new Date().toISOString().split('T')[0];
        await authHttp.post('/users', {
            name: form.name,
            dni: form.dni ?? '00000000',
            email: form.email,
            phone: form.phone ?? '',
            job_title: form.jobTitle ?? 'Operador',
            entry_date: today,
            role: 'Operator',
            password: form.password,
            photo: '',
        });

        return { ok: true, entityName: matchedAdmin.entity_name };
    } catch (err) {
        const status = err?.response?.status;
        if (status === 400) return { ok: false, error: 'emailAlreadyExists' };
        return { ok: false, error: 'networkError' };
    }
}

export function logout() {
    clearRegistrationFlow();
    writeAuthSession(null);
    localStorage.removeItem('userRole');
}

export { readAuthSession } from './auth-session.js';
