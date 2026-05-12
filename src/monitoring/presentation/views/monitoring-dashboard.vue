<script setup>
import { ref, computed, onMounted } from 'vue';
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
  ArcElement
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
  ArcElement
);

const { t } = useI18n();

// Mock Data (based on provided db.json)
const db = {
  "users": [
    { "id": 1, "name": "Juan Pérez", "role": "ADMIN" },
    { "id": 2, "name": "María García", "role": "OPERATOR" },
    { "id": 3, "name": "Carlos Ruiz", "role": "ADMIN" },
    { "id": 4, "name": "Ana Torres", "role": "OPERATOR" },
    { "id": 5, "name": "Luis Ramos", "role": "ADMIN" },
    { "id": 6, "name": "Elena Smith", "role": "OPERATOR" },
    { "id": 7, "name": "Pedro Castro", "role": "ADMIN" },
    { "id": 8, "name": "Lucía Méndez", "role": "OPERATOR" },
    { "id": 9, "name": "Jorge Luna", "role": "ADMIN" },
    { "id": 10, "name": "Sofía Vargas", "role": "OPERATOR" }
  ],
  "subscriptions": [
    { "id": 1, "status": "ACTIVE" },
    { "id": 2, "status": "ACTIVE" },
    { "id": 3, "status": "ACTIVE" },
    { "id": 4, "status": "PENDING" },
    { "id": 5, "status": "EXPIRED" },
    { "id": 6, "status": "ACTIVE" },
    { "id": 7, "status": "ACTIVE" },
    { "id": 8, "status": "ACTIVE" },
    { "id": 9, "status": "PENDING" },
    { "id": 10, "status": "ACTIVE" }
  ],
  "establishments": [
    { "id": 1, "establishment_name": "Almacén Central Norte", "city_region": "Lima" },
    { "id": 2, "establishment_name": "Sede San Isidro", "city_region": "Lima" },
    { "id": 3, "establishment_name": "Depósito Callao", "city_region": "Callao" },
    { "id": 4, "establishment_name": "Planta Arequipa", "city_region": "Arequipa" },
    { "id": 5, "establishment_name": "Sede Trujillo", "city_region": "La Libertad" }
  ],
  "operators": [
    { "id": 1, "alerts_answered": 15, "users_id": 2 },
    { "id": 2, "alerts_answered": 8, "users_id": 4 },
    { "id": 3, "alerts_answered": 22, "users_id": 6 },
    { "id": 4, "alerts_answered": 5, "users_id": 8 },
    { "id": 5, "alerts_answered": 30, "users_id": 10 },
    { "id": 6, "alerts_answered": 12, "users_id": 2 },
    { "id": 7, "alerts_answered": 3, "users_id": 4 },
    { "id": 8, "alerts_answered": 45, "users_id": 6 },
    { "id": 9, "alerts_answered": 19, "users_id": 8 },
    { "id": 10, "alerts_answered": 7, "users_id": 10 }
  ],
  "transports": [
    { "id": 1, "temperature": 4.5, "humidity": 45.0, "vibration": 0.15, "atmospheric_pressure": 1013.2, "suspended_particles": 12.5, "air_quality": 20.5 },
    { "id": 2, "temperature": -18.2, "humidity": 30.5, "vibration": 0.30, "atmospheric_pressure": 1012.0, "suspended_particles": 5.1, "air_quality": 10.2 }
  ],
  "devices": [
    { "id": 1, "temperature": 2.2, "humidity": 40.5, "establishment_id": 1 },
    { "id": 2, "temperature": 5.1, "humidity": 45.2, "establishment_id": 2 },
    { "id": 3, "temperature": 18.5, "humidity": 50.0, "establishment_id": 3 }
  ]
};

const selectedEstablishment = ref(null);
const selectedRegion = ref(null);

const regions = [...new Set(db.establishments.map(e => e.city_region))];
</script>

// Chart 1: Biometric Monitoring (Line)
const biometricData = computed(() => ({
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
  datasets: [
    {
      label: 'Temperatura (°C)',
      data: [2, 3, 5, 4, 3, 2],
      borderColor: '#60a5fa',
      backgroundColor: 'rgba(96, 165, 250, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Humedad (%)',
      data: [40, 42, 45, 43, 41, 40],
      borderColor: '#34d399',
      backgroundColor: 'rgba(52, 211, 153, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
}));

const biometricOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#f8fafc',
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
};

// Chart 2: Asset Stability (Radar)
const stabilityData = computed(() => ({
  labels: ['Vibración', 'Presión', 'Partículas', 'Calidad Aire'],
  datasets: [{
    label: 'Camión Refrigerado A1',
    data: [0.15 * 100, 1013.2 / 20, 12.5 * 2, 20.5],
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    pointBackgroundColor: '#60a5fa'
  }]
}));

const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    r: {
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
      angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
      pointLabels: { color: '#94a3b8' },
      ticks: { display: false }
    }
  }
};

// Chart 3: Response Efficiency (Bar)
const efficiencyData = computed(() => {
  const sortedOperators = [...db.operators]
    .sort((a, b) => b.alerts_answered - a.alerts_answered)
    .slice(0, 5);
  
  return {
    labels: sortedOperators.map(o => db.users.find(u => u.id === o.users_id)?.name),
    datasets: [{
      label: 'Alertas Respondidas',
      data: sortedOperators.map(o => o.alerts_answered),
      backgroundColor: (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#0d9488');
        return gradient;
      },
      borderRadius: 10
    }]
  };
});

const barOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { display: false } },
    y: { grid: { display: false }, ticks: { color: '#f8fafc', font: { weight: '600' } } }
  }
};

// Chart 4: Business Health (Doughnut)
const businessData = computed(() => {
  const active = db.subscriptions.filter(s => s.status === 'ACTIVE').length;
  const pending = db.subscriptions.filter(s => s.status === 'PENDING').length;
  const expired = db.subscriptions.filter(s => s.status === 'EXPIRED').length;
  
  return {
    labels: ['Active', 'Pending', 'Expired'],
    datasets: [{
      data: [active, pending, expired],
      backgroundColor: ['#60a5fa', '#fbbf24', '#ef4444'],
      borderWidth: 0,
      cutout: '85%'
    }]
  };
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  }
};