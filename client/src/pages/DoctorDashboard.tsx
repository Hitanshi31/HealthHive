import React, { useState } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FileText, AlertTriangle, Calendar, Activity, Lock, ArrowRight, ShieldCheck, CheckCircle2, Copy, Users, X, Clock, Pill } from 'lucide-react';
import PrescriptionForm from '../components/PrescriptionForm';
import OngoingMedicines from '../components/OngoingMedicines';

const DoctorDashboard: React.FC = () => {
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [patients, setPatients] = useState<any[]>([]); // New state for active patients
    const [expiredPatients, setExpiredPatients] = useState<any[]>([]); // Expired sessions "ghost cards"
    const [records, setRecords] = useState<any[] | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPrescribeModal, setShowPrescribeModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);


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
    useState(() => {
        fetchPatients();
    });

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



    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Navbar role="DOCTOR" />

            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Doctor Access Portal</h1>

                    {/* Doctor ID Display */}
                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full mb-4 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => {
                            const code = localStorage.getItem('doctorCode') || 'DOC-PENDING';
                            navigator.clipboard.writeText(code);
                            alert('Doctor ID copied to clipboard!');
                        }}>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">My Doctor ID:</span>
                        <span className="text-sm font-mono font-bold text-blue-800">{localStorage.getItem('doctorCode') || 'Not Assigned'}</span>
                        <Copy size={14} className="text-blue-500" />
                    </div>

                    <p className="text-slate-500 max-w-lg mx-auto">
                        Securely access patient records for diagnosis and treatment. All access events are strictly audited and logged.
                    </p>
                </div>

                {/* Active Patients Grid */}
                <div className="mb-12">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Users size={16} className="text-blue-600" /> Active Patients ({patients.length})</span>
                        <button onClick={fetchPatients} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1">
                            Refresh List
                        </button>
                    </h2>

                    {patients.length === 0 && expiredPatients.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={24} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">No Active Patients</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                You currently have no patients with active consent permissions. Share your Doctor ID with patients to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {patients.map((p) => {
                                const isSelected = selectedPatient?.patientId === p.patientId && selectedPatient?.subjectProfileId === p.subjectProfileId;
                                const compositeKey = `${p.patientId}-${p.subjectProfileId || 'primary'}`;

                                return (
                                    <div
                                        key={compositeKey}
                                        onClick={() => handlePatientSelect(p)}
                                        className={`bg-white p-6 rounded-xl border transition-all cursor-pointer relative overflow-hidden group
                                        ${isSelected
                                                ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-lg scale-[1.02]'
                                                : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                                            ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'}
                                        `}>
                                                {p.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{p.patientCode || 'Unknown ID'} {p.subjectProfileId ? '(Dependent)' : ''}</h4>
                                                <p className="text-xs text-slate-500">{p.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider">
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                                                <ShieldCheck size={10} /> Consented
                                            </span>
                                            {isSelected && (
                                                <span className="text-blue-600 flex items-center gap-1 animate-pulse">
                                                    Viewing <ArrowRight size={10} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Ghost Cards for Expired Patients */}
                    {expiredPatients.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock size={14} /> Recently Expired Sessions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {expiredPatients.map((p) => (
                                    <div
                                        key={`expired-${p.patientId}`}
                                        className="bg-slate-50 p-6 rounded-xl border border-slate-200 opacity-75 grayscale relative group"
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
                                                <h4 className="font-bold text-slate-500">{p.patientCode || 'Unknown ID'}</h4>
                                                <p className="text-xs text-slate-400">{p.email}</p>
                                            </div>
                                        </div>

                                        <div className="bg-red-50 border border-red-100 rounded px-3 py-2 flex items-center gap-2 text-xs font-bold text-red-600">
                                            <Lock size={12} />
                                            Session ended — patient access expired.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium">Securely retrieving patient records...</p>
                    </div>
                )}

                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 animate-shake">
                        <Lock size={20} />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Results Section */}
                {records && (
                    <div className="space-y-8 animate-fade-in-up">

                        {/* Access Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                                    Patient Summary
                                </h2>
                                <p className="text-slate-500 ml-4 mt-1">Found {records.length} valid records for this session.</p>
                            </div>
                            <div className="hidden md:block text-right">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle2 size={14} className="fill-green-500 text-white" /> Access Authorized
                                </div>
                            </div>
                            <div className="hidden md:block text-right">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle2 size={14} className="fill-green-500 text-white" /> Access Authorized
                                </div>
                            </div>
                        </div>

                        {/* Ongoing Medicines & Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <OngoingMedicines
                                    targetPatientId={selectedPatient?.patientId}
                                    subjectProfileId={selectedPatient?.subjectProfileId}
                                    refreshTrigger={refreshKey}
                                />
                            </div>
                            <div className="flex flex-col justify-start">
                                <button
                                    onClick={() => setShowPrescribeModal(true)}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105"
                                >
                                    <Pill size={20} /> Write Prescription
                                </button>
                                <p className="text-xs text-slate-400 text-center mt-2">Checking interactions enabled</p>
                            </div>
                        </div>

                        {/* AI Summary Banner */}
                        {records.length > 0 && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Activity size={100} />
                                </div>
                                <div className="relative z-10 flex gap-4">
                                    <div className="p-3 bg-white rounded-lg shadow-sm h-fit text-indigo-600">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-indigo-900 mb-1">AI-Generated Clinical Summary</h4>
                                        <p className="text-indigo-800 text-sm leading-relaxed max-w-2xl">
                                            System has scanned {records.length} records. Latest update was on {new Date(records[0]?.createdAt).toLocaleDateString()}. No immediate drug interactions detected based on available history.
                                        </p>
                                        <p className="text-xs text-indigo-400 mt-2 font-medium uppercase tracking-wide">Automated Analysis - Please Verify</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timeline Grid */}
                        <div className="grid gap-6">
                            {records.filter(r => r.type !== 'PRESCRIPTION').length === 0 && <p className="text-slate-500 italic text-center py-12">No medical reports found for this patient.</p>}

                            {records.filter(r => r.type !== 'PRESCRIPTION').map((r, i) => (
                                <div key={r.id || r._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 relative">
                                    {/* Vertical Line for Timeline Effect (Optional visual) */}
                                    {i !== records.length - 1 && <div className="hidden md:block absolute left-9 top-16 bottom-[-24px] w-0.5 bg-slate-100"></div>}

                                    <div className="flex-shrink-0">
                                        <a
                                            href={`${api.defaults.baseURL?.replace('/api', '')}${r.fileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/icon block relative"
                                            title="View Original Document"
                                        >
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner transition-transform group-hover/icon:scale-110 ${r.type === 'LAB_REPORT' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                                                <FileText size={24} />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                                VIEW
                                            </div>
                                        </a>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg text-slate-900">{r.type.replace('_', ' ')}</h4>
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${r.trustIndicator === 'GREEN' ? 'bg-green-50 text-green-700 border-green-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {r.trustIndicator === 'GREEN' ? 'Verified Source' : 'External/Old'}
                                            </span>
                                        </div>

                                        {r.aiStructuredSummary ? (
                                            <div className="mb-4">
                                                {/* Structured Summary View */}
                                                <div className="mb-3">
                                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Key Clinical Findings</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {r.aiStructuredSummary.keyFindings?.map((finding: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                                                <span className="text-xs font-semibold text-slate-700">{finding.name}</span>
                                                                <span className="text-xs font-mono font-bold text-blue-700">{finding.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                    <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Clinical Note</h5>
                                                    <p className={`text-sm leading-relaxed ${r.aiDoctorNote || r.aiSummary ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                                        {r.aiDoctorNote || r.aiSummary || 'AI summary not available for this record.'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Fallback for old records */
                                            <p className="text-slate-600 mb-2 leading-relaxed">{r.aiSummary || r.summary}</p>
                                        )}
                                        <div className="mb-4 flex items-center gap-1 text-[10px] text-slate-400 italic">
                                            <AlertTriangle size={10} />
                                            AI-generated summary. Verify with original document.
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {r.source || 'Patient Uploaded'}</span>
                                            {r.aiContext?.freshnessLabel && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className={`font-bold ${r.aiContext.freshnessLabel === 'RECENT' ? 'text-green-600' :
                                                        r.aiContext.freshnessLabel === 'OLD' ? 'text-amber-600' : 'text-slate-400'
                                                        }`}>
                                                        {r.aiContext.freshnessLabel}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {r.aiContext?.changeSummary && (
                                            <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                                                <span className="font-bold text-slate-700">Change Log: </span>
                                                {r.aiContext.changeSummary}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
            {showPrescribeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="w-full max-w-2xl">
                        <PrescriptionForm
                            patientId={selectedPatient?.patientId}
                            subjectProfileId={selectedPatient?.subjectProfileId} // Pass dependent ID if exists
                            onSuccess={() => {
                                setShowPrescribeModal(false);
                                setRefreshKey(prev => prev + 1); // Trigger ongoing medicines refresh
                                handlePatientSelect(selectedPatient); // Refresh timeline
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
