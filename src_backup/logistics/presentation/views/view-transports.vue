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
.transports-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 3rem;
  gap: 2rem;
}

.page-title {
  font-size: 2.75rem;
  font-weight: 900;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.04em;
}

.subtitle { color: #64748b; margin-top: 0.5rem; font-size: 1.1rem; }

.header-stats { display: flex; gap: 1rem; }

.header-stat-pill {
  background: white;
  padding: 0.75rem 1.5rem;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
}

.header-stat-pill .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.header-stat-pill .value { font-size: 1.25rem; font-weight: 800; color: #1e293b; }

.header-stat-pill.alert { border-color: #fee2e2; background: #fffafb; }
.header-stat-pill.alert .label { color: #ef4444; }
.header-stat-pill.alert .value { color: #ef4444; }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rem;
  color: #94a3b8;
}

.spinner {
  width: 44px; height: 44px; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%;
  animation: spin 1s linear infinite; margin-bottom: 1.5rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.operators-grid, .transports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.op-card-premium {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  padding: 1.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.op-card-premium:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.op-card-main { display: flex; align-items: center; gap: 1.25rem; }

.avatar-container { position: relative; }

.avatar-circle {
  width: 60px; height: 60px;
  background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%);
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 800; border-radius: 18px;
  box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.25);
}

.avatar-circle.warning { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); box-shadow: 0 8px 16px -4px rgba(245, 158, 11, 0.25); }
.avatar-circle.critical { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); box-shadow: 0 8px 16px -4px rgba(239, 68, 68, 0.25); }

.status-dot-online {
  position: absolute; bottom: -4px; right: -4px;
  width: 16px; height: 16px; background: #10b981;
  border: 3px solid white; border-radius: 50%;
}
.status-dot-online.bg-coral { background: #ef4444; }

.op-info h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #1e293b; }
.op-id { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

.cargo-section-lite { display: flex; flex-direction: column; gap: 0.4rem; }
.cargo-pill {
  background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: 10px;
  font-size: 0.85rem; font-weight: 700; color: #475569;
  display: flex; align-items: center; gap: 0.6rem; border: 1px solid #f1f5f9;
}
.cargo-pill i { color: #3b82f6; }

.op-metrics {
  display: grid; grid-template-columns: 1fr 1fr;
  background: #f8fafc; padding: 1.25rem; border-radius: 16px; gap: 1rem;
}

.metric { display: flex; flex-direction: column; gap: 0.25rem; }
.m-label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.m-value { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
.m-value.safe { color: #10b981; }
.m-value.warning { color: #f59e0b; }
.m-value.critical { color: #ef4444; }

.op-footer {
  border-top: 1px solid #f1f5f9; padding-top: 1rem;
  display: flex; justify-content: space-between; align-items: center;
}

.door-info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; }
.text-red { color: #ef4444; }
.text-green { color: #10b981; }


@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-stats { width: 100%; flex-direction: column; }
}
</style>