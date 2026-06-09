import axiosClient from './axiosClient';

export const getFeedbackByEventReport = async () => {
  try {
    const response = await axiosClient.get('/reports/feedback-by-event');
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch feedback report';
  }
};
