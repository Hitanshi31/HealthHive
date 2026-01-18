import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
};

export const getUserRole = (): 'PATIENT' | 'DOCTOR' | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded: any = jwtDecode(token);
        return decoded.role;
    } catch {
        return null;
    }
};

export const getUserId = (): string | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded: any = jwtDecode(token);
        return decoded.userId;
    } catch {
        return null;
    }
};

export default api;
