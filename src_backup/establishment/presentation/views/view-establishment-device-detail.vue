<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const establishment = ref(null);
const device = ref(null);

function sameEst(a, b) {
  return Number(a) === Number(b) || String(a) === String(b);
}

function num(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function metricStatus(key, dev) {
  const temp = num(dev.temperature);
  const hum = num(dev.humidity);
  const lux = num(dev.light_intensity ?? dev.lightIntensity ?? dev.lux);
  const vib = num(dev.vibration);
  const door = String(dev.door_status ?? dev.doorStatus ?? dev.door ?? '').toUpperCase();
  const co2 = num(dev.co2 ?? dev.air_quality ?? dev.co2_ppm);
  const pm = num(dev.pm25 ?? dev.pm2_5 ?? dev.suspended_particles);

  if (key === 'temperature') {
    if (temp == null) return 'unknown';
    if (temp > 20 || temp < 0) return temp > 20 ? 'critical' : 'warning';
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
    return door.includes('OPEN') ? 'critical' : 'ok';
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
    const p = num(dev.atmospheric_pressure ?? dev.pressure);
    if (p == null) return 'unknown';
    if (p < 980 || p > 1040) return 'warning';
    return 'ok';
  }
  return 'ok';
}

const metrics = computed(() => {
  const d = device.value;
  if (!d) return [];
  const rows = [
    {
      key: 'temperature',
      label: t('establishment.sensorTemp'),
      text:
        d.temperature != null && d.temperature !== ''
          ? `${d.temperature} °C`
          : '—',
    },
    {
      key: 'humidity',
      label: t('establishment.sensorHumidity'),
      text: d.humidity != null && d.humidity !== '' ? `${d.humidity} % RH` : '—',
    },
    {
      key: 'light',
      label: t('establishment.sensorLight'),
      text:
        (d.light_intensity ?? d.lightIntensity ?? d.lux) != null
          ? `${d.light_intensity ?? d.lightIntensity ?? d.lux} LUX`
          : '—',
    },
    {
      key: 'vibration',
      label: t('establishment.sensorVibration'),
      text:
        d.vibration != null && d.vibration !== ''
          ? `${d.vibration} m/s²`
          : '—',
    },
    {
      key: 'door',
      label: t('establishment.sensorDoor'),
      text: d.door_status ?? d.doorStatus ?? d.door ?? '—',
    },
    {
      key: 'co2',
      label: t('establishment.sensorCo2'),
      text:
        (d.co2 ?? d.air_quality ?? d.co2_ppm) != null
          ? `${d.co2 ?? d.air_quality ?? d.co2_ppm} CO₂ PPM`
          : '—',
    },
    {
      key: 'pressure',
      label: t('establishment.sensorPressure'),
      text:
        (d.atmospheric_pressure ?? d.pressure) != null
          ? `${d.atmospheric_pressure ?? d.pressure} hPa`
          : '—',
    },
    {
      key: 'pm25',
      label: t('establishment.sensorPm25'),
      text: (d.pm25 ?? d.pm2_5 ?? d.suspended_particles) != null ? `${d.pm25 ?? d.pm2_5 ?? d.suspended_particles} PM2.5` : '—',
    },
  ];
  return rows.map((r) => ({
    ...r,
    status: metricStatus(r.key, d),
  }));
});

async function load() {
  loading.value = true;
  const eid = route.params.establishmentId;
  const did = route.params.deviceId;
  try {
    const data = await fetchDashboardData();
    establishment.value = data.establishments.find((e) => sameEst(e.id, eid)) ?? null;
    device.value =
      (data.devices || []).find((d) => String(d.id) === String(did) && sameEst(d.establishment_id, eid)) ?? null;
  } catch (e) {
    console.error(e);
    device.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => [route.params.establishmentId, route.params.deviceId], load);

function goTeam() {
  router.push({
    name: 'establishment-team',
    params: { establishmentId: route.params.establishmentId },
  });
}

const medType = computed(() => {
  const d = device.value;
  if (!d) return '—';
  return (
    d.type_of_medication ??
    d.medication_type ??
    d.medicationType ??
    d.product_type ??
    d.type ??
    '—'
  );
});

function iconClass(st) {
  if (st === 'ok') return 'pi pi-check status-ok';
  if (st === 'warning') return 'pi pi-exclamation-triangle status-warn';
  if (st === 'critical') return 'pi pi-times-circle status-critical';
  return 'pi pi-minus status-unknown';
}
</script>

<template>
  <div class="dev-detail">
    <header class="toolbar">
      <pv-button
        icon="pi pi-arrow-left"
        class="p-button-text p-button-sm"
        :aria-label="t('establishment.back')"
        @click="goTeam"
      />
    </header>

    <div v-if="loading" class="state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('establishment.detailLoading') }}</span>
    </div>

    <div v-else-if="!device" class="state warn">
      <p>{{ t('establishment.deviceNotFound') }}</p>
      <pv-button :label="t('establishment.back')" class="p-button-sm" @click="goTeam" />
    </div>

    <template v-else>
      <h1 class="page-title">{{ device.exact_location || `Device #${device.id}` }}</h1>

      <div class="grid top">
        <div class="field">
          <span class="lab">{{ t('establishment.fieldId') }}</span>
          <span class="val">{{ device.id }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldAssignedEst') }}</span>
          <span class="val">{{ establishment?.establishment_name || '—' }}</span>
        </div>
        <div class="field span2">
          <span class="lab">{{ t('establishment.fieldExactLocation') }}</span>
          <span class="val">{{ device.exact_location || '—' }}</span>
        </div>
        <div class="field span2">
          <span class="lab">{{ t('establishment.fieldMedicationType') }}</span>
          <span class="val">{{ medType }}</span>
        </div>
      </div>

      <h2 class="section-title">{{ t('establishment.sensorReadings') }}</h2>
      <div class="grid metrics">
        <div v-for="m in metrics" :key="m.key" class="field metric-row">
          <span class="lab">{{ m.label }}</span>
          <div class="metric-body">
            <span class="val">{{ m.text }}</span>
            <i :class="iconClass(m.status)" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dev-detail {
  max-width: 880px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem;
  animation: fade 0.35s ease;
}
@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.toolbar {
  margin-bottom: 0.5rem;
}
.page-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}
.section-title {
  margin: 1.25rem 0 0.6rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #1e3a5f;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem 1rem;
}
.grid.top .field.span2 {
  grid-column: span 2;
}
.field {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.metric-row .metric-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.lab {
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.val {
  font-size: 0.88rem;
  font-weight: 600;
  color: #ea580c;
  word-break: break-word;
}
.status-ok {
  color: #1e3a5f;
  font-size: 1rem;
}
.status-warn {
  color: #ea580c;
  font-size: 1rem;
}
.status-critical {
  color: #dc2626;
  font-size: 1rem;
}
.status-unknown {
  color: #94a3b8;
  font-size: 0.9rem;
}
.state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #64748b;
  font-size: 0.9rem;
  padding: 2rem 0;
}
.state.warn {
  flex-direction: column;
  align-items: flex-start;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .grid.top .field.span2 {
    grid-column: span 1;
  }
}
</style>
