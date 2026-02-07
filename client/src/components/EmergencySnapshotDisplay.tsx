import React from 'react';
import RiskAlerts from './RiskAlerts';
import CriticalSummaryCard from './CriticalSummaryCard';
import { Phone, Activity } from 'lucide-react';


interface EmergencySnapshotDisplayProps {
    snapshot: any;
}

const EmergencySnapshotDisplay: React.FC<EmergencySnapshotDisplayProps> = ({ snapshot }) => {
    if (!snapshot) return null;

    return (
        <div className="bg-gray-100 min-h-screen pb-10">
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

                {/* 2.1 Emergency Contact & Latest Vitals */}
                <div className="grid md:grid-cols-2 gap-6 mb-8 mt-6">
                    {/* Emergency Contact */}
                    {snapshot.criticalSummary.emergencyContact && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm">
                            <h4 className="flex items-center gap-2 text-red-800 font-bold mb-3 uppercase text-sm tracking-wider">
                                <Phone size={18} /> Emergency Contact
                            </h4>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{snapshot.criticalSummary.emergencyContact.name}</p>
                                <a href={`tel:${snapshot.criticalSummary.emergencyContact.phone}`} className="text-lg text-blue-600 font-mono font-bold hover:underline block mt-1">
                                    {snapshot.criticalSummary.emergencyContact.phone}
                                </a>
                                {snapshot.criticalSummary.emergencyContact.relation && (
                                    <p className="text-sm text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-wide">{snapshot.criticalSummary.emergencyContact.relation}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Latest Vitals */}
                    {snapshot.vitals && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                            <h4 className="flex items-center gap-2 text-blue-800 font-bold mb-3 uppercase text-sm tracking-wider">
                                <Activity size={18} /> Latest Vitals
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {snapshot.vitals.heartRate && (
                                    <div>
                                        <span className="text-xs text-blue-500 font-bold uppercase">Heart Rate</span>
                                        <p className="text-2xl font-mono text-slate-900 font-bold flex items-baseline gap-1">
                                            {snapshot.vitals.heartRate} <span className="text-sm text-slate-400 font-sans font-normal">bpm</span>
                                        </p>
                                    </div>
                                )}
                                {snapshot.vitals.spo2 && (
                                    <div>
                                        <span className="text-xs text-blue-500 font-bold uppercase">SpO₂</span>
                                        <p className="text-2xl font-mono text-slate-900 font-bold flex items-baseline gap-1">
                                            {snapshot.vitals.spo2} <span className="text-sm text-slate-400 font-sans font-normal">%</span>
                                        </p>
                                    </div>
                                )}
                                {snapshot.vitals.bp && (
                                    <div>
                                        <span className="text-xs text-blue-500 font-bold uppercase">Blood Pressure</span>
                                        <p className="text-xl font-mono text-slate-900 font-bold flex items-baseline gap-1">
                                            {snapshot.vitals.bp} <span className="text-sm text-slate-400 font-sans font-normal">mmHg</span>
                                        </p>
                                    </div>
                                )}
                                {snapshot.vitals.recordedAt && (
                                    <div className="col-span-2 mt-2 pt-2 border-t border-blue-100">
                                        <p className="text-[10px] text-blue-400 font-medium">
                                            Recorded: {new Date(snapshot.vitals.recordedAt).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2.5 Women's Health (Conditional) */}
                {snapshot.womensHealth && (snapshot.womensHealth.isPregnant || (snapshot.womensHealth.conditions && snapshot.womensHealth.conditions.length > 0)) && (
                    <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-8 mt-6 rounded shadow-sm">
                        <h3 className="text-lg font-bold text-pink-900 mb-2 flex items-center gap-2">
                            ⚠️ Reproductive Health Alerts
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {snapshot.womensHealth.isPregnant && (
                                <div className="bg-white p-3 rounded border border-pink-200">
                                    <span className="block text-xs font-bold text-pink-500 uppercase">Status</span>
                                    <span className="font-bold text-pink-900 text-lg">PATIENT IS PREGNANT</span>
                                </div>
                            )}
                            {snapshot.womensHealth.conditions && snapshot.womensHealth.conditions.length > 0 && (
                                <div className="bg-white p-3 rounded border border-pink-200">
                                    <span className="block text-xs font-bold text-pink-500 uppercase">Conditions</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {snapshot.womensHealth.conditions.map((c: string) => (
                                            <span key={c} className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-sm font-bold">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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

export default EmergencySnapshotDisplay;
