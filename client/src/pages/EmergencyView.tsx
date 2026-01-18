import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, Clock, Activity, Heart, ShieldAlert, Droplets, Pill } from 'lucide-react';

const EmergencyView: React.FC = () => {
    const { qrToken } = useParams();
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/api/emergency/${qrToken}`);
                setData(res.data);
            } catch (err) {
                setError('Invalid or Expired Token');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [qrToken]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="uppercase tracking-widest font-bold text-sm">Accessing Secured Network...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                <p className="text-slate-500">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-red-200">

            {/* Emergency Header */}
            <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold uppercase tracking-wider leading-none">Emergency Profile</h1>
                            <span className="text-[10px] opacity-80 font-mono">ID: {data.patientId.substring(0, 8).toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-500 shadow-inner">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        LIVE READ-ONLY ACCESS
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-6">

                {/* Vital Stats Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                        <h2 className="font-bold flex items-center gap-2">
                            <Activity size={20} className="text-red-500" /> Vital Statistics
                        </h2>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Patient Email</p>
                            <p className="font-mono text-sm">{data.patient?.email}</p>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Blood Type</p>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-600 rounded-2xl font-black text-2xl border-2 border-red-100 shadow-sm relative overflow-hidden">
                                <Droplets size={48} className="absolute opacity-10 -bottom-2 -right-2" />
                                {data.bloodGroup || 'UNK'}
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-3 bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center text-sm text-slate-600">
                            <p>
                                <strong>NOTE:</strong> Ensure definitive blood typing before transfusion. This data is patient-provided.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Clinical Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Allergies */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <AlertTriangle size={80} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                <AlertTriangle size={16} />
                            </div>
                            Known Allergies
                        </h3>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                            <p className="font-medium text-amber-900 text-lg">
                                {data.allergies || 'No Known Allergies'}
                            </p>
                        </div>
                    </div>

                    {/* Conditions */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Heart size={80} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Heart size={16} />
                            </div>
                            Chronic Conditions
                        </h3>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <p className="font-medium text-blue-900 text-lg">
                                {data.chronicConditions || 'None Reported'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Active Medications List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Pill size={16} />
                        </div>
                        Active Medications
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <p className="text-slate-700 font-mono text-sm leading-relaxed whitespace-pre-line">
                            {data.activeMedications || 'No active medications listed.'}
                        </p>
                    </div>
                </div>

            </main>

            <footer className="text-center p-8 text-slate-400 text-xs">
                <p className="flex items-center justify-center gap-2 font-mono">
                    <Clock size={12} />
                    ACCESS LOGGED • EXPIRES {new Date(data.expiresAt).toLocaleTimeString()}
                </p>
            </footer>
        </div>
    );
};

export default EmergencyView;
