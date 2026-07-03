import client from './client';

export const fetchCategories = async () => {
  const { data } = await client.get('/categories/');
  return data;
};

export const createCategory = async (name, description = '') => {
  const { data } = await client.post('/categories/', { name, description });
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await client.delete(`/categories/${id}`);
  return data;
};
