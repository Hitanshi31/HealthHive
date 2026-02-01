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

export const getVitals = async (patientId: string, subjectProfileId?: string | null) => {
    try {
        const params: any = {};
        if (subjectProfileId) params.subjectProfileId = subjectProfileId;

        const res = await api.get(`/vitals/${patientId}`, { params });
        return res.data;
    } catch (error) {
        console.error('Error fetching vitals:', error);
        return [];
    }
};
