<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  RadialLinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Radar, Bar, Doughnut } from 'vue-chartjs';

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    RadialLinearScale,
    BarElement,
    ArcElement,
);

const props = defineProps({
  db: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
});

const { t, locale } = useI18n();

const chartFont = () => ({
  family: "'DM Sans', system-ui, sans-serif",
});

function numAvg(arr, key) {
  const vals = arr.map((x) => Number(x[key])).filter((n) => !Number.isNaN(n));
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function truncateLabel(s, max = 16) {
  if (!s) return '—';
  const str = String(s);
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

/** Alertas por operador: suma por users_id (evita duplicar nombres en el gráfico) */
function aggregateAlertsByUser(operators, users) {
  const map = new Map();
  for (const op of operators || []) {
    const uid = op.users_id;
    if (uid == null) continue;
    map.set(uid, (map.get(uid) || 0) + (Number(op.alerts_answered) || 0));
  }
  const rows = [...map.entries()]
      .map(([usersId, total]) => ({
        usersId,
        total,
        name: users?.find((u) => Number(u.id) === Number(usersId))?.name ?? `ID ${usersId}`,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  return rows;
}

const devices = computed(() => props.db?.devices ?? []);
const transports = computed(() => props.db?.transports ?? []);
const operators = computed(() => props.db?.operators ?? []);
const users = computed(() => props.db?.users ?? []);
const subscriptions = computed(() => props.db?.subscriptions ?? []);
const establishments = computed(() => props.db?.establishments ?? []);

const lastSyncLabel = computed(() => {
  const dates = devices.value
      .map((d) => d.updated_at || d.created_at)
      .filter(Boolean)
      .map((s) => new Date(s).getTime())
      .filter((n) => !Number.isNaN(n));
  if (!dates.length) return '—';
  const max = new Date(Math.max(...dates));
  return max.toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
});

const kpis = computed(() => {
  const devs = devices.value;
  const temps = devs.map((d) => Number(d.temperature)).filter((n) => !Number.isNaN(n));
  const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const openDoors = devs.filter((d) => String(d.door_status).toUpperCase() === 'OPEN').length;
  return {
    devices: devs.length,
    establishments: establishments.value.length,
    transports: transports.value.length,
    operators: operators.value.length,
    avgTemp: avgTemp != null ? `${avgTemp.toFixed(1)}°C` : '—',
    openDoors,
  };
});

const planCounts = computed(() => {
  const c = { BASIC: 0, PREMIUM: 0, ENTERPRISE: 0, OTHER: 0 };
  for (const s of subscriptions.value) {
    const p = String(s.plan || '').toUpperCase();
    if (p === 'BASIC') c.BASIC++;
    else if (p === 'PREMIUM') c.PREMIUM++;
    else if (p === 'ENTERPRISE') c.ENTERPRISE++;
    else if (s.plan) c.OTHER++;
  }
  return c;
});

/** Línea: puntos = sensores reales (ubicación en eje X), temp y humedad desde API */
const biometricData = computed(() => {
  const devs = devices.value.slice(0, 10);
  if (!devs.length) {
    return {
      labels: ['—'],
      datasets: [
        { label: t('monitoring.ccLegendTemp'), data: [0], borderColor: '#0d9488', backgroundColor: 'rgba(13, 148, 136, 0.08)', fill: true, tension: 0.35, pointRadius: 4 },
        { label: t('monitoring.ccLegendHum'), data: [0], borderColor: '#1e40af', backgroundColor: 'rgba(30, 64, 175, 0.06)', fill: true, tension: 0.35, pointRadius: 4 },
      ],
    };
  }
  return {
    labels: devs.map((d) => truncateLabel(d.exact_location || d.type_of_medication, 14)),
    datasets: [
      {
        label: t('monitoring.ccLegendTemp'),
        data: devs.map((d) => Number(d.temperature) || 0),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('monitoring.ccLegendHum'),
        data: devs.map((d) => Number(d.humidity) || 0),
        borderColor: '#1e40af',
        backgroundColor: 'rgba(30, 64, 175, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

const biometricOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
        padding: 16,
        color: '#64748b',
        font: { ...chartFont(), size: 11, weight: '600' },
      },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 12,
      cornerRadius: 10,
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
    },
  },
  scales: {
    y: {
      grid: { color: '#f1f5f9', lineWidth: 1 },
      ticks: { color: '#64748b', font: chartFont() },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: {
        color: '#64748b',
        font: { ...chartFont(), size: 10 },
        maxRotation: 35,
        minRotation: 35,
      },
      border: { display: false },
    },
  },
}));

/** Radar: promedio de sensores de dispositivos; si hay transportes, mezcla leve */
const stabilityData = computed(() => {
  const devs = devices.value;
  const trans = transports.value;
  const vib = numAvg(devs, 'vibration') || (trans.length ? numAvg(trans, 'vibration') : 0);
  const press = numAvg(devs, 'atmospheric_pressure') || (trans.length ? numAvg(trans, 'atmospheric_pressure') : 1013);
  const part = numAvg(devs, 'suspended_particles') || (trans.length ? numAvg(trans, 'suspended_particles') : 0);
  const air = numAvg(devs, 'air_quality') || (trans.length ? numAvg(trans, 'air_quality') : 0);
  const toScore = (x, f) => Math.min(100, Math.max(8, Math.round(x * f)));

  const scores = [
    toScore(vib, 180),
    toScore(Math.max(0, press - 1005), 8),
    toScore(part, 4),
    toScore(air, 2.5),
  ];

  return {
    labels: [
      t('monitoring.ccRadarVibration'),
      t('monitoring.ccRadarPressure'),
      t('monitoring.ccRadarParticles'),
      t('monitoring.ccRadarAirQuality'),
    ],
    datasets: [
      {
        label: t('monitoring.ccStability'),
        data: scores,
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.18)',
        pointBackgroundColor: '#0d9488',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#0f766e',
        borderWidth: 2,
      },
    ],
  };
});

const radarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: { display: false, stepSize: 25 },
      grid: { color: '#e2e8f0' },
      angleLines: { color: '#e2e8f0' },
      pointLabels: {
        color: '#475569',
        font: { ...chartFont(), size: 11, weight: '600' },
      },
    },
  },
}));

