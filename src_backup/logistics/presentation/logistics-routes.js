const viewTransports = () => import('./views/view-transports.vue');

const logisticsRoutes = [
    {
        path: 'transports',
        name: 'transports',
        component: viewTransports,
        meta: { title: 'Transports' }
    }
];

export default logisticsRoutes;