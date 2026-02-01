import React, { useEffect, useState } from 'react';
import { User, Phone, Heart, FileText, Lock, Activity, Save, Edit2, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { getProfile, updateProfile } from '../services/profile.service';
import HealthBasicsModal from './HealthBasicsModal';

interface ProfileDashboardProps {
    patientId: string | null;
}

const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ patientId }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showHealthBasics, setShowHealthBasics] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        gender: '',
        // Emergency Contact
        emergencyName: '',
        emergencyPhone: '',
        organDonor: false
    });

    useEffect(() => {
        if (patientId) {
            loadProfile();
        }
    }, [patientId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await getProfile(patientId!);
            setProfile(data);
            setFormData({
                fullName: data.fullName || '',
                phoneNumber: data.phoneNumber || '',
                gender: data.gender || '',
                emergencyName: data.emergencyContact?.name || '',
                emergencyPhone: data.emergencyContact?.phone || '',
                organDonor: data.organDonor || false
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                // gender: formData.gender, // Typically immutable or requires stricter checks, but per requirements allowing edit here if fields are editable
                // Actually requirements said "Personal details... Name, Age, Gender" editable behaviour implies update
                // User schema has gender.
                gender: formData.gender,
                emergencyContact: {
                    name: formData.emergencyName,
                    phone: formData.emergencyPhone
                },
                organDonor: formData.organDonor
            };

            await updateProfile(patientId!, payload);
            setIsEditing(false);
            loadProfile(); // Refresh
            alert('Profile updated successfully!');
        } catch (e) {
            alert('Failed to update profile.');
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading profile...</div>;

    return (
        <div className="animate-fade-in space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="text-blue-600" /> My Profile
                    </h2>
                    <p className="text-slate-500">Manage your personal information and account settings.</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Personal Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2 lg:col-span-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <User size={20} className="text-slate-400" /> Personal Details
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Your Name"
                                    />
                                ) : (
                                    <div className="text-slate-800 font-bold text-lg">{profile.fullName || 'Not set'}</div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date of Birth / Age</label>
                                <div className="text-slate-800 font-medium flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    {profile.healthBasics?.dateOfBirth ? (
                                        <>
                                            {new Date(profile.healthBasics.dateOfBirth).toLocaleDateString()}
                                            <span className="text-slate-400 text-sm">
                                                ({new Date().getFullYear() - new Date(profile.healthBasics.dateOfBirth).getFullYear()} yo)
                                            </span>
                                        </>
                                    ) : 'Not set'}
                                </div>
                                {isEditing && <div className="text-[10px] text-blue-500 mt-1">* Edit in Health Basics</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Gender</label>
                                {isEditing ? (
                                    <select
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <div className="text-slate-800 font-medium">{profile.gender}</div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Phone Number</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="tel"
                                            className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                            value={formData.phoneNumber}
                                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-slate-800 font-medium flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" />
                                        {profile.phoneNumber || 'Not linked'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency Contact Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2 lg:col-span-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Heart size={20} className="text-rose-500" /> Emergency Contact
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Contact Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="w-full p-2.5 bg-rose-50 border border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                                    value={formData.emergencyName}
                                    onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                                    placeholder="e.g. Spouse, Parent"
                                />
                            ) : (
                                <div className="text-slate-800 font-bold">{profile.emergencyContact?.name || 'Not set'}</div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Contact Phone</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    className="w-full p-2.5 bg-rose-50 border border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                                    value={formData.emergencyPhone}
                                    onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                    placeholder="Emergency Number"
                                />
                            ) : (
                                <div className="text-slate-800 font-medium flex items-center gap-2">
                                    <Phone size={16} className="text-rose-400" />
                                    {profile.emergencyContact?.phone || 'Not set'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Emergency Snapshot Preview Card */}
                <div className="bg-slate-50 p-6 rounded-2xl shadow-inner border border-slate-200 md:col-span-2 opacity-90">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Activity size={20} className="text-red-500" /> Emergency Snapshot (Preview)
                        </h3>
                        {/* Real button to open HealthBasicsModal */}
                        <button className="text-blue-600 text-sm font-bold hover:underline" onClick={() => setShowHealthBasics(true)}>
                            Edit Clinical Data
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Blood Group</label>
                            <div className="text-xl font-black text-slate-700">{profile.healthBasics?.bloodGroup || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Allergies</label>
                            <div className="text-sm font-medium text-slate-700">{profile.healthBasics?.allergies || 'None'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Conditions</label>
                            <div className="text-sm font-medium text-slate-700">{profile.healthBasics?.chronicConditions || 'None'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Organ Donor</label>
                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        checked={formData.organDonor}
                                        onChange={e => setFormData({ ...formData, organDonor: e.target.checked })}
                                    />
                                    <span className="text-sm font-bold text-slate-700">Yes, I am a donor</span>
                                </div>
                            ) : (
                                <div className={`text-sm font-bold ${profile.organDonor ? 'text-green-600' : 'text-slate-400'}`}>
                                    {profile.organDonor ? 'Yes' : 'No / Not Set'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Privacy & Account */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <Lock size={20} className="text-slate-400" /> Privacy & Data
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                            <span className="text-slate-500">Data Owner</span>
                            <span className="font-bold text-slate-800">You (Patient)</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                            <span className="text-slate-500">Default Sharing</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                                <ShieldCheck size={14} className="text-green-500" /> Consent Required
                            </span>
                        </div>
                        <div className="flex justify-between text-sm py-2">
                            <span className="text-slate-500">Emergency Access</span>
                            <span className="font-bold text-green-600">Enabled</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-slate-400" /> Account Info
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                            <span className="text-slate-500">Email Linked</span>
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                <Mail size={14} /> {profile.email}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                            <span className="text-slate-500">Patient ID</span>
                            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs select-all">
                                {profile.patientCode || profile._id}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm py-2">
                            <span className="text-slate-500">Member Since</span>
                            <span className="font-medium text-slate-800">
                                {new Date(profile.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
            {
                profile && (
                    <HealthBasicsModal
                        isOpen={showHealthBasics}
                        onClose={() => setShowHealthBasics(false)}
                        initialData={profile.healthBasics}
                        onSaveSuccess={() => {
                            setShowHealthBasics(false);
                            loadProfile();
                        }}
                    />
                )
            }
        </div >
    );
};

export default ProfileDashboard;
