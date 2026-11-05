import axiosInstance from '../api/axiosInstance';

export const dashboardService = {
  getDashboardData: async (params = {}) => {
    const response = await axiosInstance.get('api/dashboard', { params });
    return response.data;
  },
};

export default dashboardService;
