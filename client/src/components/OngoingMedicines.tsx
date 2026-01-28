import React, { useEffect, useState } from 'react';
import { Pill, Calendar, User, Trash2 } from 'lucide-react';
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
    const [medicines, setMedicines] = useState<{ active: Medicine[], past: Medicine[] }>({ active: [], past: [] });
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
            // Handle legacy array response just in case, though backend is updated
            if (Array.isArray(res.data)) {
                setMedicines({ active: res.data, past: [] });
            } else {
                setMedicines(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch ongoing medicines", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (med: Medicine) => {
        if (confirm(`Are you sure you want to remove ${med.name}?`)) {
            try {
                // Determine ID to delete: recordId (if exists) or fallback
                const idToDelete = med.recordId;
                console.log("[Delete] Attempting to delete medicine:", med.name, "ID:", idToDelete);

                if (!idToDelete) {
                    console.error("[Delete] Missing Record ID for medicine:", med);
                    alert('Cannot delete this item: Missing Record ID');
                    return;
                }

                await api.delete(`/records/${idToDelete}`);
                console.log("[Delete] Success for ID:", idToDelete);

                // Optimistic Update
                setMedicines(prev => ({
                    active: prev.active.filter(m => m.recordId !== idToDelete),
                    past: prev.past.filter(m => m.recordId !== idToDelete)
                }));
            } catch (error) {
                console.error("Delete failed", error);
                alert("Failed to delete medication");
            }
        }
    };

    if (loading) return <div className="text-center py-4 text-slate-400 text-xs">Loading medications...</div>;

    if (medicines.active.length === 0 && medicines.past.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Pill className="text-blue-400" size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No Medications</h3>
                <p className="text-xs text-slate-500 mt-1">Prescriptions will appear here.</p>
            </div>
        );
    }

    const renderMedCard = (med: Medicine, isPast = false) => (
        <div key={`${med.recordId}-${med.name}-${med.dosage}`} className={`bg-white rounded-xl p-4 border shadow-sm relative overflow-hidden group transition-all ${isPast ? 'border-slate-200 opacity-75 grayscale' : 'border-blue-100 hover:border-blue-300'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${isPast ? 'bg-slate-300' : 'bg-blue-500'}`}></div>

            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className={`font-bold ${isPast ? 'text-slate-600' : 'text-slate-900'} ${isPast ? 'line-through decoration-slate-400' : ''}`}>{med.name}</h4>
                    {(med as any).isFile ? (
                        <a
                            href={`http://localhost:3000/${(med as any).filePath}`} // Adjust if needed
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-blue-600 hover:underline mt-1 block"
                        >
                            View Document ↗
                        </a>
                    ) : (
                        <p className={`text-xs font-medium px-2 py-0.5 rounded-md inline-block mt-1 ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                            {med.dosage} • {med.frequency}
                        </p>
                    )}
                </div>
                <div className="flex items-start gap-2">
                    {isPast && <span className="text-[10px] font-bold text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">Past</span>}
                    <button
                        onClick={() => handleDelete(med)}
                        className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Delete Medication"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-3 border-t border-slate-50 pt-2">
                <span className="flex items-center gap-1">
                    <Calendar size={10} /> Started: {new Date(med.startDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                    <User size={10} /> {(med as any).isFile ? 'Source: Upload' : `Doc ID: ${med.doctorId?.substring(0, 8)}...`}
                </span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Active Medications */}
            {medicines.active.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Pill className="text-blue-600" size={16} /> Ongoing Medications
                    </h3>
                    <div className="grid gap-3">
                        {medicines.active.map(m => renderMedCard(m, false))}
                    </div>
                </div>
            )}

            {/* Past Medications */}
            {medicines.past.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <Pill className="text-slate-400" size={16} /> Past Medications
                    </h3>
                    <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity">
                        {medicines.past.map(m => renderMedCard(m, true))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OngoingMedicines;
