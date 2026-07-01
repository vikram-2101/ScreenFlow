import client from './client';

export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const signup = async (email, password) => {
  const response = await client.post('/auth/signup', { email, password });
  return response.data;
};

export const logout = async () => {
  try {
    await client.post('/auth/logout');
  } catch (error) {
    console.error('Logout error', error);
  }
};

export const getCurrentUser = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};
