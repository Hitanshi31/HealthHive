import React from 'react';
import { LogOut, ChevronRight } from 'lucide-react';

interface SidebarProps {
    onLogout: () => void;
    patients: any[];
    selectedPatientId: string | null;
    onSelectPatient: (patient: any) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const DoctorSidebar: React.FC<SidebarProps> = ({ onLogout, patients, selectedPatientId, onSelectPatient, searchQuery, onSearchChange }) => {

    const getCompositeId = (p: any) => `${p.patientId}-${p.subjectProfileId || 'primary'}`;

    return (
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
            <div className="p-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Active Patients</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{patients.length}</span>
                </h2>

                {/* Search Input */}
                <div className="mb-4 relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                </div>

                <nav className="space-y-1">
                    {patients.length === 0 && (
                        <p className="text-xs text-slate-400 italic px-4">No active patients.</p>
                    )}
                    {patients.map(p => {
                        const id = getCompositeId(p);
                        const isSelected = selectedPatientId === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onSelectPatient(p)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${isSelected
                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                        {p.email[0].toUpperCase()}
                                    </div>
                                    <div className="text-left truncate">
                                        <div className="truncate">{p.patientCode || 'Unknown'}</div>
                                    </div>
                                </div>
                                {isSelected && <ChevronRight size={14} />}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto p-6 border-t border-slate-100">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-all text-sm font-bold w-full px-4 py-3 rounded-xl shadow-sm hover:shadow-md border border-blue-100"
                >
                    <LogOut size={18} />
                    Log Out
                </button>
            </div>
        </aside>
    );
};

export default DoctorSidebar;
