import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FileText, Calendar, Activity, Lock, ArrowRight, ShieldCheck, Users, X, Clock, Pill, ChevronLeft } from 'lucide-react';
import PrescriptionForm from '../components/PrescriptionForm';
import OngoingMedicines from '../components/OngoingMedicines';
import DoctorSidebar from '../components/DoctorSidebar';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [patients, setPatients] = useState<any[]>([]); // New state for active patients
    const [expiredPatients, setExpiredPatients] = useState<any[]>([]); // Expired sessions "ghost cards"
    const [records, setRecords] = useState<any[] | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPrescribeModal, setShowPrescribeModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Navigation simplified - defaulting to patients view
    const activeTab = 'patients';

    const fetchPatients = async () => {
        try {
            const res = await api.get('/consent/doctor-patients');
            const newPatients: any[] = res.data;

            setPatients((prevPatients) => {
                // Calculate diff to find who just expired
                // Key needs to include subjectProfileId
                const getCompositeId = (p: any) => `${p.patientId}-${p.subjectProfileId || 'primary'}`;

                const newIds = new Set(newPatients.map(getCompositeId));
                const newlyExpired = prevPatients.filter(p => !newIds.has(getCompositeId(p)));

                // Always run this to clean up re-active patients even if no one new expired
                setExpiredPatients(prev => {
                    const currentExpiredIds = new Set(prev.map(getCompositeId));
                    // 1. Add newly expired unique ones
                    const uniqueNew = newlyExpired.filter(p => !currentExpiredIds.has(getCompositeId(p)));
                    let updated = [...uniqueNew, ...prev];
                    // 2. Remove anyone who is now active again
                    updated = updated.filter(p => !newIds.has(getCompositeId(p)));
                    return updated;
                });

                return newPatients;
            });

        } catch (err) {
            console.error("Failed to fetch patients", err);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchPatients();
    }, []);

    const handlePatientSelect = async (patient: any) => {
        setSelectedPatient(patient);
        setError('');
        setRecords(null);
        setLoading(true);
        try {
            const params: any = { patientId: patient.patientId };
            if (patient.subjectProfileId) params.subjectProfileId = patient.subjectProfileId;

            const res = await api.get(`/records`, { params });
            setRecords(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Access Denied or Not Found');
            setRecords(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
            <Navbar role="DOCTOR" />

            <div className="flex max-w-7xl mx-auto w-full flex-1">
                {/* 1. LEFT SIDEBAR */}
                <DoctorSidebar
                    onLogout={handleLogout}
                    patients={patients}
                    selectedPatientId={selectedPatient ? `${selectedPatient.patientId}-${selectedPatient.subjectProfileId || 'primary'}` : null}
                    onSelectPatient={(p) => {
                        if (p) handlePatientSelect(p);
                        else setSelectedPatient(null);
                    }}
                />

                {/* 2. RIGHT PANEL CONTENT AREA */}
                <main className="flex-1 p-8 overflow-y-auto w-full">
                    {/* Header Section */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {selectedPatient ? 'Patient Medical Records' : 'Doctor Dashboard'}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-slate-500 font-medium">
                                    {selectedPatient ? `Viewing records for ${selectedPatient.patientCode || 'Unknown'}` : 'Manage your patients and consultations'}
                                </span>
                            </div>
                        </div>


                    </div>

                    {/* View Logic: Patient List vs Patient Details */}
                    {!selectedPatient ? (
                        <div className="animate-fade-in">
                            {/* ACTIVE PATIENTS TAB */}
                            {activeTab === 'patients' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <Users className="text-blue-600" /> Active Patients <span className="text-sm font-normal text-slate-500">({patients.length})</span>
                                        </h2>
                                        <button onClick={fetchPatients} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1">
                                            Refresh List
                                        </button>
                                    </div>

                                    {patients.length === 0 ? (
                                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                            <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                                                <Users className="text-slate-400" size={32} />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-700">No Active Patients</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto mt-1">Share your Doctor ID with patients to get access to their records.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {patients.map((p) => {
                                                const compositeKey = `${p.patientId}-${p.subjectProfileId || 'primary'}`;
                                                return (
                                                    <div
                                                        key={compositeKey}
                                                        onClick={() => handlePatientSelect(p)}
                                                        className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 p-4 opacity-50">
                                                            <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                                                        </div>

                                                        <div className="flex items-center gap-4 mb-4">
                                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                                {p.email[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">{p.patientCode || 'Unknown ID'}</h4>
                                                                <p className="text-xs text-slate-500 font-medium">{p.subjectProfileId ? 'Dependent Profile' : 'Primary Account'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                                                                <ShieldCheck size={10} /> Access Authorized
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-4 truncate">{p.email}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EXPIRED SESSIONS TAB */}
                            {activeTab === 'expired' && (
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                                        <Clock className="text-amber-500" /> Expired Sessions
                                    </h2>
                                    {expiredPatients.length === 0 ? (
                                        <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200 border-dashed">
                                            <p className="text-slate-400">No recently expired sessions.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {expiredPatients.map((p) => (
                                                <div
                                                    key={`expired-${p.patientId}`}
                                                    className="bg-white p-6 rounded-2xl border border-slate-200 grayscale opacity-75 hover:opacity-100 transition-opacity relative group"
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpiredPatients(prev => prev.filter(ep => ep.patientId !== p.patientId));
                                                        }}
                                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Dismiss"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-lg font-bold">
                                                            {p.email[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-600">{p.patientCode || 'Unknown ID'}</h4>
                                                            <p className="text-xs text-slate-400">Session Expired</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-amber-50 border border-amber-100 rounded px-3 py-2 flex items-center gap-2 text-xs font-bold text-amber-600">
                                                        <Lock size={12} />
                                                        Access Revoked
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        // PATIENT DETAILS VIEW
                        <div className="animate-fade-in-up">
                            {/* Back Button */}
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                            >
                                <ChevronLeft size={16} /> Back to Patient List
                            </button>

                            {loading && (
                                <div className="text-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-medium">Securely retrieving patient records...</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 animate-shake mb-6">
                                    <Lock size={20} />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {records && (
                                <div className="space-y-8">
                                    {/* Action Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-6">
                                            {/* AI Summary Banner */}
                                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <Activity size={100} className="text-indigo-600" />
                                                </div>
                                                <div className="relative z-10 flex gap-4">
                                                    <div className="p-3 bg-white rounded-xl shadow-sm h-fit text-indigo-600">
                                                        <Activity size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-indigo-900 mb-1">Clinical Overview</h4>
                                                        <p className="text-indigo-800 text-sm leading-relaxed max-w-xl">
                                                            {records.length > 0
                                                                ? `Analyzed ${records.length} records. Latest update ${new Date(records[0]?.createdAt).toLocaleDateString()}. review specific findings below.`
                                                                : 'No records available for analysis.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Records List */}
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                    <FileText className="text-blue-600" /> Medical History
                                                </h3>
                                                <div className="space-y-4">
                                                    {records.filter(r => r.type !== 'PRESCRIPTION').length === 0 && (
                                                        <p className="text-slate-400 italic text-center py-8 bg-white border border-dashed border-slate-200 rounded-xl">No medical reports found.</p>
                                                    )}
                                                    {records.filter(r => r.type !== 'PRESCRIPTION').map((r) => (
                                                        <div key={r.id || r._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2.5 rounded-lg ${r.type === 'LAB_REPORT' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-slate-900 text-base">
                                                                            <a href={`${api.defaults.baseURL?.replace('/api', '')}${r.fileUrl}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                                                {r.type.replace('_', ' ')}
                                                                            </a>
                                                                        </h4>
                                                                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                                            <Calendar size={12} /> {new Date(r.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${r.trustIndicator === 'GREEN' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                                    {r.trustIndicator === 'GREEN' ? 'Verified' : 'External'}
                                                                </span>
                                                            </div>

                                                            {r.aiStructuredSummary ? (
                                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-sm">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-3">
                                                                        {r.aiStructuredSummary.keyFindings?.map((f: any, i: number) => (
                                                                            <div key={i} className="flex justify-between items-center border-b border-slate-200/60 pb-1 last:border-0">
                                                                                <span className="text-slate-600 font-medium text-xs">{f.name}</span>
                                                                                <span className="font-mono text-blue-700 font-bold text-xs">{f.value}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {r.aiDoctorNote && <p className="text-slate-600 italic border-t border-slate-200 pt-2 mt-1">"{r.aiDoctorNote}"</p>}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                                                                    {r.aiSummary || r.summary || 'No summary available.'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Actions & Meds */}
                                        <div className="space-y-6">
                                            {/* Action Card */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                <h3 className="font-bold text-slate-900 mb-4">Doctor Actions</h3>
                                                <button
                                                    onClick={() => setShowPrescribeModal(true)}
                                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                                                >
                                                    <Pill size={20} /> Write Prescription
                                                </button>
                                                <p className="text-xs text-slate-400 text-center mt-3 px-4">
                                                    Generates a digital prescription with automatic interaction checking.
                                                </p>
                                            </div>

                                            {/* Ongoing Meds */}
                                            <OngoingMedicines
                                                targetPatientId={selectedPatient?.patientId}
                                                subjectProfileId={selectedPatient?.subjectProfileId}
                                                refreshTrigger={refreshKey}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {showPrescribeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <PrescriptionForm
                            patientId={selectedPatient?.patientId}
                            subjectProfileId={selectedPatient?.subjectProfileId}
                            onSuccess={() => {
                                setShowPrescribeModal(false);
                                setRefreshKey(prev => prev + 1);
                                handlePatientSelect(selectedPatient);
                            }}
                            onCancel={() => setShowPrescribeModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
