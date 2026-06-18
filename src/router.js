import { createRouter, createWebHistory } from "vue-router";
import Layout from "./shared/presentation/components/layout.vue";
import Login from "./iam/presentation/views/login.vue";
import Home from "./shared/presentation/views/home.vue";
import HomeHealthEntity from "./shared/presentation/views/home-health-entity.vue";
import HomeOperationalStaff from "./shared/presentation/views/home-operational-staff.vue";
import establishmentRoutes from "./establishment/presentation/establishment-routes.js";
import monitoringRoutes from "./monitoring/presentation/monitoring-routes.js";
import logisticsRoutes from "./logistics/presentation/logistics-routes.js";
import subscriptionsRoutes from "./subscriptions/presentation/subscriptions-routes.js";
import iamRoutes from "./iam/presentation/iam-routes.js";
import iamAuthRoutes from "./iam/presentation/iam-auth-routes.js";

const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');
const iamAuthLayout = () => import('./iam/presentation/views/auth-layout.vue');

const routes = [
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { title: 'Login', requiresAuth: false }
    },
    {
        path: '/iam/auth',
        component: iamAuthLayout,
        children: iamAuthRoutes,
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        component: Layout,
        children: [
            { path: 'home', name: 'home', component: Home, meta: { title: 'Home' } },
            { path: 'home-health-entity', name: 'home-health-entity', component: HomeHealthEntity, meta: { title: 'Home' } },
            { path: 'home-operational-staff', name: 'home-operational-staff', component: HomeOperationalStaff, meta: { title: 'Home' } },
            { path: 'establishment', name: 'establishment', children: establishmentRoutes },
            { path: 'monitoring', name: 'monitoring', children: monitoringRoutes },
            { path: 'logistics', name: 'logistics', children: logisticsRoutes },
            { path: 'subscriptions', name: 'subscriptions', children: subscriptionsRoutes },
            { path: 'iam', name: 'iam', children: iamRoutes },
            { path: '', redirect: '/login' }
        ]
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'Page Not Found' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
});

router.beforeEach((to, from) => {
    let baseTitle = 'MediTrack Sensor';
    document.title = `${baseTitle} - ${to.meta['title']}`;
});

export default router;