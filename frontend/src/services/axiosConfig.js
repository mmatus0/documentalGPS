import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {

        const url = error.config?.url || '';
        const es401 = error.response?.status === 401;
        const esLogin = url.includes('/auth/login');

        if(es401 && !esLogin){
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
)

export default axiosInstance;