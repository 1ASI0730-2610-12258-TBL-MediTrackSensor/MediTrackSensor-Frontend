<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import useMonitoringStore from '../../application/monitoring.store.js';
import { isMockMode } from '../../../shared/infrastructure/mocks/mock-config.js';
import { getNextMockDeviceId } from '../../../shared/infrastructure/mocks/mock-database.js';
import {
  checkPlanLimit,
  resolveCurrentPlanCatalogId,
  buildPlanCard,
} from '../../../subscriptions/application/plan-catalog.js';

const monitoringStore = useMonitoringStore();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const isSaving = ref(false);
const previewId = ref('—');

const form = ref({
  type_of_medication: 'VACCINES',
  exact_location: '',
});

const sensors = ref({
  temperature: true,
  humidity: true,
  light: true,
  co2: true,
  vibration: false,
  door: false,
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
  await monitoringStore.fetchDevicesAsync();
  if (isMockMode()) {
    previewId.value = String(getNextMockDeviceId());
  } else {
    const list = monitoringStore.devices;
    const max = list.reduce((m, d) => Math.max(m, Number(d.id) || 0), 0);
    previewId.value = String(max + 1);
  }
});

const medicationOptions = computed(() => [
  { value: 'VACCINES', label: t('monitoring.medicationVaccines') },
  { value: 'PILLS', label: t('monitoring.medicationPills') },
  { value: 'CREAMS', label: t('monitoring.medicationCreams') },
  { value: 'SYRUP', label: t('monitoring.medicationSyrup') },
]);

function randomIn(min, max, decimals = 1) {
  const v = min + Math.random() * (max - min);
  return Number(v.toFixed(decimals));
}

function buildPayload() {
  const s = sensors.value;
  const payload = {
    exact_location: form.value.exact_location.trim(),
    type_of_medication: form.value.type_of_medication,
    establishment_id: 1,
    temperature: s.temperature ? randomIn(2, 8) : null,
    humidity: s.humidity ? randomIn(40, 55) : null,
    light_intensity: s.light ? randomIn(80, 220) : null,
    air_quality: s.co2 ? randomIn(350, 450) : null,
    co2: s.co2 ? randomIn(350, 450) : null,
    vibration: s.vibration ? randomIn(0.01, 0.05, 2) : null,
    door_status: s.door ? 'CLOSED' : null,
    atmospheric_pressure: s.pressure ? randomIn(1010, 1015, 1) : null,
    pm25: s.pm25 ? randomIn(8, 18, 1) : null,
    suspended_particles: s.pm25 ? randomIn(8, 18, 1) : null,
    enabled_sensors: { ...s },
  };
  return payload;
}

async function handleConfirm() {
  if (!form.value.exact_location.trim()) return;
  if (isSaving.value) return;

  const catalogId = resolveCurrentPlanCatalogId();
  const check = checkPlanLimit(catalogId, 'staticDevices', monitoringStore.devices.length);
  if (!check.allowed) {
    const plan = buildPlanCard(catalogId, t);
    toast.add({
      severity: 'warn',
      summary: t('plansPage.limits.staticDevices', { limit: check.limit, plan: plan.name }),
      life: 5000,
    });
    return;
  }

  isSaving.value = true;
  try {
    const created = await monitoringStore.createDeviceAsync(buildPayload());
    toast.add({
      severity: 'success',
      summary: t('monitoring.createSuccess'),
      life: 3000,
    });
    router.push({ name: 'device-detail', params: { deviceId: String(created.id) } });
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('monitoring.createError'),
      life: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

function goList() {
  router.push({ name: 'devices' });
}
</script>

<template>
  <div class="est-flow-page">
    <pv-toast />

    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goList">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('monitoring.backToDevices') }}</span>
      </button>
    </nav>

    <div class="est-flow-card">
      <header class="est-flow-head">
        <h1 class="est-flow-title">{{ t('monitoring.addDeviceTitle') }}</h1>
        <p class="est-flow-subtitle">{{ t('monitoring.addDeviceSubtitle') }}</p>
      </header>

      <form class="est-flow-fields est-flow-fields--span" @submit.prevent="handleConfirm">
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('monitoring.fieldId') }}</span>
          <span class="est-flow-field__value">{{ previewId }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('monitoring.fieldMedication') }} *</span>
          <select v-model="form.type_of_medication" class="est-field-select" required>
            <option v-for="opt in medicationOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="est-flow-field est-flow-field--full">
          <span class="est-flow-field__label">{{ t('monitoring.fieldExactLocation') }} *</span>
          <input
              v-model="form.exact_location"
              type="text"
              class="est-field-input"
              :placeholder="t('monitoring.placeholderLocation')"
              required
          />
        </div>

        <div class="est-flow-field est-flow-field--full">
          <p class="mon-hint">{{ t('monitoring.sensorsHint') }}</p>
          <div class="mon-sensors-grid">
            <label
                v-for="def in sensorDefs"
                :key="def.key"
                class="mon-sensor-toggle"
            >
              <span class="mon-sensor-toggle__label">{{ t(`monitoring.${def.labelKey}`) }}</span>
              <input v-model="sensors[def.key]" type="checkbox" />
              <span class="mon-switch" aria-hidden="true"></span>
            </label>
          </div>
        </div>

        <footer class="est-flow-actions" style="border-top: none; padding-top: 0; margin-top: 0.5rem">
          <button type="button" class="est-flow-btn est-flow-btn--ghost" @click="goList">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            <span>{{ t('monitoring.back') }}</span>
          </button>
          <button type="submit" class="est-flow-btn est-flow-btn--accent" :disabled="isSaving">
            <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'" aria-hidden="true"></i>
            <span>{{ isSaving ? t('monitoring.saving') : t('monitoring.confirm') }}</span>
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.est-field-input,
.est-field-select {
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
}

.est-field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.25rem;
}

.est-field-input:focus,
.est-field-select:focus {
  outline: none;
  border-color: var(--mt-primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}
</style>