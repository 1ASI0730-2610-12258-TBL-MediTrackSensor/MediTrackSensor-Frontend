/**
 * Application service store for the IAM bounded context.
 * It coordinates authentication and registration use cases, exposes profile
 * state and keeps a UI-facing view of users and admins.
 *
 * @module useIamStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '../infrastructure/iam-api.js';
import { UserAssembler } from '../infrastructure/user.assembler.js';
import { AdminAssembler } from '../infrastructure/admin.assembler.js';
import { SignInAssembler } from '../infrastructure/sign-in.assembler.js';
import {
    readAuthSession,
    writeAuthSession,
    clearRegistrationFlow,
    readPendingRegistration,
    writePendingRegistration,
    readPendingPlan,
    writePendingPlan,
} from '../infrastructure/auth-session.js';
import { SignInCommand } from '../domain/sign-in.command.js';
import { RegisterHealthEntityCommand } from '../domain/register-health-entity.command.js';
import { RegisterOperationalStaffCommand } from '../domain/register-operational-staff.command.js';
import { isMockMode } from '../../shared/infrastructure/mocks/mock-config.js';
import { MockApi } from '../../shared/infrastructure/mocks/mock-api.service.js';
import { mockDb, findMockUserByEmail } from '../../shared/infrastructure/mocks/mock-database.js';
import { Subscription } from '../../subscriptions/domain/model/subscription.entity.js';

const iamApi = new IamApi();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayNameFromEmail(email) {
    const local = String(email ?? '').split('@')[0] || 'Usuario';
    return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Builds a mock health-entity (admin) session for offline development. */
