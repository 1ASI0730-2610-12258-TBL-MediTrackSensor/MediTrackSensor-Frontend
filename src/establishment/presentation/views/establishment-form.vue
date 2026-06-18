<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { fetchDashboardData, createEstablishment } from '../../../shared/infrastructure/services/dashboard.service.js';

const { t } = useI18n();
const toast = useToast();
const establishments = ref([]);
const isLoading = ref(true);
const isSaving = ref(false);

const newEstablishment = ref({
  establishment_name: '',
  establishment_type: 'HOSPITAL',
  city_region: '',
  district: '',
  address: ''
});

const loadData = async () => {
  isLoading.value = true;
  try {
    const data = await fetchDashboardData();
    establishments.value = data.establishments;
  } catch (error) {
    console.error("Error loading establishments", error);
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  if (isSaving.value) return;
  
  isSaving.value = true;
  try {
    // Auto-generate fields
    const nameSlug = newEstablishment.value.establishment_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomPhone = Math.floor(900000000 + Math.random() * 99999999).toString();
    const now = new Date();
    
    const payload = {
      ...newEstablishment.value,
      lat: (-12.04 + (Math.random() - 0.5) * 0.5).toFixed(6),
      lng: (-77.03 + (Math.random() - 0.5) * 0.5).toFixed(6),
      website: `www.${nameSlug}.com`,
      email: `${nameSlug}@gmail.com`,
      phone: randomPhone,
      created_at: now.toLocaleString('es-PE', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      })
    };

    await createEstablishment(payload);
    
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Establecimiento registrado con datos automáticos',
      life: 3000
    });
    
    // Limpiar formulario
    newEstablishment.value = {
      establishment_name: '',
      establishment_type: 'HOSPITAL',
      city_region: '',
      district: '',
      address: ''
    };
    
    // Refrescar tabla
    await loadData();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo registrar el establecimiento',
      life: 5000
    });
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="add-establishment-container">
    <pv-toast />
    
    <!-- Header Section -->
    <header class="page-header">
      <h1 class="page-title">{{ t('establishment.addEstablishment') }}</h1>
      <p class="page-subtitle">Registra nuevos centros operativos en la red de MediTrack.</p>
    </header>

    <div class="content-grid">
      <!-- Form Section -->
      <section class="form-section card">
        <div class="card-header">
          <i class="pi pi-plus-circle"></i>
          <h3>Nuevo Establecimiento</h3>
        </div>
        
        <form @submit.prevent="handleSave" class="establishment-form">
          <div class="form-grid">
            <div class="form-field">
              <label>Nombre del Establecimiento</label>
              <input v-model="newEstablishment.establishment_name" type="text" placeholder="Ej. Hospital Central Norte" required />
            </div>
            <div class="form-field">
              <label>Tipo</label>
              <select v-model="newEstablishment.establishment_type">
                <option value="HOSPITAL">Hospital</option>
                <option value="WAREHOUSE">Almacén</option>
                <option value="CLINIC">Clínica</option>
              </select>
            </div>
            <div class="form-field">
              <label>Región / Ciudad</label>
              <input v-model="newEstablishment.city_region" type="text" placeholder="Ej. Lima" required />
            </div>
            <div class="form-field">
              <label>Distrito</label>
              <input v-model="newEstablishment.district" type="text" placeholder="Ej. San Isidro" />
            </div>
            <div class="form-field full-width">
              <label>Dirección Exacta</label>
              <input v-model="newEstablishment.address" type="text" placeholder="Ej. Av. Las Flores 456" />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
              {{ isSaving ? 'Guardando...' : 'Registrar Establecimiento' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Preview Table Section -->
      <section class="table-section card">
        <div class="card-header">
          <i class="pi pi-database"></i>
          <h3>Registros en Fake API (Vista Previa)</h3>
        </div>

        <div v-if="isLoading" class="loader">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Consultando MockAPI...</span>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Establecimiento</th>
                <th>Contacto Digital</th>
                <th>Teléfono</th>
                <th>Creado el</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="est in establishments" :key="est.id">
                <td>#{{ est.id }}</td>
                <td>
                  <div class="font-bold">{{ est.establishment_name }}</div>
                  <div class="text-sm text-gray">{{ est.city_region }}, {{ est.district }}</div>
                </td>
                <td>
                  <div class="text-blue">{{ est.website }}</div>
                  <div class="text-xs text-muted">{{ est.email }}</div>
                </td>
                <td>{{ est.phone || '9********' }}</td>
                <td>{{ est.created_at || 'Recién creado' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.add-establishment-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 1rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--mt-heading);
  margin: 0;
  letter-spacing: -0.03em;
}

.page-subtitle {
  color: var(--mt-text-muted);
  margin-top: 0.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.card {
  background: white;
  border: 1px solid var(--mt-border);
  border-radius: var(--mt-radius-lg);
  padding: 2rem;
  box-shadow: var(--mt-shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  color: var(--mt-primary);
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--mt-heading);
}

.establishment-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: span 2;
}

.form-field label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--mt-heading);
}

.form-field input, .form-field select {
  padding: 0.85rem 1.25rem;
  background-color: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.form-field input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.form-field input:focus, .form-field select:focus {
  outline: none;
  border-color: var(--mt-primary);
  background-color: #fff;
  box-shadow: 0 0 0 4px var(--mt-primary-soft), 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.form-field select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.25rem;
  padding-right: 3rem;
}

.btn-primary {
  background: var(--mt-primary);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: var(--mt-radius);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.btn-primary:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 1rem;
  background: #f8fafc;
  color: var(--mt-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
}

.data-table td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--mt-border);
  font-size: 0.95rem;
}

.font-bold { font-weight: 700; }
.text-sm { font-size: 0.85rem; }
.text-xs { font-size: 0.75rem; }
.text-blue { color: #3b82f6; font-weight: 600; }
.text-gray { color: #64748b; }
.text-muted { color: #94a3b8; }

.status-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.active {
  background: #ecfdf5;
  color: #10b981;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: var(--mt-text-muted);
  gap: 1rem;
}

.loader i {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-field.full-width { grid-column: span 1; }
}
</style>