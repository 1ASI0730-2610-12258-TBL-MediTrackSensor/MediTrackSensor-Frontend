<script setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchDashboardData } from '../../infrastructure/services/dashboard.service.js';

const { t } = useI18n();
const router = useRouter();

const db = ref(null);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const data = await fetchDashboardData();
    db.value = data;
  } catch (error) {
    console.error("Failed to load dashboard data", error);
  } finally {
    isLoading.value = false;
  }
});

// TODO: Integrar desde IAM store
const userName = ref('Franco Diego');
const establishmentName = ref('Hospital Central');

const quickActions = [
  {
    title: 'monitoring.devices',
    description: 'Monitoreo de sensores y dispositivos en tiempo real.',
    icon: 'pi pi-box',
    to: '/monitoring/devices',
    color: 'var(--mt-accent)'
  },
  {
    title: 'logistics.transports',
    description: 'Seguimiento de flota y cadena de frío en tránsito.',
    icon: 'pi pi-truck',
    to: '/logistics/transports',
    color: 'var(--mt-primary)'
  },
  {
    title: 'establishment.operators',
    description: 'Gestión y estado del personal operativo asignado.',
    icon: 'pi pi-users',
    to: '/establishment/operators',
    color: 'var(--mt-accent)'
  }
];

const navigateTo = (path) => {
  router.push(path);
};
</script>

<template>
  <div class="home-container">
    <section class="welcome-hero">
      <div class="welcome-hero-glow" aria-hidden="true"></div>
      <p class="welcome-eyebrow">{{ t('common.welcome') }}</p>
      <h1 class="welcome-title">Operational Dashboard</h1>
      <p class="welcome-lead">
        Hola, <span class="welcome-name">{{ userName }}</span>
        <span class="welcome-sep" aria-hidden="true">·</span>
        <span class="welcome-place">{{ establishmentName }}</span>
      </p>
      <p class="welcome-hint">Monitoreo crítico de dispositivos y transportes asignados a tu unidad operativa.</p>
    </section>

    <div class="dashboard-grid">
      <div
          v-for="action in quickActions"
          :key="action.title"
          class="action-card"
          @click="navigateTo(action.to)"
      >
        <div class="action-icon" :style="{ backgroundColor: action.color + '15', color: action.color }">
          <i :class="action.icon"></i>
        </div>
        <div class="action-content">
          <h3>{{ t(action.title) }}</h3>
          <p>{{ action.description }}</p>
        </div>
        <i class="pi pi-chevron-right action-arrow"></i>
      </div>
    </div>

    <!-- Control Center removed -->
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.welcome-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--mt-radius-lg);
  padding: 3rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid var(--mt-border);
  box-shadow: var(--mt-shadow-md);
}

.welcome-hero-glow {
  position: absolute;
  top: -20%;
  right: -10%;
  width: 40%;
  height: 140%;
  background: radial-gradient(circle, var(--mt-accent-soft) 0%, transparent 70%);
  pointer-events: none;
}

.welcome-eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mt-accent);
}

.welcome-title {
  margin: 0 0 0.75rem;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--mt-heading);
  line-height: 1.1;
}

.welcome-lead {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: var(--mt-text-muted);
}

.welcome-name {
  font-weight: 700;
  color: var(--mt-primary);
}

.welcome-sep {
  margin: 0 0.5rem;
  color: var(--mt-border);
}

.welcome-place {
  font-weight: 500;
  color: var(--mt-heading);
}

.welcome-hint {
  margin: 0;
  max-width: 32rem;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--mt-text-muted);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: var(--mt-surface);
  border: 1px solid var(--mt-border);
  border-radius: var(--mt-radius-lg);
  padding: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.action-card:hover {
  border-color: var(--mt-primary);
  transform: translateY(-4px);
  box-shadow: var(--mt-shadow-lg);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.action-content h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--mt-heading);
}

.action-content p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--mt-text-muted);
  line-height: 1.4;
}

.action-arrow {
  margin-left: auto;
  color: var(--mt-border);
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
  color: var(--mt-primary);
}

@media (max-width: 768px) {
  .welcome-hero {
    padding: 2rem 1.5rem;
  }

  .welcome-title {
    font-size: 1.75rem;
  }
}
</style>
