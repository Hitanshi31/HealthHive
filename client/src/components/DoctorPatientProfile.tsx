import React, { useEffect, useState } from 'react';
import { Activity, X, User, Phone, Calendar, Heart, AlertCircle, Droplet, Pill, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface DoctorPatientProfileProps {
    patientId: string; // This can be the User ID or the Dependent ID
    onClose: () => void;
}

const DoctorPatientProfile: React.FC<DoctorPatientProfileProps> = ({ patientId, onClose }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Uses the unified profile endpoint which handles both Primary Users and Dependents based on ID
                const res = await api.get(`/profile/${patientId}`);
                setProfile(res.data);
            } catch (err: any) {
                console.error("Failed to fetch profile", err);
                setError(err.response?.data?.message || 'Failed to load patient profile.');
            } finally {
                setLoading(false);
            }
        };

        if (patientId) {
            fetchProfile();
        }
    }, [patientId]);

    if (!patientId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full text-white backdrop-blur-md">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Clinical Profile</h2>
                            <p className="text-blue-100 text-sm">Patient Health Basics & Emergency Data</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-slate-500 font-medium">Retrieving clinical data...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center bg-red-50 rounded-xl border border-red-100">
                            <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                            <p className="text-red-700 font-bold">{error}</p>
                            <button onClick={onClose} className="mt-4 text-sm text-red-600 hover:underline">Close</button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in-up">

                            {/* 1. Personal Identity */}
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User size={14} /> Personal Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold block mb-1">Full Name</label>
                                        <p className="text-base font-bold text-slate-900">{profile.fullName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold block mb-1">Gender</label>
                                        <p className="text-base font-bold text-slate-900">{profile.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold block mb-1">Date of Birth</label>
                                        <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            {profile.healthBasics?.dateOfBirth ? (
                                                <>
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(profile.healthBasics.dateOfBirth).toLocaleDateString()}
                                                    <span className="text-xs font-normal text-slate-500">
                                                        ({new Date().getFullYear() - new Date(profile.healthBasics.dateOfBirth).getFullYear()} yrs)
                                                    </span>
                                                </>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold block mb-1">Contact Phone</label>
                                        <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            {profile.phoneNumber ? <><Phone size={14} className="text-slate-400" /> {profile.phoneNumber}</> : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Clinical Basics */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <Activity size={16} className="text-blue-600" /> Clinical Data
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Blood Group */}
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
                                        <div className="bg-white p-2.5 rounded-full text-red-500 shadow-sm">
                                            <Droplet size={20} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-red-400 font-bold uppercase block">Blood Group</label>
                                            <p className="text-xl font-extrabold text-red-700">{profile.healthBasics?.bloodGroup || '--'}</p>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-4">
                                        <div className="bg-white p-2.5 rounded-full text-rose-500 shadow-sm">
                                            <Heart size={20} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-rose-400 font-bold uppercase block">Emergency Contact</label>
                                            <p className="text-sm font-bold text-rose-800">{profile.emergencyContact?.name || 'Not set'}</p>
                                            <p className="text-xs text-rose-600">{profile.emergencyContact?.phone || ''}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    {/* Allergies */}
                                    <div className="md:col-span-1 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle size={16} className="text-amber-600" />
                                            <label className="text-xs text-amber-600 font-bold uppercase">Allergies</label>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 leading-snug">
                                            {profile.healthBasics?.allergies || <span className="text-slate-400 italic">None listed</span>}
                                        </p>
                                    </div>

                                    {/* Conditions */}
                                    <div className="md:col-span-1 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity size={16} className="text-blue-600" />
                                            <label className="text-xs text-blue-600 font-bold uppercase">Conditions</label>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 leading-snug">
                                            {profile.healthBasics?.chronicConditions || <span className="text-slate-400 italic">None listed</span>}
                                        </p>
                                    </div>

                                    {/* Medications */}
                                    <div className="md:col-span-1 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Pill size={16} className="text-emerald-600" />
                                            <label className="text-xs text-emerald-600 font-bold uppercase">Medications</label>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 leading-snug">
                                            {profile.healthBasics?.currentMedications || <span className="text-slate-400 italic">None listed</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Women's Health (Conditional - Only show if pregnant) */}
                            {profile.womensHealth && profile.womensHealth.isPregnant && (
                                <div className="bg-pink-50 p-5 rounded-xl border border-pink-100">
                                    <h3 className="text-sm font-bold text-pink-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Activity size={14} /> Women's Health
                                        <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200 ml-auto">
                                            Patient Consented
                                        </span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Pregnancy Status */}
                                        <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm">
                                            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Pregnancy Status</label>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
                                                <span className="font-bold text-pink-600">Pregnant</span>
                                                {profile.womensHealth.pregnancyDetails?.weeksPregnant && (
                                                    <span className="text-sm text-slate-500 font-medium">
                                                        ({profile.womensHealth.pregnancyDetails.weeksPregnant} weeks)
                                                    </span>
                                                )}
                                            </div>
                                            {profile.womensHealth.pregnancyDetails?.dueDate && (
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Due Date: <span className="font-bold">{new Date(profile.womensHealth.pregnancyDetails.dueDate).toLocaleDateString()}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Cycle & Conditions */}
                                        <div className="space-y-4">
                                            {/* Last Period */}
                                            {profile.womensHealth.pregnancyDetails?.lastPeriodDate && (
                                                <div>
                                                    <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Last Period</label>
                                                    <p className="font-bold text-slate-800">
                                                        {new Date(profile.womensHealth.pregnancyDetails.lastPeriodDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Conditions */}
                                            {profile.womensHealth.conditions && profile.womensHealth.conditions.length > 0 && (
                                                <div>
                                                    <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Conditions</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {profile.womensHealth.conditions.map((c: string, i: number) => (
                                                            <span key={i} className="text-xs bg-white border border-pink-200 text-pink-700 px-2 py-1 rounded font-medium">
                                                                {c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-100 transition-all"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorPatientProfile;
