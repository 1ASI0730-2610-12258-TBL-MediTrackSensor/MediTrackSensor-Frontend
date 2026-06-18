<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fetchDashboardPayload } from '../../../shared/infrastructure/dashboard-payload.js';

const router = useRouter();
const { t } = useI18n();

const establishments = ref([]);
const operators = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedId = ref(null);
const mapContainerRef = ref(null);

let map = null;
let markers = [];
let tileLayer = null;

const cityCoords = {
  Lima: [-12.046374, -77.042793],
  Arequipa: [-16.409047, -71.537451],
  Piura: [-5.194493, -80.632824],
  Trujillo: [-8.115989, -79.029984],
  Callao: [-12.056594, -77.128447],
  Miraflores: [-12.111062, -77.031591],
  'San Isidro': [-12.095034, -77.033318],
  'Ate Vitarte': [-12.025, -76.92],
};

function resolveCoords(est, index) {
  const lat = est.lat ?? est.latitude;
  const lng = est.lng ?? est.longitude;
  if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    return [Number(lat), Number(lng)];
  }
  const specific = {
    'Hospital Nacional Arzobispo Loayza': [-12.0469, -77.0428],
    'Almacén Vitarte': [-12.025, -76.92],
    'Sede Miraflores': [-12.111, -77.031],
    'Sede San Isidro': [-12.095, -77.033],
    'Sede Trujillo': [-8.115, -79.029],
  };
  if (specific[est.establishment_name]) return specific[est.establishment_name];
  if (est.establishment_name?.includes('Miraflores')) return cityCoords.Miraflores;
  if (est.establishment_name?.includes('San Isidro')) return cityCoords['San Isidro'];
  if (est.establishment_name?.includes('Vitarte')) return cityCoords['Ate Vitarte'];
  return cityCoords[est.city_region] || cityCoords.Lima;
}

const loadData = async () => {
  try {
    const data = await fetchDashboardPayload();
    operators.value = data.operators ?? [];
    establishments.value = (data.establishments ?? []).map((est, index) => {
      const [lat, lng] = resolveCoords(est, index);
      return {
        ...est,
        lat,
        lng,
        status: index % 4 === 0 ? 'maintenance' : 'operational',
      };
    });
  } catch (error) {
    console.error('Error loading map data', error);
  } finally {
    isLoading.value = false;
    await nextTick();
    await initMap();
  }
};

function destroyMap() {
  markers.forEach((m) => {
    try {
      map?.removeLayer(m);
    } catch {
      /* ignore */
    }
  });
  markers = [];
  if (tileLayer && map) {
    map.removeLayer(tileLayer);
    tileLayer = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
}

const filteredEstablishments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return establishments.value;
  return establishments.value.filter(
    (est) =>
      (est.establishment_name || '').toLowerCase().includes(q) ||
      (est.city_region || '').toLowerCase().includes(q) ||
      (est.district || '').toLowerCase().includes(q),
  );
});

async function initMap() {
  if (typeof L === 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return initMap();
  }

  await nextTick();

  const el = mapContainerRef.value;
  if (!el) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return initMap();
  }

  if (map) {
    updateMarkers();
    map.invalidateSize();
    return;
  }

  destroyMap();

  map = L.map(el, {
    zoomControl: false,
    attributionControl: false,
  }).setView([-9.19, -75.01], 5);

  tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);

  updateMarkers();

  requestAnimationFrame(() => {
    map?.invalidateSize();
  });
  setTimeout(() => map?.invalidateSize(), 200);
}

const updateMarkers = () => {
  if (!map) return;

  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  const blueIcon = L.divIcon({ className: 'custom-pin blue' });
  const orangeIcon = L.divIcon({ className: 'custom-pin orange' });

  establishments.value.forEach((est) => {
    const icon = est.status === 'operational' ? blueIcon : orangeIcon;
    const marker = L.marker([est.lat, est.lng], { icon }).addTo(map);
    marker.on('click', () => {
      selectEstablishment(est.id);
    });
    markers.push(marker);
  });
};

