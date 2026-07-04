<script setup>
import LanguageSwitcher from './language-switcher.vue';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { readAuthSession } from '../../../iam/infrastructure/auth-session.js';
import { getProfileRoute } from '../../../shared/infrastructure/route.helpers.js';
import useIamStore from '../../../iam/application/iam.store.js';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const iamStore = useIamStore();

const sidebarCollapsed = ref(false);
const profileMenuOpen = ref(false);
const profileMenuRef = ref(null);
const navSearch = ref('');
const isMobile = ref(false);

const userRole = ref(localStorage.getItem('userRole') || 'health-entity');
const session = ref(readAuthSession());

const isHealthEntity = computed(() => userRole.value === 'health-entity');
const isOperationalStaff = computed(() => userRole.value === 'operational-staff');

const displayName = computed(() => session.value?.name ?? t('layout.guestUser'));
const displayEmail = computed(() => session.value?.email ?? '');
const userInitial = computed(() => (displayName.value?.charAt(0) ?? 'U').toUpperCase());

const healthEntityItems = [
  { label: 'option.home', to: '/iam/home/health-entity', icon: 'pi pi-home', section: 'main' },
  { label: 'establishment.establishments', to: '/establishment/establishments', icon: 'pi pi-building', section: 'main' },
  { label: 'establishment.assignOperator', to: '/establishment/assign-operator', icon: 'pi pi-users', section: 'main' },
  { label: 'establishment.addEstablishment', to: '/establishment/establishments/new', icon: 'pi pi-plus-circle', section: 'main' },
  { label: 'establishment.mapOfEstablishments', to: '/establishment/map', icon: 'pi pi-map-marker', section: 'main' },
  { label: 'plansPage.title', to: '/subscriptions/plans', icon: 'pi pi-credit-card', section: 'secondary' },
];

const operationalItems = [
  { label: 'option.home', to: '/iam/home/operational-staff', icon: 'pi pi-home', section: 'main' },
  { label: 'monitoring.devices', to: '/monitoring/devices', icon: 'pi pi-server', section: 'main' },
  { label: 'logistics.transports', to: '/logistics/transports', icon: 'pi pi-truck', section: 'main' },
  { label: 'establishment.operators', to: '/establishment/operators', icon: 'pi pi-id-card', section: 'main' },
  { label: 'monitoring.controlCenter', to: '/monitoring/control-center', icon: 'pi pi-chart-line', section: 'secondary' },
];

const navItems = computed(() => {
  const items = isHealthEntity.value ? healthEntityItems : isOperationalStaff.value ? operationalItems : [];
  const q = navSearch.value.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => t(item.label).toLowerCase().includes(q));
});

const mainNavItems = computed(() => navItems.value.filter((item) => item.section === 'main'));
const secondaryNavItems = computed(() => navItems.value.filter((item) => item.section === 'secondary'));

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value;
}

function closeProfileMenu() {
  profileMenuOpen.value = false;
}

function goToProfile() {
  closeProfileMenu();
  router.push(getProfileRoute());
}

function handleLogout() {
  closeProfileMenu();
  sessionStorage.removeItem('meditrack_plan_context');
  iamStore.logout();
  router.push({ name: 'login' });
}

function onDocumentClick(event) {
  if (!profileMenuRef.value?.contains(event.target)) {
    closeProfileMenu();
  }
}

function isActive(to) {
  return route.path === to || route.path.startsWith(`${to}/`);
}

