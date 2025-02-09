import axios from 'axios';

const token = localStorage.getItem('token');

const api = axios.create({
  baseURL: 'https://think-tree-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

const apiWrapper = {
  get: (url, config = {}) => {
    if (localStorage.getItem('isDemo') === 'true' && !localStorage.getItem('token')) {
      console.log(`Demo mode: GET request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: GET requests are disabled.'));
    }
    return api.get(url, config);
  },
  post: (url, data, config = {}) => {
    if (url === '/api/users/signup' || url === '/api/users/login') {
      return api.post(url, data, config);
    }
    if (localStorage.getItem('isDemo') === 'true' && !localStorage.getItem('token')) {
      console.log(`Demo mode: POST request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: POST requests are disabled.'));
    }
    return api.post(url, data, config);
  },
  put: (url, data, config = {}) => {
    if (localStorage.getItem('isDemo') === 'true') {
      console.log(`Demo mode: PUT request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: PUT requests are disabled.'));
    }
    return api.put(url, data, config);
  },
  delete: (url, config = {}) => {
    if (localStorage.getItem('isDemo') === 'true') {
      console.log(`Demo mode: DELETE request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: DELETE requests are disabled.'));
    }
    return api.delete(url, config);
  },
};

export default apiWrapper;