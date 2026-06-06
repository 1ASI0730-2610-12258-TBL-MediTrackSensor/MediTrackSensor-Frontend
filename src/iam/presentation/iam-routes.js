// Lazy-loaded components
const profile = () => import('./views/profile.vue');
const notAssigned = () => import('./views/not-assigned-establishment.vue');

/**
 * Route definitions for the IAM bounded context (authenticated area).
 * All paths are relative to the `/iam` parent route.
 *
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const iamRoutes = [
    {
        path: 'profile',
        name: 'profile',
        component: profile,
        meta: { title: 'Profile', requiresAuth: true },
    },
    {
        path: 'not-assigned',
        name: 'iam-not-assigned',
        component: notAssigned,
        meta: { title: 'Not assigned', requiresAuth: true },
    },
];

export default iamRoutes;