onMounted(() => {
  session.value = readAuthSession();
  isMobile.value = window.innerWidth <= 1024;
  if (isMobile.value) {
    sidebarCollapsed.value = true;
  }
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>

<template>
  <pv-toast />
  <pv-confirm-dialog />

  <div class="app-shell" :class="{ 'app-shell--collapsed': sidebarCollapsed }">
    <aside class="app-sidebar" aria-label="Navegación principal">
      <div class="sidebar-profile-card" ref="profileMenuRef">
        <button type="button" class="sidebar-profile-card__trigger" @click.stop="toggleProfileMenu">
          <span class="mt-user-avatar mt-user-avatar--square mt-user-avatar--md">{{ userInitial }}</span>
          <span v-if="!sidebarCollapsed" class="sidebar-profile-card__meta">
            <span class="sidebar-profile-card__name">{{ displayName }}</span>
            <span class="sidebar-profile-card__email">{{ displayEmail }}</span>
          </span>
          <i v-if="!sidebarCollapsed" class="pi pi-angle-down sidebar-profile-card__chevron" aria-hidden="true"></i>
        </button>
        <div v-if="profileMenuOpen" class="sidebar-profile-dropdown" role="menu">
          <button type="button" role="menuitem" @click="goToProfile">
            <i class="pi pi-user" aria-hidden="true"></i>
            {{ t('layout.goToProfile') }}
          </button>
          <button type="button" role="menuitem" class="danger" @click="handleLogout">
            <i class="pi pi-sign-out" aria-hidden="true"></i>
            {{ t('iam.logout') }}
          </button>
        </div>
      </div>

      <div v-if="!sidebarCollapsed" class="sidebar-search">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input
          v-model="navSearch"
          type="search"
          :placeholder="t('layout.searchNav')"
          autocomplete="off"
        />
      </div>

      <nav class="sidebar-body">
        <router-link
          v-for="item in mainNavItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ 'sidebar-link--active': isActive(item.to) }"
          :title="t(item.label)"
        >
          <i :class="item.icon" aria-hidden="true"></i>
          <span class="sidebar-link__label">{{ t(item.label) }}</span>
        </router-link>

        <div v-if="secondaryNavItems.length" class="sidebar-divider" aria-hidden="true"></div>

        <router-link
          v-for="item in secondaryNavItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ 'sidebar-link--active': isActive(item.to) }"
          :title="t(item.label)"
        >
          <i :class="item.icon" aria-hidden="true"></i>
          <span class="sidebar-link__label">{{ t(item.label) }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button
          type="button"
          class="sidebar-collapse-btn"
          :aria-label="sidebarCollapsed ? t('layout.showSidebar') : t('layout.hideSidebar')"
          @click="toggleSidebar"
        >
          <i :class="sidebarCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'" aria-hidden="true"></i>
          <span v-if="!sidebarCollapsed">{{ t('layout.collapseSidebar') }}</span>
        </button>
      </div>
    </aside>

    <div v-if="!sidebarCollapsed && isMobile" class="sidebar-backdrop" @click="toggleSidebar" aria-hidden="true"></div>

    <div class="app-main">
      <header class="app-topbar">
        <div class="topbar-start">
          <button
            type="button"
            class="icon-btn mobile-only"
            :aria-label="sidebarCollapsed ? t('layout.showSidebar') : t('layout.hideSidebar')"
            @click="toggleSidebar"
          >
            <i class="pi pi-bars" aria-hidden="true"></i>
          </button>
          <div class="topbar-brand">
            <img src="/logo.png" :alt="t('common.logoAlt')" class="topbar-logo" />
            <h1>{{ t('layout.appTitle') }}</h1>
          </div>
        </div>

        <div class="topbar-end">
          <language-switcher compact />
        </div>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  --sidebar-width: 272px;
  --sidebar-collapsed-width: 76px;
  --topbar-height: 72px;
  display: flex;
  min-height: 100vh;
  background: var(--mt-bg);
}

.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1100;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid var(--mt-border);
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.04);
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-shell--collapsed .app-sidebar {
  width: var(--sidebar-collapsed-width);
}

.sidebar-profile-card {
  position: relative;
  padding: 1rem 0.85rem 0.75rem;
  border-bottom: 1px solid var(--mt-border);
}

.sidebar-profile-card__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.6rem;
  border: 1px solid var(--mt-border);
  border-radius: 14px;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
  color: var(--mt-heading);
}

