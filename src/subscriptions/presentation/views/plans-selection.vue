<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import {
  readPlanContext,
  writePlanContext,
  apiPlanToCatalogId,
  catalogIdToApiPlan,
} from '../../../iam/infrastructure/profile-demo.service.js';

const { t, locale } = useI18n();
const router = useRouter();
const toast = useToast();

const currentCatalogId = ref('basic');
const benefitsEndDate = ref(null);
const cancelOpen = ref(false);

const planDefs = computed(() => [
  {
    id: 'basic',
    name: t('plansPage.names.basic'),
    price: t('plansPage.prices.basic'),
    desc: t('plansPage.desc.basic'),
    recommended: false,
    features: [
      { ok: true, text: t('plansPage.features.basic.0') },
      { ok: true, text: t('plansPage.features.basic.1') },
      { ok: true, text: t('plansPage.features.basic.2') },
      { ok: true, text: t('plansPage.features.basic.3') },
      { ok: false, text: t('plansPage.features.basic.4') },
      { ok: false, text: t('plansPage.features.basic.5') },
    ],
  },
  {
    id: 'professional',
    name: t('plansPage.names.pro'),
    price: t('plansPage.prices.pro'),
    desc: t('plansPage.desc.pro'),
    recommended: true,
    features: [
      { ok: true, text: t('plansPage.features.pro.0') },
      { ok: true, text: t('plansPage.features.pro.1') },
      { ok: true, text: t('plansPage.features.pro.2') },
      { ok: true, text: t('plansPage.features.pro.3') },
    ],
  },
  {
    id: 'premium',
    name: t('plansPage.names.premium'),
    price: t('plansPage.prices.premium'),
    desc: t('plansPage.desc.premium'),
    recommended: false,
    features: [
      { ok: true, text: t('plansPage.features.premium.0') },
      { ok: true, text: t('plansPage.features.premium.1') },
      { ok: true, text: t('plansPage.features.premium.2') },
      { ok: true, text: t('plansPage.features.premium.3') },
      { ok: true, text: t('plansPage.features.premium.4') },
      { ok: true, text: t('plansPage.features.premium.5') },
    ],
    contactSales: true,
  },
]);

