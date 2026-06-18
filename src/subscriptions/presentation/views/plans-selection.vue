<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import useSubscriptionsStore from '../../application/subscriptions.store.js';
import {
  buildAllPlanCards,
  catalogIdToApiPlan,
  apiPlanToCatalogId,
} from '../../application/plan-catalog.js';
import {
  readAuthSession,
  writeAuthSession,
} from '../../../iam/infrastructure/auth-session.js';
import useIamStore from '../../../iam/application/iam.store.js';
import MtConfirmDialog from '../../../shared/presentation/components/mt-confirm-dialog.vue';
import '../styles/plans-shared.css';

const { t, locale } = useI18n();
const router = useRouter();
const toast = useToast();

const currentCatalogId = ref('basic');
const benefitsEndDate = ref(null);
const cancelOpen = ref(false);
const showAllPlans = ref(false);
const iamStore = useIamStore();
const subscriptionsStore = useSubscriptionsStore();

const allPlans = computed(() => buildAllPlanCards(t));

const visiblePlans = computed(() => {
  if (showAllPlans.value) return allPlans.value;
  return allPlans.value.filter((p) => p.id === currentCatalogId.value);
});

function syncFromSession() {
  const ctx = subscriptionsStore.readPlanContext();
  if (ctx?.catalogPlanId) {
    currentCatalogId.value = ctx.catalogPlanId;
  } else if (ctx?.planApiValue) {
    currentCatalogId.value = apiPlanToCatalogId(ctx.planApiValue);
  }
  benefitsEndDate.value = ctx?.benefitsEndDate ?? null;
}

onMounted(() => {
  syncFromSession();
});

onBeforeRouteLeave(() => {
  cancelOpen.value = false;
});

const formattedBenefitsEnd = computed(() => {
  if (!benefitsEndDate.value) return '—';
  try {
    return new Date(benefitsEndDate.value).toLocaleDateString(
      locale.value === 'es' ? 'es-PE' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' },
    );
  } catch {
    return benefitsEndDate.value;
  }
});

const backToProfile = () => {
  router.push({ name: 'profile' });
};

const isCurrent = (id) => id === currentCatalogId.value;

const openCancel = () => {
  cancelOpen.value = true;
};

const closeCancel = () => {
  cancelOpen.value = false;
};

const confirmCancel = () => {
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  const iso = end.toISOString().slice(0, 10);
  const ctx = subscriptionsStore.readPlanContext() || {};
  subscriptionsStore.writePlanContext({
    ...ctx,
    planApiValue: 'BASIC',
    catalogPlanId: 'basic',
    benefitsEndDate: iso,
  });
  const auth = readAuthSession() || {};
  auth.plan = 'BASIC';
  writeAuthSession(auth);
  try {
    iamStore.profilePlanApi = 'BASIC';
    iamStore.profileBenefitsEndDate = iso;
  } catch {
    /* demo */
  }
  currentCatalogId.value = 'basic';
  benefitsEndDate.value = iso;
  showAllPlans.value = false;
  cancelOpen.value = false;
  toast.add({
    severity: 'success',
    summary: t('plansPage.cancelSuccessTitle'),
    detail: t('plansPage.cancelSuccessDetail'),
    life: 4000,
  });
};

const selectPlan = (catalogId) => {
  if (isCurrent(catalogId)) return;
  const plan = allPlans.value.find((p) => p.id === catalogId);
  const apiVal = catalogIdToApiPlan(catalogId);
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  const iso = end.toISOString().slice(0, 10);
  const ctx = subscriptionsStore.readPlanContext() || {};
  subscriptionsStore.writePlanContext({
    ...ctx,
    planApiValue: apiVal,
    catalogPlanId: catalogId,
    benefitsEndDate: iso,
  });
  const auth = readAuthSession() || {};
  auth.plan = apiVal;
  writeAuthSession(auth);
  try {
    iamStore.profilePlanApi = apiVal;
    iamStore.profileBenefitsEndDate = iso;
  } catch {
    /* demo */
  }
  currentCatalogId.value = catalogId;
  benefitsEndDate.value = iso;
  showAllPlans.value = false;
  toast.add({
    severity: 'success',
    summary: t('plansPage.planUpdatedTitle'),
    detail: t('plansPage.planUpdatedDetail', { plan: plan?.name ?? '' }),
    life: 3500,
  });
  router.push({ name: 'profile' });
};
</script>

