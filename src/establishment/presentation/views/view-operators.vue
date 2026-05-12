<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const { t } = useI18n();
const operators = ref([]);
const users = ref([]);
const admins = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

onMounted(async () => {
  try {
    const data = await fetchDashboardData();
    operators.value = data.operators;
    users.value = data.users;
    admins.value = data.admins;
  } catch (error) {
    console.error("Error loading operators", error);
  } finally {
    isLoading.value = false;
  }
});

const getOperatorInfo = (userId) => {
  const allPersonnel = [...users.value, ...admins.value];
  return allPersonnel.find(u => u.id === userId) || { name: 'Desconocido', email: '-' };
};

const filteredOperators = computed(() => {
  if (!searchQuery.value) return operators.value;
  const query = searchQuery.value.toLowerCase();
  return operators.value.filter(op => {
    const info = getOperatorInfo(op.users_id);
    return info.name.toLowerCase().includes(query);
  });
});

const stats = computed(() => {
  const total = operators.value.length;
  const totalAlerts = operators.value.reduce((acc, op) => acc + (op.alerts_answered || 0), 0);
  return { total, totalAlerts };
});
</script>

<template>
  <div class="operators-view">
    <!-- Header with Stats -->
    <header class="page-header">
      <div class="title-group">
        <h1 class="page-title">{{ t('establishment.operators') }}</h1>
        <p class="subtitle">Monitoreo de rendimiento y asignación del equipo operativo.</p>
      </div>

      <div class="header-stats">
        <div class="header-stat-card">
          <div class="stat-icon blue"><i class="pi pi-users"></i></div>
          <div class="stat-data">
            <span class="val">{{ stats.total }}</span>
            <span class="lab">Personal Total</span>
          </div>
        </div>
        <div class="header-stat-card">
          <div class="stat-icon emerald"><i class="pi pi-bolt"></i></div>
          <div class="stat-data">
            <span class="val">{{ stats.totalAlerts }}</span>
            <span class="lab">Alertas Respondidas</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Buscar operador por nombre..." />
      </div>
    </div>

    <!-- Grid -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Sincronizando equipo operativo...</p>
    </div>

    <div v-else class="operators-grid">
      <div v-for="op in filteredOperators" :key="op.id" class="op-card-premium">
        <div class="op-card-main">
          <div class="avatar-container">
            <div class="avatar-circle">
              {{ getOperatorInfo(op.users_id).name.charAt(0) }}
            </div>
            <div class="status-dot-online"></div>
          </div>

          <div class="op-info">
            <h3>{{ getOperatorInfo(op.users_id).name }}</h3>
            <span class="op-id">ID Operador: #{{ op.id }}</span>
          </div>
        </div>

        <div class="op-metrics">
          <div class="metric">
            <span class="m-label">Turno</span>
            <span class="m-value">{{ op.schedule || 'Mañana' }}</span>
          </div>
          <div class="metric">
            <span class="m-label">Alertas</span>
            <span class="m-value highlight">{{ op.alerts_answered || 0 }}</span>
          </div>
        </div>

        <div class="op-footer">
          <pv-button label="Ver Actividad" class="p-button-text p-button-sm w-full" icon="pi pi-external-link" />
        </div>
      </div>

      <div v-if="filteredOperators.length === 0" class="empty-state">
        <i class="pi pi-search-minus"></i>
        <p>No se encontró personal con ese nombre.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.operators-view {
  padding: 2rem;
  max-width: 1300px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
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
  font-size: 2.5rem;
  font-weight: 900;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.04em;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
  font-size: 1.1rem;
}

.header-stats {
  display: flex;
  gap: 1.5rem;
}

.header-stat-card {
  background: white;
  padding: 1.25rem 1.75rem;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-icon.blue { background: #eff6ff; color: #3b82f6; }
.stat-icon.emerald { background: #ecfdf5; color: #10b981; }

.stat-data { display: flex; flex-direction: column; }
.stat-data .val { font-size: 1.25rem; font-weight: 800; color: #1e293b; line-height: 1; }
.stat-data .lab { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; margin-top: 0.25rem; }

.toolbar {
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  max-width: 450px;
}

.search-box i {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 1rem 1.25rem 1rem 3.25rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  outline: none;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.search-box input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6rem;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.operators-grid {
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.op-card-premium:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.op-card-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.avatar-container {
  position: relative;
}

.avatar-circle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  border-radius: 18px;
  box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.25);
}

.status-dot-online {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: #10b981;
  border: 3px solid white;
  border-radius: 50%;
}

.op-info h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #1e293b; }
.op-id { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

.op-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 16px;
  gap: 1rem;
}

.metric { display: flex; flex-direction: column; gap: 0.25rem; }
.m-label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.m-value { font-size: 0.9rem; font-weight: 800; color: #475569; }
.m-value.highlight { color: #3b82f6; font-size: 1.1rem; }

.empty-state {
  grid-column: 1 / -1;
  padding: 6rem;
  text-align: center;
  color: #94a3b8;
}

.empty-state i { font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.5; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-stats { width: 100%; flex-direction: column; }
}
</style>