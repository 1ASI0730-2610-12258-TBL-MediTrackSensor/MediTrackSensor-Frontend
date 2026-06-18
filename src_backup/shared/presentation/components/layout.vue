<script setup>
import LanguageSwitcher from "./language-switcher.vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

const userRole = ref(localStorage.getItem('userRole') || 'health-entity');

const isHealthEntity = computed(() => userRole.value === 'health-entity');
const isOperationalStaff = computed(() => userRole.value === 'operational-staff');

const items = computed(() => {
  if (isHealthEntity.value) {
    return [
      { label: 'option.home', to: '/home-health-entity' },
      { label: 'establishment.establishments', to: '/establishment/establishments' },
      { label: 'establishment.assignOperator', to: '/establishment/assign-operator' },
      { label: 'establishment.addEstablishment', to: '/establishment/establishments/new' },
      { label: 'establishment.mapOfEstablishments', to: '/establishment/map' }
    ];
  } else if (isOperationalStaff.value) {
    return [
      { label: 'option.home', to: '/home-operational-staff' },
      { label: 'monitoring.devices', to: '/monitoring/devices' },
      { label: 'logistics.transports', to: '/logistics/transports' },
      { label: 'establishment.operators', to: '/establishment/operators' }
    ];
  }
  return [];
});

const goToProfile = () => {
  router.push({ name: 'profile' });
};
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
  <div class="layout-wrapper">
    <header class="header">
      <pv-toolbar class="app-toolbar">
        <template #start>
          <div class="toolbar-start">
            <img src="/logo.png" alt="VITAL CARE" class="logo" />
          </div>
        </template>

        <template #center>
          <nav class="main-nav flex gap-2" aria-label="Principal">
            <pv-button
                v-for="item in items"
                :key="item.label"
                as-child
                v-slot="slotProps"
            >
              <router-link :to="item.to" :class="['nav-link', slotProps['class']]">
                {{ t(item.label) }}
              </router-link>
            </pv-button>
          </nav>
        </template>

        <template #end>
          <div class="toolbar-end flex gap-3 align-items-center">
            <button
                type="button"
                class="profile-btn"
                @click="goToProfile"
                :title="t('common.profile')"
                aria-label="Perfil"
            >
              <i class="pi pi-user" aria-hidden="true"></i>
            </button>
          </div>
        </template>
      </pv-toolbar>
    </header>

    <main class="main-content">
      <router-view/>
    </main>

    <div class="language-bottom-left">
      <language-switcher/>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  background: var(--mt-bg);
}

.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #0f172a; /* Solid fallback */
}

.toolbar-start {
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
}

.logo {
  height: 38px;
  width: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.02);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8) !important;
  text-decoration: none !important;
  padding: 0.6rem 1.25rem !important;
  font-weight: 500;
  font-size: 0.95rem;
  border-radius: var(--mt-radius) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  border: 1px solid transparent;
}

.nav-link:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.08) !important;
  transform: translateY(-1px);
}

.router-link-active.nav-link {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
}

.profile-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #fff;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.profile-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.language-bottom-left {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 999;
}

:deep(.app-toolbar.p-toolbar) {
  height: var(--nav-height);
  padding: 0 2rem;
  border: none;
  border-radius: 0;
  background: linear-gradient(to right, #0f172a, #1e293b);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

:deep(.p-toolbar-group-start),
:deep(.p-toolbar-group-center),
:deep(.p-toolbar-group-end) {
  display: flex;
  align-items: center;
}

@media (max-width: 1024px) {
  :deep(.app-toolbar.p-toolbar) {
    padding: 0 1rem;
    height: auto;
    flex-direction: column;
    padding-bottom: 1rem;
  }

  .main-nav {
    margin: 0.5rem 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-link {
    padding: 0.5rem 0.75rem !important;
    font-size: 0.85rem;
  }
}
</style>
