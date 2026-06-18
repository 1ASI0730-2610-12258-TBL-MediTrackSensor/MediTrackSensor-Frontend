<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import {
  fetchDashboardData,
  deleteOperator,
} from '../../../shared/infrastructure/services/dashboard.service.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const loading = ref(true);
const establishment = ref(null);
const operators = ref([]);
const devices = ref([]);
const users = ref([]);
const admins = ref([]);

function sameEst(a, b) {
  return Number(a) === Number(b) || String(a) === String(b);
}

function personnel(userId) {
  const all = [...users.value, ...admins.value];
  return all.find((u) => u.id === userId) || { name: '—', email: '—' };
}

async function load() {
  loading.value = true;
  const eid = route.params.establishmentId;
  try {
    const data = await fetchDashboardData();
    establishment.value = data.establishments.find((e) => sameEst(e.id, eid)) ?? null;
    users.value = data.users || [];
    admins.value = data.admins || [];
    operators.value = (data.operators || []).filter((op) => sameEst(op.establishment_id, eid));
    devices.value = (data.devices || []).filter((d) => sameEst(d.establishment_id, eid));
  } catch (e) {
    console.error(e);
    establishment.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.establishmentId, load);

function goDetail() {
  router.push({
    name: 'establishment-detail',
    params: { establishmentId: route.params.establishmentId },
  });
}

function openOperator(op) {
  router.push({
    name: 'establishment-operator-detail',
    params: {
      establishmentId: route.params.establishmentId,
      operatorId: String(op.id),
    },
  });
}

function openDevice(dev) {
  router.push({
    name: 'establishment-device-detail',
    params: {
      establishmentId: route.params.establishmentId,
      deviceId: String(dev.id),
    },
  });
}

async function onDeleteOperator(op) {
  const name = personnel(op.users_id).name;
  const ok = window.confirm(t('establishment.deleteConfirm', { name }));
  if (!ok) return;
  try {
    await deleteOperator(op.id);
    operators.value = operators.value.filter((o) => o.id !== op.id);
    toast.add({
      severity: 'success',
      summary: t('establishment.deleteDone'),
      detail: name,
      life: 2800,
    });
  } catch (e) {
    console.error(e);
    toast.add({
      severity: 'error',
      summary: t('establishment.deleteError'),
      life: 4000,
    });
  }
}

const pageTitle = computed(() => establishment.value?.establishment_name || t('establishment.teamTitle'));
</script>

<template>
  <div class="team-view">
    <pv-toast />
    <header class="head">
      <pv-button
        icon="pi pi-arrow-left"
        class="p-button-text p-button-sm"
        :aria-label="t('establishment.back')"
        @click="goDetail"
      />
      <div class="head-text">
        <h1>{{ pageTitle }}</h1>
        <p class="sub">{{ t('establishment.teamSubtitle') }}</p>
      </div>
    </header>

    <div v-if="loading" class="state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('establishment.detailLoading') }}</span>
    </div>

    <div v-else-if="!establishment" class="state warn">
      <p>{{ t('establishment.notFound') }}</p>
      <pv-button :label="t('establishment.back')" class="p-button-sm" @click="goDetail" />
    </div>

    <div v-else class="columns">
      <section class="panel">
        <h2>{{ t('establishment.operatorsColumn') }}</h2>
        <ul v-if="operators.length" class="rows">
          <li v-for="op in operators" :key="op.id" class="row">
            <button type="button" class="row-main" @click="openOperator(op)">
              <span class="name">{{ personnel(op.users_id).name }}</span>
              <i class="pi pi-angle-right chev" />
            </button>
            <div class="row-tools">
              <pv-button
                icon="pi pi-eye"
                class="p-button-text p-button-sm"
                :aria-label="t('establishment.viewDetail')"
                @click="openOperator(op)"
              />
              <pv-button
                icon="pi pi-trash"
                class="p-button-text p-button-sm p-button-danger"
                :aria-label="t('establishment.deleteOperator')"
                @click.stop="onDeleteOperator(op)"
              />
            </div>
          </li>
        </ul>
        <p v-else class="empty">{{ t('establishment.noOperatorsAssigned') }}</p>
      </section>

      <section class="panel">
        <h2>{{ t('establishment.devicesColumn') }}</h2>
        <ul v-if="devices.length" class="rows">
          <li v-for="dev in devices" :key="dev.id" class="row">
            <button type="button" class="row-main" @click="openDevice(dev)">
              <span class="name">{{ dev.exact_location || dev.name || `#${dev.id}` }}</span>
              <i class="pi pi-angle-right chev" />
            </button>
            <pv-button
              icon="pi pi-eye"
              class="p-button-text p-button-sm"
              :aria-label="t('establishment.viewDetail')"
              @click="openDevice(dev)"
            />
          </li>
        </ul>
        <p v-else class="empty">{{ t('establishment.noDevicesAtSite') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.team-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem;
  animation: fade 0.35s ease;
}
@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.head {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
}
.head-text h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}
.sub {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}
.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
@media (max-width: 720px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.85rem 1rem;
}
.panel h2 {
  margin: 0 0 0.65rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: #1e3a5f;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 0.2rem 0.35rem 0.2rem 0.5rem;
}
.row-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  padding: 0.35rem 0.25rem;
  font: inherit;
  color: #c2410c;
  font-weight: 600;
  font-size: 0.85rem;
}
.row-main:hover {
  color: #9a3412;
}
.chev {
  font-size: 0.75rem;
  color: #94a3b8;
}
.row-tools {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.empty {
  margin: 0;
  font-size: 0.82rem;
  color: #94a3b8;
}
.state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #64748b;
  font-size: 0.9rem;
  padding: 2rem 0;
}
.state.warn {
  flex-direction: column;
  align-items: flex-start;
}
</style>
