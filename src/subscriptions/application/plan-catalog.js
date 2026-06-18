/**
 * Plan catalog helpers — tarjetas, límites y contexto de suscripción.
 * @module plan-catalog
 */
import { Subscription } from '../domain/model/subscription.entity.js';
import { readAuthSession } from '../../iam/infrastructure/auth-session.js';

const PLAN_CONTEXT_KEY = 'meditrack_plan_context';

export const PLAN_CATALOG_ORDER = Subscription.PLAN_CATALOG_ORDER;

export function readPlanContextRaw() {
    try {
        const raw = sessionStorage.getItem(PLAN_CONTEXT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function resolveCurrentPlanCatalogId() {
    const ctx = readPlanContextRaw();
    if (ctx?.catalogPlanId) return ctx.catalogPlanId;
    if (ctx?.planApiValue) return Subscription.apiPlanToCatalogId(ctx.planApiValue);
    const auth = readAuthSession();
    if (auth?.plan) return Subscription.apiPlanToCatalogId(auth.plan);
    return 'basic';
}

export function getPlanLimits(catalogId) {
    return Subscription.getPlanByCatalogId(catalogId).limits;
}

export function getPlanDefinition(catalogId) {
    return Subscription.getPlanByCatalogId(catalogId);
}

/**
 * @param {string} catalogId
 * @param {import('vue-i18n').ComposerTranslation} t
 */
export function buildPlanFeatures(catalogId, t) {
    const def = Subscription.getPlanByCatalogId(catalogId);
    const limits = def.limits;
    return [
        t('plansPage.featureLabels.establishments', { n: limits.establishments }),
        t('plansPage.featureLabels.staticDevices', { n: limits.staticDevices }),
        t('plansPage.featureLabels.vehicleDevices', { n: limits.vehicleDevices }),
        def.customParameters
            ? t('plansPage.featureLabels.customParamsYes')
            : t('plansPage.featureLabels.customParamsNo'),
        t('plansPage.featureLabels.operators'),
        ...(catalogId === 'enterprise' ? [t('plansPage.featureLabels.enterpriseExtras')] : []),
        t('plansPage.featureLabels.reports'),
    ];
}

/**
 * @param {string} catalogId
 * @param {import('vue-i18n').ComposerTranslation} t
 */
export function buildPlanCard(catalogId, t) {
    const def = Subscription.getPlanByCatalogId(catalogId);
    return {
        id: catalogId,
        name: t(`plansPage.names.${catalogId}`),
        price: t(`plansPage.prices.${catalogId}`),
        desc: t(`plansPage.desc.${catalogId}`),
        recommended: def.recommended,
        features: buildPlanFeatures(catalogId, t),
        limits: def.limits,
        customParameters: def.customParameters,
    };
}

/**
 * @param {import('vue-i18n').ComposerTranslation} t
 */
export function buildAllPlanCards(t) {
    return PLAN_CATALOG_ORDER.map((id) => buildPlanCard(id, t));
}

export function checkPlanLimit(catalogId, resource, currentCount) {
    const limits = getPlanLimits(catalogId);
    const limitMap = {
        establishments: limits.establishments,
        staticDevices: limits.staticDevices,
        vehicleDevices: limits.vehicleDevices,
    };
    const limit = limitMap[resource];
    if (limit == null) return { allowed: true, limit: null, current: currentCount };
    return {
        allowed: currentCount < limit,
        limit,
        current: currentCount,
    };
}

export function catalogIdToApiPlan(catalogId) {
    return Subscription.catalogIdToApiPlan(catalogId);
}

export function apiPlanToCatalogId(apiPlan) {
    return Subscription.apiPlanToCatalogId(apiPlan);
}
