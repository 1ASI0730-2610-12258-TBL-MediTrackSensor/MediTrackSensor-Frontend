<script setup>
import LanguageSwitcher from './language-switcher.vue';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { readAuthSession } from '../../../iam/infrastructure/auth-session.js';
import { logout as authLogout } from '../../../iam/infrastructure/auth.service.js';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const sidebarOpen = ref(true);
const profileMenuOpen = ref(false);
const profileMenuRef = ref(null);

const userRole = ref(localStorage.getItem('userRole') || 'health-entity');
const session = ref(readAuthSession());

const isHealthEntity = computed(() => userRole.value === 'health-entity');
const isOperationalStaff = computed(() => userRole.value === 'operational-staff');

const displayName = computed(() => session.value?.name ?? t('layout.guestUser'));
const displayEmail = computed(() => session.value?.email ?? '');
const userInitial = computed(() => (displayName.value?.charAt(0) ?? 'U').toUpperCase());

const healthEntityItems = [
  { label: 'option.home', to: '/home-health-entity', icon: 'pi pi-home' },
  { label: 'establishment.establishments', to: '/establishment/establishments', icon: 'pi pi-building' },
  { label: 'establishment.assignOperator', to: '/establishment/assign-operator', icon: 'pi pi-users' },
  { label: 'establishment.addEstablishment', to: '/establishment/establishments/new', icon: 'pi pi-plus-circle' },
  { label: 'establishment.mapOfEstablishments', to: '/establishment/map', icon: 'pi pi-map-marker' },
];

const operationalItems = [
  { label: 'option.home', to: '/home-operational-staff', icon: 'pi pi-home' },
  { label: 'monitoring.devices', to: '/monitoring/devices', icon: 'pi pi-server' },
  { label: 'logistics.transports', to: '/logistics/transports', icon: 'pi pi-truck' },
  { label: 'establishment.operators', to: '/establishment/operators', icon: 'pi pi-id-card' },
];

const navItems = computed(() => {
  if (isHealthEntity.value) return healthEntityItems;
  if (isOperationalStaff.value) return operationalItems;
  return [];
});

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value;
}

function closeProfileMenu() {
  profileMenuOpen.value = false;
}

function goToProfile() {
  closeProfileMenu();
  router.push({ name: 'profile' });
}

function handleLogout() {
  closeProfileMenu();
  sessionStorage.removeItem('meditrack_plan_context');
  authLogout();
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
  if (window.innerWidth <= 1024) {
    sidebarOpen.value = false;
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

  <div class="app-shell" :class="{ 'app-shell--collapsed': !sidebarOpen }">
    <aside class="app-sidebar" aria-label="Navegación principal">
      <div class="sidebar-header">
        <img src="/logo.png" :alt="t('common.logoAlt')" class="sidebar-logo" />
      </div>

      <nav class="sidebar-body">
        <router-link
          v-for="item in navItems"
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
        <button type="button" class="sidebar-profile" @click="goToProfile">
          <span class="mt-user-avatar mt-user-avatar--square mt-user-avatar--md sidebar-profile__avatar">{{ userInitial }}</span>
          <span class="sidebar-profile__info">
            <span class="sidebar-profile__name">{{ displayName }}</span>
            <span class="sidebar-profile__email">{{ displayEmail }}</span>
          </span>
        </button>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="toggleSidebar" aria-hidden="true"></div>

    <div class="app-main">
      <header class="app-topbar">
        <div class="topbar-start">
          <button
            type="button"
            class="icon-btn"
            :aria-label="sidebarOpen ? t('layout.hideSidebar') : t('layout.showSidebar')"
            @click="toggleSidebar"
          >
            <i class="pi pi-bars" aria-hidden="true"></i>
          </button>
          <div class="topbar-title">
            <h1>{{ t('layout.appTitle') }}</h1>
          </div>
        </div>

        <div class="topbar-end">
          <language-switcher compact />

          <div ref="profileMenuRef" class="profile-menu-wrap">
            <button
              type="button"
              class="icon-btn icon-btn--profile"
              :aria-expanded="profileMenuOpen"
              :aria-label="t('common.profile')"
              @click.stop="toggleProfileMenu"
            >
              <span class="mt-user-avatar mt-user-avatar--square mt-user-avatar--chip profile-chip">{{ userInitial }}</span>
            </button>

            <div v-if="profileMenuOpen" class="profile-dropdown" role="menu">
              <button type="button" class="profile-dropdown__item" role="menuitem" @click="goToProfile">
                <i class="pi pi-user" aria-hidden="true"></i>
                {{ t('layout.goToProfile') }}
              </button>
              <button type="button" class="profile-dropdown__item profile-dropdown__item--danger" role="menuitem" @click="handleLogout">
                <i class="pi pi-sign-out" aria-hidden="true"></i>
                {{ t('iam.logout') }}
              </button>
            </div>
          </div>
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
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-shell--collapsed .app-sidebar {
  transform: translateX(calc(-1 * var(--sidebar-width)));
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid var(--mt-border);
}

.sidebar-logo {
  width: min(180px, 78%);
  height: auto;
  max-height: 72px;
  object-fit: contain;
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  color: var(--mt-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  border: 1px solid transparent;
}

.sidebar-link i {
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
  color: #94a3b8;
}

.sidebar-link:hover {
  color: var(--mt-primary);
  background: var(--mt-primary-soft);
  transform: translateX(2px);
}

.sidebar-link:hover i {
  color: var(--mt-primary);
}

.sidebar-link--active {
  color: var(--mt-primary);
  background: var(--mt-primary-soft);
  border-color: rgba(30, 58, 138, 0.12);
  box-shadow: inset 3px 0 0 var(--mt-accent);
}

.sidebar-link--active i {
  color: var(--mt-accent);
}

.sidebar-footer {
  padding: 1rem 0.75rem 1.25rem;
  border-top: 1px solid var(--mt-border);
}

.sidebar-profile {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--mt-border);
  border-radius: 14px;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
  color: var(--mt-heading);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.sidebar-profile:hover {
  background: var(--mt-primary-soft);
  border-color: rgba(30, 58, 138, 0.2);
}

.sidebar-profile__avatar {
  flex-shrink: 0;
}

.sidebar-profile__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.sidebar-profile__name {
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-profile__email {
  font-size: 0.72rem;
  color: var(--mt-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  margin-left: 0;
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
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.topbar-start,
.topbar-end {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.topbar-title {
  display: flex;
  align-items: center;
}

.topbar-title h1 {
  margin: 0;
  font-size: clamp(0.95rem, 2vw, 1.15rem);
  font-weight: 700;
  letter-spacing: -0.02em;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  border-color: var(--mt-primary);
  color: var(--mt-primary);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}

.icon-btn--profile {
  padding: 0;
  overflow: hidden;
}

.profile-chip {
  display: inline-flex;
}

.profile-menu-wrap {
  position: relative;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 190px;
  background: #fff;
  border: 1px solid var(--mt-border);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  padding: 0.35rem;
  z-index: 1200;
}

.profile-dropdown__item {
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

.profile-dropdown__item:hover {
  background: var(--mt-primary-soft);
  color: var(--mt-primary);
}

.profile-dropdown__item--danger:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
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
  .app-main {
    margin-left: 0;
  }

  .app-sidebar {
    transform: translateX(calc(-1 * var(--sidebar-width)));
  }

  .app-shell:not(.app-shell--collapsed) .app-sidebar {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1050;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
  }

  .app-shell--collapsed .sidebar-backdrop {
    display: none;
  }
}
</style>
