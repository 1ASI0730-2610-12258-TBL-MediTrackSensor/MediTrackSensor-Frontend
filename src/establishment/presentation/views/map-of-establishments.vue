<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const { t } = useI18n();
const establishments = ref([]);
const operators = ref([]);
const isLoading = ref(true);
const selectedId = ref(null); // Starts closed
let map = null;
let markers = [];

const cityCoords = {
  'Lima': [-12.046374, -77.042793],
  'Arequipa': [-16.409047, -71.537451],
  'Piura': [-5.194493, -80.632824],
  'Trujillo': [-8.115989, -79.029984],
  'Callao': [-12.056594, -77.128447],
  'Loreto': [-3.74912, -73.25383],
  'Cusco': [-13.53195, -71.96746],
  'Miraflores': [-12.111062, -77.031591],
  'San Isidro': [-12.095034, -77.033318],
  'Ate Vitarte': [-12.025, -76.92]
};

const specificCoords = {
  'Hospital Nacional Arzobispo Loayza': [-12.0469, -77.0428],
  'Almacén Vitarte': [-12.025, -76.92],
  'Sede Miraflores': [-12.111, -77.031],
  'Sede San Isidro': [-12.095, -77.033],
  'Sede Trujillo': [-8.115, -79.029]
};

const loadData = async () => {
  try {
    const data = await fetchDashboardData();
    operators.value = data.operators ?? [];
    establishments.value = data.establishments.map((est, index) => {
      // Priority 1: Specific name match
      let coord = specificCoords[est.establishment_name];
      
      // Priority 2: District/Region match (in name or city_region)
      if (!coord) {
        if (est.establishment_name.includes('Miraflores')) coord = cityCoords['Miraflores'];
        else if (est.establishment_name.includes('San Isidro')) coord = cityCoords['San Isidro'];
        else if (est.establishment_name.includes('Vitarte')) coord = cityCoords['Ate Vitarte'];
        else coord = cityCoords[est.city_region] || cityCoords['Lima'];
      }
      
      return {
        ...est,
        lat: coord[0] + (Math.random() - 0.5) * 0.01, // Minimal random for visibility
        lng: coord[1] + (Math.random() - 0.5) * 0.01,
        status: index % 4 === 0 ? 'Mantenimiento' : 'Operativo'
      };
    });
  } catch (error) {
    console.error("Error loading map data", error);
  } finally {
    isLoading.value = false;
    initMap();
  }
};

const initMap = () => {
  if (typeof L === 'undefined') {
    setTimeout(initMap, 500);
    return;
  }

  map = L.map('map-container', {
    zoomControl: false,
    attributionControl: false
  }).setView([-9.19, -75.01], 5); // Center of Peru

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  updateMarkers();
};

const updateMarkers = () => {
  if (!map) return;
  
  // Clear old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const blueIcon = L.divIcon({ className: 'custom-pin blue' });
  const orangeIcon = L.divIcon({ className: 'custom-pin orange' });

  establishments.value.forEach(est => {
    const icon = est.status === 'Operativo' ? blueIcon : orangeIcon;
    const marker = L.marker([est.lat, est.lng], { icon }).addTo(map);
    
    marker.on('click', () => {
      selectedId.value = est.id;
    });
    
    markers.push(marker);
  });
};

const selectedEst = computed(() => 
  establishments.value.find(e => e.id === selectedId.value)
);

function countOperatorsForEstablishment(est) {
  if (!est?.id || !operators.value.length) return 0;
  const estId = Number(est.id);
  if (Number.isNaN(estId)) return 0;
  return operators.value.filter((op) => Number(op.establishment_id) === estId).length;
}

const selectedOperatorCount = computed(() =>
  selectedEst.value ? countOperatorsForEstablishment(selectedEst.value) : 0
);

function personnelLabel(count) {
  if (count === 0) return t('establishment.noOperatorsAssigned');
  if (count === 1) return t('establishment.operatorsCountOne');
  return t('establishment.operatorsCount', { n: count });
}

const selectEstablishment = (id) => {
  selectedId.value = id;
  const est = establishments.value.find(e => e.id === id);
  if (est && map) {
    map.flyTo([est.lat, est.lng], 15);
  }
};

onMounted(() => {
  // Load Leaflet dynamically
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = loadData;
  document.head.appendChild(script);
});
</script>

