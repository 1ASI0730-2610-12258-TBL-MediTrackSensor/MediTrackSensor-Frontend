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
const operatorsCount = ref(0);
const devicesCount = ref(0);

function sameEst(a, b) {
  return Number(a) === Number(b) || String(a) === String(b);
}

async function load() {
  loading.value = true;
  const eid = route.params.establishmentId;
  try {
    const data = await fetchDashboardData();
    establishment.value = data.establishments.find((e) => sameEst(e.id, eid)) ?? null;
    operatorsCount.value = (data.operators || []).filter((op) => sameEst(op.establishment_id, eid)).length;
    devicesCount.value = (data.devices || []).filter((d) => sameEst(d.establishment_id, eid)).length;
  } catch (e) {
    console.error(e);
    establishment.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.establishmentId, load);

const displayType = computed(() => {
  const raw = establishment.value?.establishment_type;
  if (!raw) return '—';
  return String(raw).replace(/_/g, ' ');
});

function goList() {
  router.push({ name: 'establishments' });
}

function goTeam() {
  router.push({
    name: 'establishment-team',
    params: { establishmentId: route.params.establishmentId },
  });
}
</script>

<template>
  <div class="est-detail">
    <header class="toolbar">
      <pv-button
        icon="pi pi-arrow-left"
        class="p-button-text p-button-sm"
        :aria-label="t('establishment.back')"
        @click="goList"
      />
      <h1 class="title">{{ establishment?.establishment_name || t('establishment.detailTitle') }}</h1>
    </header>

    <div v-if="loading" class="state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('establishment.detailLoading') }}</span>
    </div>

    <div v-else-if="!establishment" class="state warn">
      <p>{{ t('establishment.notFound') }}</p>
      <pv-button :label="t('establishment.back')" class="p-button-sm" @click="goList" />
    </div>

    <template v-else>
      <div class="grid">
        <div class="field">
          <span class="lab">{{ t('establishment.fieldId') }}</span>
          <span class="val">{{ establishment.id }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldType') }}</span>
          <span class="val">{{ displayType }}</span>
        </div>
        <div class="field span2">
          <span class="lab">{{ t('establishment.fieldName') }}</span>
          <span class="val">{{ establishment.establishment_name }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldAddress') }}</span>
          <span class="val">{{ establishment.address || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldDistrict') }}</span>
          <span class="val">{{ establishment.district || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldCity') }}</span>
          <span class="val">{{ establishment.city_region || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldCountry') }}</span>
          <span class="val">{{ establishment.country || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldPhone') }}</span>
          <span class="val">{{ establishment.phone || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldEmail') }}</span>
          <span class="val">{{ establishment.email || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldWebsite') }}</span>
          <span class="val">{{ establishment.website || '—' }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldOperatorsCount') }}</span>
          <span class="val">{{ operatorsCount }}</span>
        </div>
        <div class="field">
          <span class="lab">{{ t('establishment.fieldDevicesCount') }}</span>
          <span class="val">{{ devicesCount }}</span>
        </div>
      </div>

      <footer class="actions">
        <pv-button :label="t('establishment.viewOperatorsTeam')" class="p-button-sm primary-cta" @click="goTeam" />
      </footer>
    </template>
  </div>
</template>

<style scoped>
.est-detail {
  max-width: 880px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
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
.field.span2 {
  grid-column: span 2;
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
.actions {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.primary-cta {
  background: #ea580c;
  border-color: #ea580c;
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
  .field.span2 {
    grid-column: span 1;
  }
}
</style>
