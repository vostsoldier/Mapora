import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL.trim(); 

const axiosInstance = axios.create({
<<<<<<< Updated upstream
  baseURL: 'https://think-tree-production.up.railway.app',
=======
  baseURL,
>>>>>>> Stashed changes
  headers: {
    'Content-Type': 'application/json',
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (!(config.url && config.url.startsWith('/canvas'))) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;