const efficiencyData = computed(() => {
  const rows = aggregateAlertsByUser(operators.value, users.value);
  if (!rows.length) {
    return {
      labels: ['—'],
      datasets: [{ label: '—', data: [0], backgroundColor: '#e2e8f0', borderRadius: 8, barThickness: 14 }],
    };
  }
  return {
    labels: rows.map((r) => truncateLabel(r.name, 22)),
    datasets: [
      {
        label: t('monitoring.ccEfficiency'),
        data: rows.map((r) => r.total),
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return '#0d9488';
          const g = c.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          g.addColorStop(0, '#0d9488');
          g.addColorStop(1, '#1e40af');
          return g;
        },
        borderRadius: 8,
        barThickness: 14,
      },
    ],
  };
});

const barOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { color: '#f1f5f9', drawBorder: false },
      ticks: { color: '#94a3b8', font: chartFont() },
      border: { display: false },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#334155', font: { ...chartFont(), size: 11, weight: '600' } },
      border: { display: false },
    },
  },
}));

const businessData = computed(() => {
  const subs = subscriptions.value;
  const active = subs.filter((s) => String(s.status).toUpperCase() === 'ACTIVE').length;
  const pending = subs.filter((s) => String(s.status).toUpperCase() === 'PENDING').length;
  const expired = subs.filter((s) => String(s.status).toUpperCase() === 'EXPIRED').length;
  const other = Math.max(0, subs.length - active - pending - expired);
  return {
    labels: [
      t('monitoring.ccSubActive'),
      t('monitoring.ccSubPending'),
      t('monitoring.ccSubExpired'),
      ...(other ? [t('monitoring.ccOther')] : []),
    ],
    datasets: [
      {
        data: other ? [active, pending, expired, other] : [active, pending, expired],
        backgroundColor: ['#1e40af', '#f59e0b', '#ef4444', '#94a3b8'],
        borderWidth: 0,
        cutout: '72%',
        spacing: 2,
      },
    ],
  };
});

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
        padding: 12,
        color: '#64748b',
        font: { ...chartFont(), size: 11 },
      },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 12,
      cornerRadius: 10,
    },
  },
}));

const subscriptionTotal = computed(() => subscriptions.value.length);

const kpiCards = computed(() => [
  { key: 'devices', icon: 'pi pi-th-large', value: String(kpis.value.devices), label: t('monitoring.ccKpiDevices'), variant: 'slate' },
  { key: 'est', icon: 'pi pi-building', value: String(kpis.value.establishments), label: t('monitoring.ccKpiEst'), variant: 'slate' },
  { key: 'trans', icon: 'pi pi-truck', value: String(kpis.value.transports), label: t('monitoring.ccKpiTransports'), variant: 'slate' },
  { key: 'ops', icon: 'pi pi-users', value: String(kpis.value.operators), label: t('monitoring.ccKpiOperators'), variant: 'slate' },
  { key: 'temp', icon: 'pi pi-chart-line', value: kpis.value.avgTemp, label: t('monitoring.ccKpiAvgTemp'), variant: 'teal' },
  { key: 'doors', icon: 'pi pi-lock-open', value: String(kpis.value.openDoors), label: t('monitoring.ccKpiOpenDoors'), variant: kpis.value.openDoors > 0 ? 'amber' : 'slate' },
]);
</script>

