<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AuthPanel from '../components/auth-panel.vue';
import { saveRegistrationPlan } from '../../infrastructure/auth.service.js';
import { readPendingRegistration } from '../../infrastructure/auth-session.js';
import { buildAllPlanCards } from '../../../subscriptions/application/plan-catalog.js';
import '../../../subscriptions/presentation/styles/plans-shared.css';

const { t } = useI18n();
const router = useRouter();

onMounted(() => {
  if (!readPendingRegistration()) {
    router.replace({ name: 'iam-register-health-entity' });
  }
});

const plans = computed(() => buildAllPlanCards(t));

function selectPlan(plan) {
  saveRegistrationPlan(plan.id);
  router.push({ name: 'iam-billing' });
}

function goBack() {
  router.push({ name: 'iam-register-health-entity' });
}
</script>

<template>
  <auth-panel show-back single-column wide @back="goBack">
    <div class="plans-page plans-page--auth">
      <div class="plans-card">
        <header class="plans-head">
          <img src="/logo.png" :alt="t('common.logoAlt')" class="plans-logo" />
          <h1 class="plans-title">{{ t('plansPage.title') }}</h1>
          <p class="plans-subtitle">{{ t('plansPage.subtitle') }}</p>
        </header>

        <div class="plans-grid">
          <article
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :class="{ 'plan-card--recommended': plan.recommended }"
          >
            <div v-if="plan.recommended" class="badge-rec">{{ t('plansPage.recommended') }}</div>
            <h2 class="plan-name">{{ plan.name }}</h2>
            <p class="plan-price">{{ plan.price }}</p>
            <p class="plan-desc">{{ plan.desc }}</p>
            <ul class="plan-features">
              <li v-for="(f, i) in plan.features" :key="i" class="bullet">{{ f }}</li>
            </ul>
            <div class="plan-actions">
              <button type="button" class="plan-btn plan-btn--primary" @click="selectPlan(plan)">
                <span>{{ t('plansPage.startNow') }}</span>
                <i class="pi pi-arrow-right" aria-hidden="true"></i>
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </auth-panel>
</template>
