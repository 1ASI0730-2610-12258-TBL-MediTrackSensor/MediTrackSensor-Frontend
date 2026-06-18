<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import {
  fetchProfileDemoFromApi,
  readPlanContext,
  writePlanContext,
  apiPlanToCatalogId,
} from '../../infrastructure/profile-demo.service.js';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const error = ref(null);
const user = ref(null);
const establishment = ref(null);
const planApi = ref('BASIC');

const isEditing = ref(false);
const editForm = ref({
  name: '',
  email: '',
  phone: '',
  entityName: '',
  jobTitle: '',
});

const maskedPassword = '••••••••';

const planDisplay = computed(() => String(planApi.value || '').toUpperCase());

const heroName = computed(() => {
  if (!user.value) return '';
  return isEditing.value ? editForm.value.name : user.value.name;
});

const heroEmail = computed(() => {
  if (!user.value) return '';
  return isEditing.value ? editForm.value.email : user.value.email;
});

const establishmentCode = computed(() => {
  const e = establishment.value;
  if (!e) return '—';
  return String(e.id ?? e.admin_id ?? '').padStart(7, '0');
});

async function loadProfile() {
  loading.value = true;
  error.value = null;
  try {
    const ctx = readPlanContext();
    const planFromSession =
        ctx?.planApiValue != null
            ? { planApiValue: ctx.planApiValue, benefitsEndDate: ctx.benefitsEndDate }
            : null;

    const data = await fetchProfileDemoFromApi({
      persistedUserId: ctx?.userId ?? null,
      planFromSession,
    });

    user.value = data.user;
    establishment.value = data.establishment;
    planApi.value = data.planApi;
    isEditing.value = false;

    writePlanContext({
      ...(ctx || {}),
      userId: data.user.id,
      planApiValue: data.planApi,
      benefitsEndDate: data.benefitsEndDate,
      catalogPlanId: apiPlanToCatalogId(data.planApi),
    });
  } catch (e) {
    console.error(e);
    error.value = t('profileView.loadError');
  } finally {
    loading.value = false;
  }
}

onMounted(loadProfile);

const logout = () => {
  sessionStorage.removeItem('meditrack_plan_context');
  localStorage.removeItem('userRole');
  router.push({ name: 'login' });
};

const goHome = () => {
  const role = localStorage.getItem('userRole');
  if (role === 'health-entity') router.push({ name: 'home-health-entity' });
  else if (role === 'operational-staff') router.push({ name: 'home-operational-staff' });
  else router.push({ name: 'login' });
};

const goPlans = () => {
  const ctx = readPlanContext() || {};
  writePlanContext({
    ...ctx,
    userId: user.value?.id,
    planApiValue: planApi.value,
    benefitsEndDate: ctx.benefitsEndDate,
    catalogPlanId: apiPlanToCatalogId(planApi.value),
  });
  router.push({ name: 'plans' });
};

