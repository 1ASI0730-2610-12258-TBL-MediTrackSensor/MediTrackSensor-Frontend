const assignOperator = () => import('./views/assign-operator.vue');
const establishmentForm = () => import('./views/establishment-form.vue');
const mapOfEstablishments = () => import('./views/map-of-establishments.vue');
const viewEstablishments = () => import('./views/view-establishments.vue');
const viewOperators = () => import('./views/view-operators.vue');

const establishmentRoutes = [
    {
        path: 'establishments/new',
        name: 'establishment-new',
        component: establishmentForm,
        meta: { title: 'New Establishment' }
    },
    {
        path: 'establishments',
        name: 'establishments',
        component: viewEstablishments,
        meta: { title: 'Establishments' }
    },
    {
        path: 'assign-operator',
        name: 'assign-operator',
        component: assignOperator,
        meta: { title: 'Assign Operator' }
    },
    {
        path: 'map',
        name: 'establishment-map',
        component: mapOfEstablishments,
        meta: { title: 'Map of Establishments' }
    },
    {
        path: 'operators',
        name: 'operators',
        component: viewOperators,
        meta: { title: 'Operators' }
    }
];

export default establishmentRoutes;