import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  let sessionId = localStorage.getItem('sf_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('sf_session_id', sessionId);
  }
  config.headers['X-Session-ID'] = sessionId;
  
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't intercept 401s from the login route itself (let the modal handle it)
      if (error.config && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/signup')) {
        localStorage.removeItem('sf_token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
