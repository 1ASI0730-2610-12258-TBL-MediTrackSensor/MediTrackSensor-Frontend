const viewDevices = () => import('./views/view-devices.vue');
const controlCenter = () => import('./views/monitoring-dashboard.vue');

const monitoringRoutes = [
    {
        path: 'devices',
        name: 'devices',
        component: viewDevices,
        meta: { title: 'Devices' }
    },
    {
        path: 'control-center',
        name: 'control-center',
        component: controlCenter,
        meta: { title: 'Control Center' }
    }
];

export default monitoringRoutes;