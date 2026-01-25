import React, { useState } from 'react';
import { createDependent } from '../services/dependentService';
import { X, UserPlus, Calendar, User, Heart } from 'lucide-react';

interface AddFamilyMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
    const [relationship, setRelationship] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createDependent({
                name,
                dateOfBirth: dob,
                gender,
                relationship,
                healthBasics: {
                    allergies: [],
                    chronicConditions: [],
                    currentMedications: []
                }
            });
            onSuccess();
            onClose();
            // Reset form
            setName('');
            setDob('');
            setRelationship('');
        } catch (error) {
            console.error(error);
            alert('Failed to add family member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all scale-100">
                <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserPlus size={24} /> Add Family Member
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    required
                                    value={dob}
                                    onChange={e => setDob(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Gender</label>
                            <select
                                value={gender}
                                onChange={e => setGender(e.target.value as any)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Relationship</label>
                        <div className="relative">
                            <Heart className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                required
                                value={relationship}
                                onChange={e => setRelationship(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="e.g. Child, Spouse, Parent"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Family Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFamilyMemberModal;