const startEdit = () => {
  if (!user.value) return;
  editForm.value = {
    name: user.value.name ?? '',
    email: user.value.email ?? '',
    phone: user.value.phone ?? '',
    entityName: establishment.value?.establishment_name ?? '',
    jobTitle: user.value.job_title ?? '',
  };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const saveEdit = () => {
  if (!user.value) return;
  user.value.name = editForm.value.name;
  user.value.email = editForm.value.email;
  user.value.phone = editForm.value.phone;
  user.value.job_title = editForm.value.jobTitle;
  if (establishment.value) {
    establishment.value.establishment_name = editForm.value.entityName;
  }
  isEditing.value = false;
  toast.add({
    severity: 'success',
    summary: t('profileView.editSavedTitle'),
    detail: t('profileView.editSavedDetail'),
    life: 3500,
  });
};
</script>

<template>
  <div class="profile-page">
    <pv-button
        class="back-fab"
        icon="pi pi-arrow-left"
        rounded
        text
        severity="secondary"
        :aria-label="t('profileView.back')"
        @click="goHome"
    />

    <div v-if="loading" class="state state--loading">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <span>{{ t('profileView.loading') }}</span>
    </div>

    <div v-else-if="error" class="state state--error">
      <p>{{ error }}</p>
      <pv-button :label="t('profileView.retry')" @click="loadProfile" />
    </div>

    <template v-else-if="user">
      <header class="profile-hero">
        <img
            class="profile-avatar"
            :src="user.photo"
            :alt="heroName"
            width="72"
            height="72"
        />
        <div class="profile-identity">
          <h1 class="profile-name">{{ heroName }}</h1>
          <p class="profile-email">{{ heroEmail }}</p>
        </div>
        <aside class="sub-card sub-card--schedule" aria-label="schedule">
          <p class="sub-card__kicker">{{ t('profileView.scheduleTitle') }}</p>
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

      <!-- Misma lógica visual que las tarjetas de suscripción (plans-selection) -->
      <section class="fields-grid">
        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.name') }}</p>
          <input
              v-if="isEditing"
              v-model="editForm.name"
              type="text"
              class="sub-card__input"
              autocomplete="name"
          />
          <p v-else class="sub-card__value">{{ user.name }}</p>
        </article>

        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.entity') }}</p>
          <textarea
              v-if="isEditing"
              v-model="editForm.entityName"
              class="sub-card__input sub-card__input--area"
              rows="2"
              autocomplete="organization"
          />
          <p v-else class="sub-card__value sub-card__value--multiline">{{ establishment?.establishment_name ?? '—' }}</p>
        </article>

        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.dni') }}</p>
          <p class="sub-card__value sub-card__value--secondary">{{ user.dni }}</p>
        </article>

        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.entityCode') }}</p>
          <p class="sub-card__value sub-card__value--secondary">{{ establishmentCode }}</p>
        </article>

        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.email') }}</p>
          <input
              v-if="isEditing"
              v-model="editForm.email"
              type="email"
              class="sub-card__input"
              autocomplete="email"
          />
          <p v-else class="sub-card__value">{{ user.email }}</p>
        </article>

        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.jobTitle') }}</p>
          <input
              v-if="isEditing"
              v-model="editForm.jobTitle"
              type="text"
              class="sub-card__input"
              autocomplete="organization-title"
          />
          <p v-else class="sub-card__value">{{ user.job_title }}</p>
        </article>

        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.phone') }}</p>
          <input
              v-if="isEditing"
              v-model="editForm.phone"
              type="tel"
              class="sub-card__input"
              autocomplete="tel"
          />
          <p v-else class="sub-card__value">{{ user.phone }}</p>
        </article>

        <article class="sub-card">
          <p class="sub-card__kicker">{{ t('profileView.password') }}</p>
          <p class="sub-card__value sub-card__value--mono">{{ maskedPassword }}</p>
        </article>

        <article class="sub-card sub-card--plan">
          <p class="sub-card__kicker">{{ t('profileView.actualPlan') }}</p>
          <div class="plan-inline">
            <p class="sub-card__value sub-card__value--plan">{{ planDisplay }}</p>
            <pv-button
                class="btn-update btn-update--compact"
                :label="t('profileView.update')"
                icon="pi pi-sync"
                size="small"
                @click="goPlans"
            />
          </div>
        </article>
      </section>

      <div class="toolbar-actions">
        <template v-if="!isEditing">
          <pv-button
              class="btn-edit"
              :label="t('profileView.edit')"
              icon="pi pi-pencil"
              size="small"
              @click="startEdit"
          />
        </template>
        <template v-else>
          <pv-button
              class="btn-save"
              :label="t('profileView.save')"
              icon="pi pi-check"
              size="small"
              @click="saveEdit"
          />
          <pv-button
              :label="t('profileView.cancelEdit')"
              severity="secondary"
              outlined
              size="small"
              @click="cancelEdit"
          />
        </template>
        <pv-button
            class="btn-return"
            :label="t('profileView.return')"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            size="small"
            @click="goHome"
        />
      </div>

      <footer class="profile-footer">
        <pv-button
            :label="t('iam.logout')"
            icon="pi pi-sign-out"
            severity="danger"
            size="small"
            @click="logout"
        />
      </footer>
    </template>
  </div>
</template>

<style scoped>
/* Perfil compacto tipo panel administrativo */
.profile-page {
  position: relative;
  max-width: 920px;
  margin: 0 auto;
  padding: 0 0 1.5rem;
}

.back-fab {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 200px;
  color: #64748b;
  font-size: 0.9rem;
}

.state--error {
  color: #b91c1c;
}

.profile-hero {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem 1.25rem;
  align-items: center;
  margin-bottom: 1.25rem;
  padding: 0.75rem 0 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.profile-identity {
  min-width: 0;
}

.profile-name {
  margin: 0 0 0.2rem;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.profile-email {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  line-height: 1.35;
}

.sub-card {
  position: relative;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.65rem 0.85rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.sub-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.sub-card--schedule {
  padding: 0.65rem 0.85rem;
  max-width: 17rem;
}

.sub-card--plan {
  grid-column: 1 / -1;
  padding: 0.65rem 1rem;
}

.sub-card__kicker {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  line-height: 1.2;
}

.sub-card__value {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.4;
  color: #0f172a;
  letter-spacing: -0.01em;
  word-break: break-word;
}

.sub-card__value--multiline {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.45;
}

.sub-card__value--secondary {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.sub-card__value--mono {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  letter-spacing: 0.08em;
  color: #64748b;
}

.sub-card__value--plan {
  font-size: 1rem;
  font-weight: 700;
}

.sub-card__input {
  width: 100%;
  margin: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  background: #fafafa;
  font-family: inherit;
  box-sizing: border-box;
}

.sub-card__input:focus {
  outline: none;
  border-color: #94a3b8;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.25);
}

.sub-card__input--area {
  min-height: 3.25rem;
  resize: vertical;
  line-height: 1.4;
  font-weight: 500;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  align-items: stretch;
  margin-bottom: 1rem;
}

.plan-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  justify-content: space-between;
}

.plan-inline .sub-card__value--plan {
  flex: 1 1 120px;
  margin: 0;
}

.btn-update--compact {
  flex-shrink: 0;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.schedule-table th {
  text-align: left;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 0 0.4rem 0.2rem 0;
}

.schedule-table td {
  color: #475569;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem 0 0;
  vertical-align: top;
}

.btn-edit {
  background: #ea580c !important;
  border-color: #ea580c !important;
}

.btn-save {
  background: #ea580c !important;
  border-color: #ea580c !important;
}

.btn-update {
  background: #ea580c !important;
  border-color: #ea580c !important;
}

.btn-return {
  color: #1e3a8a !important;
  border-color: #cbd5e1 !important;
}

.profile-footer {
  display: flex;
  justify-content: center;
  padding-top: 0.85rem;
  border-top: 1px solid #e2e8f0;
}

.profile-footer :deep(.p-button) {
  font-size: 0.875rem;
}

@media (max-width: 900px) {
  .profile-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .profile-avatar {
    margin: 0 auto;
  }

  .sub-card--schedule {
    max-width: none;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .sub-card--plan {
    grid-column: auto;
  }

  .plan-inline {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-update--compact {
    width: 100%;
  }
}
</style>