<template>
  <div v-if="db" class="control-panel" :class="{ 'control-panel--embedded': embedded }">
    <header class="panel-header est-flow-head est-flow-head--row control-panel__head">
      <div class="est-flow-head__text header-info">
        <h2 class="est-flow-title panel-title">{{ t('monitoring.ccTitle') }}</h2>
        <p class="est-flow-subtitle panel-subtitle">{{ t('monitoring.ccSubtitle') }}</p>
        <p class="panel-meta">
          <i class="pi pi-clock" aria-hidden="true"></i>
          {{ t('monitoring.ccSync') }}: <strong>{{ lastSyncLabel }}</strong>
        </p>
      </div>
      <div class="est-flow-stats header-status">
        <span class="est-flow-stat est-flow-stat--teal status-badge">
          <span class="pulse-indicator" aria-hidden="true"></span>
          <span class="est-flow-stat__value" style="font-size: 0.75rem; font-weight: 600">{{ t('monitoring.ccOnline') }}</span>
        </span>
      </div>
    </header>

    <section class="kpi-strip" aria-label="KPI">
      <article
          v-for="card in kpiCards"
          :key="card.key"
          class="kpi-card"
          :class="[`kpi-card--${card.variant}`]"
      >
        <div class="kpi-card__icon" aria-hidden="true">
          <i :class="card.icon"></i>
        </div>
        <div class="kpi-card__body">
          <span class="kpi-card__value">{{ card.value }}</span>
          <span class="kpi-card__label">{{ card.label }}</span>
        </div>
      </article>
    </section>

    <div class="plans-strip">
      <span class="plans-strip-title">{{ t('monitoring.ccPlans') }}</span>
      <div class="plans-pills">
        <span class="pill pill--b">{{ t('monitoring.ccPlanBasic') }} · {{ planCounts.BASIC }}</span>
        <span class="pill pill--p">{{ t('monitoring.ccPlanPro') }} · {{ planCounts.PREMIUM }}</span>
        <span class="pill pill--e">{{ t('monitoring.ccPlanEnt') }} · {{ planCounts.ENTERPRISE }}</span>
        <span v-if="planCounts.OTHER" class="pill pill--o">{{ t('monitoring.ccOther') }} · {{ planCounts.OTHER }}</span>
      </div>
    </div>

    <div class="bento-grid">
      <div class="bento-card span-2 main-chart">
        <div class="card-header">
          <h3>{{ t('monitoring.ccBiometric') }}</h3>
          <p>{{ t('monitoring.ccBiometricHint') }}</p>
        </div>
        <div class="chart-wrapper line-chart">
          <Line :data="biometricData" :options="biometricOptions" />
        </div>
      </div>

      <div class="bento-card stability-chart">
        <div class="card-header">
          <h3>{{ t('monitoring.ccStability') }}</h3>
          <p>{{ t('monitoring.ccStabilityHint') }}</p>
        </div>
        <div class="chart-wrapper">
          <Radar :data="stabilityData" :options="radarOptions" />
        </div>
      </div>

      <div class="bento-card efficiency-chart">
        <div class="card-header">
          <h3>{{ t('monitoring.ccEfficiency') }}</h3>
          <p>{{ t('monitoring.ccEfficiencyHint') }}</p>
        </div>
        <div class="chart-wrapper bar-wrap">
          <Bar :data="efficiencyData" :options="barOptions" />
        </div>
      </div>

      <div class="bento-card business-chart">
        <div class="card-header">
          <h3>{{ t('monitoring.ccSubscriptions') }}</h3>
          <p>{{ t('monitoring.ccSubscriptionsHint') }}</p>
        </div>
        <div class="doughnut-container">
          <div class="chart-wrapper dough-wrap">
            <Doughnut :data="businessData" :options="doughnutOptions" />
          </div>
          <div class="doughnut-center">
            <span class="center-label">{{ t('monitoring.ccDoughnutCenter') }}</span>
            <span class="center-value">{{ subscriptionTotal }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading || !db" class="panel-loading" :class="{ 'panel-loading--embedded': embedded }">
    <div class="loader-content">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem" aria-hidden="true"></i>
      <p>{{ t('monitoring.ccLoading') }}</p>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  margin-top: 0;
}

.control-panel--embedded .control-panel__head {
  margin-bottom: 1.1rem;
  padding-bottom: 1rem;
}

