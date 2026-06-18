<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useMonitoringStore from '../../application/monitoring.store.js';
import { isMockMode } from '../../../shared/infrastructure/mocks/mock-config.js';

const monitoringStore = useMonitoringStore();
const router = useRouter();
const { t } = useI18n();

const devices = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

onMounted(async () => {
  try {
    devices.value = await monitoringStore.fetchDevicesAsync();
    // Start sensor simulation in real mode (every 8 seconds)
    if (!isMockMode()) monitoringStore.startSimulation(8000);
  } catch (error) {
    console.error('Error loading devices', error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  monitoringStore.stopSimulation();
});

const filteredDevices = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return devices.value;
  return devices.value.filter(
    (d) =>
      (d.exact_location || '').toLowerCase().includes(q) ||
      (d.type_of_medication || '').toLowerCase().includes(q),
  );
});

const stats = computed(() => {
  const total = devices.value.length;
  const alerts = devices.value.filter(
    (d) => Number(d.temperature) > 20 || Number(d.humidity) > 60,
  ).length;
  return { total, alerts };
});

function formatMedication(type) {
  const raw = String(type || '').toUpperCase();
  const map = {
    VACCINES: 'medicationVaccines',
    PILLS: 'medicationPills',
    CREAMS: 'medicationCreams',
    SYRUP: 'medicationSyrup',
    BIOLOGICALS: 'medicationBiologicals',
  };
  const key = map[raw];
  return key ? t(`monitoring.${key}`) : type || '—';
}

function hasAlert(dev) {
  return Number(dev.temperature) > 20 || Number(dev.humidity) > 60;
}

function goHome() {
  router.push({ name: 'home-operational-staff' });
}

function goAdd() {
  router.push({ name: 'device-new' });
}

function viewDevice(id) {
  router.push({ name: 'device-detail', params: { deviceId: String(id) } });
}
</script>

<template>
  <div class="est-flow-page">
    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goHome">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('monitoring.backToStaffHome') }}</span>
      </button>
    </nav>

    <div class="est-flow-card">
      <header class="est-flow-head est-flow-head--row">
        <div class="est-flow-head__text">
          <h1 class="est-flow-title">{{ t('monitoring.devices') }}</h1>
          <p class="est-flow-subtitle">{{ t('monitoring.listPageSubtitle') }}</p>
        </div>
        <div class="est-flow-stats">
          <div class="est-flow-stat">
            <span class="est-flow-stat__label">{{ t('monitoring.statDevices') }}</span>
            <span class="est-flow-stat__value">{{ stats.total }}</span>
          </div>
          <div class="est-flow-stat" :class="{ 'est-flow-stat--blue': stats.alerts === 0 }">
            <span class="est-flow-stat__label">{{ t('monitoring.statGlobalStatus') }}</span>
            <span class="est-flow-stat__value">
              {{ stats.alerts > 0 ? stats.alerts : t('monitoring.systemOk') }}
            </span>
          </div>
        </div>
      </header>

      <div class="mon-toolbar-actions">
        <button type="button" class="est-flow-btn est-flow-btn--accent" @click="goAdd">
          <i class="pi pi-plus" aria-hidden="true"></i>
          <span>{{ t('monitoring.addDevice') }}</span>
        </button>
      </div>

      <div class="est-flow-toolbar">
        <div class="est-flow-search">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('monitoring.searchPlaceholder')"
            autocomplete="off"
          />
        </div>
      </div>

      <div v-if="isLoading" class="est-flow-state">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <span>{{ t('monitoring.loadingDevices') }}</span>
      </div>

      <div v-else-if="filteredDevices.length === 0" class="est-flow-state">
        <i class="pi pi-filter-slash" aria-hidden="true"></i>
        <span>{{ t('monitoring.emptySearch') }}</span>
      </div>

      <div v-else class="est-flow-table-wrap">
        <table class="est-flow-table">
          <thead>
            <tr>
              <th>{{ t('monitoring.colLocation') }}</th>
              <th>{{ t('monitoring.colMedication') }}</th>
              <th>{{ t('monitoring.colTemp') }}</th>
              <th>{{ t('monitoring.colHumidity') }}</th>
              <th class="est-flow-table__actions">{{ t('monitoring.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dev in filteredDevices" :key="dev.id">
              <td>
                <div class="est-flow-table__name">
                  <i
                    v-if="hasAlert(dev)"
                    class="pi pi-exclamation-triangle"
                    style="color: #d97706; margin-right: 0.35rem; font-size: 0.85rem"
                    aria-hidden="true"
                  ></i>
                  {{ dev.exact_location || `Device #${dev.id}` }}
                </div>
                <div class="est-flow-table__meta">ID {{ dev.id }}</div>
              </td>
              <td>{{ formatMedication(dev.type_of_medication) }}</td>
              <td>
                <span :style="{ color: hasAlert(dev) ? '#dc2626' : '#059669', fontWeight: 600 }">
                  {{ dev.temperature != null ? `${dev.temperature}°C` : '—' }}
                </span>
              </td>
              <td>{{ dev.humidity != null ? `${dev.humidity}%` : '—' }}</td>
              <td class="est-flow-table__actions">
                <button
                  type="button"
                  class="est-flow-icon-btn"
                  :aria-label="t('monitoring.viewDetail')"
                  @click="viewDevice(dev.id)"
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
