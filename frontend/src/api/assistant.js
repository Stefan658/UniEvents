import axiosClient from './axiosClient';

export const sendAssistantMessage = async (message) => {
  try {
    const response = await axiosClient.post('/assistant/chat', { message });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to communicate with assistant';
  }
};
