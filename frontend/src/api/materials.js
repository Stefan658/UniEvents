import axiosClient from './axiosClient';

export const getEventMaterials = async (eventId) => {
  try {
    const response = await axiosClient.get(`/events/${eventId}/materials`);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch event materials';
  }
};

export const uploadMaterial = async (payload) => {
  try {
    const response = await axiosClient.post('/materials', payload);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to upload material';
  }
};

export const deleteMaterial = async (id) => {
  try {
    await axiosClient.delete(`/materials/${id}`);
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete material';
  }
};
