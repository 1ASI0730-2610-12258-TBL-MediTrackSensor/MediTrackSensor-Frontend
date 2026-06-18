import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '../infrastructure/iam-api.js';
import { UserAssembler } from '../infrastructure/user.assembler.js';
import { AdminAssembler } from '../infrastructure/admin.assembler.js';
import { readAuthSession } from '../infrastructure/auth-session.js';
import { isMockMode } from '../../shared/infrastructure/mocks/mock-config.js';
import { MockApi } from '../../shared/infrastructure/mocks/mock-api.service.js';
import { mockDb } from '../../shared/infrastructure/mocks/mock-database.js';

const iamApi = new IamApi();

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
    };
});

export default useIamStore;
