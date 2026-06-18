<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';

const { t } = useI18n();
const router = useRouter();

const selectedRole = ref(null);

const roles = [
  {
    id: 'health-entity',
    label: 'roles.healthEntity',
    icon: 'pi pi-box',
    description: 'roles.healthEntityDesc'
  },
  {
    id: 'operational-staff',
    label: 'roles.operationalStaff',
    icon: 'pi pi-chart-bar',
    description: 'roles.operationalStaffDesc'
  }
];

const selectRole = (roleId) => {
  selectedRole.value = roleId;
  localStorage.setItem('userRole', roleId);

  if (roleId === 'health-entity') {
    router.push({ name: 'iam-login-health-entity' });
  } else if (roleId === 'operational-staff') {
    router.push({ name: 'iam-login-operational-staff' });
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-brand" aria-hidden="true">
      <div class="login-brand-slider">
        <div class="login-slide slide-1"></div>
        <div class="login-slide slide-2"></div>
      </div>
      <div class="login-brand-overlay"></div>
      <div class="login-brand-content">
        <span class="login-brand-mark">{{ t('login.brandMark') }}</span>
        <p class="login-brand-title">{{ t('login.brandTitle') }}</p>
        <p class="login-brand-tagline">{{ t('login.brandTagline') }}</p>
      </div>
    </div>

    <div class="login-panel">
      <div class="login-card">
        <header class="logo-section">
          <img src="/logo.png" :alt="t('common.logoAlt')" class="login-logo-main" />
          <h1>{{ t('common.brandName') }}</h1>
          <p class="logo-sub">{{ t('login.cardSubtitle') }}</p>
        </header>

        <h2 class="form-title">{{ t('login.selectUserType') }}</h2>

        <div class="roles-grid">
          <button
              type="button"
              v-for="role in roles"
              :key="role.id"
              class="role-card"
              @click="selectRole(role.id)"
          >
            <div class="role-icon">
              <i :class="role.icon" aria-hidden="true"></i>
            </div>
            <div class="role-info">
              <h3>{{ t(role.label) }}</h3>
              <p>{{ t(role.description) }}</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="language-bottom-left">
      <language-switcher />
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 100vh;
  background: #0f172a;
}

.login-brand {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: #0f172a;
  text-align: center;
}

.login-brand-slider {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.login-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  animation: crossfade 16s infinite;
}

.slide-1 {
  background-image: url('/section_home-hero.jpeg');
  animation-delay: 0s;
}

.slide-2 {
  background-image: url('/section_2-1.jpeg');
  animation-delay: 8s;
}

.login-brand-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 58, 138, 0.55) 60%, rgba(13, 148, 136, 0.45) 100%);
  backdrop-filter: blur(1px);
}

@keyframes crossfade {
  0% { opacity: 0; transform: scale(1.05); }
  5% { opacity: 1; }
  45% { opacity: 1; }
  55% { opacity: 0; transform: scale(1); }
  100% { opacity: 0; }
}

.login-brand-content {
  position: relative;
  z-index: 2;
  max-width: 28rem;
  transform: translateY(-12%);
}

.login-brand-mark {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--mt-accent);
  margin-bottom: 1.5rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.login-brand-title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #fff;
  line-height: 0.95;
}

.login-brand-tagline {
  margin: 2rem auto 0;
  font-size: 1.15rem;
  line-height: 1.6;
  color: rgba(248, 250, 252, 0.7);
  max-width: 20rem;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f8fafc;
}

.login-card {
  width: 100%;
  max-width: 500px;
  padding: 3rem 2.5rem;
  background: white;
  border-radius: 32px;
  box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.05),
      0 20px 50px -12px rgba(0, 0, 0, 0.1);
}

.login-logo-main {
  width: min(160px, 55vw);
  height: auto;
  max-height: 120px;
  margin: 0 auto 1.5rem;
  display: block;
  object-fit: contain;
}

.logo-section {
  text-align: center;
}

.logo-section h1 {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--mt-heading);
  margin: 0;
}

.logo-sub {
  margin: 0.5rem 0 2.5rem;
  font-size: 0.9rem;
  color: var(--mt-text-muted);
}

.form-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--mt-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1.5rem;
  text-align: center;
}

.roles-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.role-card {
  padding: 1.25rem;
  background: white;
  border: 1px solid var(--mt-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.role-card:hover {
  border-color: var(--mt-primary);
  background: var(--mt-primary-soft);
  transform: translateY(-2px);
}

.role-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mt-primary);
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.role-info {
  flex: 1;
}

.role-card h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--mt-heading);
  margin: 0 0 0.15rem;
}

.role-card p {
  font-size: 0.8rem;
  color: var(--mt-text-muted);
  margin: 0;
  line-height: 1.4;
}

.language-bottom-left {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 100;
}

@media (max-width: 1024px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .login-brand {
    display: none;
  }
}
</style>