<template>
  <div class="map-dashboard-real">
    <!-- Sidebar -->
    <aside class="sidebar-light">
      <div class="header-light">
        <h3>{{ t('establishment.establishments') }}</h3>
        <span class="status-badge">{{ establishments.length }} Sedes</span>
      </div>
      
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input type="text" placeholder="Filtrar establecimientos..." />
      </div>

      <div class="list-container custom-scroll">
        <div 
          v-for="est in establishments" 
          :key="est.id"
          class="list-item"
          :class="{ active: selectedId === est.id }"
          @click="selectEstablishment(est.id)"
        >
          <div class="status-dot" :class="est.status === 'Operativo' ? 'green' : 'orange'"></div>
          <div class="item-meta">
            <span class="name">{{ est.establishment_name }}</span>
            <span class="region">{{ est.city_region }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Map Canvas -->
    <main class="map-canvas">
      <div id="map-container" class="map-full"></div>

      <!-- Detail Panel -->
      <transition name="slide-up">
        <div v-if="selectedEst" class="detail-card">
          <div class="card-top">
            <span class="tag">{{ selectedEst.establishment_type }}</span>
            <button class="close-icon" @click="selectedId = null">×</button>
          </div>
          <h2 class="card-name">{{ selectedEst.establishment_name }}</h2>
          <p class="card-address">
            <i class="pi pi-map-marker"></i>
            {{ selectedEst.address }}, {{ selectedEst.district }}
          </p>
          
          <div class="card-stats">
            <div class="stat-box">
              <span class="s-label">Estado</span>
              <span class="s-value" :class="selectedEst.status === 'Operativo' ? 'text-green' : 'text-orange'">
                {{ selectedEst.status }}
              </span>
            </div>
            <div class="stat-box">
              <span class="s-label">Personal</span>
              <span
                class="s-value"
                :class="{ 'text-muted': selectedOperatorCount === 0 }"
              >{{ personnelLabel(selectedOperatorCount) }}</span>
            </div>
          </div>

          <pv-button label="Gestionar Sede" icon="pi pi-cog" class="p-button-sm p-button-primary w-full" />
        </div>
      </transition>

      <!-- Map Floating Tools -->
      <div class="map-tools">
        <button @click="map?.zoomIn()"><i class="pi pi-plus"></i></button>
        <button @click="map?.zoomOut()"><i class="pi pi-minus"></i></button>
        <button class="primary" @click="map?.setView([-12.046374, -77.042793], 13)"><i class="pi pi-compass"></i></button>
      </div>
    </main>
  </div>
</template>

<style>
/* Global Leaflet Customization */
.custom-pin {
  width: 20px;
  height: 20px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  margin-left: -10px;
  margin-top: -10px;
  border: 2px solid white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.custom-pin::after {
  content: '';
  width: 8px;
  height: 8px;
  margin: 4px 0 0 4px;
  background: white;
  position: absolute;
  border-radius: 50%;
}

.custom-pin.blue { background: #3b82f6; }
.custom-pin.orange { background: #f59e0b; }

.leaflet-div-icon {
  background: transparent;
  border: none;
}
</style>

<style scoped>
.map-dashboard-real {
  display: flex;
  height: calc(100vh - 140px);
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.sidebar-light {
  width: 320px;
  background: #ffffff;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.header-light {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-light h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }

.status-badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
}

.search-box { padding: 0 1.5rem 1.5rem; position: relative; }
.search-box i { position: absolute; left: 2.25rem; top: 0.65rem; color: #94a3b8; }
.search-box input {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
}

.list-container { flex: 1; overflow-y: auto; padding: 0.5rem; }
.list-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 16px; cursor: pointer; transition: all 0.2s ease; }
.list-item:hover { background: #f8fafc; }
.list-item.active { background: #eff6ff; }

.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-dot.green { background: #10b981; }
.status-dot.orange { background: #f59e0b; }

.item-meta .name { font-weight: 700; font-size: 0.9rem; color: #1e293b; display: block; }
.item-meta .region { font-size: 0.75rem; color: #64748b; }

.map-canvas { flex: 1; position: relative; }
.map-full { width: 100%; height: 100%; z-index: 1; }

.detail-card {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 320px;
  background: #ffffff;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
  z-index: 1000;
}

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.tag { font-size: 0.65rem; font-weight: 800; background: #eff6ff; color: #3b82f6; padding: 0.25rem 0.6rem; border-radius: 6px; }
.close-icon { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
.card-name { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; }
.card-address { font-size: 0.85rem; color: #64748b; display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 1.5rem; }

.card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.stat-box { display: flex; flex-direction: column; }
.s-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }
.s-value { font-size: 0.95rem; font-weight: 700; }
.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }
.text-muted { color: #94a3b8; font-weight: 600; }

.map-tools {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  display: flex;
  gap: 0.75rem;
  z-index: 1000;
}

.map-tools button {
  width: 44px; height: 44px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 14px;
  color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.2s;
}

.map-tools button:hover { background: #f8fafc; color: #1e293b; }
.map-tools button.primary { background: #3b82f6; color: #ffffff; border-color: #3b82f6; }

.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(30px); }
</style>