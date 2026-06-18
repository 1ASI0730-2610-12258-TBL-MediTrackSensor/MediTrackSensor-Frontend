/**
 * Subscription entity within the Subscriptions bounded context.
 *
 * @class Subscription
 */
export class Subscription {
    constructor({
        id = null,
        admin_id = null,
        plan = '',
        start_date = '',
        end_date = '',
        status = '',
        created_at = '',
    } = {}) {
        this.id = id;
        this.admin_id = admin_id;
        this.plan = plan;
        this.start_date = start_date;
        this.end_date = end_date;
        this.status = status;
        this.created_at = created_at;
    }

    // ── Plan catalog ──────────────────────────────────────────────────────────

    static PLAN_CATALOG_ORDER = ['basic', 'premium', 'enterprise'];

    static PLAN_CATALOG = {
        basic: {
            id: 'basic',
            apiPlan: 'BASIC',
            recommended: false,
            limits: { establishments: 5, staticDevices: 40, vehicleDevices: 40 },
            customParameters: false,
        },
        premium: {
            id: 'premium',
            apiPlan: 'PREMIUM',
            recommended: true,
            limits: { establishments: 40, staticDevices: 200, vehicleDevices: 200 },
            customParameters: true,
        },
        enterprise: {
            id: 'enterprise',
            apiPlan: 'ENTERPRISE',
            recommended: false,
            limits: { establishments: 400, staticDevices: 800, vehicleDevices: 800 },
            customParameters: true,
        },
    };

    static getPlanByCatalogId(catalogId) {
        const id = String(catalogId || 'basic').toLowerCase();
        return Subscription.PLAN_CATALOG[id] ?? Subscription.PLAN_CATALOG.basic;
    }

    static apiPlanToCatalogId(apiPlan) {
        const p = String(apiPlan || 'BASIC').toUpperCase();
        const found = Subscription.PLAN_CATALOG_ORDER.find(
            (id) => Subscription.PLAN_CATALOG[id].apiPlan === p,
        );
        return found ?? 'basic';
    }

    static catalogIdToApiPlan(catalogId) {
        return Subscription.getPlanByCatalogId(catalogId).apiPlan;
    }

    // ── Payment validation ────────────────────────────────────────────────────

    static validatePayment({ cardNumber, expiry, cvv }) {
        const errors = {};

        const digits = String(cardNumber || '').replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) {
            errors.cardNumber = 'invalidCardNumber';
        }

        const exp = String(expiry || '').trim();
        const m = exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
        if (!m) {
            errors.expiry = 'invalidExpiry';
        } else {
            const month = Number(m[1]);
            const year = 2000 + Number(m[2]);
            const expDate = new Date(year, month, 0);
            if (month < 1 || month > 12 || expDate < new Date()) {
                errors.expiry = 'expiredCard';
            }
        }

        const cvvDigits = String(cvv || '').replace(/\D/g, '');
        if (cvvDigits.length < 3 || cvvDigits.length > 4) {
            errors.cvv = 'invalidCvv';
        }

        return { valid: Object.keys(errors).length === 0, errors };
    }
}
