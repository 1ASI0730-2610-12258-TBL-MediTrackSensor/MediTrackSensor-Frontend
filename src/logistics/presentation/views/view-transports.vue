<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useLogisticsStore from '../../application/logistics.store.js';

const logisticsStore = useLogisticsStore();
const router = useRouter();
const { t } = useI18n();

const transports = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

onMounted(async () => {
  try {
    transports.value = await logisticsStore.fetchTransportsAsync();
  } catch (error) {
    console.error('Error loading transports', error);
  } finally {
    isLoading.value = false;
  }
});

const filteredTransports = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return transports.value;
  return transports.value.filter(
    (tr) =>
      (tr.type_of_transport || '').toLowerCase().includes(q) ||
      (tr.type_of_medication || '').toLowerCase().includes(q),
  );
});

const stats = computed(() => {
  const total = transports.value.length;
  const alerts = transports.value.filter(
    (tr) => Number(tr.temperature) > 8 || isDoorOpen(tr.door_status),
  ).length;
  return { total, alerts };
});

function isDoorOpen(status) {
  const s = String(status || '').toUpperCase();
  return s.includes('OPEN') || s.includes('ABIERTA');
}

function hasAlert(tr) {
  return Number(tr.temperature) > 8 || isDoorOpen(tr.door_status);
}

function formatTransportType(type) {
  const raw = String(type || '').toUpperCase();
  const map = {
    VAN: 'transportVan',
    OFF_ROAD: 'transportOffRoad',
    MOTORCYCLE: 'transportMotorcycle',
    REFRIGERATED: 'transportRefrigerated',
    COLD_CHAIN: 'transportColdChain',
  };
  if (map[raw]) return t(`logistics.${map[raw]}`);
  return type || '—';
}

function formatMedication(med) {
  const raw = String(med || '').toUpperCase();
  const map = {
    VACCINES: 'medicationVaccines',
    VACUNAS: 'medicationVaccines',
    PILLS: 'medicationPills',
    CREAMS: 'medicationCreams',
    SYRUP: 'medicationSyrup',
    INSULINA: 'medicationInsulin',
    INSULIN: 'medicationInsulin',
  };
  for (const [key, localeKey] of Object.entries(map)) {
    if (raw.includes(key)) return t(`logistics.${localeKey}`);
  }
  return med || '—';
}

function formatDoor(status) {
  if (isDoorOpen(status)) return t('logistics.doorOpen');
  return t('logistics.doorClosed');
}

function goHome() {
  router.push({ name: 'home-operational-staff' });
}

function goAdd() {
  router.push({ name: 'transport-new' });
}

function viewTransport(id) {
  router.push({ name: 'transport-detail', params: { transportId: String(id) } });
}
</script>

<template>
  <div class="est-flow-page">
    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goHome">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('logistics.backToStaffHome') }}</span>
      </button>
    </nav>

    <div class="est-flow-card">
      <header class="est-flow-head est-flow-head--row">
        <div class="est-flow-head__text">
          <h1 class="est-flow-title">{{ t('logistics.transports') }}</h1>
          <p class="est-flow-subtitle">{{ t('logistics.listPageSubtitle') }}</p>
        </div>
        <div class="est-flow-stats">
          <div class="est-flow-stat">
            <span class="est-flow-stat__label">{{ t('logistics.statFleet') }}</span>
            <span class="est-flow-stat__value">{{ stats.total }}</span>
          </div>
          <div
            class="est-flow-stat"
            :class="stats.alerts > 0 ? '' : 'est-flow-stat--teal'"
          >
            <span class="est-flow-stat__label">{{ t('logistics.statAlerts') }}</span>
            <span class="est-flow-stat__value">{{ stats.alerts }}</span>
          </div>
        </div>
      </header>

      <div class="mon-toolbar-actions">
        <button type="button" class="est-flow-btn est-flow-btn--accent" @click="goAdd">
          <i class="pi pi-plus" aria-hidden="true"></i>
          <span>{{ t('logistics.addTransport') }}</span>
        </button>
      </div>

      <div class="est-flow-toolbar">
        <div class="est-flow-search">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('logistics.searchPlaceholder')"
            autocomplete="off"
          />
        </div>
      </div>

      <div v-if="isLoading" class="est-flow-state">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <span>{{ t('logistics.loadingTransports') }}</span>
      </div>

      <div v-else-if="filteredTransports.length === 0" class="est-flow-state">
        <i class="pi pi-filter-slash" aria-hidden="true"></i>
        <span>{{ t('logistics.emptySearch') }}</span>
      </div>

      <div v-else class="est-flow-table-wrap">
        <table class="est-flow-table">
          <thead>
            <tr>
              <th>{{ t('logistics.colTransport') }}</th>
              <th>{{ t('logistics.colMedication') }}</th>
              <th>{{ t('logistics.colTemp') }}</th>
              <th>{{ t('logistics.colHumidity') }}</th>
              <th>{{ t('logistics.colDoor') }}</th>
              <th class="est-flow-table__actions">{{ t('logistics.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tr in filteredTransports" :key="tr.id">
              <td>
                <div class="est-flow-table__name">
                  <i
                    v-if="hasAlert(tr)"
                    class="pi pi-exclamation-triangle"
                    style="color: #d97706; margin-right: 0.35rem; font-size: 0.85rem"
                    aria-hidden="true"
                  ></i>
                  {{ formatTransportType(tr.type_of_transport) }}
                </div>
                <div class="est-flow-table__meta">#{{ tr.id }}</div>
              </td>
              <td>{{ formatMedication(tr.type_of_medication) }}</td>
              <td>
                <span
                  :style="{
                    color: hasAlert(tr) && Number(tr.temperature) > 8 ? '#dc2626' : '#059669',
                    fontWeight: 600,
                  }"
                >
                  {{ tr.temperature != null ? `${tr.temperature}°C` : '—' }}
                </span>
              </td>
              <td>{{ tr.humidity != null ? `${tr.humidity}%` : '—' }}</td>
              <td>
                <span
                  :style="{
                    color: isDoorOpen(tr.door_status) ? '#dc2626' : '#059669',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                  }"
                >
                  {{ formatDoor(tr.door_status) }}
                </span>
              </td>
              <td class="est-flow-table__actions">
                <button
                  type="button"
                  class="est-flow-icon-btn"
                  :aria-label="t('logistics.viewDetail')"
                  @click="viewTransport(tr.id)"
                >
                  <i class="pi pi-eye" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
