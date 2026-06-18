<script setup>
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';

defineProps({
  showBack: { type: Boolean, default: false },
  /** Solo pago: una columna centrada */
  singleColumn: { type: Boolean, default: false },
  /** Formulario más compacto (pago) */
  compact: { type: Boolean, default: false },
  /** Registro: mismo tamaño que Sign in, campos en 2 columnas */
  signup: { type: Boolean, default: false },
  /** Una sola columna sin panel izquierdo de marca */
  wide: { type: Boolean, default: false },
});

const emit = defineEmits(['back']);
const { t } = useI18n();
</script>

<template>
  <div
    class="auth-page"
    :class="{
      'auth-page--single': singleColumn,
      'auth-page--compact': compact,
      'auth-page--signup': signup,
      'auth-page--wide': wide,
    }"
  >
    <div v-if="!singleColumn" class="auth-brand" aria-hidden="true">
      <div class="auth-brand-slider">
        <div class="auth-slide slide-1"></div>
        <div class="auth-slide slide-2"></div>
      </div>
      <div class="auth-brand-overlay"></div>
      <div class="auth-brand-content">
        <span class="auth-brand-mark">{{ t('login.brandMark') }}</span>
        <p class="auth-brand-title">{{ t('login.brandTitle') }}</p>
        <p class="auth-brand-tagline">{{ t('login.brandTagline') }}</p>
      </div>
    </div>

    <div class="auth-panel">
      <button
        v-if="showBack"
        type="button"
        class="auth-back"
        aria-label="Back"
        @click="emit('back')"
      >
        <i class="pi pi-arrow-left"></i>
      </button>
      <div class="auth-card">
        <slot />
      </div>
    </div>

    <div class="language-bottom-left">
      <language-switcher />
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 100dvh;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background: #f8fafc;
}

.auth-page--single {
  grid-template-columns: 1fr;
}

.auth-brand {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #0f172a;
}

.auth-brand-slider {
  position: absolute;
  inset: 0;
}

.auth-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  animation: crossfade 16s infinite;
}

.slide-1 {
  background-image: url('/section_home-hero.jpeg');
}

.slide-2 {
  background-image: url('/section_2-1.jpeg');
  animation-delay: 8s;
}

.auth-brand-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.8), rgba(30, 58, 138, 0.55));
}

@keyframes crossfade {
  0%, 55% { opacity: 0; }
  5%, 45% { opacity: 1; }
  100% { opacity: 0; }
}

.auth-brand-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 28rem;
}

.auth-brand-mark {
  color: #0d9488;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.3em;
}

.auth-brand-title {
  margin: 1rem 0 0;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}

.auth-brand-tagline {
  margin: 1.25rem 0 0;
  color: rgba(248, 250, 252, 0.75);
  line-height: 1.6;
}

.auth-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 0;
  overflow-y: auto;
  background: #f8fafc;
}

.auth-page--compact .auth-panel {
  padding: 1rem 1.25rem;
  overflow: hidden;
  align-items: center;
}

.auth-page--compact:not(.auth-page--wide) .auth-card {
  max-width: 400px;
  padding: 1.35rem 1.2rem 1.1rem;
}

.auth-page--signup .auth-panel {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  align-items: center;
}

.auth-page--signup:not(.auth-page--wide) .auth-card {
  max-width: 560px;
  padding: 2.75rem 2.5rem 2.25rem;
}

.auth-page--wide .auth-panel {
  align-items: flex-start;
  padding: 1.5rem 1.25rem 2rem;
}

.auth-page--wide .auth-card {
  max-width: min(1080px, 100%);
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}

.auth-back {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 2;
  width: 40px;
  height: 40px;
  border: 1px solid #dbe3ef;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  color: #1e3a8a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  min-width: 0;
  padding: 3rem 2.5rem;
  background: #fff;
  border-radius: 32px;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 20px 50px -12px rgba(0, 0, 0, 0.1);
}

:deep(.auth-card) .btn-primary {
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #2563eb, #1e40af);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.language-bottom-left {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 100;
}

@media (max-width: 1024px) {
  .auth-page:not(.auth-page--single) {
    grid-template-columns: 1fr;
  }
  .auth-brand {
    display: none;
  }
}
</style>