const selectedEst = computed(() =>
  establishments.value.find((e) => e.id === selectedId.value),
);

function countOperatorsForEstablishment(est) {
  if (!est?.id || !operators.value.length) return 0;
  const estId = Number(est.id);
  if (Number.isNaN(estId)) return 0;
  return operators.value.filter((op) => Number(op.establishment_id) === estId).length;
}

const selectedOperatorCount = computed(() =>
  selectedEst.value ? countOperatorsForEstablishment(selectedEst.value) : 0,
);

function personnelLabel(count) {
  if (count === 0) return t('establishment.noOperatorsAssigned');
  if (count === 1) return t('establishment.operatorsCountOne');
  return t('establishment.operatorsCount', { n: count });
}

function statusLabel(status) {
  return status === 'operational'
    ? t('establishment.mapStatusOperational')
    : t('establishment.mapStatusMaintenance');
}

function formatType(type) {
  const raw = String(type || '').toUpperCase();
  if (raw === 'HOSPITAL') return t('establishment.typeHospital');
  if (raw === 'WAREHOUSE') return t('establishment.typeWarehouse');
  if (raw === 'CLINIC') return t('establishment.typeClinic');
  return type || '—';
}

const selectEstablishment = (id) => {
  selectedId.value = id;
  const est = establishments.value.find((e) => e.id === id);
  if (est && map) {
    map.flyTo([est.lat, est.lng], 14);
  }
};

function goHome() {
  router.push({ name: 'home-health-entity' });
}

function manageSite() {
  if (!selectedEst.value) return;
  router.push({
    name: 'establishment-detail',
    params: { establishmentId: String(selectedEst.value.id) },
  });
}

