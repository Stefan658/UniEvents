import axiosClient from './axiosClient';

export const loginStudent = async (payload) => {
  try {
    const response = await axiosClient.post('/auth/student/google', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Student authentication failed';
  }
};

export const loginOrganizer = async (email, password) => {
  try {
    const response = await axiosClient.post('/auth/organizer/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Organizer login failed';
  }
};

export const loginAdmin = async (email, password) => {
  try {
    const response = await axiosClient.post('/auth/admin/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Admin login failed';
  }
};

export const logoutUser = async () => {
  try {
    await axiosClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
