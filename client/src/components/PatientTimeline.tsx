import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Record {
    _id: string;
    id?: string;
    type: string;
    createdAt: string;
    source?: string;
    trustIndicator: 'GREEN' | 'YELLOW' | 'RED';
    summary?: string;
    aiSummary?: string;
    prescription?: {
        medicines: any[];
        doctorId: string;
    };
}

interface PatientTimelineProps {
    records: Record[];
}

const PatientTimeline: React.FC<PatientTimelineProps> = ({ records }) => {
    // Sort Newest First
    const sortedRecords = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (sortedRecords.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p>No history yet.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-4">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="text-blue-600" size={20} /> Medical History
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                {sortedRecords.map((r, index) => (
                    <div key={r._id || r.id || index} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm
                            ${r.trustIndicator === 'GREEN' ? 'bg-green-500' : r.trustIndicator === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500'}
                        `}></div>

                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            {/* Record Summary/Content */}
                            <div className="mb-3">
                                {r.type === 'PRESCRIPTION' && r.prescription ? (
                                    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {r.prescription.medicines.map((med: any, i: number) => (
                                                <span key={i} className="inline-flex flex-col bg-white border border-blue-200 px-3 py-1 rounded-md shadow-sm">
                                                    <span className="font-bold text-slate-800 text-sm">{med.name}</span>
                                                    <span className="text-[10px] text-slate-500">{med.dosage} • {med.frequency} • {med.duration}</span>
                                                </span>
                                            ))}
                                        </div>
                                        {r.source && (
                                            <p className="text-xs text-blue-600 font-medium mt-1">Prescribed by: {r.source}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {r.summary || (r.aiSummary ? "AI Summary available" : "No details provided.")}
                                    </p>
                                )}
                            </div>

                            {/* Tags / Metadata */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.type === 'PRESCRIPTION' ? 'bg-purple-100 text-purple-700' :
                                    r.type === 'LAB_REPORT' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {r.type.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-sm text-slate-700 font-medium line-clamp-2">
                                {r.aiSummary || r.summary || "No summary available."}
                            </p>

                            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-50 pt-2">
                                <span className="flex items-center gap-1">
                                    {r.trustIndicator === 'GREEN' ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-amber-500" />}
                                    {r.trustIndicator === 'GREEN' ? 'Verified Source' : 'Uploaded by Patient'}
                                </span>
                                {r.source && (
                                    <>
                                        <span>•</span>
                                        <span>{r.source}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatientTimeline;
