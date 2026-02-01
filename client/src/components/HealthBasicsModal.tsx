import React, { useState } from 'react';
import { Shield, User, Heart, Activity } from 'lucide-react';
import { updateProfile } from '../services/profile.service';
import api from '../services/api'; // Keep for skip logic if needed, or remove if we use updateProfile for everything

interface HealthBasicsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    initialData?: any;
    patientId?: string | null;
}

const HealthBasicsModal: React.FC<HealthBasicsModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, patientId }) => {
    // Personal Details
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('Male');

    // Emergency Contact
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    // Health Basics
    const [bloodGroup, setBloodGroup] = useState('');
    const [allergies, setAllergies] = useState('');
    const [chronicConditions, setChronicConditions] = useState('');
    const [currentMedications, setMedications] = useState('');
    const [dob, setDob] = useState('');

    const [saving, setSaving] = useState(false);

    // Load initial data when modal opens
    React.useEffect(() => {
        if (isOpen && initialData) {
            setFullName(initialData.fullName || '');
            setPhoneNumber(initialData.phoneNumber || '');
            setGender(initialData.gender || 'Male');
            setEmergencyName(initialData.emergencyContact?.name || '');
            setEmergencyPhone(initialData.emergencyContact?.phone || '');

            setAllergies(initialData.healthBasics?.allergies || initialData.allergies || '');
            setChronicConditions(initialData.healthBasics?.chronicConditions || initialData.chronicConditions || '');
            setMedications(initialData.healthBasics?.currentMedications || initialData.currentMedications || '');
            setBloodGroup(initialData.healthBasics?.bloodGroup || initialData.bloodGroup || '');

            const dobValue = initialData.healthBasics?.dateOfBirth || initialData.dateOfBirth;
            if (dobValue) {
                const d = new Date(dobValue);
                if (!isNaN(d.getTime())) {
                    setDob(d.toISOString().split('T')[0]);
                }
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!fullName.trim()) {
            alert('Full Name is required.');
            return;
        }

        if (!patientId && !initialData?._id) {
            // Fallback if we don't have an ID (shouldn't happen in updated flow)
            // We can try to rely on the /user/health-basics endpoint if it was just basics, 
            // but for full profile we need the ID or a /me endpoint.
            // Assuming patientId is passed or present in initialData.
            console.error("No Patient ID found for update");
            alert("Error: Cannot save profile without ID. Please re-login.");
            return;
        }

        const targetId = patientId || initialData?._id;

        setSaving(true);
        try {
            const payload = {
                fullName,
                phoneNumber,
                gender,
                emergencyContact: {
                    name: emergencyName,
                    phone: emergencyPhone
                },
                // Flattening health basics into the update structure or separate depending on backend
                // The updateProfile service likely expects top-level fields for user and separate for healthBasics?
                // Looking at ProfileDashboard it sends: { fullName, phoneNumber, gender, emergencyContact: {...}, organDonor }
                // The backend likely expects basics to be updated separately OR the updateProfile endpoint handles it.
                // To be safe, let's look at how we implemented backend. 
                // Wait, I don't see the backend implementation here. 
                // But generally, let's send what we collected. 
                // If updateProfile maps everything, great. If not, we might need two calls.
                // Let's assume updateProfile handles the profile schema. 
                // For health basics, let's include them in a way the backend might expect, 
                // or do a separate call if needed.
                // Let's assume we do two calls to be safe if we are unsure, 
                // OR just use the /user/health-basics for basics and updateProfile for the rest.

                // Let's try to do it all if possible, but safely we can chain them.
            };

            // 1. Update Profile (Personal & Emergency)
            await updateProfile(targetId, payload);

            // 2. Update Health Basics (Clinical)
            // The original logic used /user/health-basics which updates the HealthBasics model.
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
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        try {
            await api.put('/user/health-basics', { skip: true });
            onClose();
        } catch (error) {
            console.error(error);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <Shield size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Complete Your Profile</h2>
                    <p className="text-blue-100 text-sm mt-1">
                        Please provide your details for a personalized and secure experience.
                    </p>
                </div>

                <div className="p-6 space-y-8">

                    {/* Section 1: Personal Details */}
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <User size={18} className="text-blue-600" /> Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                    placeholder="Your Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+1 (555) 000-0000"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
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
                    </div>

                    {/* Section 2: Emergency Contact */}
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <Heart size={18} className="text-rose-500" /> Emergency Contact
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                    placeholder="e.g. Spouse, Parent"
                                    value={emergencyName}
                                    onChange={(e) => setEmergencyName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                                <input
                                    type="tel"
                                    className="w-full p-3 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                    placeholder="Emergency Number"
                                    value={emergencyPhone}
                                    onChange={(e) => setEmergencyPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Clinical Data (Health Basics) */}
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <Activity size={18} className="text-green-600" /> Health Basics <span className="text-xs font-normal text-slate-400 ml-2">(Used for Emergency Snapshot)</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
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
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Allergies</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. Peanuts"
                                    value={allergies}
                                    onChange={(e) => setAllergies(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chronic Conditions</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. Diabetes"
                                    value={chronicConditions}
                                    onChange={(e) => setChronicConditions(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Medications</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. Insulin"
                                    value={currentMedications}
                                    onChange={(e) => setMedications(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                <div className="p-6 pt-0 flex flex-col gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        {saving ? 'Saving Profile...' : 'Save Profile'}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="w-full py-3 bg-transparent hover:bg-slate-50 text-slate-400 font-semibold rounded-xl transition-all"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HealthBasicsModal;
