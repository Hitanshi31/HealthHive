import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pill, AlertTriangle, Save } from 'lucide-react';
import api from '../services/api';

interface PrescriptionFormProps {
    patientId: string;
    subjectProfileId?: string | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ patientId, subjectProfileId, onSuccess, onCancel }) => {
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    const [loading, setLoading] = useState(false);
    const [ongoingMeds, setOngoingMeds] = useState<any[]>([]);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    // Fetch ongoing meds for duplicate check
    useEffect(() => {
        const fetchOngoing = async () => {
            try {
                const params: any = { targetPatientId: patientId };
                if (subjectProfileId) params.subjectProfileId = subjectProfileId;
                const res = await api.get('/records/ongoing', { params });
                setOngoingMeds(res.data);
            } catch (e) { console.error(e); }
        };
        fetchOngoing();
    }, [patientId, subjectProfileId]);

    const handleMedChange = (index: number, field: string, value: string) => {
        const newMeds = [...medicines];
        (newMeds[index] as any)[field] = value;
        setMedicines(newMeds);

        // Check Duplicate
        if (field === 'name') {
            const exists = ongoingMeds.some(m => m.name.toLowerCase() === value.toLowerCase());
            if (exists) {
                setDuplicateWarning(`Warning: '${value}' is already an active medication.`);
            } else {
                setDuplicateWarning(null);
            }
        }
    };

    const addRow = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeRow = (index: number) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/records/prescription', {
                patientId,
                subjectProfileId,
                medicines
            });
            alert('Prescription Created!');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to create prescription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                    <Pill size={20} /> Write Prescription
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {duplicateWarning && (
                    <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm flex items-center gap-2 border border-amber-200">
                        <AlertTriangle size={16} /> {duplicateWarning}
                    </div>
                )}

                <div className="space-y-4">
                    {medicines.map((med, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Medicine {idx + 1}</h4>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                                    <input
                                        required
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="e.g. Amoxicillin"
                                        value={med.name}
                                        onChange={e => handleMedChange(idx, 'name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dosage</label>
                                    <input
                                        required
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="e.g. 500mg"
                                        value={med.dosage}
                                        onChange={e => handleMedChange(idx, 'dosage', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Frequency</label>
                                    <input
                                        required
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="e.g. Twice daily"
                                        value={med.frequency}
                                        onChange={e => handleMedChange(idx, 'frequency', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration</label>
                                    <input
                                        required
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="e.g. 7 days"
                                        value={med.duration}
                                        onChange={e => handleMedChange(idx, 'duration', e.target.value)}
                                    />
                                </div>
                            </div>

                            {medicines.length > 1 && (
                                <button type="button" onClick={() => removeRow(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button type="button" onClick={addRow} className="flex-1 py-3 border border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex justify-center items-center gap-2">
                        <Plus size={16} /> Add Medicine
                    </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2">
                        {loading ? 'Saving...' : <><Save size={18} /> Save Prescription</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PrescriptionForm;
