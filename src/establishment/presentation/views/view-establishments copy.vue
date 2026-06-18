<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const router = useRouter();
const { t } = useI18n();

const establishments = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

const loadData = async () => {
  try {
    const data = await fetchDashboardData();
    establishments.value = data.establishments;
  } catch (error) {
    console.error("Failed to load establishments", error);
  } finally {
    isLoading.value = false;
  }
};

const filteredEst = computed(() => {
  if (!searchQuery.value) return establishments.value;
  return establishments.value.filter(e => 
    (e.establishment_name || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (e.city_region || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const stats = computed(() => {
  const total = establishments.value.length;
  const hospitals = establishments.value.filter(e => 
    e.establishment_type?.toUpperCase() === 'HOSPITAL'
  ).length;
  const warehouses = establishments.value.filter(e => 
    ['WAREHOUSE', 'ALMACEN', 'ALMACÉN', 'FACTORY', 'PLANTA'].includes(e.establishment_type?.toUpperCase())
  ).length;
  
  return {
    total,
    hospitals,
    warehouses,
    others: total - (hospitals + warehouses)
  };
});

onMounted(loadData);

const viewDetails = (id) =>
  router.push({
    name: 'establishment-detail',
    params: { establishmentId: String(id) },
  });
const goBack = () => router.back();
</script>

<template>
  <div class="view-est-container">
    <!-- Header Section -->
    <header class="page-header">
      <div class="title-group">
        <h1 class="page-title">{{ t('establishment.establishments') }}</h1>
        <p class="page-subtitle">Visualización y gestión de la red operativa de MediTrack.</p>
      </div>
      
      <div class="stats-row">
        <div class="stat-pill">
          <span class="label">Total</span>
          <span class="value">{{ stats.total }}</span>
        </div>
        <div class="stat-pill blue">
          <span class="label">Hospitales</span>
          <span class="value">{{ stats.hospitals }}</span>
        </div>
        <div class="stat-pill teal">
          <span class="label">Almacenes</span>
          <span class="value">{{ stats.warehouses }}</span>
        </div>
        <div v-if="stats.others > 0" class="stat-pill gray">
          <span class="label">Otros</span>
          <span class="value">{{ stats.others }}</span>
        </div>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="table-toolbar">
      <div class="search-wrapper">
        <i class="pi pi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Filtrar por nombre o ciudad..." />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Sincronizando red de establecimientos...</p>
    </div>

    <!-- Data List -->
    <div v-else class="est-list">
      <div
        v-for="est in filteredEst"
        :key="est.id"
        class="est-card"
        role="button"
        tabindex="0"
        @click="viewDetails(est.id)"
        @keydown.enter.prevent="viewDetails(est.id)"
      >
        <div
          class="est-icon"
          :class="(est.establishment_type || 'OTHER').toLowerCase().replace(/[^a-z0-9]/g, '') || 'other'"
        >
          <i :class="est.establishment_type === 'HOSPITAL' ? 'pi pi-heart-fill' : 'pi pi-box'"></i>
        </div>
        
        <div class="est-body">
          <div class="est-main">
            <h3>{{ est.establishment_name }}</h3>
            <span class="type-tag">{{ est.establishment_type }}</span>
          </div>
          <div class="est-meta">
            <span class="loc">
              <i class="pi pi-map-marker"></i>
              {{ est.city_region }}, {{ est.district }}
            </span>
            <span class="addr">{{ est.address }}</span>
          </div>
        </div>

        <div class="est-actions">
          <div class="status-indicator">
            <span class="dot"></span>
            Activo
          </div>
          <pv-button
            icon="pi pi-chevron-right"
            class="p-button-rounded p-button-text p-button-secondary"
            @click.stop="viewDetails(est.id)"
          />
        </div>
      </div>
      
      <div v-if="filteredEst.length === 0" class="empty-state">
        <i class="pi pi-filter-slash"></i>
        <p>No se encontraron resultados para tu búsqueda.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-est-container {
  padding: 2rem;
  max-width: 1200px;
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
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.04em;
}

.page-subtitle {
  color: #64748b;
  margin-top: 0.5rem;
  font-size: 1.1rem;
}

.stats-row {
  display: flex;
  gap: 1rem;
}

.stat-pill {
  background: #f1f5f9;
  padding: 0.5rem 1.25rem;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
}

.stat-pill .label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.stat-pill .value { font-size: 1rem; font-weight: 800; color: #1e293b; }

.stat-pill.blue { background: #eff6ff; border-color: #dbeafe; }
.stat-pill.blue .label { color: #3b82f6; }

.stat-pill.teal { background: #f0fdfa; border-color: #ccfbf1; }
.stat-pill.teal .label { color: #0d9488; }

.stat-pill.gray { background: #f8fafc; border-color: #e2e8f0; }
.stat-pill.gray .label { color: #64748b; }

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 500px;
}

.search-wrapper i {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-wrapper input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 3rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  outline: none;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.search-wrapper input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem;
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

.est-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.est-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.est-card:hover {
  transform: translateX(10px);
  border-color: #3b82f6;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.est-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.est-icon.hospital { background: #fee2e2; color: #ef4444; }
.est-icon.warehouse,
.est-icon.almacen,
.est-icon.almacn { background: #fef9c3; color: #ca8a04; }
.est-icon.other,
.est-icon.distributioncenter,
.est-icon.factory { background: #f1f5f9; color: #64748b; }

.est-body {
  flex: 1;
}

.est-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.est-main h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; }

.type-tag {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  background: #f1f5f9;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  color: #64748b;
  letter-spacing: 0.05em;
}

.est-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.est-meta .loc { font-size: 0.9rem; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 0.5rem; }
.est-meta .addr { font-size: 0.85rem; color: #94a3b8; }

.est-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #10b981;
}

.status-indicator .dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
}

.empty-state {
  padding: 5rem;
  text-align: center;
  color: #94a3b8;
}

.empty-state i { font-size: 3rem; margin-bottom: 1rem; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .est-card { flex-direction: column; align-items: flex-start; }
  .est-actions { width: 100%; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
}
</style>