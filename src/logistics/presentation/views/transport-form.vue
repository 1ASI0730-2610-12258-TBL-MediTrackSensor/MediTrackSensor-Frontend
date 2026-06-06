<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import useLogisticsStore from '../../application/logistics.store.js';
import { isMockMode } from '../../../shared/infrastructure/mocks/mock-config.js';
import { getNextMockTransportId } from '../../../shared/infrastructure/mocks/mock-database.js';

const logisticsStore = useLogisticsStore();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const isSaving = ref(false);
const previewId = ref('—');

const form = ref({
  type_of_transport: 'VAN',
  type_of_medication: 'VACCINES',
});

const sensors = ref({
  temperature: true,
  humidity: true,
  light: true,
  co2: true,
  vibration: false,
  door: true,
  pressure: false,
  pm25: false,
});

const sensorDefs = [
  { key: 'temperature', labelKey: 'sensorTemp' },
  { key: 'humidity', labelKey: 'sensorHumidity' },
  { key: 'light', labelKey: 'sensorLight' },
  { key: 'co2', labelKey: 'sensorCo2' },
  { key: 'vibration', labelKey: 'sensorVibration' },
  { key: 'door', labelKey: 'sensorDoor' },
  { key: 'pressure', labelKey: 'sensorPressure' },
  { key: 'pm25', labelKey: 'sensorPm25' },
];

onMounted(async () => {
  await logisticsStore.fetchTransportsAsync();
  if (isMockMode()) {
    previewId.value = String(getNextMockTransportId());
  } else {
    const list = logisticsStore.transports;
    const max = list.reduce((m, tr) => Math.max(m, Number(tr.id) || 0), 0);
    previewId.value = String(max + 1);
  }
});

const transportOptions = computed(() => [
  { value: 'VAN', label: t('logistics.transportVan') },
  { value: 'OFF_ROAD', label: t('logistics.transportOffRoad') },
  { value: 'MOTORCYCLE', label: t('logistics.transportMotorcycle') },
  { value: 'REFRIGERATED', label: t('logistics.transportRefrigerated') },
  { value: 'COLD_CHAIN', label: t('logistics.transportColdChain') },
]);

const medicationOptions = computed(() => [
  { value: 'VACCINES', label: t('logistics.medicationVaccines') },
  { value: 'PILLS', label: t('logistics.medicationPills') },
  { value: 'CREAMS', label: t('logistics.medicationCreams') },
  { value: 'SYRUP', label: t('logistics.medicationSyrup') },
]);

function randomIn(min, max, decimals = 1) {
  const v = min + Math.random() * (max - min);
  return Number(v.toFixed(decimals));
}

function buildPayload() {
  const s = sensors.value;
  return {
    type_of_transport: form.value.type_of_transport,
    type_of_medication: form.value.type_of_medication,
    establishment_id: 1,
    temperature: s.temperature ? randomIn(2, 8) : null,
    humidity: s.humidity ? randomIn(40, 60) : null,
    light_intensity: s.light ? randomIn(70, 220) : null,
    air_quality: s.co2 ? randomIn(350, 450) : null,
    vibration: s.vibration ? randomIn(0.01, 0.06, 2) : null,
    door_status: s.door ? 'CLOSED' : null,
    atmospheric_pressure: s.pressure ? randomIn(1010, 1015, 1) : null,
    suspended_particles: s.pm25 ? randomIn(8, 18, 1) : null,
    enabled_sensors: { ...s },
  };
}

async function handleConfirm() {
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    const created = await logisticsStore.createTransportAsync(buildPayload());
    toast.add({
      severity: 'success',
      summary: t('logistics.createSuccess'),
      life: 3000,
    });
    router.push({ name: 'transport-detail', params: { transportId: String(created.id) } });
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('logistics.createError'),
      life: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

function goList() {
  router.push({ name: 'transports' });
}
</script>

<template>
  <div class="est-flow-page">
    <pv-toast />

    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goList">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('logistics.backToTransports') }}</span>
      </button>
    </nav>

    <div class="est-flow-card">
      <header class="est-flow-head">
        <h1 class="est-flow-title">{{ t('logistics.addTransportTitle') }}</h1>
        <p class="est-flow-subtitle">{{ t('logistics.addTransportSubtitle') }}</p>
      </header>

      <form class="est-flow-fields est-flow-fields--span" @submit.prevent="handleConfirm">
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('logistics.fieldId') }}</span>
          <span class="est-flow-field__value">{{ previewId }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('logistics.fieldTransportType') }} *</span>
          <select v-model="form.type_of_transport" class="log-field-select" required>
            <option v-for="opt in transportOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="est-flow-field est-flow-field--full">
          <span class="est-flow-field__label">{{ t('logistics.fieldMedication') }} *</span>
          <select v-model="form.type_of_medication" class="log-field-select" required>
            <option v-for="opt in medicationOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="est-flow-field est-flow-field--full">
          <p class="mon-hint">{{ t('logistics.sensorsHint') }}</p>
          <div class="mon-sensors-grid">
            <label v-for="def in sensorDefs" :key="def.key" class="mon-sensor-toggle">
              <span class="mon-sensor-toggle__label">{{ t(`logistics.${def.labelKey}`) }}</span>
              <input v-model="sensors[def.key]" type="checkbox" />
              <span class="mon-switch" aria-hidden="true"></span>
            </label>
          </div>
        </div>

        <footer class="est-flow-actions" style="border-top: none; padding-top: 0; margin-top: 0.5rem">
          <button type="button" class="est-flow-btn est-flow-btn--ghost" @click="goList">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            <span>{{ t('logistics.back') }}</span>
          </button>
          <button type="submit" class="est-flow-btn est-flow-btn--accent" :disabled="isSaving">
            <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'" aria-hidden="true"></i>
            <span>{{ isSaving ? t('logistics.saving') : t('logistics.confirm') }}</span>
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.log-field-select {
  width: 100%;
  margin: 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--mt-border);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mt-heading);
  background: #fff;
  font-family: inherit;
  box-sizing: border-box;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.25rem;
}

.log-field-select:focus {
  outline: none;
  border-color: var(--mt-primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}
</style>
