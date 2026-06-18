<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fetchDashboardPayload } from '../../../shared/infrastructure/dashboard-payload.js';
import { readAuthSession } from '../../../iam/infrastructure/auth-session.js';
import { Operator } from '../../domain/model/operator.entity.js';

const router = useRouter();
const { t } = useI18n();

const operators = ref([]);
const users = ref([]);
const establishments = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const session = ref(null);

onMounted(async () => {
  session.value = readAuthSession();
  try {
    const data = await fetchDashboardPayload();
    operators.value = data.operators;
    users.value = data.users;
    establishments.value = data.establishments;
  } catch (error) {
    console.error('Error loading operators', error);
  } finally {
    isLoading.value = false;
  }
});

const scopedOperators = computed(() => {
  if (!session.value?.adminId) return operators.value;
  return Operator.getAssignedForAdmin({
    operators: operators.value,
    establishments: establishments.value,
    adminId: session.value.adminId,
  });
});

const pendingUsers = computed(() => {
  const code = session.value?.entityCode;
  if (!code) return [];
  return Operator.getPendingUsers({
    users: users.value,
    operators: operators.value,
    entityCode: code,
  });
});

function getUserById(userId) {
  const id = Operator.normalizeId(userId);
  return users.value.find((u) => Operator.normalizeId(u.id) === id) ?? { name: t('establishment.unknownUser'), email: '—' };
}

function getEstablishmentName(establishmentId) {
  if (establishmentId == null) return t('establishment.unassignedSite');
  const est = establishments.value.find((e) => Operator.normalizeId(e.id) === Operator.normalizeId(establishmentId));
  return est?.establishment_name ?? '—';
}

const tableRows = computed(() => {
  const assigned = scopedOperators.value.map((op) => {
    const user = getUserById(op.users_id);
    return {
      key: `op-${op.id}`,
      type: 'assigned',
      operator: op,
      user,
      name: user.name,
      schedule: Operator.formatSchedule(op.schedule),
      alerts: op.alerts_answered ?? 0,
      establishment: getEstablishmentName(op.establishment_id),
    };
  });
  const pending = pendingUsers.value.map((user) => ({
    key: `pending-${user.id}`,
    type: 'pending',
    operator: null,
    user,
    name: user.name,
    schedule: '—',
    alerts: '—',
    establishment: t('establishment.unassignedSite'),
  }));
  return [...assigned, ...pending];
});

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return tableRows.value;
  return tableRows.value.filter((row) => (row.name || '').toLowerCase().includes(q));
});

const stats = computed(() => {
  const total = tableRows.value.length;
  const totalAlerts = scopedOperators.value.reduce(
    (acc, op) => acc + (op.alerts_answered || 0),
    0,
  );
  return { total, totalAlerts, pending: pendingUsers.value.length };
});

function goHome() {
  router.push({ name: 'home-operational-staff' });
}

function viewOperator(op) {
  router.push({
    name: 'operator-profile',
    params: { operatorId: String(op.id) },
  });
}

function goAssign() {
  router.push({ name: 'assign-operator' });
}
</script>

<template>
  <div class="est-flow-page">
    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goHome">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('establishment.backToStaffHome') }}</span>
      </button>
    </nav>

    <div class="est-flow-card">
      <header class="est-flow-head est-flow-head--row">
        <div class="est-flow-head__text">
          <h1 class="est-flow-title">{{ t('establishment.operators') }}</h1>
          <p class="est-flow-subtitle">{{ t('establishment.operatorsListSubtitle') }}</p>
        </div>
        <div class="est-flow-stats">
          <div class="est-flow-stat est-flow-stat--blue">
            <span class="est-flow-stat__label">{{ t('establishment.statTotalStaff') }}</span>
            <span class="est-flow-stat__value">{{ stats.total }}</span>
          </div>
          <div class="est-flow-stat est-flow-stat--teal">
            <span class="est-flow-stat__label">{{ t('establishment.statAlertsAnswered') }}</span>
            <span class="est-flow-stat__value">{{ stats.totalAlerts }}</span>
          </div>
          <div v-if="stats.pending > 0" class="est-flow-stat">
            <span class="est-flow-stat__label">{{ t('establishment.statUnassigned') }}</span>
            <span class="est-flow-stat__value">{{ stats.pending }}</span>
          </div>
        </div>
      </header>

      <div class="est-flow-toolbar">
        <div class="est-flow-search">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('establishment.searchOperatorsPlaceholder')"
            autocomplete="off"
          />
        </div>
      </div>

      <div v-if="isLoading" class="est-flow-state">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <span>{{ t('establishment.loadingOperators') }}</span>
      </div>

      <div v-else-if="filteredRows.length === 0" class="est-flow-state">
        <i class="pi pi-filter-slash" aria-hidden="true"></i>
        <span>{{ t('establishment.emptyOperatorsSearch') }}</span>
      </div>

      <div v-else class="est-flow-table-wrap">
        <table class="est-flow-table">
          <thead>
            <tr>
              <th>{{ t('establishment.colOpName') }}</th>
              <th>{{ t('establishment.colOpShift') }}</th>
              <th>{{ t('establishment.colOpAlerts') }}</th>
              <th>{{ t('establishment.colOpEstablishment') }}</th>
              <th class="est-flow-table__actions">{{ t('establishment.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filteredRows"
              :key="row.key"
              :class="{ 'op-row--pending': row.type === 'pending' }"
            >
              <td>
                <div class="est-flow-table__name">{{ row.name }}</div>
                <div v-if="row.type === 'assigned'" class="est-flow-table__meta">
                  #{{ row.operator.id }}
                </div>
                <span v-else class="est-flow-type-tag" style="margin-top: 0.25rem">
                  {{ t('establishment.pendingBadge') }}
                </span>
              </td>
              <td>{{ row.schedule }}</td>
              <td>
                <span
                  v-if="row.type === 'assigned'"
                  style="font-weight: 700; color: var(--mt-primary)"
                >
                  {{ row.alerts }}
                </span>
                <span v-else>—</span>
              </td>
              <td>{{ row.establishment }}</td>
              <td class="est-flow-table__actions">
                <button
                  v-if="row.type === 'assigned'"
                  type="button"
                  class="est-flow-icon-btn"
                  :aria-label="t('establishment.viewDetail')"
                  @click="viewOperator(row.operator)"
                >
                  <i class="pi pi-eye" aria-hidden="true"></i>
                </button>
                <button
                  v-else
                  type="button"
                  class="est-flow-icon-btn"
                  :aria-label="t('establishment.assignSite')"
                  :title="t('establishment.assignSite')"
                  @click="goAssign"
                >
                  <i class="pi pi-user-plus" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.op-row--pending td {
  background: #fffbeb;
}
</style>
