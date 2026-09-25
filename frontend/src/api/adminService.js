import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Create a configured axios instance for admin protected routes
const adminAxios = axios.create({
    baseURL: API_BASE_URL.replace(/\/$/, ''),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to inject the token from localStorage
adminAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Note: Replace these mocked endpoints with actual Django backend routes once ready
// For example:
// const API_DASHBOARD_STATS = '/admin/dashboard/stats/';
// const API_PUBLIC_STOCK = '/blood/public/live-stock/';

export const adminService = {
    /**
     * Fetch key totals (staff, doctors, users, system inventory total)
     * Expected Django Response:
     * {
     *   total_staff: number,
     *   total_doctors: number,
     *   total_users: number,
     *   total_inventory_units: number
     * }
     */
    getDashboardStats: async () => {
        // Temporarily mocked response until backend is fully wired
        return Promise.resolve({
            data: {
                total_staff: 26,
                total_doctors: 54,
                total_users: 1240,
                total_inventory_units: 540
            }
        });

        // Correct implementation:
        // const response = await adminAxios.get('/admin/dashboard/summary/');
        // return response.data;
    },

    /**
     * Fetch live blood stock across all blood groups
     * Connected to your existing blood inventor service
     */
    getLiveStock: async () => {
        const response = await adminAxios.get('/blood/live-stock/');
        return response.data; // Example: { updatedAt: "...", stocks: [ { bloodType: "A+", units: 45, status: "Normal" }, ... ] }
    }
};

