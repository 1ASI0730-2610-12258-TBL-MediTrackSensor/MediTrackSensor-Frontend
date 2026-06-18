const loginHealthEntity = () => import('./views/login-health-entity.vue');
const loginOperationalStaff = () => import('./views/login-operational-staff.vue');
const registerHealthEntity = () => import('./views/register-health-entity.vue');
const registerOperationalStaff = () => import('./views/register-operational-staff.vue');
const registerPlans = () => import('./views/register-plans.vue');
const billingCheckout = () => import('./views/billing-checkout.vue');

/** @type {import('vue-router').RouteRecordRaw[]} */
const iamAuthRoutes = [
    {
        path: 'login-health-entity',
        name: 'iam-login-health-entity',
        component: loginHealthEntity,
        meta: { title: 'Login', requiresAuth: false },
    },
    {
        path: 'login-operational-staff',
        name: 'iam-login-operational-staff',
        component: loginOperationalStaff,
        meta: { title: 'Login', requiresAuth: false },
    },
    {
        path: 'register-health-entity',
        name: 'iam-register-health-entity',
        component: registerHealthEntity,
        meta: { title: 'Register', requiresAuth: false },
    },
    {
        path: 'register-operational-staff',
        name: 'iam-register-operational-staff',
        component: registerOperationalStaff,
        meta: { title: 'Register', requiresAuth: false },
    },
    {
        path: 'register-plans',
        name: 'iam-register-plans',
        component: registerPlans,
        meta: { title: 'Plans', requiresAuth: false },
    },
    {
        path: 'billing',
        name: 'iam-billing',
        component: billingCheckout,
        meta: { title: 'Payment', requiresAuth: false },
    },
];

export default iamAuthRoutes;
