import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const AUTH_URL = `${API_BASE_URL.replace(/\/$/, '')}/auth`;


/**
 * Registers a new user
 * @param {Object} payload The user registration payload matching Django RegisterSerializer
 */
export const registerUser = async (payload) => {
    return await axios.post(`${AUTH_URL}/register/`, payload);
};

/**
 * Resolves a hospital location and creates/fetches its record from the backend
 * @param {Object} hospitalData Contains place_id, name, lat, lon, address
 */
export const resolveHospital = async (hospitalData) => {
    // Note: Typo vi -> v1 in the original file was present, correcting to v1.
    return await axios.post(`${AUTH_URL}/hospitals/resolve/`, hospitalData);
};