function buildHealthEntitySession(email, mockUser = null, extra = {}) {
    const admin = mockDb.admins[0];
    return {
        userId: mockUser?.id ?? null,
        email,
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

/** Builds a mock operational-staff (operator) session for offline development. */
function buildOperationalStaffSession(email, mockUser = null, extra = {}) {
    const operator = mockDb.operators.find((op) => Number(op.users_id) === Number(mockUser?.id));
    return {
        userId: mockUser?.id ?? null,
        email,
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

/**
 * Authenticates against the real backend and enriches the session with the
 * admin/operator profile linked to the user.
 * @param {SignInCommand} command - Sign-in command.
 * @returns {Promise<{ok: true, session: Object} | {ok: false, error: string}>}
 */
async function signInReal(command) {
    const response = await iamApi.signIn(command);
    const session = SignInAssembler.toSessionFromResponse(response, command.segment);
    if (!session) return { ok: false, error: 'invalidCredentials' };

    // Persist the base session so the gateway interceptor authenticates enrichment calls.
    writeAuthSession(session);

    if (session.role === 'ADMIN') {
        try {
            const admins = (await iamApi.getAdmins()).data ?? [];
            const admin = admins.find((a) => Number(a.user_id ?? a.users_id) === Number(session.userId));
            if (admin) {
                session.adminId = admin.id;
                session.entityCode = admin.entity_code;
                session.entityName = admin.entity_name;
            }
        } catch {
            // non-critical — profile loads lazily via loadProfileFromSession
        }
    }

    if (session.role === 'OPERATOR') {
        try {
            const ops = (await iamApi.getOperators()).data ?? [];
            const op = ops.find((o) => Number(o.users_id) === Number(session.userId));
            if (op) {
                session.operatorId = op.id;
                session.establishmentId = op.establishment_id ?? null;
                session.notAssigned = !op.establishment_id;
            }
        } catch {
            // non-critical
        }
    }

    writeAuthSession(session);
    return { ok: true, session };
}

const useIamStore = defineStore('iam', () => {
    const users = ref([]);
    const admins = ref([]);
    const errors = ref([]);
    const usersLoaded = ref(false);
    const adminsLoaded = ref(false);

    const profileUser = ref(null);
    const profileEstablishment = ref(null);
    const profilePlanApi = ref('BASIC');
    const profileEntityCode = ref('');
    const profileEntityName = ref('');

    const usersCount = computed(() => (usersLoaded.value ? users.value.length : 0));
    const adminsCount = computed(() => (adminsLoaded.value ? admins.value.length : 0));

    // ─── Queries ────────────────────────────────────────────────────────────────

    async function fetchUsersAsync() {
        try {
            const response = isMockMode() ? await MockApi.getUsers() : await iamApi.getUsers();
            users.value = UserAssembler.toEntitiesFromResponse(response);
            usersLoaded.value = true;
            return users.value;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.getUsers();
                users.value = UserAssembler.toEntitiesFromResponse(fallback);
                usersLoaded.value = true;
                return users.value;
            }
            return [];
        }
    }

    function fetchUsers() {
        fetchUsersAsync();
    }

    async function fetchAdminsAsync() {
        try {
            const response = isMockMode() ? await MockApi.getAdmins() : await iamApi.getAdmins();
            admins.value = AdminAssembler.toEntitiesFromResponse(response);
            adminsLoaded.value = true;
            return admins.value;
        } catch (error) {
            errors.value.push(error);
            if (isMockMode()) {
                const fallback = await MockApi.getAdmins();
                admins.value = AdminAssembler.toEntitiesFromResponse(fallback);
                adminsLoaded.value = true;
                return admins.value;
            }
            return [];
        }
    }

    function fetchAdmins() {
        fetchAdminsAsync();
    }

    async function loadProfileFromSession() {
        const session = readAuthSession();
        await Promise.all([fetchUsersAsync(), fetchAdminsAsync()]);

        const user =
            (session?.userId && users.value.find((u) => Number(u.id) === Number(session.userId))) ||
            users.value.find((u) => u.email === session?.email) ||
            users.value.find((u) => u.role === (session?.role ?? 'ADMIN')) ||
            users.value[0] ||
            null;

        profileUser.value = user;

        const admin =
            admins.value.find((a) => Number(a.user_id ?? a.users_id) === Number(user?.id)) ||
            admins.value.find((a) => a.entity_code === session?.entityCode) ||
            admins.value[0] ||
            null;

        profileEntityCode.value = admin?.entity_code ?? session?.entityCode ?? '';
        profileEntityName.value = admin?.entity_name ?? session?.entityName ?? '';

        if (isMockMode()) {
            const establishment = mockDb.establishments.find(
                (e) => Number(e.admin_id) === Number(admin?.id),
            );
            profileEstablishment.value = establishment
                ? { establishment_name: admin?.entity_name ?? establishment.establishment_name }
                : admin
                  ? { establishment_name: admin.entity_name }
                  : null;
        } else {
            profileEstablishment.value = admin
                ? { establishment_name: admin.entity_name }
                : null;
        }

        profilePlanApi.value = session?.plan ?? 'PROFESSIONAL';
    }

    function getUserById(id) {
        const idNum = parseInt(id, 10);
        return users.value.find((user) => user.id === idNum);
    }

    function getAdminById(id) {
        const idNum = parseInt(id, 10);
        return admins.value.find((admin) => admin.id === idNum);
    }

    // ─── Authentication use cases ─────────────────────────────────────────────────

    /**
     * Signs a health-entity administrator in.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{ok: true, session: Object} | {ok: false, error: string}>}
     */
    async function loginHealthEntity(email, password) {
        const command = new SignInCommand({ email, password, segment: 'health-entity' });
        if (!command.email || !command.password) {
            return { ok: false, error: 'invalidCredentials' };
        }

        if (isMockMode()) {
            const mockUser = findMockUserByEmail(command.email);
            if (mockUser && mockUser.password !== command.password) {
                return { ok: false, error: 'invalidCredentials' };
            }
            const session = buildHealthEntitySession(command.email, mockUser);
            writeAuthSession(session);
            localStorage.setItem('userRole', 'health-entity');
            return { ok: true, session };
        }

        try {
            const result = await signInReal(command);
            if (!result.ok) return result;
            localStorage.setItem('userRole', 'health-entity');
            return { ok: true, session: result.session };
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 400) return { ok: false, error: 'invalidCredentials' };
            return { ok: false, error: 'networkError' };
        }
    }

    /**
     * Signs an operational-staff operator in.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} Result carrying the session and assignment status.
     */
    async function loginOperationalStaff(email, password) {
        const command = new SignInCommand({ email, password, segment: 'operational-staff' });
        if (!command.email || !command.password) {
            return { ok: false, error: 'invalidCredentials' };
        }

        if (isMockMode()) {
            const mockUser = findMockUserByEmail(command.email);
            if (mockUser && mockUser.password !== command.password) {
                return { ok: false, error: 'invalidCredentials' };
            }
            const session = buildOperationalStaffSession(command.email, mockUser);
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
            const result = await signInReal(command);
            if (!result.ok) return result;
            localStorage.setItem('userRole', 'operational-staff');
            return { ok: true, session: result.session, notAssigned: result.session.notAssigned };
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 400) return { ok: false, error: 'invalidCredentials' };
            return { ok: false, error: 'networkError' };
        }
    }

    /**
     * Stores the first step of a health-entity registration in the pending flow.
     * @param {Object} form - Registration form data.
     * @returns {Promise<{ok: boolean, error?: string}>}
     */
    async function startHealthEntityRegistration(form) {
        const command = new RegisterHealthEntityCommand(form ?? {});
        if (!command.isComplete()) {
            return { ok: false, error: 'required' };
        }
        writePendingRegistration({
            segment: 'health-entity',
            name: command.name,
            email: command.email,
            password: command.password,
            entityName: command.entityName,
        });
        return { ok: true };
    }

    /**
     * Persists the plan chosen during the registration flow.
     * @param {string} catalogPlanId - Catalog plan identifier (basic | premium | enterprise).
     */
    function saveRegistrationPlan(catalogPlanId) {
        writePendingPlan({
            catalogPlanId,
            planApiValue: Subscription.catalogIdToApiPlan(catalogPlanId),
            flow: 'registration',
        });
    }

    /**
     * Completes a health-entity registration by validating payment and creating
     * the user + admin records (skipped in mock mode).
     * @param {Object} payment - Card payment data.
     * @returns {Promise<Object>} Result of the registration.
     */
    async function completeHealthEntityRegistration(payment) {
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
                const today = new Date().toISOString().split('T')[0];
                const userResp = await iamApi.createUser({
                    name: pending.name,
                    dni: '00000000', // placeholder — user updates in profile
                    email: pending.email,
                    phone: '',
                    job_title: 'Administrador',
                    entry_date: today,
                    role: 'Admin',
                    password: pending.password,
                    photo: '',
                });
                const userId = userResp.data.id;
                const entityCode = `ENT-${userId}`;
                await iamApi.createAdmin({
                    entity_name: pending.entityName,
                    entity_code: entityCode,
                    schedule: '',
                    user_id: userId,
                });
            } catch (err) {
                console.error('Registration failed:', err?.response?.data ?? err.message);
                const message = String(err?.response?.data?.error ?? '').toLowerCase();
                if (err?.response?.status === 400 && message.includes('email already exists')) {
                    return { ok: false, error: 'emailExists' };
                }
                return { ok: false, error: 'networkError' };
            }
        }

        clearRegistrationFlow();
        return { ok: true, email: pending.email };
    }

    /**
     * Registers an operational-staff operator against an existing entity code.
     * @param {Object} form - Registration form data.
     * @returns {Promise<Object>} Result carrying the joined entity name.
     */
    async function registerOperationalStaff(form) {
        const command = new RegisterOperationalStaffCommand(form ?? {});
        if (!command.name || !command.email || !command.password) {
            return { ok: false, error: 'required' };
        }
        if (!command.entityCode) return { ok: false, error: 'entityCodeRequired' };

        if (isMockMode()) {
            const admin = mockDb.admins.find((a) => a.entity_code === command.entityCode);
            if (!admin) return { ok: false, error: 'invalidEntityCode' };
            return { ok: true, entityName: admin.entity_name };
        }

        try {
            const admins = (await iamApi.getAdmins()).data ?? [];
            const matchedAdmin = admins.find((a) => a.entity_code === command.entityCode);
            if (!matchedAdmin) return { ok: false, error: 'invalidEntityCode' };

            const today = new Date().toISOString().split('T')[0];
            await iamApi.createUser({
                name: command.name,
                dni: command.dni || '00000000',
                email: command.email,
                phone: command.phone || '',
                job_title: command.jobTitle || 'Operador',
                entry_date: today,
                role: 'Operator',
                password: command.password,
                photo: '',
            });

            return { ok: true, entityName: matchedAdmin.entity_name };
        } catch (err) {
            const status = err?.response?.status;
            if (status === 400) return { ok: false, error: 'emailExists' };
            return { ok: false, error: 'networkError' };
        }
    }

    /** Clears the active session and any in-progress registration flow. */
    function logout() {
        clearRegistrationFlow();
        writeAuthSession(null);
        localStorage.removeItem('userRole');
    }

    return {
        users,
        admins,
        errors,
        usersLoaded,
        adminsLoaded,
        usersCount,
        adminsCount,
        profileUser,
        profileEstablishment,
        profilePlanApi,
        profileEntityCode,
        profileEntityName,
        fetchUsers,
        fetchUsersAsync,
        fetchAdmins,
        fetchAdminsAsync,
        loadProfileFromSession,
        getUserById,
        getAdminById,
        loginHealthEntity,
        loginOperationalStaff,
        startHealthEntityRegistration,
        saveRegistrationPlan,
        completeHealthEntityRegistration,
        registerOperationalStaff,
        logout,
    };
});

export default useIamStore;