<template>
  <div class="plans-page plans-selection">
    <nav class="plans-back-bar" aria-label="Navegación">
      <button type="button" class="plans-back-btn" @click="backToProfile">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('plansPage.back') }}</span>
      </button>
    </nav>

    <div class="plans-card">
      <header class="plans-head">
        <h1 class="plans-title">{{ t('plansPage.title') }}</h1>
        <p class="plans-subtitle">
          {{ showAllPlans ? t('plansPage.subtitle') : t('plansPage.currentPlanSubtitle') }}
        </p>
        <button type="button" class="plans-toggle" @click="showAllPlans = !showAllPlans">
          {{
            showAllPlans ? t('plansPage.showCurrentPlanOnly') : t('plansPage.showAllPlans')
          }}
        </button>
      </header>

      <div class="plans-grid" :class="{ 'plans-grid--single': !showAllPlans }">
        <article
          v-for="plan in visiblePlans"
          :key="plan.id"
          class="plan-card"
          :class="{
            'plan-card--current': isCurrent(plan.id),
            'plan-card--recommended': plan.recommended && showAllPlans,
          }"
        >
          <div v-if="plan.recommended && showAllPlans" class="badge-rec">
            {{ t('plansPage.recommended') }}
          </div>
          <h2 class="plan-name">{{ plan.name }}</h2>
          <p class="plan-price">{{ plan.price }}</p>
          <p class="plan-desc">{{ plan.desc }}</p>
          <ul class="plan-features">
            <li v-for="(f, idx) in plan.features" :key="idx" class="bullet">{{ f }}</li>
          </ul>
          <div class="plan-actions">
            <button
              v-if="isCurrent(plan.id)"
              type="button"
              class="plan-btn plan-btn--danger"
              @click="openCancel"
            >
              <i class="pi pi-times-circle" aria-hidden="true"></i>
              <span>{{ t('plansPage.cancelPlan') }}</span>
            </button>
            <button
              v-else
              type="button"
              class="plan-btn plan-btn--primary"
              @click="selectPlan(plan.id)"
            >
              <span>{{ t('plansPage.startNow') }}</span>
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </article>
      </div>
    </div>

    <MtConfirmDialog
      v-if="cancelOpen"
      v-model:visible="cancelOpen"
      :eyebrow="t('plansPage.cancelEyebrow')"
      :title="t('plansPage.cancelConfirmTitle')"
      :message="t('plansPage.cancelBenefitsEnd', { date: formattedBenefitsEnd })"
      :confirm-label="t('plansPage.confirm')"
      :cancel-label="t('plansPage.cancel')"
      confirm-tone="danger"
      confirm-icon="pi pi-check"
      @confirm="confirmCancel"
      @cancel="closeCancel"
    />
  </div>
</template>

<style scoped>
.plans-page {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
}

.plans-back-bar {
  background: #fff;
  border: 1px solid var(--mt-border);
  border-radius: 14px;
  padding: 0.55rem 0.75rem;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.plans-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  color: var(--mt-primary);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
}

.plans-back-btn:hover {
  background: var(--mt-primary-soft);
  color: var(--mt-primary-hover);
}

.plans-grid--single {
  grid-template-columns: minmax(0, 420px);
  justify-content: center;
}

.plans-selection .plan-card {
  min-height: 26rem;
}

@media (max-width: 960px) {
  .plans-selection .plan-card {
    min-height: auto;
  }
}
</style>
