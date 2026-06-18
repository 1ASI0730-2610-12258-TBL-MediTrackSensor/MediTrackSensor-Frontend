<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import useIamStore from '../../application/iam.store.js';
import useSubscriptionsStore from '../../../subscriptions/application/subscriptions.store.js';
import { Subscription } from '../../../subscriptions/domain/model/subscription.entity.js';

const iamStore = useIamStore();
const subscriptionsStore = useSubscriptionsStore();
const { t } = useI18n();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const error = ref(null);
const user = ref(null);
const establishment = ref(null);
const planApi = ref('BASIC');
const isEditing = ref(false);

const form = ref({
  name: '',
  email: '',
  phone: '',
  entityName: '',
  jobTitle: '',
  dni: '',
  entityCode: '',
});

const planDisplay = computed(() => {
  const api = String(planApi.value || 'BASIC').toUpperCase();
  const catalog = Subscription.apiPlanToCatalogId(api);
  const keyMap = { basic: 'basic', professional: 'pro', pro: 'pro', premium: 'premium' };
  const localeKey = keyMap[catalog] || 'basic';
  try {
    return t(`plansPage.names.${localeKey}`);
  } catch {
    return String(api);
  }
});

const userInitial = computed(() => (form.value.name?.charAt(0) ?? 'U').toUpperCase());
const hasPhoto = computed(() => Boolean(user.value?.photo));
const inputsReadonly = computed(() => !isEditing.value);

const backLabel = computed(() => {
  const role = localStorage.getItem('userRole');
  if (role === 'operational-staff') return t('profileView.backToStaffHome');
  return t('profileView.backToHome');
});

function syncFormFromUser() {
  if (!user.value) return;
  form.value = {
    name: user.value.name ?? '',
    email: user.value.email ?? '',
    phone: user.value.phone ?? '',
    entityName:
      establishment.value?.establishment_name ??
      iamStore.profileEntityName ??
      '',
    jobTitle: user.value.job_title ?? '',
    dni: user.value.dni ?? '',
    entityCode: iamStore.profileEntityCode ? String(iamStore.profileEntityCode) : '',
  };
}

async function loadProfile() {
  loading.value = true;
  error.value = null;
  try {
    await iamStore.loadProfileFromSession();
    user.value = iamStore.profileUser;
    establishment.value = iamStore.profileEstablishment;
    planApi.value = iamStore.profilePlanApi;
    isEditing.value = false;
    syncFormFromUser();
  } catch (e) {
    console.error(e);
    error.value = t('profileView.loadError');
  } finally {
    loading.value = false;
  }
}

onMounted(loadProfile);

function goHome() {
  const role = localStorage.getItem('userRole');
  if (role === 'health-entity') router.push({ name: 'home-health-entity' });
  else if (role === 'operational-staff') router.push({ name: 'home-operational-staff' });
  else router.push({ name: 'login' });
}

function goPlans() {
  const ctx = subscriptionsStore.readPlanContext() || {};
  subscriptionsStore.writePlanContext({
    ...ctx,
    userId: user.value?.id,
    planApiValue: planApi.value,
    benefitsEndDate: ctx.benefitsEndDate,
    catalogPlanId: Subscription.apiPlanToCatalogId(planApi.value),
  });
  router.push({ name: 'plans' });
}

function startEdit() {
  syncFormFromUser();
  isEditing.value = true;
}

function cancelEdit() {
  syncFormFromUser();
  isEditing.value = false;
}

function saveEdit() {
  if (!user.value) return;
  user.value.name = form.value.name;
  user.value.email = form.value.email;
  user.value.phone = form.value.phone;
  user.value.job_title = form.value.jobTitle;
  if (establishment.value) {
    establishment.value.establishment_name = form.value.entityName;
  }
  isEditing.value = false;
  toast.add({
    severity: 'success',
    summary: t('profileView.editSavedTitle'),
    detail: t('profileView.editSavedDetail'),
    life: 3500,
  });
}
</script>

