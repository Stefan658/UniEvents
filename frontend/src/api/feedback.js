import axiosClient from './axiosClient';

export const submitFeedback = async (payload) => {
  try {
    const response = await axiosClient.post('/feedback', payload);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit feedback';
  }
};
