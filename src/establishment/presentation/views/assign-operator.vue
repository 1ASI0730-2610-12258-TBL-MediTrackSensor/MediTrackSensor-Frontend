<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const operators = ref([]);
const establishments = ref([]);
const users = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);

const loadData = async () => {
  try {
    const data = await fetchDashboardData();
    operators.value = data.operators.map(op => ({
      ...op,
      selected_est: null // Temporary selection state
    }));
    establishments.value = data.establishments;
    users.value = data.users;
  } catch (error) {
    console.error("Error loading assignment data", error);
  } finally {
    isLoading.value = false;
  }
};

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId);
  return user ? user.name : 'Desconocido';
};

const confirmAssignment = async (op) => {
  if (!op.selected_est) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Seleccione un establecimiento primero', life: 3000 });
    return;
  }

  toast.add({
    severity: 'success',
    summary: 'Asignado',
    detail: `${getUserName(op.users_id)} ahora está en ${op.selected_est.establishment_name}`,
    life: 3000
  });
};

const goBack = () => router.back();

onMounted(loadData);
</script>

<template>
  <div class="assign-container">
    <pv-toast />

    <header class="assign-header">
      <div class="title-section">
        <h1 class="page-title">{{ t('establishment.assignOperator') }}</h1>
        <p class="subtitle">Vincule personal calificado con centros de monitoreo activos.</p>
      </div>
      <div class="header-actions">
        <pv-button icon="pi pi-arrow-left" class="p-button-text" @click="goBack" />
      </div>
    </header>

    <div v-if="isLoading" class="loader-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Sincronizando base de datos...</p>
    </div>

    <div v-else class="assignment-grid">
      <div v-for="op in operators" :key="op.id" class="op-assign-card">
        <div class="card-avatar">
          <div class="avatar-inner">{{ getUserName(op.users_id).charAt(0) }}</div>
        </div>

        <div class="op-details">
          <h3>{{ getUserName(op.users_id) }}</h3>
          <span class="op-role">Operador de Campo</span>

          <div class="assign-form">
            <label>Sede a Asignar</label>
            <select v-model="op.selected_est" class="modern-select">
              <option :value="null" disabled>Seleccionar establecimiento...</option>
              <option v-for="est in establishments" :key="est.id" :value="est">
                {{ est.establishment_name }}
              </option>
            </select>

            <button @click="confirmAssignment(op)" class="btn-assign">
              Asignar Personal
              <i class="pi pi-user-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assign-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  animation: slideFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes slideFade {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.assign-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.04em;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
  font-size: 1.1rem;
}

.loader-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem;
  color: #94a3b8;
  gap: 1rem;
}

.loader-state i { font-size: 3rem; color: var(--mt-primary); }

.assignment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.op-assign-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  text-align: center;
}

.op-assign-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: #e2e8f0;
}

.card-avatar {
  flex-shrink: 0;
}

.avatar-inner {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  font-size: 1.75rem;
  font-weight: 800;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
}

.op-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.op-details h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #1e293b;
}

.op-role {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.assign-form {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.assign-form label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  text-align: left;
}

.modern-select {
  width: 100%;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
}

.modern-select:focus {
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.btn-assign {
  width: 100%;
  background: #1e293b;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-assign:hover {
  background: #334155;
  transform: scale(1.02);
}

@media (max-width: 640px) {
  .op-assign-card { flex-direction: column; text-align: center; }
  .avatar-inner { margin: 0 auto; }
  .btn-assign { width: 100%; }
}
</style>