<template>
  <div class="profile-page">
    <nav v-if="!loading && !error" class="profile-back-bar" aria-label="Navegación">
      <button type="button" class="profile-back-btn" @click="goHome">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ backLabel }}</span>
      </button>
    </nav>

    <div v-if="loading" class="profile-card state state--loading">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <span>{{ t('profileView.loading') }}</span>
    </div>

    <div v-else-if="error" class="profile-card state state--error">
      <p>{{ error }}</p>
      <button type="button" class="profile-btn profile-btn--primary" @click="loadProfile">
        {{ t('profileView.retry') }}
      </button>
    </div>

    <div v-else-if="user" class="profile-card">
      <header class="profile-hero">
        <div class="profile-hero__identity">
          <img
            v-if="hasPhoto"
            class="profile-avatar profile-avatar--img"
            :src="user.photo"
            :alt="form.name"
            width="52"
            height="52"
          />
          <span
            v-else
            class="mt-user-avatar mt-user-avatar--round mt-user-avatar--lg profile-avatar--initial"
          >{{ userInitial }}</span>
          <div class="profile-identity">
            <h1 class="profile-name">{{ form.name }}</h1>
            <p class="profile-email">{{ form.email }}</p>
          </div>
        </div>
        <aside class="field-block field-block--schedule" aria-label="schedule">
          <span class="field-block__label">{{ t('profileView.scheduleTitle') }}</span>
          <table class="schedule-table">
            <thead>
              <tr>
                <th>{{ t('profileView.scheduleShift') }}</th>
                <th>{{ t('profileView.scheduleDay') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ t('profileView.scheduleShiftValue') }}</td>
                <td>{{ t('profileView.scheduleDayValue') }}</td>
              </tr>
            </tbody>
          </table>
        </aside>
      </header>

      <section class="fields-grid">
        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.name') }}</span>
          <input
            v-model="form.name"
            type="text"
            class="field-block__input"
            :readonly="inputsReadonly"
            autocomplete="name"
          />
        </label>

        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.entity') }}</span>
          <input
            v-model="form.entityName"
            type="text"
            class="field-block__input"
            :readonly="inputsReadonly"
            autocomplete="organization"
          />
        </label>

        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.dni') }}</span>
          <input
            v-model="form.dni"
            type="text"
            class="field-block__input field-block__input--readonly"
            readonly
          />
        </label>

        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.entityCode') }}</span>
          <input
            v-model="form.entityCode"
            type="text"
            class="field-block__input field-block__input--readonly"
            readonly
          />
        </label>

        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.email') }}</span>
          <input
            v-model="form.email"
            type="email"
            class="field-block__input"
            :readonly="inputsReadonly"
            autocomplete="email"
          />
        </label>

        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.jobTitle') }}</span>
          <input
            v-model="form.jobTitle"
            type="text"
            class="field-block__input"
            :readonly="inputsReadonly"
            autocomplete="organization-title"
          />
        </label>

        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.phone') }}</span>
          <input
            v-model="form.phone"
            type="tel"
            class="field-block__input"
            :readonly="inputsReadonly"
            autocomplete="tel"
          />
        </label>

        <label class="field-block">
          <span class="field-block__label">{{ t('profileView.password') }}</span>
          <input
            type="text"
            class="field-block__input field-block__input--readonly"
            value="••••••••"
            readonly
          />
        </label>

        <div class="field-block field-block--plan">
          <span class="field-block__label">{{ t('profileView.actualPlan') }}</span>
          <div class="plan-row">
            <input
              type="text"
              class="field-block__input field-block__input--plan"
              :value="planDisplay"
              readonly
            />
            <button type="button" class="profile-btn profile-btn--plan" @click="goPlans">
              <i class="pi pi-credit-card" aria-hidden="true"></i>
              <span>{{ t('profileView.updatePlan') }}</span>
            </button>
          </div>
        </div>
      </section>

      <footer class="toolbar-actions">
        <template v-if="!isEditing">
          <button type="button" class="profile-btn profile-btn--edit" @click="startEdit">
            <i class="pi pi-user-edit" aria-hidden="true"></i>
            <span>{{ t('profileView.edit') }}</span>
          </button>
        </template>
        <template v-else>
          <button type="button" class="profile-btn profile-btn--primary" @click="saveEdit">
            <i class="pi pi-check" aria-hidden="true"></i>
            <span>{{ t('profileView.save') }}</span>
          </button>
          <button type="button" class="profile-btn profile-btn--ghost" @click="cancelEdit">
            <span>{{ t('profileView.cancelEdit') }}</span>
          </button>
        </template>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-back-bar {
  background: #fff;
  border: 1px solid var(--mt-border);
  border-radius: 14px;
  padding: 0.55rem 0.75rem;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.profile-back-btn {
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

.profile-back-btn:hover {
  background: var(--mt-primary-soft);
  color: var(--mt-primary-hover);
}

.profile-back-btn i {
  font-size: 0.8rem;
}

.profile-card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid var(--mt-border);
  box-shadow: 0 10px 36px rgba(15, 23, 42, 0.07);
  padding: 1.65rem 1.75rem 1.35rem;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 180px;
  color: var(--mt-text-muted);
  font-size: 0.875rem;
}

.state--error {
  color: #b91c1c;
}

.profile-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--mt-border);
}