function syncFromSession() {
  const ctx = readPlanContext();
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
  const ctx = readPlanContext() || {};
  writePlanContext({
    ...ctx,
    planApiValue: 'BASIC',
    catalogPlanId: 'basic',
    benefitsEndDate: iso,
  });
  currentCatalogId.value = 'basic';
  benefitsEndDate.value = iso;
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
  const plan = planDefs.value.find((p) => p.id === catalogId);
  if (plan?.contactSales) {
    toast.add({
      severity: 'info',
      summary: t('plansPage.contactTitle'),
      detail: t('plansPage.contactDetail'),
      life: 4000,
    });
    return;
  }
  const apiVal = catalogIdToApiPlan(catalogId);
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  const iso = end.toISOString().slice(0, 10);
  const ctx = readPlanContext() || {};
  writePlanContext({
    ...ctx,
    planApiValue: apiVal,
    catalogPlanId: catalogId,
    benefitsEndDate: iso,
  });
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
  <div class="plans-page">
    <header class="plans-head">
      <pv-button
        icon="pi pi-arrow-left"
        text
        rounded
        class="plans-back"
        :aria-label="t('plansPage.back')"
        @click="backToProfile"
      />
      <div class="plans-brand">
        <img src="/logo.png" alt="" class="plans-logo" width="56" height="56" />
        <div>
          <p class="plans-brand-name">MediTrack Sensor</p>
          <h1 class="plans-title">{{ t('plansPage.title') }}</h1>
        </div>
      </div>
    </header>

    <div class="plans-grid">
      <article
        v-for="plan in planDefs"
        :key="plan.id"
        class="plan-card"
        :class="{
          'plan-card--current': isCurrent(plan.id),
          'plan-card--recommended': plan.recommended,
        }"
      >
        <div v-if="plan.recommended" class="badge-rec">{{ t('plansPage.recommended') }}</div>
        <h2 class="plan-name">{{ plan.name }}</h2>
        <p class="plan-price">{{ plan.price }}</p>
        <p class="plan-desc">{{ plan.desc }}</p>
        <ul class="plan-features">
          <li v-for="(f, idx) in plan.features" :key="idx" :class="f.ok ? 'ok' : 'no'">
            <i :class="f.ok ? 'pi pi-check' : 'pi pi-times'" aria-hidden="true"></i>
            <span>{{ f.text }}</span>
          </li>
        </ul>
        <div class="plan-actions">
          <template v-if="isCurrent(plan.id)">
            <pv-button
              :label="t('plansPage.cancelPlan')"
              class="btn-cancel-plan"
              icon="pi pi-times-circle"
              @click="openCancel"
            />
          </template>
          <template v-else-if="plan.contactSales">
            <pv-button
              :label="t('plansPage.contactSales')"
              severity="secondary"
              outlined
              icon="pi pi-arrow-right"
              icon-pos="right"
              @click="selectPlan(plan.id)"
            />
          </template>
          <template v-else>
            <pv-button
              :label="t('plansPage.startNow')"
              class="btn-start"
              icon="pi pi-arrow-right"
              icon-pos="right"
              @click="selectPlan(plan.id)"
            />
          </template>
        </div>
      </article>
    </div>

    <pv-dialog
      v-model:visible="cancelOpen"
      :modal="true"
      :draggable="false"
      :closable="false"
      :show-header="false"
      dismissable-mask
      class="cancel-dialog-wrap"
      :style="{ width: 'min(92vw, 480px)' }"
      content-class="cancel-dialog-surface"
      @hide="closeCancel"
    >
      <div class="cancel-shell">
        <button
          type="button"
          class="cancel-close"
          :aria-label="t('plansPage.closeModal')"
          @click="closeCancel"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
        <div class="cancel-inner">
          <h2 class="cancel-title">{{ t('plansPage.cancelConfirmTitle') }}</h2>
          <p class="cancel-sub">{{ t('plansPage.cancelBenefitsEnd', { date: formattedBenefitsEnd }) }}</p>
          <div class="cancel-actions">
            <button type="button" class="cancel-btn cancel-btn--confirm" @click="confirmCancel">
              {{ t('plansPage.confirm') }}
            </button>
            <button type="button" class="cancel-btn cancel-btn--dismiss" @click="closeCancel">
              {{ t('plansPage.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </pv-dialog>
  </div>
</template>

<style scoped>
.plans-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 0 3rem;
}

.plans-head {
  position: relative;
  text-align: center;
  padding: 0.5rem 0 2rem;
}

.plans-back {
  position: absolute;
  left: 0;
  top: 0;
}

.plans-brand {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.plans-logo {
  object-fit: contain;
}

.plans-brand-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: -0.01em;
}

.plans-title {
  margin: 0.25rem 0 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  align-items: stretch;
}

.plan-card {
  position: relative;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.5rem 1.35rem 1.35rem;
  min-height: 28rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.plan-card--recommended {
  border-color: #ea580c;
  box-shadow: 0 12px 40px rgba(234, 88, 12, 0.15);
}

.plan-card--current {
  border-color: #1e3a8a;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.12);
}

.badge-rec {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fff;
  background: #ea580c;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
}

.plan-name {
  margin: 0 0 0.35rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.plan-price {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.plan-desc {
  margin: 0 0 1rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #64748b;
  flex-grow: 0;
}

.plan-features {
  list-style: none;
  margin: 0 0 1.25rem;
  padding: 0;
  flex: 1;
}

.plan-features li {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.82rem;
  margin-bottom: 0.45rem;
  line-height: 1.35;
}

.plan-features li.ok {
  color: #15803d;
}

.plan-features li.no {
  color: #94a3b8;
}

.plan-features li i {
  margin-top: 0.1rem;
  font-size: 0.85rem;
}

.plan-actions {
  margin-top: auto;
}

.plan-actions :deep(.p-button) {
  width: 100%;
  justify-content: center;
}

.btn-start {
  background: #ea580c !important;
  border-color: #ea580c !important;
}

.btn-cancel-plan {
  background: #dc2626 !important;
  border-color: #dc2626 !important;
}

:deep(.cancel-dialog-wrap.p-dialog) {
  border: none;
  box-shadow: none;
  background: transparent;
  overflow: visible;
}

:deep(.cancel-dialog-wrap .p-dialog-content) {
  padding: 0;
  background: transparent;
  overflow: visible;
  border-radius: 0;
}

.cancel-shell {
  position: relative;
  padding: 0.45rem;
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
  border-radius: 22px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.cancel-close {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  z-index: 2;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(51, 65, 85, 0.95);
  color: #f8fafc;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.cancel-close:hover {
  background: #475569;
  transform: scale(1.05);
}

.cancel-inner {
  position: relative;
  padding: 2rem 1.75rem 1.65rem;
  border-radius: 18px;
  background: linear-gradient(165deg, #1e3a8a 0%, #172554 45%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.cancel-title {
  margin: 0 2.25rem 0.85rem 0;
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.35;
  color: #fb923c;
  letter-spacing: -0.02em;
}

.cancel-sub {
  margin: 0 0 1.65rem;
  font-size: 0.95rem;
  line-height: 1.55;
  color: rgba(248, 250, 252, 0.94);
}

.cancel-actions {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.cancel-btn {
  flex: 1 1 140px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.cancel-btn:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.cancel-btn--confirm {
  background: linear-gradient(180deg, #fb7185 0%, #f43f5e 100%);
  color: #0f172a;
  box-shadow: 0 4px 14px rgba(244, 63, 94, 0.45);
}

.cancel-btn--dismiss {
  background: #334155;
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

@media (max-width: 960px) {
  .plans-grid {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: 0 auto;
  }

  .plan-card {
    min-height: auto;
  }

  .plans-back {
    position: relative;
    margin-bottom: 0.5rem;
  }

  .plans-head {
    padding-top: 0;
  }
}
</style>
