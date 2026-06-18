<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const establishment = ref(null);
const operator = ref(null);
const user = ref(null);

function sameEst(a, b) {
  return Number(a) === Number(b) || String(a) === String(b);
}

async function load() {
  loading.value = true;
  const eid = route.params.establishmentId;
  const oid = route.params.operatorId;
  try {
    const data = await fetchDashboardData();
    establishment.value = data.establishments.find((e) => sameEst(e.id, eid)) ?? null;
    const ops = data.operators || [];
    const allUsers = [...(data.users || []), ...(data.admins || [])];
    operator.value = ops.find((o) => String(o.id) === String(oid) && sameEst(o.establishment_id, eid)) ?? null;
    if (operator.value) {
      user.value = allUsers.find((u) => u.id === operator.value.users_id) ?? null;
    } else {
      user.value = null;
    }
  } catch (e) {
    console.error(e);
    operator.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => [route.params.establishmentId, route.params.operatorId], load);

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
  return [{ turn: '—', day: String(sch) }];
});

const entryDate = computed(() => {
  const op = operator.value;
  if (!op) return '—';
  const raw = op.entry_date ?? op.entryDate ?? op.createdAt ?? op.created_at;
  if (!raw) return '—';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString();
});

function goTeam() {
  router.push({
    name: 'establishment-team',
    params: { establishmentId: route.params.establishmentId },
  });
}

const heroName = computed(() => user.value?.name || t('establishment.unknownUser'));
const heroEmail = computed(() => user.value?.email || '—');
const avatarLetter = computed(() => {
  const n = user.value?.name;
  return n && n.length ? n.charAt(0) : '?';
});
const photoUrl = computed(() => user.value?.photo || user.value?.photo_url || user.value?.avatar || null);
</script>

<template>
  <div class="op-detail">
    <header class="toolbar">
      <pv-button
        icon="pi pi-arrow-left"
        class="p-button-text p-button-sm"
        :aria-label="t('establishment.back')"
        @click="goTeam"
      />
    </header>

    <div v-if="loading" class="state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('establishment.detailLoading') }}</span>
    </div>

    <div v-else-if="!operator" class="state warn">
      <p>{{ t('establishment.operatorNotFound') }}</p>
      <pv-button :label="t('establishment.back')" class="p-button-sm" @click="goTeam" />
    </div>

    <template v-else>
      <div class="hero">
        <div class="avatar-wrap">
          <img v-if="photoUrl" :src="photoUrl" alt="" class="avatar-img" />
          <div v-else class="avatar-fallback">{{ avatarLetter }}</div>
        </div>
        <div class="hero-text">
          <h1>{{ heroName }}</h1>
          <p class="email">{{ heroEmail }}</p>
        </div>
        <div class="schedule">
          <h3>{{ t('profileView.scheduleTitle') }}</h3>
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
        </div>
      </div>

      <div class="grid">
        <div class="field">
          <span class="lab">{{ t('establishment.fieldOpName') }}</span>
          <span class="val">{{ user?.name || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldAssignedEst') }}</span>
          <span class="val">{{ establishment?.establishment_name || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldDni') }}</span>
          <span class="val">{{ user?.dni || user?.document || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldEntryDate') }}</span>
          <span class="val">{{ entryDate }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldEmail') }}</span>
          <span class="val">{{ user?.email || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldAlertsAnswered') }}</span>
          <span class="val">{{ operator.alerts_answered ?? 0 }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldPhone') }}</span>
          <span class="val">{{ user?.phone || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldJobTitle') }}</span>
          <span class="val">{{ user?.job_title || user?.jobTitle || '—' }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.op-detail {
  max-width: 920px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem;
  animation: fade 0.35s ease;
}
@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.toolbar {
  margin-bottom: 0.75rem;
}
.hero {
  display: grid;
  grid-template-columns: auto 1fr minmax(0, 260px);
  gap: 1rem;
  align-items: start;
  margin-bottom: 1.25rem;
}
@media (max-width: 800px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
.avatar-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  flex-shrink: 0;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e3a5f;
  color: #fff;
  font-weight: 800;
  font-size: 1.35rem;
}
.hero-text h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}
.email {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: #ea580c;
  font-weight: 600;
}
.schedule {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem 0.65rem;
}
.schedule h3 {
  margin: 0 0 0.4rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #1e3a5f;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
th,
td {
  text-align: left;
  padding: 0.3rem 0.35rem;
  border-bottom: 1px solid #f1f5f9;
}
th {
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.62rem;
}
td:last-child {
  color: #c2410c;
  font-weight: 600;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem 1rem;
}
.field {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.lab {
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.val {
  font-size: 0.88rem;
  font-weight: 600;
  color: #ea580c;
  word-break: break-word;
}
.state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #64748b;
  font-size: 0.9rem;
  padding: 2rem 0;
}
.state.warn {
  flex-direction: column;
  align-items: flex-start;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
