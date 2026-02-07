
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import EmergencySnapshotDisplay from '../components/EmergencySnapshotDisplay';

const EmergencyView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [snapshot, setSnapshot] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSnapshot = async () => {
            try {
                // Use configured api instance
                const res = await api.get(`/emergency/view/${token}`);
                setSnapshot(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load emergency data. Link may be expired.');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchSnapshot();
    }, [token]);

    if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Critical Data...</div>;
    if (error) return <div className="p-10 text-center font-bold text-red-600 border-2 border-red-600 rounded m-10 bg-red-50">{error}</div>;
    if (!snapshot) return null;

    return <EmergencySnapshotDisplay snapshot={snapshot} />;
};

export default EmergencyView;
