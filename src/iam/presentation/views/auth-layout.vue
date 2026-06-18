<template>
  <pv-toast />
  <router-view />
</template>

<style>
.reg-compact { width: 100%; min-width: 0; }
.reg-compact__head { text-align: center; margin-bottom: 0.5rem; }
.reg-compact__logo {
  width: min(160px, 55vw);
  height: auto;
  max-height: 120px;
  margin: 0 auto 1.5rem;
  display: block;
  object-fit: contain;
}
.reg-compact__badge {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--mt-accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.reg-compact__title {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--mt-heading);
}
.reg-compact__hint {
  margin: 0.5rem 0 2rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--mt-text-muted);
}
.reg-compact__form { display: flex; flex-direction: column; gap: 1rem; }
.reg-compact__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--mt-heading);
}
.reg-compact__field input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 0.85rem;
  font-size: 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--mt-border);
  background: #fff;
  color: var(--mt-text);
}
.reg-compact__field input:focus {
  outline: none;
  border-color: var(--mt-primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}
.reg-compact__pw { position: relative; }
.reg-compact__pw input { padding-right: 2.5rem; }
.reg-compact__eye {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  color: var(--mt-text-muted);
}
.reg-compact__row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; min-width: 0; }
.reg-compact__muted { font-size: 0.75rem; color: var(--mt-text-muted); }
.reg-compact__error { font-size: 0.75rem; color: #ef4444; }
.reg-compact__btn { margin-top: 0.5rem; }
.reg-compact__footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--mt-text-muted);
}
.reg-compact__footer .link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}

.auth-page--signup .reg-compact__hint {
  margin-bottom: 1.5rem;
}
.auth-page--signup .reg-compact__form--signup {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 1rem;
  row-gap: 1rem;
}
.auth-page--signup .reg-compact__form--signup .reg-compact__btn {
  grid-column: 1 / -1;
  margin-top: 0.25rem;
}

@media (max-width: 600px) {
  .auth-page--signup .reg-compact__form--signup {
    grid-template-columns: 1fr;
  }
}
</style>
