import api from "../api/api";

export const adminService = {
  /**
   * Fetch key totals (staff, doctors, donors, users, system inventory total)
   * From real Django AdminDashboard stats endpoint: /adminDashboard/stats/
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get("adminDashboard/stats/");
      return response.data;
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      throw error;
    }
  },

  /**
   * Fetch live blood stock across all blood groups
   * Connected to existing blood inventor service: /blood/live-stock/
   */
  getLiveStock: async (params = {}) => {
    try {
      const response = await api.get("blood/live-stock/", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching live stock:", error);
      throw error;
    }
  },

  /**
   * Fetch national inventory summary
   */
  getNationalInventory: async () => {
    try {
      const response = await api.get("blood/national/dashboard/");
      return response.data;
    } catch (error) {
      console.error("Error fetching national inventory:", error);
      throw error;
    }
  },

  /**
   * Fetch all hospitals stock
   */
  getHospitalsStock: async () => {
    try {
      const response = await api.get("blood/hospitals/stock/");
      return response.data;
    } catch (error) {
      console.error("Error fetching hospitals stock:", error);
      throw error;
    }
  },

  /**
   * Fetch admin donors
   */
  getAdminDonors: async () => {
    try {
      const response = await api.get("adminDashboard/donors/");
      return response.data;
    } catch (error) {
      console.error("Error fetching admin donors:", error);
      throw error;
    }
  },

  /**
   * Fetch admin camps
   */
  getAdminCamps: async () => {
    try {
      const response = await api.get("adminDashboard/camps/");
      return response.data;
    } catch (error) {
      console.error("Error fetching admin camps:", error);
      throw error;
    }
  },
};

// Also export individual functions for backward compatibility with existing components
export const getAdminDashboardStats = adminService.getDashboardStats;
export const getAdminDonors = adminService.getAdminDonors;
export const getAdminCamps = adminService.getAdminCamps;

export default adminService;
