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

export const fetchDashboardData = async () => {
  try {
    const [
      usersRes,
      adminsRes,
      subsRes,
      estRes,
      devRes,
      opsRes,
      transRes
    ] = await Promise.all([
      axios.get(`${apiUrls.users}${endpoints.users}`),
      axios.get(`${apiUrls.admins}${endpoints.admins}`),
      axios.get(`${apiUrls.subscriptions}${endpoints.subscriptions}`),
      axios.get(`${apiUrls.establishments}${endpoints.establishments}`),
      axios.get(`${apiUrls.devices}${endpoints.devices}`),
      axios.get(`${apiUrls.operators}${endpoints.operators}`),
      axios.get(`${apiUrls.transports}${endpoints.transports}`),
    ]);

    return {
      users: usersRes.data,
      admins: adminsRes.data,
      subscriptions: subsRes.data,
      establishments: estRes.data,
      devices: devRes.data,
      operators: opsRes.data,
      transports: transRes.data
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
export const createEstablishment = async (data) => {
  try {
    const response = await axios.post(`${apiUrls.establishments}${endpoints.establishments}`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating establishment:', error);
    throw error;
  }
};

export const deleteOperator = async (id) => {
  const response = await axios.delete(`${apiUrls.operators}${endpoints.operators}/${id}`);
  return response.data;
};
