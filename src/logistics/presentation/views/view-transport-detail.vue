<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useLogisticsStore from '../../application/logistics.store.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const logisticsStore = useLogisticsStore();

const loading = ref(true);
const transport = ref(null);

function num(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function metricStatus(key, tr) {
  const temp = num(tr.temperature);
  const hum = num(tr.humidity);
  const lux = num(tr.light_intensity);
  const vib = num(tr.vibration);
  const door = String(tr.door_status ?? '').toUpperCase();
  const co2 = num(tr.air_quality);
  const pm = num(tr.suspended_particles);

  if (key === 'temperature') {
    if (temp == null) return 'unknown';
    if (temp > 8 || temp < 0) return temp > 8 ? 'critical' : 'warning';
    return 'ok';
  }
  if (key === 'humidity') {
    if (hum == null) return 'unknown';
    if (hum > 75) return 'critical';
    if (hum > 60) return 'warning';
    return 'ok';
  }
  if (key === 'light') {
    if (lux == null) return 'unknown';
    if (lux > 800) return 'warning';
    return 'ok';
  }
  if (key === 'vibration') {
    if (vib == null) return 'unknown';
    if (vib > 0.15) return 'critical';
    if (vib > 0.08) return 'warning';
    return 'ok';
  }
  if (key === 'door') {
    if (!door) return 'unknown';
    return door.includes('OPEN') || door.includes('ABIERTA') ? 'critical' : 'ok';
  }
  if (key === 'co2') {
    if (co2 == null) return 'unknown';
    if (co2 > 1200) return 'critical';
    if (co2 > 800) return 'warning';
    return 'ok';
  }
  if (key === 'pm25') {
    if (pm == null) return 'unknown';
    if (pm > 55) return 'critical';
    if (pm > 35) return 'warning';
    return 'ok';
  }
  if (key === 'pressure') {
    const p = num(tr.atmospheric_pressure);
    if (p == null) return 'unknown';
    if (p < 980 || p > 1040) return 'warning';
    return 'ok';
  }
  return 'ok';
}

const metricDefs = [
  { key: 'temperature', labelKey: 'sensorTemp', text: (tr) => (tr.temperature != null ? `${tr.temperature} °C` : null) },
  { key: 'humidity', labelKey: 'sensorHumidity', text: (tr) => (tr.humidity != null ? `${tr.humidity} % RH` : null) },
  { key: 'light', labelKey: 'sensorLight', text: (tr) => (tr.light_intensity != null ? `${tr.light_intensity} LUX` : null) },
  { key: 'vibration', labelKey: 'sensorVibration', text: (tr) => (tr.vibration != null ? `${tr.vibration} m/s²` : null) },
  { key: 'door', labelKey: 'sensorDoor', text: (tr) => tr.door_status ?? null },
  { key: 'co2', labelKey: 'sensorCo2', text: (tr) => (tr.air_quality != null ? `${tr.air_quality} CO₂ PPM` : null) },
  { key: 'pressure', labelKey: 'sensorPressure', text: (tr) => (tr.atmospheric_pressure != null ? `${tr.atmospheric_pressure} hPa` : null) },
  { key: 'pm25', labelKey: 'sensorPm25', text: (tr) => (tr.suspended_particles != null ? `${tr.suspended_particles} PM2.5` : null) },
];

const metrics = computed(() => {
  const tr = transport.value;
  if (!tr) return [];
  const enabled = tr.enabled_sensors;
  return metricDefs
    .filter((def) => {
      if (enabled && typeof enabled === 'object') return enabled[def.key] !== false;
      return def.text(tr) != null;
    })
    .map((def) => ({
      key: def.key,
      label: t(`logistics.${def.labelKey}`),
      text: def.text(tr) ?? '—',
      status: metricStatus(def.key, tr),
    }));
});

async function load() {
  loading.value = true;
  const tid = route.params.transportId;
  try {
    await logisticsStore.fetchTransportsAsync();
    transport.value =
      logisticsStore.transports.find((tr) => String(tr.id) === String(tid)) ?? null;
  } catch (e) {
    console.error(e);
    transport.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.transportId, load);

function goList() {
  router.push({ name: 'transports' });
}

function formatTransportType(type) {
  const raw = String(type || '').toUpperCase();
  const map = {
    VAN: 'transportVan',
    OFF_ROAD: 'transportOffRoad',
    MOTORCYCLE: 'transportMotorcycle',
    REFRIGERATED: 'transportRefrigerated',
    COLD_CHAIN: 'transportColdChain',
  };
  if (map[raw]) return t(`logistics.${map[raw]}`);
  return type || '—';
}

function formatMedication(med) {
  const raw = String(med || '').toUpperCase();
  const map = {
    VACCINES: 'medicationVaccines',
    PILLS: 'medicationPills',
    CREAMS: 'medicationCreams',
    SYRUP: 'medicationSyrup',
  };
  if (map[raw]) return t(`logistics.${map[raw]}`);
  return med || '—';
}

function iconClass(st) {
  if (st === 'ok') return 'pi pi-check est-flow-metric__icon--ok';
  if (st === 'warning') return 'pi pi-exclamation-triangle est-flow-metric__icon--warn';
  if (st === 'critical') return 'pi pi-times-circle est-flow-metric__icon--critical';
  return 'pi pi-minus est-flow-metric__icon--unknown';
}
</script>

<template>
  <div class="est-flow-page">
    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goList">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('logistics.backToTransports') }}</span>
      </button>
    </nav>

    <div v-if="loading" class="est-flow-card est-flow-state">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <span>{{ t('logistics.detailLoading') }}</span>
    </div>

    <div v-else-if="!transport" class="est-flow-card est-flow-state est-flow-state--warn">
      <p>{{ t('logistics.transportNotFound') }}</p>
      <button type="button" class="est-flow-btn est-flow-btn--ghost" @click="goList">
        {{ t('logistics.back') }}
      </button>
    </div>

    <div v-else class="est-flow-card">
      <header class="est-flow-head">
        <h1 class="est-flow-title">{{ formatTransportType(transport.type_of_transport) }}</h1>
        <p class="est-flow-subtitle">{{ t('logistics.transportInfo') }}</p>
      </header>

      <div class="est-flow-fields est-flow-fields--span">
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('logistics.fieldId') }}</span>
          <span class="est-flow-field__value">{{ transport.id }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('logistics.fieldMedication') }}</span>
          <span class="est-flow-field__value">{{ formatMedication(transport.type_of_medication) }}</span>
        </div>
        <div class="est-flow-field est-flow-field--full">
          <span class="est-flow-field__label">{{ t('logistics.fieldTransportType') }}</span>
          <span class="est-flow-field__value">{{ formatTransportType(transport.type_of_transport) }}</span>
        </div>
      </div>

      <h2 v-if="metrics.length" class="est-flow-section-title">{{ t('logistics.sensorReadings') }}</h2>
      <div v-if="metrics.length" class="est-flow-fields">
        <div v-for="m in metrics" :key="m.key" class="est-flow-metric">
          <span class="est-flow-field__label">{{ m.label }}</span>
          <div class="est-flow-metric__body">
            <span class="est-flow-metric__value">{{ m.text }}</span>
            <i :class="iconClass(m.status)" aria-hidden="true"></i>
          </div>
        </div>
      </div>
      <p v-else class="est-flow-subtitle" style="text-align: center; margin-top: 1rem">
        {{ t('logistics.noSensorData') }}
      </p>

      <footer class="est-flow-actions">
        <button type="button" class="est-flow-btn est-flow-btn--ghost" @click="goList">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          <span>{{ t('logistics.back') }}</span>
        </button>
      </footer>
    </div>
  </div>
</template>
