<script setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted, computed } from 'vue';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const { t } = useI18n();
const devices = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const data = await fetchDashboardData();
    devices.value = data.devices;
  } catch (error) {
    console.error("Error loading devices", error);
  } finally {
    isLoading.value = false;
  }
});

const getTempStatus = (temp) => {
  if (temp > 20) return 'critical';
  if (temp < 0) return 'warning';
  return 'safe';
};

const stats = computed(() => {
  return {
    total: devices.value.length,
    alerts: devices.value.filter(d => d.temperature > 20 || d.humidity > 60).length
  };
});
</script>

<template>
  <div class="devices-view">
    </div>
</template>

<template>
  <div class="devices-view">
    <header class="page-header">
      <div class="title-group">
        <h1 class="page-title">{{ t('monitoring.devices') }}</h1>
        <p class="subtitle">Supervisión técnica de sensores ambientales y equipos IoT.</p>
      </div>

      <div class="header-stats">
        <div class="header-stat-pill">
          <div class="pill-icon blue"><i class="pi pi-tablet"></i></div>
          <div class="pill-info">
            <span class="v">{{ stats.total }}</span>
            <span class="l">Dispositivos</span>
          </div>
        </div>
        <div class="header-stat-pill" :class="{ alert: stats.alerts > 0 }">
          <div class="pill-icon" :class="stats.alerts > 0 ? 'red' : 'green'"><i class="pi pi-check-circle"></i></div>
          <div class="pill-info">
            <span class="v">{{ stats.alerts > 0 ? stats.alerts : 'Sistema OK' }}</span>
            <span class="l">Estado Global</span>
          </div>
        </div>
      </div>
    </header>
  </div>
</template>