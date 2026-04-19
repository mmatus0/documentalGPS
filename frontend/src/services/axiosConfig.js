import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const axiosInstance = axios.create({
    baseURL: API,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers['Authorization'] = 'Bearer ${token';
    }

    return config;
});

axiosInstance.interceptors.responde.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401){
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
)

export default axiosInstance;