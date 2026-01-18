import React, { useEffect, useState } from 'react';
import api, { getUserId } from '../services/api';
import Navbar from '../components/Navbar';
import { Shield, FileText, Activity, Users, AlertTriangle, QrCode, ClipboardCheck, Trash2, CheckCircle2, AlertCircle, Plus, ChevronRight, Clock } from 'lucide-react';

const PatientDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('records');
    const [records, setRecords] = useState<any[]>([]);
    const [consents, setConsents] = useState<any[]>([]);
    const [newDoctorId, setNewDoctorId] = useState('');
    const [userId] = useState(getUserId());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRecords();
        fetchConsents();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await api.get('/records');
            setRecords(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchConsents = async () => {
        try {
            const res = await api.get('/consent');
            setConsents(res.data);
        } catch (e) { console.error(e); }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate upload delay
        setTimeout(async () => {
            await api.post('/records', {
                type: 'LAB_REPORT',
                summary: 'Complete Blood Count (CBC) - AI Note: Hemoglobin levels 13.5 g/dL (Normal). White blood cell count slightly elevated.',
                source: 'Metropolis Labs',
                isComplete: true
            });
            await fetchRecords();
            setLoading(false);
        }, 1000);
    };

    const handleGrantConsent = async () => {
        try {
            await api.post('/consent', {
                doctorId: newDoctorId,
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
            setNewDoctorId('');
            fetchConsents();
            alert('Consent Granted');
        } catch (e) { alert('Failed to grant consent. Check Doctor ID.'); }
    };

    const handleRevoke = async (id: string) => {
        if (confirm('Are you sure you want to revoke access immediately?')) {
            await api.put(`/consent/${id}/revoke`);
            fetchConsents();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Navbar role="PATIENT" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all">

                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Health Dashboard</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-mono text-slate-500 flex items-center gap-2 shadow-sm">
                                <span className="font-bold">ID:</span> {userId}
                            </div>
                            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                            </span>
                        </div>
                    </div>

                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                        {['records', 'consent', 'emergency'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab
                                        ? (tab === 'emergency' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200')
                                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                                    }`}
                            >
                                {tab === 'records' && <FileText size={18} />}
                                {tab === 'consent' && <Shield size={18} />}
                                {tab === 'emergency' && <Activity size={18} />}
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">

                    {activeTab === 'records' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Main Records grid */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <ClipboardCheck className="text-blue-600" /> Recent Medical Records
                                    </h2>
                                    <div className="text-sm text-slate-500">
                                        Showing {records.length} records
                                    </div>
                                </div>

                                {records.length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                        <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                                            <FileText className="text-slate-400" size={32} />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-700">No records found</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto mt-1">Upload your first medical report to start building your secure health history.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    {records.map(r => (
                                        <div key={r.id} className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 relative overflow-hidden">
                                            {/* Trust Badge Top Right */}
                                            <div className="absolute top-0 right-0 p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5
                                            ${r.trustIndicator === 'GREEN' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        r.trustIndicator === 'YELLOW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {r.trustIndicator === 'GREEN' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                                    {r.trustIndicator === 'GREEN' ? 'Verified' : r.trustIndicator === 'YELLOW' ? 'Old Data' : 'Incomplete'}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg flex-shrink-0 ${r.type === 'LAB_REPORT' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1 pr-20">
                                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {r.type.replace('_', ' ')}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span>{r.source || 'Uploaded by Patient'}</span>
                                                    </div>

                                                    {/* AI Summary Box */}
                                                    <div className="mt-4 bg-blue-50/50 border-l-4 border-blue-500 rounded-r-lg p-3">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">AI Summary</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 leading-relaxed">{r.summary}</p>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 italic">
                                                        <AlertTriangle size={10} />
                                                        AI insights are for informational purposes only.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="font-bold text-slate-900 mb-1">Add New Record</h3>
                                    <p className="text-sm text-slate-500 mb-4">Securely upload lab reports or prescriptions.</p>

                                    <button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</span>
                                        ) : (
                                            <><Plus size={20} /> Upload File</>
                                        )}
                                    </button>
                                    <p className="text-xs text-center text-slate-400 mt-3">Supports PDF, JPG, PNG (Max 10MB)</p>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
                                    <h4 className="font-bold text-indigo-900 mb-2">Did you know?</h4>
                                    <p className="text-sm text-indigo-700 leading-relaxed">
                                        You can grant temporary access to specialists directly from the "Data Access" tab. No need to carry physical files.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'consent' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="grid md:grid-cols-3 gap-8">
                                {/* Grant Form */}
                                <div className="md:col-span-1">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-2">Grant Access</h3>
                                        <p className="text-sm text-slate-500 mb-6">Allow a doctor to view your records for 7 days.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Doctor ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. DOC-123456"
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono"
                                                    value={newDoctorId}
                                                    onChange={(e) => setNewDoctorId(e.target.value)}
                                                />
                                            </div>
                                            <button onClick={handleGrantConsent} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                                                <CheckCircle2 size={18} /> Grant Access
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Consents List */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                        <h3 className="font-bold text-slate-800 text-lg">Active Permissions</h3>
                                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{consents.filter(c => c.status === 'ACTIVE').length} Active</span>
                                    </div>

                                    {consents.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <Shield size={32} className="mb-2 opacity-50" />
                                            <p>No doctors currently have access.</p>
                                        </div>
                                    )}

                                    {consents.map(c => (
                                        <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center group hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">Doctor ID: {c.doctorId}</p>
                                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">
                                                        {c.status === 'ACTIVE' ? (
                                                            <span className="text-green-600">Expires: {new Date(c.validUntil).toLocaleDateString()}</span>
                                                        ) : (
                                                            <span className="text-slate-400">Expired / Revoked</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {c.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleRevoke(c.id)}
                                                    className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 size={14} /> Revoke
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'emergency' && (
                        <div className="max-w-2xl mx-auto py-8">
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                                <div className="bg-red-600 p-8 text-center text-white">
                                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                                        <Activity size={32} />
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight">Emergency Access</h2>
                                    <p className="text-red-100 mt-2 max-w-md mx-auto">
                                        Use this QR code to provide paramedics with immediate, read-only access to your critical health data (Blood Type, Allergies).
                                    </p>
                                </div>

                                <div className="p-10 flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-2xl shadow-inner border-4 border-slate-100">
                                        {/* Mock QR */}
                                        <QrCode size={200} className="text-slate-900" />
                                    </div>

                                    <div className="mt-8 text-center space-y-4 w-full">
                                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <Shield size={12} /> Secure • Logged • Time-Limited
                                        </div>

                                        <a
                                            href={`http://localhost:5173/emergency/EMERGENCY-TOKEN-${userId?.substring(0, 8)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block w-full max-w-sm mx-auto py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                        >
                                            <ChevronRight size={18} /> Simulate Scan
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default PatientDashboard;
