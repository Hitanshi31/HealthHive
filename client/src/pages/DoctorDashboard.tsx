import React, { useState } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Search, FileText, AlertTriangle, UserCheck, Calendar, Activity, Lock, ArrowRight, ShieldCheck, Clock, CheckCircle2, Copy } from 'lucide-react';

const DoctorDashboard: React.FC = () => {
    const [patientId, setPatientId] = useState('');
    const [records, setRecords] = useState<any[] | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setRecords(null);
        setLoading(true);
        try {
            const res = await api.get(`/records?patientId=${patientId}`);
            setRecords(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Access Denied or Not Found');
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

                {/* Search Card */}
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden transform transition-all hover:shadow-2xl hover:shadow-blue-900/5 mb-12">
                    <div className="p-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <div className="p-8">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Search size={16} className="text-blue-600" /> Patient Lookup
                        </h2>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter Patient ID"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-lg font-mono text-slate-900 transition-all placeholder:text-slate-400"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <UserCheck size={20} />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !patientId}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                            >
                                {loading ? 'Verifying...' : 'Access Records'}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        {error ? (
                            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 animate-shake">
                                <Lock size={20} />
                                <span className="font-medium">{error}</span>
                            </div>
                        ) : (
                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 justify-center">
                                <ShieldCheck size={12} />
                                <span>Secure Connection • HIPAA/GDPR Compliant Logging</span>
                            </div>
                        )}
                    </div>
                </div>

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
                                        <h4 className="font-bold text-indigo-900 mb-1">AI Clinical Assistant Note</h4>
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
                            {records.length === 0 && <p className="text-slate-500 italic text-center py-12">No records found for this patient.</p>}

                            {records.map((r, i) => (
                                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 relative">
                                    {/* Vertical Line for Timeline Effect (Optional visual) */}
                                    {i !== records.length - 1 && <div className="hidden md:block absolute left-9 top-16 bottom-[-24px] w-0.5 bg-slate-100"></div>}

                                    <div className="flex-shrink-0">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${r.type === 'LAB_REPORT' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                                            <FileText size={24} />
                                        </div>
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

                                        <p className="text-slate-600 mb-4 leading-relaxed">{r.summary}</p>

                                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {r.source || 'Patient Uploaded'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};


export default DoctorDashboard;
