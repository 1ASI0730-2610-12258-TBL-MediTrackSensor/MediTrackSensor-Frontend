<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import useLogisticsStore from '../../application/logistics.store.js';
import useEstablishmentStore from '../../../establishment/application/establishment.store.js';
import { isMockMode } from '../../../shared/infrastructure/mocks/mock-config.js';
import { getNextMockTransportId } from '../../../shared/infrastructure/mocks/mock-database.js';
import { readAuthSession } from '../../../iam/infrastructure/auth-session.js';

const logisticsStore = useLogisticsStore();
const establishmentStore = useEstablishmentStore();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const isSaving = ref(false);
const previewId = ref('—');
const establishmentOptions = ref([]);
const selectedEstablishmentId = ref(null);
const noEstablishment = ref(false);

const form = ref({
  type_of_transport: 'Van',
  type_of_medication: 'Refrigerated',
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
  try {
    await logisticsStore.fetchTransportsAsync();
    const all = await establishmentStore.fetchEstablishmentsAsync();
    const session = readAuthSession();
    const adminId = session?.adminId;
    const owned = adminId
      ? all.filter((e) => Number(e.admin_id) === Number(adminId))
      : all;
    establishmentOptions.value = owned.length ? owned : all;
    selectedEstablishmentId.value = establishmentOptions.value[0]?.id ?? null;
    noEstablishment.value = !selectedEstablishmentId.value;

    if (isMockMode()) {
      previewId.value = String(getNextMockTransportId());
    } else {
      const list = logisticsStore.transports;
      const max = list.reduce((m, tr) => Math.max(m, Number(tr.id) || 0), 0);
      previewId.value = String(max + 1);
    }
  } catch (e) {
    console.error('transport-form onMounted error:', e);
    previewId.value = '—';
    noEstablishment.value = true;
  }
});

const transportOptions = computed(() => [
  { value: 'Van', label: t('logistics.transportVan') },
  { value: 'OffRoad', label: t('logistics.transportOffRoad') },
  { value: 'Motorcycle', label: t('logistics.transportMotorcycle') },
  { value: 'Refrigerated', label: t('logistics.transportRefrigerated') },
  { value: 'ColdChain', label: t('logistics.transportColdChain') },
]);

// Backend enum values (must match Logistics TypeOfMedication PascalCase)
const medicationOptions = computed(() => [
  { value: 'Refrigerated', label: t('logistics.medicationVaccines') },
  { value: 'Biological', label: t('logistics.medicationPills') },
  { value: 'Controlled', label: t('logistics.medicationCreams') },
  { value: 'General', label: t('logistics.medicationSyrup') },
]);

function buildPayload() {
  const establishmentId = Number(selectedEstablishmentId.value);
  if (!establishmentId) {
    throw new Error('noEstablishment');
  }
  return {
    type_of_transport: form.value.type_of_transport,
    type_of_medication: form.value.type_of_medication,
    establishment_id: establishmentId,
    enabled_sensors: JSON.stringify(sensors.value),
  };
}

async function handleConfirm() {
  if (isSaving.value) return;
  if (!selectedEstablishmentId.value) {
    toast.add({
      severity: 'warn',
      summary: t('logistics.createError'),
      detail: t('logistics.noEstablishmentForTransport'),
      life: 6000,
    });
    return;
  }
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
    const detail = e?.message === 'noEstablishment'
      ? t('logistics.noEstablishmentForTransport')
      : t('logistics.createError');
    toast.add({
      severity: 'error',
      summary: t('logistics.createError'),
      detail,
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
          <span class="est-flow-field__label">{{ t('logistics.fieldEstablishment') }} *</span>
          <select
            v-if="establishmentOptions.length"
            v-model="selectedEstablishmentId"
            class="log-field-select"
            required
          >
            <option v-for="est in establishmentOptions" :key="est.id" :value="est.id">
              {{ est.establishment_name }}
            </option>
          </select>
          <p v-else class="mon-hint mon-hint--warn">{{ t('logistics.noEstablishmentForTransport') }}</p>
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

.mon-hint--warn {
  color: #b45309;
  font-weight: 600;
}

.log-field-select:focus {
  outline: none;
  border-color: var(--mt-primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}
</style>