.sidebar-profile-card__trigger:hover {
  background: var(--mt-primary-soft);
  border-color: rgba(30, 58, 138, 0.18);
}

.sidebar-profile-card__meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.sidebar-profile-card__name {
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-profile-card__email {
  font-size: 0.72rem;
  color: var(--mt-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-profile-card__chevron {
  color: var(--mt-text-muted);
  font-size: 0.75rem;
}

.sidebar-profile-dropdown {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0.85rem;
  right: 0.85rem;
  background: #fff;
  border: 1px solid var(--mt-border);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  padding: 0.35rem;
  z-index: 1200;
}

.sidebar-profile-dropdown button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--mt-heading);
  text-align: left;
}

.sidebar-profile-dropdown button:hover {
  background: var(--mt-primary-soft);
  color: var(--mt-primary);
}

.sidebar-profile-dropdown button.danger:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.sidebar-search {
  position: relative;
  padding: 0.75rem 0.85rem 0.35rem;
}

.sidebar-search i {
  position: absolute;
  left: 1.45rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.sidebar-search input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem 0.6rem 2.25rem;
  border: 1px solid var(--mt-border);
  border-radius: 12px;
  font-size: 0.8125rem;
  font-family: inherit;
  color: var(--mt-heading);
  background: #f8fafc;
}

.sidebar-search input:focus {
  outline: none;
  border-color: var(--mt-primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-divider {
  height: 1px;
  margin: 0.5rem 0.35rem;
  background: repeating-linear-gradient(to right, #e2e8f0 0 4px, transparent 4px 8px);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.72rem 0.85rem;
  border-radius: 12px;
  color: var(--mt-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.sidebar-link i {
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
  color: #94a3b8;
}

.sidebar-link:hover {
  color: var(--mt-heading);
  background: #f8fafc;
}

.sidebar-link--active {
  color: #fff;
  background: #1e293b;
  border-color: #1e293b;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
}

.sidebar-link--active i {
  color: #fff;
}

.app-shell--collapsed .sidebar-link__label,
.app-shell--collapsed .sidebar-search,
.app-shell--collapsed .sidebar-profile-card__meta,
.app-shell--collapsed .sidebar-profile-card__chevron,
.app-shell--collapsed .sidebar-collapse-btn span {
  display: none;
}

.app-shell--collapsed .sidebar-profile-card__trigger {
  justify-content: center;
  padding: 0.55rem;
}

.app-shell--collapsed .sidebar-link {
  justify-content: center;
  padding: 0.72rem;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--mt-border);
}

.sidebar-collapse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem;
  border: 1px solid var(--mt-border);
  border-radius: 12px;
  background: #fff;
  color: var(--mt-text-muted);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
}

.sidebar-collapse-btn:hover {
  background: #f8fafc;
  color: var(--mt-primary);
}

.app-main {
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-shell--collapsed .app-main {
  margin-left: var(--sidebar-collapsed-width);
}

.app-topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--mt-border);
}

.topbar-start,
.topbar-end {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topbar-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.topbar-brand h1 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--mt-heading);
}

.icon-btn {
  width: 42px;
  height: 42px;
  border: 1px solid var(--mt-border);
  border-radius: 12px;
  background: #fff;
  color: var(--mt-heading);
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
}

.mobile-only {
  display: none;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 2.5rem;
}

.sidebar-backdrop {
  display: none;
}

@media (max-width: 1024px) {
  .mobile-only {
    display: inline-flex;
  }

  .app-main {
    margin-left: 0;
  }

  .app-shell:not(.app-shell--collapsed) .app-sidebar {
    width: var(--sidebar-width);
  }

  .app-shell--collapsed .app-sidebar {
    transform: translateX(calc(-1 * var(--sidebar-width)));
    width: var(--sidebar-width);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1050;
    background: rgba(15, 23, 42, 0.45);
  }

  .app-shell--collapsed .sidebar-backdrop {
    display: none;
  }
}
</style>
