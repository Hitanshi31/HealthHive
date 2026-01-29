import api from './api';

export const getProfile = async (patientId: string) => {
    try {
        const res = await api.get(`/profile/${patientId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

export const updateProfile = async (patientId: string, profileData: any) => {
    try {
        const res = await api.put(`/profile/${patientId}`, profileData);
        return res.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};
