import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';
import api from '../services/api';

interface HealthBasicsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
}

const HealthBasicsModal: React.FC<HealthBasicsModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
    const [allergies, setAllergies] = useState('');
    const [chronicConditions, setChronicConditions] = useState('');
    const [currentMedications, setMedications] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [dob, setDob] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/user/health-basics', {
                allergies,
                chronicConditions,
                currentMedications,
                bloodGroup,
                dateOfBirth: dob,
                skip: false
            });
            onSaveSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to save. Please try again or skip.');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        try {
            // Tell backend we skipped so we don't prompt again
            await api.put('/user/health-basics', { skip: true });
            onClose();
        } catch (error) {
            console.error(error);
            onClose(); // Close anyway
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <Shield size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Complete Your Profile</h2>
                    <p className="text-blue-100 text-sm mt-1">
                        Critical info for emergencies.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group</label>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={bloodGroup}
                                onChange={(e) => setBloodGroup(e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                            <input
                                type="date"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Allergies (Optional)</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Penicillin, Peanuts"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chronic Conditions (Optional)</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Diabetes, Asthma"
                            value={chronicConditions}
                            onChange={(e) => setChronicConditions(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Medications (Optional)</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Metformin 500mg"
                            value={currentMedications}
                            onChange={(e) => setMedications(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 pt-0 flex flex-col gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? 'Saving...' : 'Save to Profile'}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="w-full py-3 bg-transparent hover:bg-slate-50 text-slate-500 font-semibold rounded-xl transition-all"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HealthBasicsModal;