onMounted(() => {
  if (document.querySelector('link[data-leaflet]')) {
    if (typeof L !== 'undefined') loadData();
    else {
      const s = document.querySelector('script[data-leaflet]');
      if (s) s.addEventListener('load', loadData);
    }
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.setAttribute('data-leaflet', '1');
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.setAttribute('data-leaflet', '1');
  script.onload = loadData;
  document.head.appendChild(script);
});

onBeforeUnmount(() => {
  destroyMap();
});
</script>

<template>
  <div class="est-flow-page est-flow-page--map">
    <nav class="est-flow-back-bar" aria-label="Navegación">
      <button type="button" class="est-flow-back-btn" @click="goHome">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('establishment.backToHome') }}</span>
      </button>
    </nav>

    <div class="est-flow-card est-flow-card--map">
      <header class="est-flow-head est-flow-head--row">
        <div class="est-flow-head__text">
          <h1 class="est-flow-title">{{ t('establishment.mapOfEstablishments') }}</h1>
          <p class="est-flow-subtitle">{{ t('establishment.mapPageSubtitle') }}</p>
        </div>
        <div class="est-flow-stats">
          <div class="est-flow-stat est-flow-stat--blue">
            <span class="est-flow-stat__label">{{ t('establishment.mapSitesLabel') }}</span>
            <span class="est-flow-stat__value">{{ establishments.length }}</span>
          </div>
        </div>
      </header>

      <div v-if="isLoading" class="map-loader">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <span>{{ t('establishment.mapLoading') }}</span>
      </div>

      <div v-else class="map-layout">
        <aside class="map-sidebar" :aria-label="t('establishment.mapOfEstablishments')">
          <div class="map-sidebar__head">
            <h2 class="map-sidebar__title">{{ t('establishment.mapListTitle') }}</h2>
            <span class="est-flow-stat">
              <span class="est-flow-stat__value" style="font-size: 0.8rem">{{
                filteredEstablishments.length
              }}</span>
            </span>
          </div>

          <div class="map-sidebar__search">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('establishment.mapSearchPlaceholder')"
              autocomplete="off"
            />
          </div>

          <div class="map-sidebar__list">
            <div
              v-for="est in filteredEstablishments"
              :key="est.id"
              class="map-sidebar__item"
              :class="{ 'map-sidebar__item--active': selectedId === est.id }"
              role="button"
              tabindex="0"
              @click="selectEstablishment(est.id)"
              @keydown.enter.prevent="selectEstablishment(est.id)"
            >
              <span
                class="map-sidebar__dot"
                :class="est.status === 'operational' ? 'map-sidebar__dot--ok' : 'map-sidebar__dot--warn'"
                aria-hidden="true"
              ></span>
              <div>
                <span class="map-sidebar__item-name">{{ est.establishment_name }}</span>
                <span class="map-sidebar__item-region">{{ est.city_region }}</span>
              </div>
            </div>
          </div>
        </aside>

        <main class="map-canvas">
          <div ref="mapContainerRef" class="map-canvas__el"></div>

          <transition name="slide-up">
            <div v-if="selectedEst" class="map-detail">
              <div class="map-detail__top">
                <span class="map-detail__tag">{{ formatType(selectedEst.establishment_type) }}</span>
                <button
                  type="button"
                  class="map-detail__close"
                  :aria-label="t('establishment.back')"
                  @click="selectedId = null"
                >
                  ×
                </button>
              </div>
              <h3 class="map-detail__name">{{ selectedEst.establishment_name }}</h3>
              <p class="map-detail__address">
                <i class="pi pi-map-marker" aria-hidden="true"></i>
                <span>{{ selectedEst.address }}, {{ selectedEst.district }}</span>
              </p>
              <div class="map-detail__stats">
                <div>
                  <span class="map-detail__stat-label">{{ t('establishment.mapStateLabel') }}</span>
                  <span
                    class="map-detail__stat-value"
                    :class="
                      selectedEst.status === 'operational'
                        ? 'map-detail__stat-value--ok'
                        : 'map-detail__stat-value--warn'
                    "
                  >
                    {{ statusLabel(selectedEst.status) }}
                  </span>
                </div>
                <div>
                  <span class="map-detail__stat-label">{{ t('establishment.mapStaffLabel') }}</span>
                  <span
                    class="map-detail__stat-value"
                    :class="{ 'map-detail__stat-value--muted': selectedOperatorCount === 0 }"
                  >
                    {{ personnelLabel(selectedOperatorCount) }}
                  </span>
                </div>
              </div>
              <button type="button" class="est-flow-btn est-flow-btn--primary est-flow-btn--block" @click="manageSite">
                <i class="pi pi-eye" aria-hidden="true"></i>
                <span>{{ t('establishment.mapManageSite') }}</span>
              </button>
            </div>
          </transition>

          <div class="map-tools">
            <button type="button" :aria-label="t('establishment.mapZoomIn')" @click="map?.zoomIn()">
              <i class="pi pi-plus" aria-hidden="true"></i>
            </button>
            <button type="button" :aria-label="t('establishment.mapZoomOut')" @click="map?.zoomOut()">
              <i class="pi pi-minus" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="map-tools__primary"
              :aria-label="t('establishment.mapCenterLima')"
              @click="map?.setView([-12.046374, -77.042793], 13)"
            >
              <i class="pi pi-compass" aria-hidden="true"></i>
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style>
.custom-pin {
  width: 18px;
  height: 18px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  margin-left: -9px;
  margin-top: -9px;
  border: 2px solid white;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.25);
}

.custom-pin::after {
  content: '';
  width: 6px;
  height: 6px;
  margin: 3px 0 0 3px;
  background: white;
  position: absolute;
  border-radius: 50%;
}

