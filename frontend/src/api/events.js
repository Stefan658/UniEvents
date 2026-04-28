import axiosClient from './axiosClient';

export const getAllEvents = async () => {
  try {
    const response = await axiosClient.get('/events');
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch events';
  }
};

export const getEventById = async (id) => {
  try {
    const response = await axiosClient.get(`/events/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch event details';
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await axiosClient.post('/events', eventData);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to create event';
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    const response = await axiosClient.put(`/events/${id}`, eventData);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to update event';
  }
};

export const deleteEvent = async (id) => {
  try {
    await axiosClient.delete(`/events/${id}`);
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete event';
  }
};
