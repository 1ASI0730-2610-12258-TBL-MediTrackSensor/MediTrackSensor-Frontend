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
    <!-- Monitoring Header -->
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

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="pulse-loader"></div>
      <p>Sincronizando red de sensores...</p>
    </div>

    <!-- Grid -->
    <div v-else class="devices-grid">
      <div v-for="dev in devices" :key="dev.id" class="op-card-premium">
        <div class="op-card-main">
          <div class="avatar-container">
            <div class="avatar-circle" :class="getTempStatus(dev.temperature)">
              <i class="pi pi-microchip"></i>
            </div>
            <div class="status-dot-online"></div>
          </div>
          
          <div class="op-info">
            <h3>{{ dev.exact_location }}</h3>
            <span class="op-id">NOD: {{ dev.id }} • v1.4.2</span>
          </div>
        </div>

        <div class="op-metrics">
          <div class="metric">
            <span class="m-label">Temperatura</span>
            <span class="m-value" :class="getTempStatus(dev.temperature)">
              {{ dev.temperature }}°C
            </span>
          </div>
          <div class="metric">
            <span class="m-label">Humedad</span>
            <span class="m-value">{{ dev.humidity }}%</span>
          </div>
        </div>

        <div class="op-footer">
          <div class="signal-info">
            <i class="pi pi-wifi"></i>
            <span>Señal: Excelente</span>
          </div>
          <pv-button icon="pi pi-cog" class="p-button-rounded p-button-text p-button-secondary p-button-sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.devices-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3.5rem;
  gap: 2rem;
}

.page-title {
  font-size: 2.75rem;
  font-weight: 950;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.05em;
}

.subtitle { color: #64748b; margin-top: 0.5rem; font-size: 1.15rem; font-weight: 500; }

.header-stats { display: flex; gap: 1.5rem; }

.header-stat-pill {
  background: white;
  padding: 0.75rem 1.25rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
}

.pill-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.pill-icon.blue { background: #eff6ff; color: #3b82f6; }
.pill-icon.green { background: #f0fdf4; color: #10b981; }
.pill-icon.red { background: #fef2f2; color: #ef4444; }

.pill-info { display: flex; flex-direction: column; }
.pill-info .v { font-size: 1.15rem; font-weight: 800; color: #1e293b; line-height: 1; }
.pill-info .l { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 0.2rem; }

.header-stat-pill.alert { border-color: #fee2e2; background: #fffafb; }

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rem;
  color: #94a3b8;
}

.pulse-loader {
  width: 48px; height: 48px; background: #3b82f6; border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out; margin-bottom: 2rem;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.5; }
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2.5rem;
}

.op-card-premium {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 28px;
  padding: 1.75rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.op-card-premium:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  border-color: #3b82f655;
}

.op-card-main { display: flex; align-items: center; gap: 1.25rem; }

.avatar-container { position: relative; }

.avatar-circle {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; font-weight: 800; border-radius: 20px;
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.3);
}

.avatar-circle.warning { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); box-shadow: 0 10px 20px -5px rgba(245, 158, 11, 0.3); }
.avatar-circle.critical { background: linear-gradient(135deg, #ef4444 0%, #f43f5e 100%); box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.3); }

.status-dot-online {
  position: absolute; bottom: -2px; right: -2px;
  width: 18px; height: 18px; background: #10b981;
  border: 4px solid white; border-radius: 50%;
}

.op-info h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; }
.op-id { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 0.25rem; display: block; }

.op-metrics {
  display: grid; grid-template-columns: 1fr 1fr;
  background: #f8fafc; padding: 1.25rem; border-radius: 20px; gap: 1rem;
}

.metric { display: flex; flex-direction: column; gap: 0.3rem; }
.m-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.m-value { font-size: 1.25rem; font-weight: 900; color: #1e293b; }
.m-value.safe { color: #10b981; }
.m-value.warning { color: #f59e0b; }
.m-value.critical { color: #ef4444; }

.op-footer {
  border-top: 1px solid #f1f5f9; padding-top: 1.25rem;
  display: flex; justify-content: space-between; align-items: center;
}

.signal-info { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; font-weight: 700; color: #64748b; }
.signal-info i { color: #10b981; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-stats { width: 100%; flex-direction: column; }
}
</style>