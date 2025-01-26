import axiosInstance from './axios';

const isDemo = localStorage.getItem('isDemo') === 'true';

const apiWrapper = {
  get: (url, config = {}) => {
    if (isDemo) {
      console.log(`Demo mode: GET request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: GET requests are disabled.'));
    }
    return axiosInstance.get(url, config);
  },
  post: (url, data, config = {}) => {
    if (isDemo) {
      console.log(`Demo mode: POST request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: POST requests are disabled.'));
    }
    return axiosInstance.post(url, data, config);
  },
  put: (url, data, config = {}) => {
    if (isDemo) {
      console.log(`Demo mode: PUT request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: PUT requests are disabled.'));
    }
    return axiosInstance.put(url, data, config);
  },
  delete: (url, config = {}) => {
    if (isDemo) {
      console.log(`Demo mode: DELETE request to ${url} blocked.`);
      return Promise.reject(new Error('Demo mode: DELETE requests are disabled.'));
    }
    return axiosInstance.delete(url, config);
  },
};

export default apiWrapper;