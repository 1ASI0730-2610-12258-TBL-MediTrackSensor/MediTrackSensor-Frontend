import axios from 'axios';

const apiUrls = {
  users: import.meta.env.VITE_MEDITRACK_SENSOR_US_AD_API,
  admins: import.meta.env.VITE_MEDITRACK_SENSOR_US_AD_API,
  subscriptions: import.meta.env.VITE_MEDITRACK_SENSOR_SUB_EST_API,
  establishments: import.meta.env.VITE_MEDITRACK_SENSOR_SUB_EST_API,
  devices: import.meta.env.VITE_MEDITRACK_SENSOR_DV_API,
  operators: import.meta.env.VITE_MEDITRACK_SENSOR_OP_TR_API,
  transports: import.meta.env.VITE_MEDITRACK_SENSOR_OP_TR_API,
};

const endpoints = {
  users: '/users',
  admins: '/admins',
  subscriptions: import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH,
  establishments: import.meta.env.VITE_ESTABLISHMENT_ENDPOINT_PATH,
  devices: import.meta.env.VITE_MONITORING_ENDPOINT_PATH,
  operators: import.meta.env.VITE_OPERATORS_ENDPOINT_PATH,
  transports: import.meta.env.VITE_LOGISTICS_ENDPOINT_PATH,
};

const resourceKeys = ['users', 'admins', 'subscriptions', 'establishments', 'devices', 'operators', 'transports'];

const joinUrl = (baseUrl, endpointPath) => {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  const path = String(endpointPath || '').trim().replace(/^\/+/, '');
  if (!base || !path) return '';
  return `${base}/${path}`;
};

const getResourceUrl = (resource) => joinUrl(apiUrls[resource], endpoints[resource]);

const extractCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.content)) return payload.content;

  return [];
};

const validateResourceConfig = () => {
  const missing = resourceKeys.filter((key) => !apiUrls[key] || !endpoints[key]);
  if (missing.length > 0) {
    console.error('[dashboard.service] Missing API config for resources:', missing);
  }
};

export const fetchDashboardData = async () => {
  validateResourceConfig();

  const requests = resourceKeys.map((resource) =>
    axios
      .get(getResourceUrl(resource), { timeout: 15000 })
      .then((response) => ({ resource, data: extractCollection(response.data) }))
  );

  const settled = await Promise.allSettled(requests);
  const payload = {};

  settled.forEach((result, index) => {
    const resource = resourceKeys[index];
    if (result.status === 'fulfilled') {
      payload[resource] = result.value.data;
      return;
    }

    payload[resource] = [];
    const status = result.reason?.response?.status;
    const url = getResourceUrl(resource);
    console.error(`[dashboard.service] Failed to fetch "${resource}" (${url})`, {
      status,
      message: result.reason?.message,
    });
  });

  return payload;
};
export const createEstablishment = async (data) => {
  try {
    const url = getResourceUrl('establishments');
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error('Error creating establishment:', error);
    throw error;
  }
};

export const deleteOperator = async (id) => {
  const url = `${getResourceUrl('operators')}/${id}`;
  const response = await axios.delete(url);
  return response.data;
};