.custom-pin.blue {
  background: var(--mt-primary, #1e3a8a);
}

.custom-pin.orange {
  background: #d97706;
}

.leaflet-div-icon {
  background: transparent;
  border: none;
}
</style>

<style scoped>
.est-flow-page--map {
  max-width: 1200px;
}

.est-flow-card--map {
  padding: 1.35rem 1.35rem 1.25rem;
}

.est-flow-btn--block {
  width: 100%;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

.map-layout {
  display: flex;
  min-height: min(72vh, 720px);
  border: 1px solid var(--mt-border);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.map-sidebar {
  width: min(100%, 300px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--mt-border);
  background: #fafbfc;
}

.map-sidebar__head {
  padding: 1rem 1rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 1px solid var(--mt-border);
}

.map-sidebar__title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--mt-primary);
}

.map-sidebar__search {
  padding: 0.75rem 1rem;
  position: relative;
}

.map-sidebar__search i {
  position: absolute;
  left: 1.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.map-sidebar__search input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 0.75rem 0.55rem 2.25rem;
  border: 1px solid var(--mt-border);
  border-radius: 10px;
  font-size: 0.8125rem;
  font-family: inherit;
  color: var(--mt-heading);
  background: #fff;
}

.map-sidebar__search input:focus {
  outline: none;
  border-color: var(--mt-primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}

.map-sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.35rem 0.5rem 0.75rem;
}

.map-sidebar__item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 0.65rem;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.map-sidebar__item:hover {
  background: #fff;
  border-color: var(--mt-border);
}

.map-sidebar__item--active {
  background: var(--mt-primary-soft);
  border-color: rgba(30, 58, 138, 0.2);
}

.map-sidebar__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.map-sidebar__dot--ok { background: #10b981; }
.map-sidebar__dot--warn { background: #d97706; }

.map-sidebar__item-name {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--mt-heading);
  line-height: 1.3;
}

.map-sidebar__item-region {
  display: block;
  font-size: 0.72rem;
  color: var(--mt-text-muted);
  margin-top: 0.1rem;
}

.map-canvas {
  flex: 1;
  position: relative;
  min-width: 0;
  min-height: 480px;
  height: 100%;
}

.map-canvas__el {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 480px;
  z-index: 1;
  background: #e8eef4;
}

.map-canvas__el.leaflet-container {
  width: 100% !important;
  height: 100% !important;
  font-family: inherit;
}

.map-detail {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: min(100% - 2rem, 300px);
  background: #fff;
  border: 1px solid var(--mt-border);
  border-radius: 16px;
  padding: 1.1rem 1.15rem;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  z-index: 1000;
}

.map-detail__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.map-detail__tag {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: var(--mt-primary-soft);
  color: var(--mt-primary);
}

.map-detail__close {
  border: none;
  background: transparent;
  color: var(--mt-text-muted);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
}

.map-detail__close:hover {
  background: #f1f5f9;
  color: var(--mt-heading);
}

.map-detail__name {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--mt-heading);
  line-height: 1.3;
}

.map-detail__address {
  margin: 0 0 0.85rem;
  font-size: 0.78rem;
  color: var(--mt-text-muted);
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  line-height: 1.4;
}

.map-detail__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.map-detail__stat-label {
  display: block;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--mt-text-muted);
  margin-bottom: 0.15rem;
}

.map-detail__stat-value { font-size: 0.8125rem; font-weight: 600; color: var(--mt-heading); }
.map-detail__stat-value--ok { color: #059669; }
.map-detail__stat-value--warn { color: #d97706; }
.map-detail__stat-value--muted { color: var(--mt-text-muted); font-weight: 500; }

.map-tools {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.45rem;
  z-index: 1000;
}

.map-tools button {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--mt-border);
  border-radius: 10px;
  background: #fff;
  color: var(--mt-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  transition: background 0.15s ease, color 0.15s ease;
}

.map-tools button:hover {
  background: var(--mt-primary-soft);
  color: var(--mt-primary);
}

.map-tools button.map-tools__primary {
  background: linear-gradient(180deg, #2563eb, var(--mt-primary));
  color: #fff;
  border-color: var(--mt-primary);
}

.map-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: var(--mt-text-muted);
  font-size: 0.875rem;
  gap: 0.65rem;
}

@media (max-width: 900px) {
  .map-layout { flex-direction: column; min-height: auto; }
  .map-sidebar { width: 100%; max-height: 240px; border-right: none; border-bottom: 1px solid var(--mt-border); }
  .map-canvas { min-height: 360px; }
  .map-detail { left: 1rem; right: 1rem; width: auto; }
}
</style>
