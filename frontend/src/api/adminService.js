import api from './api';

export const adminService = {
    /**
     * Fetch key totals (staff, doctors, donors, users, system inventory total)
     * From real Django AdminDashboard stats endpoint: /adminDashboard/stats/
     */
    getDashboardStats: async () => {
        const response = await api.get('adminDashboard/stats/');
        return response.data;
    },

    /**
     * Fetch live blood stock across all blood groups
     * Connected to existing blood inventor service: /blood/live-stock/
     */
    getLiveStock: async (params = {}) => {
        const response = await api.get('blood/live-stock/', { params });
        return response.data;
    },

    /**
     * Fetch national inventory summary
     */
    getNationalInventory: async () => {
        const response = await api.get('blood/national/dashboard/');
        return response.data;
    },

    /**
     * Fetch all hospitals stock
     */
    getHospitalsStock: async () => {
        const response = await api.get('blood/hospitals/stock/');
        return response.data;
    }
};

export default adminService;
