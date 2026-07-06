<script setup>
import { useI18n } from 'vue-i18n';
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { readAuthSession } from '../../../iam/infrastructure/auth-session.js';
import useEstablishmentStore from '../../../establishment/application/establishment.store.js';

const { t } = useI18n();
const router = useRouter();
const establishmentStore = useEstablishmentStore();

const session = readAuthSession();
const userName = computed(() => session?.name ?? t('layout.guestUser'));
const establishmentName = ref('—');
const alertsAnswered = ref(null);

onMounted(async () => {
  try {
    await establishmentStore.fetchOperatorsAsync();
    await establishmentStore.fetchEstablishmentsAsync();
    const operatorId = session?.operatorId;
    const op = operatorId
      ? establishmentStore.operators.find((o) => Number(o.id) === Number(operatorId))
      : null;
    alertsAnswered.value = op?.alerts_answered ?? 0;
    const est = op?.establishment_id
      ? establishmentStore.establishments.find((e) => Number(e.id) === Number(op.establishment_id))
      : null;
    if (est) establishmentName.value = est.establishment_name;
  } catch {
    // non-critical
  }
});

const quickActions = [
  {
    titleKey: 'monitoring.devices',
    descKey: 'homeOperational.actionDevicesDesc',
    icon: 'pi pi-box',
    to: '/monitoring/devices',
    tone: 'teal',
  },
  {
    titleKey: 'logistics.transports',
    descKey: 'homeOperational.actionTransportsDesc',
    icon: 'pi pi-truck',
    to: '/logistics/transports',
    tone: 'navy',
  },
  {
    titleKey: 'establishment.operators',
    descKey: 'homeOperational.actionOperatorsDesc',
    icon: 'pi pi-users',
    to: '/establishment/operators',
    tone: 'teal',
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
        <h1 class="home-title">{{ t('homeOperational.title') }}</h1>
        <p class="home-greeting">
          {{ t('homeOperational.greetingHello') }}
          <strong>{{ userName }}</strong>
          <span class="home-greeting-place">
            {{ t('homeOperational.atEstablishment', { place: establishmentName }) }}
          </span>
        </p>
        <p class="home-subtitle">{{ t('homeOperational.subtitle') }}</p>
      </div>
      <div v-if="alertsAnswered !== null" class="home-alerts-stat">
        <i class="pi pi-check-circle home-alerts-stat__icon" aria-hidden="true"></i>
        <div>
          <span class="home-alerts-stat__count">{{ alertsAnswered }}</span>
          <span class="home-alerts-stat__label">{{ t('homeOperational.alertsAnswered') }}</span>
        </div>
      </div>
    </section>

    <div class="home-actions" role="navigation" :aria-label="t('homeOperational.title')">
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
  </div>
</template>

<style scoped>
.home-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.home-alerts-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  padding: 0.85rem 1.25rem;
  min-width: 160px;
}
.home-alerts-stat__icon {
  font-size: 1.6rem;
  color: #16a34a;
}
.home-alerts-stat__count {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: #15803d;
  line-height: 1;
}
.home-alerts-stat__label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #166534;
  margin-top: 0.2rem;
}
</style>
