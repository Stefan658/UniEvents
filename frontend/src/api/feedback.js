import axiosClient from './axiosClient';

export const submitFeedback = async (payload) => {
  try {
    const response = await axiosClient.post('/feedback', payload);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit feedback';
  }
};

export const getEventFeedback = async (eventId) => {
  try {
    const response = await axiosClient.get(`/feedback/event/${eventId}`);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch feedback';
  }
};

export const getEventFeedbackSummary = async (eventId) => {
  try {
    const response = await axiosClient.get(`/events/${eventId}/feedback/summary`);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch feedback summary';
  }
};
