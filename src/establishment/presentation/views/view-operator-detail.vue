<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fetchDashboardPayload } from '../../../shared/infrastructure/dashboard-payload.js';
import { Operator } from '../../domain/model/operator.entity.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const establishment = ref(null);
const operator = ref(null);
const user = ref(null);

function sameId(a, b) {
  return Number(a) === Number(b) || String(a) === String(b);
}

async function load() {
  loading.value = true;
  const oid = route.params.operatorId;
  try {
    const data = await fetchDashboardPayload();
    const ops = data.operators || [];
    const allUsers = [...(data.users || []), ...(data.admins || [])];
    operator.value = ops.find((o) => String(o.id) === String(oid)) ?? null;
    user.value = operator.value
      ? (allUsers.find((u) => u.id === operator.value.users_id) ?? null)
      : null;
    if (operator.value?.establishment_id != null) {
      establishment.value =
        (data.establishments || []).find((e) =>
          sameId(e.id, operator.value.establishment_id),
        ) ?? null;
    } else {
      establishment.value = null;
    }
  } catch (e) {
    console.error(e);
    operator.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.operatorId, load);

const scheduleRows = computed(() => {
  const sch = operator.value?.schedule;
  if (!sch) {
    return [
      { turn: t('establishment.scheduleMorning'), day: '—' },
      { turn: t('establishment.scheduleAfternoon'), day: '—' },
      { turn: t('establishment.scheduleNight'), day: '—' },
    ];
  }
  if (typeof sch === 'string') {
    return [{ turn: t('establishment.scheduleShift'), day: sch }];
  }
  if (typeof sch === 'object' && !Array.isArray(sch)) {
    return Object.entries(sch).map(([turn, day]) => ({ turn, day: String(day) }));
  }
  if (Array.isArray(sch)) {
    return sch.map((row) => ({
      turn: row.turn || row.shift || '—',
      day: row.day || row.hours || row.range || '—',
    }));
  }
  return [{ turn: t('establishment.scheduleShift'), day: Operator.formatSchedule(sch) }];
});

const entryDate = computed(() => {
  const op = operator.value;
  const u = user.value;
  if (!op && !u) return '—';
  const raw = op?.entry_date ?? u?.entry_date ?? op?.createdAt ?? op?.created_at;
  if (!raw) return '—';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString();
});

function goList() {
  router.push({ name: 'operators' });
}

const heroName = computed(() => user.value?.name || t('establishment.unknownUser'));
const heroEmail = computed(() => user.value?.email || '—');
const userInitial = computed(() => {
  const n = user.value?.name;
  return n && n.length ? n.charAt(0).toUpperCase() : '?';
});
const photoUrl = computed(
  () => user.value?.photo || user.value?.photo_url || user.value?.avatar || null,
);
</script>

<template>
  <div class="est-flow-page">
    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goList">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('establishment.backToOperators') }}</span>
      </button>
    </nav>

    <div v-if="loading" class="est-flow-card est-flow-state">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <span>{{ t('establishment.detailLoading') }}</span>
    </div>

    <div v-else-if="!operator" class="est-flow-card est-flow-state est-flow-state--warn">
      <p>{{ t('establishment.operatorNotFound') }}</p>
      <button type="button" class="est-flow-btn est-flow-btn--ghost" @click="goList">
        {{ t('establishment.back') }}
      </button>
    </div>

    <div v-else class="est-flow-card">
      <header class="est-flow-head">
        <h1 class="est-flow-title">{{ t('establishment.operatorInfo') }}</h1>
      </header>

      <div class="est-flow-hero">
        <div class="est-flow-hero__identity">
          <img
            v-if="photoUrl"
            :src="photoUrl"
            alt=""
            width="64"
            height="64"
            style="border-radius: 50%; object-fit: cover"
          />
          <span
            v-else
            class="mt-user-avatar mt-user-avatar--round mt-user-avatar--lg"
          >{{ userInitial }}</span>
          <div>
            <h2 class="est-flow-hero__name">{{ heroName }}</h2>
            <p class="est-flow-hero__email">{{ heroEmail }}</p>
          </div>
        </div>
        <aside class="est-flow-schedule" aria-label="schedule">
          <h3 class="est-flow-schedule__title">{{ t('profileView.scheduleTitle') }}</h3>
          <table>
            <thead>
              <tr>
                <th>{{ t('profileView.scheduleShift') }}</th>
                <th>{{ t('profileView.scheduleDay') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in scheduleRows" :key="idx">
                <td>{{ row.turn }}</td>
                <td>{{ row.day }}</td>
              </tr>
            </tbody>
          </table>
        </aside>
      </div>

      <div class="est-flow-fields">
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldOpName') }}</span>
          <span class="est-flow-field__value">{{ user?.name || '—' }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldAssignedEst') }}</span>
          <span class="est-flow-field__value">
            {{ establishment?.establishment_name || t('establishment.unassignedSite') }}
          </span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldDni') }}</span>
          <span class="est-flow-field__value">{{ user?.dni || user?.document || '—' }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldEntryDate') }}</span>
          <span class="est-flow-field__value">{{ entryDate }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldEmail') }}</span>
          <span class="est-flow-field__value">{{ user?.email || '—' }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldAlertsAnswered') }}</span>
          <span class="est-flow-field__value">{{ operator.alerts_answered ?? 0 }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldPhone') }}</span>
          <span class="est-flow-field__value">{{ user?.phone || '—' }}</span>
        </div>
        <div class="est-flow-field">
          <span class="est-flow-field__label">{{ t('establishment.fieldJobTitle') }}</span>
          <span class="est-flow-field__value">{{ user?.job_title || user?.jobTitle || '—' }}</span>
        </div>
      </div>

      <footer class="est-flow-actions">
        <button type="button" class="est-flow-btn est-flow-btn--ghost" @click="goList">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          <span>{{ t('establishment.back') }}</span>
        </button>
      </footer>
    </div>
  </div>
</template>
