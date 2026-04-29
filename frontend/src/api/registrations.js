import axiosClient from './axiosClient';

export const getAllRegistrations = async () => {
  try {
    const response = await axiosClient.get('/registrations');
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch registrations';
  }
};

export const registerForEvent = async (userId, eventId) => {
  try {
    const response = await axiosClient.post('/registrations', { 
      user_id: userId, 
      event_id: eventId 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Registration failed';
  }
};

export const cancelRegistration = async (registrationId) => {
  try {
    const response = await axiosClient.delete(`/registrations/${registrationId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to cancel registration';
  }
};

export const getEventRegistrations = async (eventId) => {
  try {
    const response = await axiosClient.get(`/events/${eventId}/registrations`);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch event registrations';
  }
};

export const getMyRegistrations = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axiosClient.get('/registrations/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch your registrations';
  }
};
