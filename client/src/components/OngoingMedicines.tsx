import React, { useEffect, useState } from 'react';
import { Pill, Calendar, User, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface Medicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    startDate: string;
    doctorId: string;
    recordId: string;
}

interface OngoingMedicinesProps {
    subjectProfileId?: string | null;
    targetPatientId?: string; // For Doctor View
    refreshTrigger?: number; // Force refresh
}

const OngoingMedicines: React.FC<OngoingMedicinesProps> = ({ subjectProfileId, targetPatientId, refreshTrigger }) => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMedicines();
    }, [subjectProfileId, targetPatientId, refreshTrigger]); // Refetch on profile change or trigger

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (subjectProfileId) params.subjectProfileId = subjectProfileId;
            if (targetPatientId) params.targetPatientId = targetPatientId;

            const res = await api.get('/records/ongoing', { params });
            setMedicines(res.data);
        } catch (error) {
            console.error("Failed to fetch ongoing medicines", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-4 text-slate-400 text-xs">Loading medications...</div>;

    if (medicines.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Pill className="text-blue-400" size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No Active Medications</h3>
                <p className="text-xs text-slate-500 mt-1">Ongoing prescriptions will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Pill className="text-blue-600" size={16} /> Ongoing Medications
            </h3>

            <div className="grid gap-3">
                {medicines.map((med, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-slate-900">{med.name}</h4>
                                <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                    {med.dosage} • {med.frequency}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-3 border-t border-slate-50 pt-2">
                            <span className="flex items-center gap-1">
                                <Calendar size={10} /> Started: {new Date(med.startDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <User size={10} /> Doc ID: {med.doctorId?.substring(0, 8)}...
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OngoingMedicines;
