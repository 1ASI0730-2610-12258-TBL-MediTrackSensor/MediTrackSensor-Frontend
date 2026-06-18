<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  compact: { type: Boolean, default: false },
});

const { locale, availableLocales } = useI18n();
</script>

<template>
  <div class="language-switcher-shell" :class="{ 'language-switcher-shell--compact': compact }">
    <div
      class="language-switcher-icon"
      :class="{ 'language-switcher-icon--inline': compact }"
      aria-hidden="true"
    >
      <i class="pi pi-globe"></i>
    </div>

    <div class="language-options">
      <button
        v-for="loc in availableLocales"
        :key="loc"
        type="button"
        class="lang-btn"
        :aria-pressed="locale === loc"
        :class="{ checked: locale === loc }"
        @click="locale = loc"
      >
        {{ loc.toUpperCase() }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.language-switcher-shell {
  display: inline-flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem 0.75rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--mt-border);
}

.language-switcher-shell--compact {
  flex-direction: row;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.45rem;
  border-radius: 12px;
  box-shadow: none;
}

.language-switcher-shell--compact::before {
  content: '';
  display: none;
}

.language-switcher-shell--compact .language-options {
  gap: 0.25rem;
}

.language-switcher-shell--compact .lang-btn {
  min-width: 2rem;
  height: 2rem;
  font-size: 0.72rem;
}

.language-switcher-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mt-text-muted);
  font-size: 1rem;
  margin-bottom: 0.15rem;
}

.language-switcher-icon--inline {
  margin-bottom: 0;
  font-size: 0.95rem;
}

.language-options {
  display: flex;
  gap: 0.35rem;
}

.lang-btn {
  border-radius: 10px;
  min-width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--mt-border);
  background: #f8fafc;
  color: var(--mt-text-muted);
  font-weight: 700;
  cursor: pointer;
}

.lang-btn.checked {
  background: #0f172a;
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.18);
  border-color: transparent;
}
</style>
