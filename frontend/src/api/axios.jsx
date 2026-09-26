import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import { useAuth } from '../context/auth/useAuth';
import { API_BASE_URL } from '../config/apiConfig';

const baseURL = `${API_BASE_URL.replace(/\/$/, '')}/auth`;

const useAxios = () => {
    const { authTokens, setUser, setAuthTokens } = useAuth();
    
    const axioInstance = axios.create({
        baseURL,
        headers: { Authorization: `Bearer ${authTokens?.access}` }
    });

    axioInstance.interceptors.request.use(async req => {
        const user = jwtDecode(authTokens.access)
        const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1
    

        if (!isExpired) {
            return req
        }
        
        const response = await axios.post(`${baseURL}/token/refresh/`, {
            refresh: authTokens.refresh
        })
        
        setAuthTokens(response.data)
        setUser(jwtDecode(response.data.access))

        req.headers.Authorization = `Bearer ${response.data.access}`
        return req
        
    })
    return axioInstance
}
export default useAxios