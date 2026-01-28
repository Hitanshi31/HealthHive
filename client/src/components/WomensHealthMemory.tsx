import React, { useState, useEffect } from 'react';
import { Calendar, Baby, Lock, ChevronRight, Droplets, ArrowLeft, ShieldAlert } from 'lucide-react';
import api from '../services/api';

interface WomensHealthProps {
    userData: any;
    onClose: () => void;
}

type View = 'HOME' | 'MENSTRUAL' | 'PREGNANCY' | 'PRIVACY';

const WomensHealthMemory: React.FC<WomensHealthProps> = ({ userData, onClose }) => {
    const [view, setView] = useState<View>('HOME');
    const [loading, setLoading] = useState(false);

    // Local State initialized from props
    const [periodLog, setPeriodLog] = useState<any[]>(userData?.womensHealth?.periodLog || []);
    const [isPregnant, setIsPregnant] = useState(userData?.womensHealth?.isPregnant || false);
    const [pregnancyDetails, setPregnancyDetails] = useState<any>(userData?.womensHealth?.pregnancyDetails || {
        weeksPregnant: '',
        lastUltrasoundDate: '',
        checklist: [],
        pastPregnancies: []
    });
    // conditions state removed
    const [privacy, setPrivacy] = useState(userData?.womensHealth?.privacy || {
        shareWithEmergency: false,
        shareWithDoctor: false
    });

    // Menstrual Log Form State
    const [periodForm, setPeriodForm] = useState({
        startDate: '',
        endDate: '',
        flowIntensity: 'Medium',
        painLevel: 'None',
        notes: ''
    });

    const handleSaveAPI = async (payload: any) => {
        setLoading(true);
        try {
            await api.put('/user/womens-health', { ...payload, subjectProfileId: userData.subjectProfileId });
            // In a real app app we might want to refresh parent data, but for now we assume local optimisitc updates are enough or next load will fix
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save changes.");
        } finally {
            setLoading(false);
        }
    };

    const renderHome = () => (
        <div className="space-y-6 animate-fade-in">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Women's Health Timeline</h2>
                <p className="text-slate-500 text-sm">Private reproductive health memory.</p>
            </header>

            <div className="grid gap-4">
                <MenuCard
                    title="Menstrual History"
                    icon={<Droplets className="text-rose-500" />}
                    onClick={() => setView('MENSTRUAL')}
                    color="bg-rose-50 border-rose-100 hover:border-rose-300"
                />
                <MenuCard
                    title="Pregnancy History"
                    icon={<Baby className="text-purple-500" />}
                    onClick={() => setView('PREGNANCY')}
                    color="bg-purple-50 border-purple-100 hover:border-purple-300"
                />
                <MenuCard
                    title="Privacy Settings"
                    icon={<Lock className="text-slate-500" />}
                    onClick={() => setView('PRIVACY')}
                    color="bg-slate-50 border-slate-100 hover:border-slate-300"
                />
            </div>
        </div>
    );

    const renderMenstrual = () => (
        <div className="animate-slide-in-right space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
                <h3 className="font-bold text-lg text-rose-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} /> Log Last Period
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full p-3 bg-rose-50 rounded-lg border-none focus:ring-2 focus:ring-rose-200"
                            value={periodForm.startDate}
                            onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full p-3 bg-rose-50 rounded-lg border-none focus:ring-2 focus:ring-rose-200"
                            value={periodForm.endDate}
                            onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 mb-2">Flow Intensity</label>
                    <div className="flex bg-rose-50 p-1 rounded-lg">
                        {['Light', 'Medium', 'Heavy'].map(opt => (
                            <button
                                key={opt}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${periodForm.flowIntensity === opt ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                                onClick={() => setPeriodForm({ ...periodForm, flowIntensity: opt })}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 mb-2">Pain Level</label>
                    <div className="flex bg-rose-50 p-1 rounded-lg">
                        {['None', 'Mild', 'Severe'].map(opt => (
                            <button
                                key={opt}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${periodForm.painLevel === opt ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                                onClick={() => setPeriodForm({ ...periodForm, painLevel: opt })}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Notes (Optional)</label>
                    <textarea
                        className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-300"
                        rows={3}
                        placeholder="Symptoms, mood, etc..."
                        value={periodForm.notes}
                        onChange={e => setPeriodForm({ ...periodForm, notes: e.target.value })}
                    ></textarea>
                </div>

                <button
                    onClick={async () => {
                        const newEntry = { ...periodForm, startDate: new Date(periodForm.startDate), endDate: periodForm.endDate ? new Date(periodForm.endDate) : undefined };
                        const updatedLog = [newEntry, ...periodLog];
                        setPeriodLog(updatedLog); // Optimistic
                        await handleSaveAPI({ periodLog: updatedLog });
                        alert("Period entry saved.");
                    }}
                    disabled={!periodForm.startDate || loading}
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Entry'}
                </button>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Stored as memory only. No predictions.
                </p>
            </div>
        </div>
    );

    const renderPregnancy = () => (
        <div className="animate-slide-in-right space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-purple-900">Currently Pregnant?</h3>
                    <div className="flex bg-purple-50 p-1 rounded-lg">
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${isPregnant ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400'}`}
                            onClick={() => setIsPregnant(true)}
                        >Yes</button>
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${!isPregnant ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}
                            onClick={() => setIsPregnant(false)}
                        >No</button>
                    </div>
                </div>

                {isPregnant && (
                    <div className="space-y-4 mb-6 animation-expand">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Weeks Pregnant</label>
                            <input
                                type="number"
                                className="w-full p-3 bg-purple-50 rounded-lg border-none focus:ring-2 focus:ring-purple-200"
                                value={pregnancyDetails.weeksPregnant}
                                onChange={e => setPregnancyDetails({ ...pregnancyDetails, weeksPregnant: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Last Ultrasound Date</label>
                            <input
                                type="date"
                                className="w-full p-3 bg-purple-50 rounded-lg border-none focus:ring-2 focus:ring-purple-200"
                                value={pregnancyDetails.lastUltrasoundDate ? new Date(pregnancyDetails.lastUltrasoundDate).toISOString().split('T')[0] : ''}
                                onChange={e => setPregnancyDetails({ ...pregnancyDetails, lastUltrasoundDate: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                <div className="border-t border-purple-100 pt-6">
                    <h4 className="font-bold text-sm text-slate-700 mb-3">Past Pregnancies</h4>
                    {pregnancyDetails.pastPregnancies?.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm p-3 bg-purple-50 rounded-lg mb-2">
                            <span className="font-bold text-purple-900">{p.year}</span>
                            <span className="text-purple-700">{p.outcome}</span>
                        </div>
                    ))}

                    <button
                        onClick={() => {
                            const year = prompt("Enter Year:");
                            const outcome = prompt("Outcome (Normal Delivery, C-section, Miscarriage, Abortion):");
                            if (year && outcome) {
                                const newPast = [...(pregnancyDetails.pastPregnancies || []), { year: parseInt(year), outcome }];
                                setPregnancyDetails({ ...pregnancyDetails, pastPregnancies: newPast });
                            }
                        }}
                        className="text-sm font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 mt-2"
                    >
                        <PlusIcon /> Add Past Entry
                    </button>
                </div>

                <button
                    onClick={async () => {
                        await handleSaveAPI({
                            isPregnant,
                            pregnancyDetails: {
                                ...pregnancyDetails,
                                weeksPregnant: parseInt(pregnancyDetails.weeksPregnant)
                            }
                        });
                        alert("Pregnancy details saved.");
                    }}
                    disabled={loading}
                    className="w-full mt-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );



    const renderPrivacy = () => (
        <div className="animate-slide-in-right space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                    <ShieldAlert className="text-slate-500" /> Privacy Controls
                </h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Women's health data is encrypted and hidden by default. Only you can see it unless you explicitly turn on sharing below.
                </p>

                <div className="space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800">Include in Emergency Snapshot</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                If enabled, paramedics can see "Currently Pregnant" via the Emergency QR code.
                            </p>
                        </div>
                        <Switch
                            checked={privacy.shareWithEmergency}
                            onChange={() => setPrivacy({ ...privacy, shareWithEmergency: !privacy.shareWithEmergency })}
                        />
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800">Allow Doctor View</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                If enabled, doctors with active consent can view this section in their dashboard.
                            </p>
                        </div>
                        <Switch
                            checked={privacy.shareWithDoctor}
                            onChange={() => setPrivacy({ ...privacy, shareWithDoctor: !privacy.shareWithDoctor })}
                        />
                    </div>
                </div>

                <div className="mt-8 bg-slate-50 p-4 rounded-xl text-xs text-slate-500 flex gap-2">
                    <Lock size={16} />
                    Data is stored encrypted. Toggle these settings anytime to revoke access instantly.
                </div>

                <button
                    onClick={async () => {
                        await handleSaveAPI({ privacy });
                        alert("Privacy settings updated.");
                    }}
                    disabled={loading}
                    className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    {loading ? 'Updating...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (view) {
            case 'MENSTRUAL': return renderMenstrual();
            case 'PREGNANCY': return renderPregnancy();
            case 'PRIVACY': return renderPrivacy();
            default: return renderHome();
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans">
            {/* Top Bar */}
            <div className="bg-white p-4 sticky top-0 z-10 border-b border-slate-200 flex items-center justify-between">
                <button
                    onClick={() => view === 'HOME' ? onClose() : setView('HOME')}
                    className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900"
                >
                    <ArrowLeft size={20} />
                    {view === 'HOME' ? 'Back to Vault' : 'Home'}
                </button>
                {view !== 'HOME' && <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{view}</span>}
            </div>

            <div className="max-w-xl mx-auto p-4 pt-6">
                {renderContent()}
            </div>
        </div>
    );
};

// UI Helpers
const MenuCard = ({ title, icon, onClick, color }: any) => (
    <div
        onClick={onClick}
        className={`p-5 rounded-xl border cursor-pointer transition-all active:scale-95 flex items-center justify-between ${color} bg-white`}
    >
        <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm">
                {icon}
            </div>
            <span className="font-bold text-slate-800 text-lg">{title}</span>
        </div>
        <ChevronRight className="text-slate-400" />
    </div>
);

const PlusIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

const Switch = ({ checked, onChange }: any) => (
    <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-green-500' : 'bg-slate-300'}`}
    >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${checked ? 'left-7' : 'left-1'}`}></div>
    </button>
);

export default WomensHealthMemory;
