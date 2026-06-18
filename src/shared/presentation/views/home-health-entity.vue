<script setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { readAuthSession } from '../../../iam/infrastructure/auth-session.js';
import ControlCenterPanel from '../../../monitoring/presentation/components/control-center-panel.vue';
import { fetchDashboardPayload as fetchDashboardData } from '../../infrastructure/dashboard-payload.js';

const { t } = useI18n();
const router = useRouter();

const db = ref(null);
const isLoading = ref(true);

onMounted(async () => {
  try {
    db.value = await fetchDashboardData();
  } catch (error) {
    console.error('Failed to load dashboard data', error);
  } finally {
    isLoading.value = false;
  }
});

const userName = computed(() => readAuthSession()?.name ?? t('layout.guestUser'));

const quickActions = [
  {
    titleKey: 'establishment.establishments',
    descKey: 'homeHealth.actionEstDesc',
    icon: 'pi pi-building',
    to: '/establishment/establishments',
    tone: 'teal',
  },
  {
    titleKey: 'establishment.assignOperator',
    descKey: 'homeHealth.actionAssignDesc',
    icon: 'pi pi-users',
    to: '/establishment/assign-operator',
    tone: 'navy',
  },
  {
    titleKey: 'establishment.addEstablishment',
    descKey: 'homeHealth.actionAddDesc',
    icon: 'pi pi-plus-circle',
    to: '/establishment/establishments/new',
    tone: 'teal',
  },
  {
    titleKey: 'establishment.mapOfEstablishments',
    descKey: 'homeHealth.actionMapDesc',
    icon: 'pi pi-map-marker',
    to: '/establishment/map',
    tone: 'navy',
  },
];

const navigateTo = (path) => {
  router.push(path);
};
</script>

<template>
  <div class="home-dash-page">
    <section class="est-flow-card home-hero-card">
      <div class="home-hero-card__inner">
        <p class="home-eyebrow">{{ t('common.welcome') }}</p>
        <h1 class="home-title">{{ t('homeHealth.title') }}</h1>
        <p class="home-greeting">
          {{ t('homeHealth.greetingHello') }}
          <strong>{{ userName }}</strong>
        </p>
        <p class="home-subtitle">{{ t('homeHealth.subtitle') }}</p>
      </div>
    </section>

    <div class="home-actions" role="navigation" :aria-label="t('homeHealth.title')">
      <button
        v-for="action in quickActions"
        :key="action.titleKey"
        type="button"
        class="home-action"
        @click="navigateTo(action.to)"
      >
        <span
          class="home-action__icon"
          :class="action.tone === 'teal' ? 'home-action__icon--teal' : 'home-action__icon--navy'"
          aria-hidden="true"
        >
          <i :class="action.icon"></i>
        </span>
        <span class="home-action__body">
          <h2 class="home-action__title">{{ t(action.titleKey) }}</h2>
          <p class="home-action__desc">{{ t(action.descKey) }}</p>
        </span>
        <i class="pi pi-chevron-right home-action__chevron" aria-hidden="true"></i>
      </button>
    </div>

    <section class="est-flow-card home-cc-section" aria-busy="isLoading">
      <ControlCenterPanel :db="db" :loading="isLoading" embedded />
    </section>
  </div>
</template>
