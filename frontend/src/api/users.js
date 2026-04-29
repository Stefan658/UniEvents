import axiosClient from './axiosClient';

export const getOrganizers = async () => {
  try {
    const response = await axiosClient.get('/users/organizers');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch organizers';
  }
};
