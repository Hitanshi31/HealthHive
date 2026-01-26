
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import RiskAlerts from '../components/RiskAlerts';
import CriticalSummaryCard from '../components/CriticalSummaryCard';

const EmergencyView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [snapshot, setSnapshot] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSnapshot = async () => {
            try {
                // Use configured api instance
                const res = await api.get(`/emergency/view/${token}`);
                setSnapshot(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load emergency data. Link may be expired.');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchSnapshot();
    }, [token]);

    if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Critical Data...</div>;
    if (error) return <div className="p-10 text-center font-bold text-red-600 border-2 border-red-600 rounded m-10 bg-red-50">{error}</div>;
    if (!snapshot) return null;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Disclaimer Bar */}
            <div className="bg-red-600 text-white text-center py-2 font-bold uppercase tracking-wider text-sm sticky top-0 z-50">
                ⚠️ Emergency Medical Snapshot (Read-Only) • Generated {new Date(snapshot.createdAt).toLocaleTimeString()}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* 1. Risk Alerts */}
                <RiskAlerts risks={snapshot.riskFlags} />

                {/* 2. Critical Summary */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 uppercase tracking-wide">Vital Information</h3>
                <CriticalSummaryCard summary={snapshot.criticalSummary} />

                {/* 3. Recent Reports & History */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide border-b pb-2">Recent Medical History</h3>

                    {snapshot.recentReports && snapshot.recentReports.length > 0 ? (
                        <div className="space-y-6">
                            {snapshot.recentReports.map((report: any, idx: number) => (
                                <div key={idx} className="border-l-4 border-blue-200 pl-4 py-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-lg text-blue-900">{report.title}</h4>
                                        <span className="text-sm text-gray-500">{new Date(report.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-700">{report.summary}</p>

                                    {/* AI Highlights if any */}
                                    {report.criticalHighlights && report.criticalHighlights.length > 0 && (
                                        <div className="mt-2 bg-yellow-50 p-2 rounded text-sm text-yellow-800 border border-yellow-200">
                                            <strong>Key Findings:</strong>
                                            <ul className="list-disc list-inside ml-2 mt-1">
                                                {report.criticalHighlights.map((highlight: string, hIdx: number) => (
                                                    <li key={hIdx}>{highlight}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No recent reports found in this snapshot.</p>
                    )}
                </div>

                {/* Footer / Meta */}
                <div className="mt-10 text-center text-gray-400 text-xs">
                    <p>Snapshot ID: {snapshot._id}</p>
                    <p>Expires: {new Date(snapshot.expiresAt).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default EmergencyView;
