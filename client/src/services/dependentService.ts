import api from './api';

export interface HealthBasics {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
}

export interface Dependent {
    id: string;
    name: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female' | 'Other';
    relationship: string;
    patientCode?: string;
    healthBasics: HealthBasics;
    womensHealth?: any; // Using any for simplicity as it mirrors the User's inner structure
}

export const createDependent = async (dependent: Omit<Dependent, 'id'>) => {
    const response = await api.post('/dependents', dependent);
    return response.data;
};

export const listDependents = async (): Promise<Dependent[]> => {
    const response = await api.get('/dependents');
    return response.data;
};

export const updateDependent = async (id: string, updates: Partial<Dependent>) => {
    const response = await api.put(`/dependents/${id}`, updates);
    return response.data;
};

export const deleteDependent = async (id: string) => {
    const response = await api.delete(`/dependents/${id}`);
    return response.data;
};
