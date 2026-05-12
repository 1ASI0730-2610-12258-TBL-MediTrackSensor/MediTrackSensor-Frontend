<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const { t } = useI18n();
const transports = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const data = await fetchDashboardData();
    transports.value = data.transports;
  } catch (error) {
    console.error("Error loading transports", error);
  } finally {
    isLoading.value = false;
  }
});

const getTempStatus = (temp) => {
  if (temp > 8) return 'critical';
  if (temp < 0) return 'warning';
  return 'safe';
};

const getTransportIcon = (type) => {
  const t = type.toLowerCase();
  if (t.includes('camión') || t.includes('camioneta')) return 'pi-truck';
  if (t.includes('furgoneta')) return 'pi-car';
  if (t.includes('moto')) return 'pi-directions';
  if (t.includes('dron')) return 'pi-send';
  return 'pi-box';
};

const stats = computed(() => {
  return {
    total: transports.value.length,
    alerts: transports.value.filter(t => t.temperature > 8 || t.door_status === 'OPEN').length
  };
});
</script>

<template>
  <div class="transports-view">
    <!-- Logistics Header -->
    <header class="page-header">
      <div class="title-group">
        <h1 class="page-title">{{ t('logistics.transports') }}</h1>
        <p class="subtitle">Monitoreo en tiempo real de la cadena de frío y flota activa.</p>
      </div>

      <div class="header-stats">
        <div class="header-stat-pill">
          <span class="label">Flota Activa</span>
          <span class="value">{{ stats.total }}</span>
        </div>
        <div class="header-stat-pill" :class="{ alert: stats.alerts > 0 }">
          <span class="label">Alertas Críticas</span>
          <span class="value">{{ stats.alerts }}</span>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Sincronizando sensores telemáticos...</p>
    </div>

    <!-- Grid -->
    <div v-else class="transports-grid">
      <div v-for="tr in transports" :key="tr.id" class="op-card-premium">
        <div class="op-card-main">
          <div class="avatar-container">
            <div class="avatar-circle" :class="getTempStatus(tr.temperature)">
              <i class="pi" :class="getTransportIcon(tr.type_of_transport)"></i>
            </div>
            <div class="status-dot-online" :class="{ 'bg-coral': tr.door_status === 'OPEN' }"></div>
          </div>

          <div class="op-info">
            <h3>{{ tr.type_of_transport }}</h3>
            <span class="op-id">ID UNIDAD: #{{ tr.id }}</span>
          </div>
        </div>

        <div class="cargo-section-lite">
          <span class="m-label">Carga Actual</span>
          <div class="cargo-pill">
            <i class="pi pi-box"></i>
            {{ tr.type_of_medication }}
          </div>
        </div>

        <div class="op-metrics">
          <div class="metric">
            <span class="m-label">Temperatura</span>
            <span class="m-value" :class="getTempStatus(tr.temperature)">
              {{ tr.temperature }}°C
            </span>
          </div>
          <div class="metric">
            <span class="m-label">Humedad</span>
            <span class="m-value">{{ tr.humidity }}%</span>
          </div>
        </div>

        <div class="op-footer">
          <div class="door-info">
            <i :class="tr.door_status === 'OPEN' ? 'pi pi-lock-open text-red' : 'pi pi-lock text-green'"></i>
            <span :class="tr.door_status === 'OPEN' ? 'text-red' : 'text-green'">
              Puerta {{ tr.door_status }}
            </span>
          </div>
          <pv-button icon="pi pi-map-marker" class="p-button-text p-button-sm p-button-secondary" label="GPS" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem;
}
</style>