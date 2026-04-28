import axiosClient from './axiosClient';

export const getAllCategories = async () => {
  try {
    const response = await axiosClient.get('/categories');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    // No hardcoded fallbacks as per constraints
    return [];
  }
};
