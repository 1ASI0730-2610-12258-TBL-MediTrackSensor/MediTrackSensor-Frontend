<script setup>
import {useI18n} from "vue-i18n";
const { locale, availableLocales } = useI18n();

</script>

<template>
  <div class="language-switcher-shell">
    <div class="language-switcher-icon" aria-hidden="true">
      <i class="pi pi-globe"></i>
    </div>
    <pv-select-button
        v-model="locale"
        :options="availableLocales"
        class="language-select"
    >
      <template #option="slotProps">
        <span class="language-option">{{ slotProps.option.toUpperCase() }}</span>
      </template>
    </pv-select-button>
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
  box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--mt-border);
}

.language-switcher-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mt-text-muted);
  font-size: 1rem;
  margin-bottom: 0.15rem;
}

.language-option {
  font-weight: 700;
  font-size: 0.75rem;
}

:deep(.language-select.p-selectbutton) {
  display: flex;
  gap: 0.35rem;
  background: transparent;
  border: none;
}

:deep(.language-select .p-togglebutton) {
  border-radius: 10px;
  min-width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--mt-border);
  background: #f8fafc;
  color: var(--mt-text-muted);
  transition: all 0.2s ease;
  padding: 0;
}

:deep(.language-select .p-togglebutton.p-togglebutton-checked) {
  background: #0f172a;
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

:deep(.language-select .p-togglebutton:not(.p-togglebutton-checked):hover) {
  background: #f1f5f9;
  border-color: var(--mt-primary);
}
</style>
