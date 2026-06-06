<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import AuthPanel from '../components/auth-panel.vue';
import { completeHealthEntityRegistration } from '../../infrastructure/auth.service.js';
import { readPendingPlan, readPendingRegistration } from '../../infrastructure/auth-session.js';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();

const card = ref({ cardNumber: '', expiry: '', cvv: '' });
const loading = ref(false);
const selectedPlan = readPendingPlan();

const planLabel = computed(() => {
  const id = selectedPlan?.catalogPlanId;
  if (!id) return '';
  return t(`plansPage.names.${id}`);
});

onMounted(() => {
  if (!readPendingRegistration() || !selectedPlan?.planApiValue) {
    router.replace({ name: 'iam-register-plans' });
  }
});

function goBack() {
  router.push({ name: 'iam-register-plans' });
}

async function onSubmit() {
  loading.value = true;
  try {
    const result = await completeHealthEntityRegistration(card.value);
    if (!result.ok) {
      if (result.errors) {
        const key = Object.keys(result.errors)[0];
        toast.add({
          severity: 'error',
          summary: t('iam.errors.title'),
          detail: t(`iam.payment.${result.errors[key]}`),
          life: 5000,
        });
        return;
      }
      toast.add({
        severity: 'error',
        summary: t('iam.errors.title'),
        detail: t(`iam.errors.${result.error}`),
        life: 4000,
      });
      return;
    }
    toast.add({
      severity: 'success',
      summary: t('iam.payment.successTitle'),
      detail: t('iam.payment.successDetail', { email: result.email }),
      life: 6000,
    });
    router.push({ name: 'iam-login-health-entity' });
  } catch (e) {
    console.error(e);
    toast.add({ severity: 'error', summary: t('iam.errors.title'), detail: t('iam.errors.network'), life: 4000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <auth-panel show-back single-column compact @back="goBack">
    <div class="reg-compact">
      <header class="reg-compact__head">
        <img src="/logo.png" :alt="t('common.logoAlt')" class="reg-compact__logo" />
        <h1 class="reg-compact__title">{{ t('iam.payment.title') }}</h1>
        <p v-if="planLabel" class="reg-compact__hint">
          {{ t('iam.payment.selectedPlan') }}: <strong>{{ planLabel }}</strong>
        </p>
      </header>

      <form class="reg-compact__form" @submit.prevent="onSubmit">
        <p class="reg-compact__field" style="margin:0;font-weight:700;">
          <i class="pi pi-credit-card"></i> {{ t('iam.payment.card') }}
        </p>
        <label class="reg-compact__field">
          <span>{{ t('iam.payment.cardNumber') }}</span>
          <input v-model="card.cardNumber" placeholder="0000 0000 0000 0000" maxlength="19" />
        </label>
        <div class="reg-compact__row">
          <label class="reg-compact__field">
            <span>{{ t('iam.payment.expiry') }}</span>
            <input v-model="card.expiry" placeholder="MM/AA" maxlength="5" />
          </label>
          <label class="reg-compact__field">
            <span>{{ t('iam.payment.cvv') }}</span>
            <input v-model="card.cvv" type="password" placeholder="•••" maxlength="4" />
          </label>
        </div>
        <button type="submit" class="btn-primary reg-compact__btn" :disabled="loading">
          {{ loading ? t('iam.payment.processing') : t('iam.payment.submit') }}
        </button>
      </form>
    </div>
  </auth-panel>
</template>
