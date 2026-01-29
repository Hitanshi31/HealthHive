import api from './api';

export const saveVital = async (vital: any) => {
    try {
        const res = await api.post('/vitals', vital);
        return res.data;
    } catch (error) {
        console.error('Error saving vital:', error);
        throw error;
    }
};

export const getVitals = async (patientId: string) => {
    try {
        const res = await api.get(`/vitals/${patientId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching vitals:', error);
        return [];
    }
};
