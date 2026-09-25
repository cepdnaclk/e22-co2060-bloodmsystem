import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const donorAPI = axios.create({
    baseURL: `${API_BASE_URL.replace(/\/$/, '')}/donor/public`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const scanDonorQR = async (qrId) => {
    try {
        const response = await donorAPI.get(`/${qrId}/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};