.profile-hero__identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.profile-identity {
  min-width: 0;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-avatar--img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
}

.profile-name {
  margin: 0 0 0.15rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--mt-heading);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.profile-email {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--mt-text-muted);
  line-height: 1.35;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.15rem;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.field-block--schedule {
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--mt-border);
  border-radius: 12px;
  background: #f8fafc;
  min-width: min(100%, 14.5rem);
}

.field-block--plan {
  grid-column: 1 / -1;
}

.field-block__label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--mt-text-muted);
}

.field-block__input {
  width: 100%;
  margin: 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--mt-border);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mt-heading);
  background: #fff;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field-block__input:focus {
  outline: none;
  border-color: var(--mt-primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}

.field-block__input:read-only,
.field-block__input--readonly {
  background: #f8fafc;
  color: #475569;
  cursor: default;
}

.field-block__input--plan {
  flex: 1;
  font-weight: 600;
  color: var(--mt-primary);
}

.plan-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--mt-border);
}

.profile-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease, transform 0.15s ease;
}

.profile-btn i {
  font-size: 0.85rem;
}

.profile-btn--primary {
  background: linear-gradient(180deg, #2563eb, var(--mt-primary));
  color: #fff;
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.25);
}

.profile-btn--edit {
  background: linear-gradient(180deg, #2563eb, var(--mt-primary));
  color: #fff;
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.25);
}

.profile-btn--plan {
  background: #fff;
  color: var(--mt-accent);
  border: 1px solid rgba(13, 148, 136, 0.35);
  box-shadow: none;
  white-space: nowrap;
}

.profile-btn--plan:hover {
  background: var(--mt-accent-soft);
  transform: translateY(-1px);
}

.profile-btn--primary:hover,
.profile-btn--edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.profile-btn--ghost {
  background: #fff;
  color: var(--mt-text-muted);
  border: 1px solid var(--mt-border);
}

.profile-btn--ghost:hover {
  background: #f8fafc;
  color: var(--mt-heading);
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
  margin-top: 0.15rem;
}

.schedule-table th {
  text-align: left;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--mt-text-muted);
  padding: 0 0.35rem 0.15rem 0;
}

.schedule-table td {
  color: #475569;
  font-weight: 600;
  font-size: 0.7rem;
  padding: 0.1rem 0.35rem 0 0;
}

@media (max-width: 640px) {
  .profile-card {
    padding: 1rem;
    border-radius: 16px;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .field-block--plan {
    grid-column: auto;
  }

  .plan-row {
    flex-direction: column;
    align-items: stretch;
  }

  .profile-btn {
    width: 100%;
  }
}
</style>
