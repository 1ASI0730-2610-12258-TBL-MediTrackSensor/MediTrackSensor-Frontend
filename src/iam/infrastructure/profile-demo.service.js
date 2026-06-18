import axios from 'axios';

const usersBase = import.meta.env.VITE_MEDITRACK_SENSOR_US_AD_API;
const subEstBase = import.meta.env.VITE_MEDITRACK_SENSOR_SUB_EST_API;
const establishmentsPath = import.meta.env.VITE_ESTABLISHMENT_ENDPOINT_PATH;
const subscriptionsPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;

function pickRandom(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchSubscriptionsList() {
  const primary = `${subEstBase}${subscriptionsPath}`;
  try {
    const res = await axios.get(primary);
    return res.data;
  } catch (e) {
    if (subscriptionsPath !== '/subscriptions') {
      const res = await axios.get(`${subEstBase}/subscriptions`);
      return res.data;
    }
    throw e;
  }
}

/**
 * Demo sin login: usuario persistido por `userId` en sessionStorage; plan y fecha
 * desde la API o desde `planFromSession` si el usuario cambió plan en otra vista.
 */
export async function fetchProfileDemoFromApi({ persistedUserId, planFromSession } = {}) {
  const [usersRes, establishmentsRes, subscriptions] = await Promise.all([
    axios.get(`${usersBase}/users`),
    axios.get(`${subEstBase}${establishmentsPath}`),
    fetchSubscriptionsList(),
  ]);

  const users = usersRes.data;
  const establishments = establishmentsRes.data;

  const user =
    (persistedUserId && users.find((u) => u.id === persistedUserId)) ?? pickRandom(users);

  const establishment =
    establishments.find((e) => e.admin_id === user?.id) ?? pickRandom(establishments);

  const subscription =
    subscriptions.find((s) => s.admin_id === user?.id) ?? pickRandom(subscriptions);

  const randomSub = pickRandom(subscriptions);
  const planApi =
    planFromSession?.planApiValue != null
      ? planFromSession.planApiValue
      : randomSub?.plan ?? 'BASIC';
  const benefitsEndDate =
    planFromSession?.benefitsEndDate != null
      ? planFromSession.benefitsEndDate
      : randomSub?.end_date ?? subscription?.end_date ?? null;

  return {
    user,
    establishment,
    subscription,
    planApi,
    benefitsEndDate,
  };
}

export const PLAN_CONTEXT_KEY = 'meditrack_plan_context';

/** BASIC | PREMIUM | ENTERPRISE → id de catálogo en UI */
export function apiPlanToCatalogId(plan) {
  const p = String(plan || '').toUpperCase();
  if (p === 'BASIC') return 'basic';
  if (p === 'ENTERPRISE') return 'premium';
  if (p === 'PREMIUM') return 'professional';
  return 'basic';
}

export function catalogIdToApiPlan(catalogId) {
  if (catalogId === 'basic') return 'BASIC';
  if (catalogId === 'premium') return 'ENTERPRISE';
  return 'PREMIUM';
}

export function readPlanContext() {
  try {
    const raw = sessionStorage.getItem(PLAN_CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writePlanContext(ctx) {
  sessionStorage.setItem(PLAN_CONTEXT_KEY, JSON.stringify(ctx));
}