.control-panel--embedded .control-panel__head.est-flow-head--row {
  border-bottom: 1px solid var(--mt-border);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0;
}

.panel-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--mt-heading, #0f172a);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.panel-subtitle {
  margin: 0.35rem 0 0;
  color: var(--mt-text-muted, #64748b);
  font-size: 0.875rem;
  line-height: 1.45;
  max-width: 42rem;
}

.panel-meta {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.panel-meta strong {
  color: #475569;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  flex-shrink: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.pulse-indicator {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45);
  animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 1rem;
  margin-bottom: 1.1rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 5.75rem;
  padding: 1.1rem 1.2rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 8px 24px -8px rgba(15, 23, 42, 0.08);
  transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow:
      0 4px 6px rgba(15, 23, 42, 0.05),
      0 16px 32px -12px rgba(15, 23, 42, 0.12);
  border-color: #cbd5e1;
}

.kpi-card__icon {
  flex-shrink: 0;
  width: 3.25rem;
  height: 3.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 1.35rem;
}

.kpi-card--slate .kpi-card__icon {
  background: linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.kpi-card--teal {
  border-color: rgba(13, 148, 136, 0.35);
  background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 55%, #ffffff 100%);
}

.kpi-card--teal .kpi-card__icon {
  background: linear-gradient(145deg, #14b8a6 0%, #0d9488 100%);
  color: #fff;
  border: none;
  box-shadow: 0 6px 16px rgba(13, 148, 136, 0.35);
}

.kpi-card--amber {
  border-color: rgba(245, 158, 11, 0.45);
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 55%, #ffffff 100%);
}

.kpi-card--amber .kpi-card__icon {
  background: linear-gradient(145deg, #fbbf24 0%, #f59e0b 100%);
  color: #fff;
  border: none;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
}

.kpi-card__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.35rem;
  min-width: 0;
}

.kpi-card__value {
  font-size: 1.65rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.04em;
  line-height: 1;
}

.kpi-card__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  line-height: 1.2;
}

@media (max-width: 640px) {
  .kpi-strip {
    grid-template-columns: 1fr 1fr;
  }

  .kpi-card {
    min-height: 5.25rem;
    padding: 0.95rem 1rem;
  }

  .kpi-card__value {
    font-size: 1.4rem;
  }

  .kpi-card__icon {
    width: 2.85rem;
    height: 2.85rem;
    font-size: 1.15rem;
  }
}

.plans-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.65rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.plans-strip-title {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.plans-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: #fff;
}

.pill--b {
  background: #475569;
}
.pill--p {
  background: #ea580c;
}
.pill--e {
  background: #1e3a8a;
}
.pill--o {
  background: #94a3b8;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(160px, auto);
  gap: 0.85rem;
}

.bento-card {
  background: #fff;
  border: 1px solid var(--mt-border, #e2e8f0);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.bento-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.07);
}

.span-2 {
  grid-column: span 7;
  grid-row: span 2;
}

.stability-chart {
  grid-column: span 5;
}

.efficiency-chart {
  grid-column: span 7;
}

.business-chart {
  grid-column: span 5;
}

.card-header {
  margin-bottom: 0.65rem;
}

.card-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--mt-heading, #0f172a);
  letter-spacing: -0.02em;
}

.card-header p {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--mt-text-muted, #64748b);
  line-height: 1.35;
}

.chart-wrapper {
  height: 200px;
  position: relative;
}

.line-chart {
  height: min(320px, 34vh);
}

.bar-wrap {
  height: 220px;
}

.dough-wrap {
  height: 200px;
}

.doughnut-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doughnut-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.center-label {
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.center-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--mt-heading, #0f172a);
  letter-spacing: -0.03em;
}

.panel-loading {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 2.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: 0;
}

.panel-loading--embedded {
  min-height: 12rem;
}

.loader-content {
  color: var(--mt-text-muted, #64748b);
}

.loader-content p {
  margin-top: 0.75rem;
  font-weight: 500;
  font-size: 0.9rem;
}

@media (max-width: 1100px) {
  .bento-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  .span-2 {
    grid-column: span 6;
    grid-row: span 1;
  }
  .stability-chart {
    grid-column: span 6;
  }
  .efficiency-chart {
    grid-column: span 6;
  }
  .business-chart {
    grid-column: span 6;
  }
  .line-chart {
    height: 260px;
  }
}

@media (max-width: 640px) {
  .panel-header {
    flex-direction: column;
  }
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .span-2,
  .stability-chart,
  .efficiency-chart,
  .business-chart {
    grid-column: span 1;
  }
}
</style>
