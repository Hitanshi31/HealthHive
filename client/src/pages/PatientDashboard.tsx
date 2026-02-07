import React, { useEffect, useState } from 'react';
import api from '../services/api';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Shield, FileText, Activity, Users, AlertTriangle, QrCode as QrIcon, ClipboardCheck, Trash2, CheckCircle2, AlertCircle, Plus, ChevronRight, Timer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import HealthBasicsModal from '../components/HealthBasicsModal';
import PatientTimeline from '../components/PatientTimeline';
import OngoingMedicines from '../components/OngoingMedicines';
import { type Profile } from '../components/ProfileSwitcher';
import AddFamilyMemberModal from '../components/AddFamilyMemberModal';
import { listDependents, deleteDependent } from '../services/dependentService';
import WomensHealthMemory from '../components/WomensHealthMemory';
import VitalsDashboard from '../components/VitalsDashboard';
import ProfileDashboard from '../components/ProfileDashboard';
import EmergencySnapshotDisplay from '../components/EmergencySnapshotDisplay';
import DashboardSidebar from '../components/DashboardSidebar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

import { useNavigate, useSearchParams } from 'react-router-dom';

const PatientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Default to 'records' as the main view, or use param
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'records');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);
    const [duration, setDuration] = useState('7d');
    const [records, setRecords] = useState<any[]>([]);
    const [consents, setConsents] = useState<any[]>([]);
    const [dependents, setDependents] = useState<any[]>([]);
    const [newDoctorId, setNewDoctorId] = useState('');
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [qrExpires, setQrExpires] = useState<string | null>(null);
    const [offlineSnapshot, setOfflineSnapshot] = useState<any>(null);
    const [showOfflineSnapshot, setShowOfflineSnapshot] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [loading, setLoading] = useState(false);
    const [showBasicsModal, setShowBasicsModal] = useState(false);

    // Upload Flow State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const [userData, setUserData] = useState<any>(null);

    const [mainUserId, setMainUserId] = useState<string | null>(null);

    // Refresh Triggers
    const [medsRefreshTrigger, setMedsRefreshTrigger] = useState(0);

    // Family Profile State
    const [profiles, setProfiles] = useState<Profile[]>([{ id: null, name: 'Me', relationship: 'Primary' }]);
    const [selectedProfile, setSelectedProfile] = useState<Profile>({ id: null, name: 'Me', relationship: 'Primary' });
    const [showAddMember, setShowAddMember] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenBasicsPrompt');
        if (hasSeen === 'false') {
            setShowBasicsModal(true);
        }

        // Extract User ID
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const uid = JSON.parse(atob(token.split('.')[1])).userId;
                setMainUserId(uid);
            }
        } catch (e) { }

        fetchProfiles();
        fetchBasicUserData();
    }, []);

    const fetchBasicUserData = async () => {
        try {
            // Fetch self to get women's health data status
            if (!mainUserId) {
                const token = localStorage.getItem('token');
                if (token) {
                    const userId = JSON.parse(atob(token.split('.')[1])).userId;
                    const res = await api.get(`/user/${userId}/health-basics`);
                    setUserData(res.data);
                }
            } else {
                const res = await api.get(`/user/${mainUserId}/health-basics`);
                setUserData(res.data);
            }
        } catch (e) { console.error(e); }
    };

    const handleBasicsSaved = () => {
        setShowBasicsModal(false);
        localStorage.setItem('hasSeenBasicsPrompt', 'true');
    };

    useEffect(() => {
        if (activeTab === 'emergency' && !qrToken) {
            generateEmergencyQR();
        }
    }, [activeTab]);

    const generateEmergencyQR = async () => {
        try {
            const res = await api.post('/emergency/generate', {
                subjectProfileId: selectedProfile.id
            });
            const { token, expiresAt } = res.data;
            setQrToken(token);
            setQrExpires(expiresAt);

            // Cache for offline usage
            try {
                // We use the token to fetch the full snapshot content immediately
                // This ensures we have the data locally
                const snapshotRes = await api.get(`/emergency/view/${token}`);
                const snapshotData = snapshotRes.data;
                const cacheData = { token, expiresAt, snapshot: snapshotData };

                localStorage.setItem('offlineEmergencyData', JSON.stringify(cacheData));
                setOfflineSnapshot(cacheData);
            } catch (err) {
                console.error("Failed to cache snapshot for offline use", err);
            }

        } catch (e) {
            console.error("Failed to generate QR", e);
        }
    };

    // Offline & Cache Management
    useEffect(() => {
        const checkOnlineStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener('online', checkOnlineStatus);
        window.addEventListener('offline', checkOnlineStatus);

        // Load cached snapshot if valid
        const cached = localStorage.getItem('offlineEmergencyData');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (new Date(parsed.expiresAt) > new Date()) {
                    setOfflineSnapshot(parsed);
                    // Also restore QR if valid and we don't have one 
                    if (!qrToken) {
                        setQrToken(parsed.token);
                        setQrExpires(parsed.expiresAt);
                    }
                } else {
                    localStorage.removeItem('offlineEmergencyData');
                }
            } catch (e) { localStorage.removeItem('offlineEmergencyData'); }
        }

        return () => {
            window.removeEventListener('online', checkOnlineStatus);
            window.removeEventListener('offline', checkOnlineStatus);
        };
    }, []);

    useEffect(() => {
        fetchRecords();
        fetchConsents();
        setQrToken(null);
        if (activeTab === 'emergency') {
            generateEmergencyQR();
        }
    }, [selectedProfile]);

    const fetchProfiles = async () => {
        try {
            const deps = await listDependents();
            const family: Profile[] = deps.map(d => ({
                id: d.id,
                name: d.name,
                relationship: d.relationship,
                gender: d.gender,
                patientCode: d.patientCode
            }));
            const meProfile: Profile = {
                id: null,
                name: 'Me',
                relationship: 'Primary',
                gender: userData?.gender
            };
            setProfiles([meProfile, ...family]);
            setDependents(deps);
        } catch (e) {
            console.error("Failed to fetch dependents", e);
        }
    };

    const fetchRecords = async () => {
        try {
            const params: any = {};
            if (selectedProfile.id) params.subjectProfileId = selectedProfile.id;

            const res = await api.get('/records', { params });
            setRecords(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchConsents = async () => {
        try {
            const res = await api.get('/consent');
            const filtered = res.data.filter((c: any) => {
                if (selectedProfile.id) return c.subjectProfileId === selectedProfile.id;
                return !c.subjectProfileId; // Primary
            });
            // Sort by latest granted (validFrom descending)
            const sorted = filtered.sort((a: any, b: any) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime());
            setConsents(sorted);
        } catch (e) { console.error(e); }
    }

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadFile(e.target.files[0]);
        setShowUploadModal(true);
        // Reset input so same file can be selected again if cancelled
        e.target.value = '';
    };

    const confirmUpload = async (type: string) => {
        if (!uploadFile) return;

        setShowUploadModal(false);
        setLoading(true);

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('type', type);
        formData.append('isComplete', 'true'); // Treat as complete for now

        try {
            if (selectedProfile.id) {
                formData.append('subjectProfileId', selectedProfile.id);
            }

            await api.post('/records', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchRecords();

            if (type === 'PRESCRIPTION') {
                setMedsRefreshTrigger(prev => prev + 1); // Trigger Refresh
                if (selectedProfile.id === null) {
                    fetchBasicUserData();
                }
            }

            alert('Upload Successful!');
        } catch (error) {
            console.error(error);
            alert('Upload failed. Please try again.');
        } finally {
            setLoading(false);
            setUploadFile(null);
        }
    };

    const handleGrantConsent = async () => {
        try {
            let expiry = new Date();
            switch (duration) {
                case '15m': expiry.setMinutes(expiry.getMinutes() + 15); break;
                case '1h': expiry.setHours(expiry.getHours() + 1); break;
                case '24h': expiry.setHours(expiry.getHours() + 24); break;
                default: expiry.setDate(expiry.getDate() + 7);
            }

            await api.post('/consent', {
                doctorId: newDoctorId,
                validUntil: expiry,
                subjectProfileId: selectedProfile.id || undefined
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

    const handleDeleteProfile = async (profile: Profile) => {
        if (!profile.id) return; // Cannot delete 'Me'
        try {
            await deleteDependent(profile.id);
            // If deleted profile was selected, switch to Me
            if (selectedProfile.id === profile.id) {
                setSelectedProfile(profiles[0]); // Me
            }
            fetchProfiles(); // Refresh list
            alert('Family member removed.');
        } catch (error: any) {
            console.error("Failed to delete profile", error);
            const msg = error.response?.data?.error || error.message || "Unknown error";
            alert(`Failed to delete profile: ${msg}`);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            await axios.delete(`http://localhost:3000/api/records/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchRecords();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleRetryAI = async (id: string) => {
        try {
            // Optimistic update
            const newRecords = records.map(r =>
                (r._id === id || r.id === id) ? { ...r, aiStatus: 'PENDING' } : r
            );
            setRecords(newRecords);

            await axios.post(`http://localhost:3000/api/records/${id}/retry`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTimeout(fetchRecords, 2000);
        } catch (error) {
            console.error('Retry failed:', error);
            alert("Failed to start retry process. Please try again.");
            fetchRecords(); // Revert state
        }
    };



    // Determine Gender for Women's Health Visibility
    const isFemale = React.useMemo(() => {
        let gender = 'Other';
        if (selectedProfile.id === null) gender = userData?.gender;
        else gender = selectedProfile.gender || 'Other';
        return gender === 'Female';
    }, [userData, selectedProfile]);

    const [onboardingTargetId, setOnboardingTargetId] = useState<string | null>(null);
    const [onboardingInitialData, setOnboardingInitialData] = useState<any>(null);

    const handleFamilyMemberAdded = async (newDependent?: any) => {
        await fetchProfiles();
        if (newDependent) {
            // Switch to new profile
            const newProfile: Profile = {
                id: newDependent.id,
                name: newDependent.name,
                relationship: newDependent.relationship,
                gender: newDependent.gender,
                patientCode: newDependent.patientCode
            };
            setSelectedProfile(newProfile);

            // Trigger Onboarding
            setOnboardingTargetId(newDependent.id);
            setOnboardingInitialData({
                fullName: newDependent.name,
                gender: newDependent.gender,
                dateOfBirth: newDependent.dateOfBirth,
                // Pass empty fields to ensure controlled inputs if needed
                emergencyContact: {},
                healthBasics: {}
            });
            setShowBasicsModal(true);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
            <Navbar
                role="PATIENT"
                profiles={profiles}
                currentProfile={selectedProfile}
                onSelectProfile={setSelectedProfile}
                onAddFamilyMember={() => setShowAddMember(true)}
                onDeleteProfile={handleDeleteProfile}
            />

            <div className="flex max-w-7xl mx-auto w-full flex-1">
                {/* 1. LEFT SIDEBAR */}
                <DashboardSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={handleLogout}
                    showWomensHealth={isFemale}
                />

                {/* 2. RIGHT PANEL CONTENT AREA */}
                <main className="flex-1 p-8 overflow-y-auto">

                    {/* Header Section (Profile Switcher & Title moved here) */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                {/* Profile Switcher Moved to Navbar */}
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {activeTab === 'overview' ? 'Dashboard Overview' :
                                    activeTab === 'records' ? 'My Medical Records' :
                                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-slate-500 font-medium">Welcome back, {selectedProfile.name}</span>
                            </div>
                        </div>


                    </div>





                    {/* TAB CONTENT RENDER */}
                    <div className="animate-fade-in">



                        {/* 2. RECORDS (EXISTING VIEW REFACTORED) */}
                        {activeTab === 'records' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Main Records grid */}
                                <div className="lg:col-span-8 space-y-6">


                                    {/* Ongoing Medicines Section */}
                                    <OngoingMedicines subjectProfileId={selectedProfile.id} refreshTrigger={medsRefreshTrigger} />

                                    {/* Lab Reports Header */}
                                    <div className="flex items-center justify-between mt-8 mb-4">
                                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <FileText className="text-blue-600" /> Lab Reports
                                        </h2>
                                        <div className="text-sm text-slate-500">
                                            Showing {records.filter(r => r.type !== 'PRESCRIPTION' && r.type !== 'INSURANCE').length} reports
                                        </div>
                                    </div>

                                    {/* Records List (Existing Logic) */}
                                    {records.filter(r => r.type !== 'PRESCRIPTION' && r.type !== 'INSURANCE').length === 0 && (
                                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                            <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                                                <FileText className="text-slate-400" size={32} />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-700">No records found</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto mt-1">Upload your first medical report to start building your secure health history.</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-4">
                                        {records.filter(r => r.type !== 'PRESCRIPTION' && r.type !== 'INSURANCE').map(r => (
                                            <div key={r.id || r._id} className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 relative overflow-hidden">
                                                {/* Trust Badge */}
                                                <div className="absolute top-0 right-0 p-4">
                                                    <Badge variant={r.trustIndicator === 'GREEN' ? 'success' : r.trustIndicator === 'YELLOW' ? 'warning' : 'danger'} icon={r.trustIndicator === 'GREEN' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}>
                                                        {r.trustIndicator === 'GREEN' ? 'Verified' : r.trustIndicator === 'YELLOW' ? 'Old Data' : 'Incomplete'}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-lg flex-shrink-0 ${r.type === 'LAB_REPORT' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                        <FileText size={24} />
                                                    </div>
                                                    <div className="flex-1 pr-20">
                                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            <a
                                                                href={`http://localhost:3000/uploads/${r.filePath ? r.filePath.split(/[\\/]/).pop() : ''}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:underline"
                                                            >
                                                                {r.type.replace('_', ' ')}
                                                            </a>
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                            <span className="flex items-center gap-1"><Timer size={12} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span>{r.source || 'Uploaded by Patient'}</span>
                                                        </div>

                                                        {/* AI Summary Box */}
                                                        <div className="mt-4 bg-blue-50/50 border-l-4 border-blue-500 rounded-r-lg p-3">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                                                                    {r.showClinical ? 'Clinical Summary' : 'Patient Summary'}
                                                                </span>
                                                                {r.aiStatus === 'COMPLETED' || (!r.aiStatus && r.aiSummary) ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            const newRecords = [...records];
                                                                            const idx = newRecords.findIndex(rec => rec._id === r._id || rec.id === r.id);
                                                                            if (idx !== -1) {
                                                                                newRecords[idx].showClinical = !newRecords[idx].showClinical;
                                                                                setRecords(newRecords);
                                                                            }
                                                                        }}
                                                                        className="text-[10px] text-blue-500 hover:text-blue-700 underline font-medium"
                                                                    >
                                                                        {r.showClinical ? 'Show Simple Explainer' : 'Show Clinical Details'}
                                                                    </button>
                                                                ) : null}
                                                            </div>

                                                            {(!r.aiStatus && !r.aiSummary) || r.aiStatus === 'PENDING' ? (
                                                                <div className="flex items-center gap-3 py-2 text-slate-500">
                                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    <span className="text-xs font-medium">AI is analyzing this document...</span>
                                                                </div>
                                                            ) : r.aiStatus === 'FAILED' ? (
                                                                <div className="flex flex-col gap-2">
                                                                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                                        <AlertCircle size={12} /> Analysis Failed
                                                                    </p>
                                                                    <button onClick={() => handleRetryAI(r.id || r._id)} className="self-start px-2 py-1 text-[10px] bg-red-50 text-red-600 border border-red-200 rounded">Retry Analysis</button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {r.showClinical && r.aiStructuredSummary ? (
                                                                        <div className="space-y-3">
                                                                            {r.aiStructuredSummary.keyFindings?.map((f: any, i: number) => (
                                                                                <div key={i} className="flex justify-between items-center text-xs border-b border-blue-100 pb-1">
                                                                                    <span className="font-semibold text-slate-600">{f.name}</span>
                                                                                    <span className="font-mono text-blue-700">{f.value}</span>
                                                                                </div>
                                                                            ))}
                                                                            {r.aiDoctorNote && <p className="text-xs text-slate-600 italic border-t border-blue-200 pt-2 mt-2">"{r.aiDoctorNote}"</p>}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-slate-700 leading-relaxed">{(r.showClinical ? r.aiSummary : (r.aiPatientSummary || r.aiSummary)) || r.summary}</p>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 italic"><AlertTriangle size={10} /> AI-generated summary. Verify with original document.</div>
                                                            <button onClick={() => handleDeleteRecord(r.id || r._id)} className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50" title="Delete Record"><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sidebar Actions (Upload/Women's Health) - Kept on Right for 'Records' view as utility panel */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <FileText size={100} className="text-white transform rotate-12 translate-x-4 -translate-y-4" />
                                        </div>

                                        <div className="relative z-10">
                                            <h3 className="font-bold text-white mb-1 text-lg">Add New Record</h3>
                                            <p className="text-sm text-blue-100 mb-6">Securely upload lab reports or prescriptions.</p>

                                            <Button
                                                variant="secondary"
                                                fullWidth
                                                onClick={handleUploadClick}
                                                disabled={loading}
                                                className="shadow-lg border-transparent text-blue-700 hover:text-blue-800"
                                            >
                                                {loading ? 'Uploading...' : <><Plus size={20} /> Upload File</>}
                                            </Button>
                                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                            <p className="text-[10px] text-center text-blue-200/80 mt-3 font-medium">Supports PDF, JPG, PNG (Max 10MB)</p>
                                        </div>
                                    </div>

                                    {/* WOMEN'S HEALTH BUTTON REMOVED */}
                                </div>

                                {/* Insurance moved to bottom of records list */}
                                <div className="lg:col-span-12 mt-8 animate-fade-in order-last">
                                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Shield className="text-blue-600" /> Insurance Documents</h2>
                                    {records.filter(r => r.type === 'INSURANCE').length === 0 ? (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-sm text-slate-500">No insurance documents.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {records.filter(r => r.type === 'INSURANCE').map(r => (
                                                <div key={r.id || r._id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Shield size={20} /></div>
                                                        <a href={`http://localhost:3000/uploads/${r.filePath?.split(/[\\/]/).pop()}`} target="_blank" className="font-bold text-slate-800 text-sm hover:underline">Insurance Policy</a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}

                        {/* 3. TIMELINE */}
                        {activeTab === 'timeline' && (
                            <div className="space-y-6">

                                <PatientTimeline records={records.filter(r => r.type !== 'PRESCRIPTION' && r.type !== 'INSURANCE')} />
                            </div>
                        )}

                        {/* 4. CONSENT (DATA ACCESS) */}
                        {activeTab === 'consent' && (
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="grid md:grid-cols-3 gap-8">
                                    {/* Grant Form */}
                                    <div className="md:col-span-1">
                                        <Card className="h-full relative overflow-hidden border-orange-100">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                                            <h3 className="font-bold text-slate-900 text-lg mb-2">Grant Access</h3>
                                            <p className="text-sm text-slate-500 mb-6">Allow a doctor to view your records.</p>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Doctor ID</label>
                                                    <input type="text" placeholder="DOC-123456" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:ring-2 focus:ring-orange-200 transition-all" value={newDoctorId} onChange={(e) => setNewDoctorId(e.target.value)} />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Duration</label>
                                                    <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-700 focus:ring-2 focus:ring-orange-200 transition-all">
                                                        <option value="15m">15 Minutes</option>
                                                        <option value="1h">1 Hour</option>
                                                        <option value="24h">24 Hours</option>
                                                        <option value="7d">7 Days</option>
                                                    </select>
                                                </div>
                                                <Button onClick={handleGrantConsent} fullWidth className="bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200">
                                                    Grant Access
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                    {/* Active Consents */}
                                    <div className="md:col-span-2 space-y-8">
                                        {/* Active Section */}
                                        <div>
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-4">
                                                <h3 className="font-bold text-slate-800 text-lg">Active Permissions</h3>
                                            </div>
                                            {consents.filter(c => c.status === 'ACTIVE' && new Date(c.validUntil) > new Date()).length === 0 && (
                                                <div className="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    No active permissions.
                                                </div>
                                            )}
                                            <div className="space-y-4">
                                                {consents.filter(c => c.status === 'ACTIVE' && new Date(c.validUntil) > new Date()).map(c => (
                                                    <div key={c.id} className="bg-white p-5 rounded-xl border border-green-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                                                                <Users size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">Doctor ID: <span className="font-mono text-slate-600">{c.doctor?.doctorCode || c.doctorId}</span></p>
                                                                <p className="text-green-700 text-xs font-bold flex items-center gap-1 mt-1">
                                                                    <Timer size={12} /> Expires: {new Date(c.validUntil).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleRevoke(c.id)}
                                                            className="w-full sm:w-auto"
                                                        >
                                                            Revoke Access
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expired Section */}
                                        <div>
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-4 mt-8">
                                                <h3 className="font-bold text-slate-500 text-lg flex items-center gap-2">
                                                    <Timer size={20} /> Expired Grant Records
                                                </h3>
                                            </div>
                                            {consents.filter(c => c.status !== 'ACTIVE' || new Date(c.validUntil) <= new Date()).length === 0 && (
                                                <div className="text-center py-4 text-slate-400 text-sm">No expired records.</div>
                                            )}
                                            <div className="space-y-4 opacity-75">
                                                {consents.filter(c => c.status !== 'ACTIVE' || new Date(c.validUntil) <= new Date()).map(c => (
                                                    <div key={c.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 grayscale-[50%] hover:grayscale-0 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center">
                                                                <Users size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-700 text-sm">Doctor: {c.doctor?.doctorCode || c.doctorId}</p>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-slate-500 text-xs">Ended: {new Date(c.validUntil).toLocaleDateString()}</span>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${c.status === 'REVOKED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                                                        {c.status === 'REVOKED' ? 'REVOKED' : 'EXPIRED'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. EMERGENCY */}
                        {activeTab === 'emergency' && (
                            <div className="max-w-2xl mx-auto py-8">
                                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 ring-4 ring-red-50">
                                    <div className="bg-red-700 p-8 text-center text-white relative">
                                        <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner text-white">
                                            <Activity size={32} strokeWidth={3} />
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tight mb-2">Emergency Access</h2>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-800/40 rounded-full text-red-50 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-red-500/30">
                                            <Shield size={12} /> Read-only • Auto-expiring • Offline-ready
                                        </div>
                                        <p className="text-red-100 mt-4 text-sm font-medium max-w-md mx-auto leading-relaxed opacity-90">
                                            Use this QR code to provide paramedics with immediate, read-only access to critical health data.
                                        </p>
                                    </div>
                                    <div className="p-10 flex flex-col items-center">
                                        <div className="bg-white p-4 rounded-2xl shadow-inner border-4 border-slate-100 flex flex-col items-center relative">
                                            {/* Corner Accents for QR */}
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-slate-900 rounded-tl-xl -translate-x-2 -translate-y-2"></div>
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-slate-900 rounded-tr-xl translate-x-2 -translate-y-2"></div>
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-slate-900 rounded-bl-xl -translate-x-2 translate-y-2"></div>
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-slate-900 rounded-br-xl translate-x-2 translate-y-2"></div>
                                            {qrToken ? (
                                                <>
                                                    <QRCodeCanvas value={`${window.location.origin}/emergency/view/${qrToken}`} size={220} level={'H'} />
                                                    {qrExpires && (
                                                        <div className="mt-4 flex flex-col items-center">
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Expires In</div>
                                                            <div className="text-lg font-mono font-bold text-red-600">
                                                                {new Date(qrExpires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg">
                                                    <QrIcon size={64} className="animate-pulse" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-10 w-full max-w-sm space-y-4">
                                            {qrToken && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        fullWidth
                                                        onClick={() => window.open(`${window.location.origin}/emergency/view/${qrToken}`, '_blank')}
                                                        className="h-12 border-slate-300 text-slate-700 hover:border-slate-800 hover:text-slate-900"
                                                    >
                                                        Preview Snapshot Content
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        fullWidth
                                                        onClick={generateEmergencyQR}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        disabled={isOffline}
                                                    >
                                                        {isOffline ? 'Offline - Cannot Regenerate' : 'Regenerate New Token'}
                                                    </Button>

                                                    <a
                                                        href={`${window.location.origin}/emergency/view/${qrToken}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        <ChevronRight size={18} /> Simulate Paramedic Scan
                                                    </a>
                                                </>
                                            )}

                                            {/* Offline View Button */}
                                            {offlineSnapshot && offlineSnapshot.snapshot && (
                                                <div className="pt-4 border-t border-slate-200 mt-4">
                                                    <Button
                                                        variant="secondary"
                                                        fullWidth
                                                        onClick={() => setShowOfflineSnapshot(true)}
                                                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                                    >
                                                        {isOffline ? 'You are offline. View Saved Snapshot' : 'View Offline Snapshot Copy'}
                                                    </Button>
                                                    <p className="text-[10px] text-center text-slate-400 mt-2">
                                                        Last Synced: {new Date(offlineSnapshot.snapshot.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Offline Snapshot Modal Overlay */}
                        {showOfflineSnapshot && offlineSnapshot && (
                            <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fade-in text-left">
                                <div className="sticky top-0 z-[101] flex items-center justify-between p-4 bg-slate-900 text-white shadow-md">
                                    <h2 className="font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        Offline Backup Mode
                                    </h2>
                                    <button
                                        onClick={() => setShowOfflineSnapshot(false)}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Close Viewer
                                    </button>
                                </div>
                                <EmergencySnapshotDisplay snapshot={offlineSnapshot.snapshot} />
                            </div>
                        )}

                        {/* 6. VITALS */}
                        {activeTab === 'vitals' && <VitalsDashboard patientId={mainUserId} subjectProfileId={selectedProfile.id} />}

                        {/* 7. PROFILE */}
                        {activeTab === 'profile' && <ProfileDashboard patientId={selectedProfile.id || mainUserId} />}

                        {/* 8. WOMEN'S HEALTH */}
                        {activeTab === 'womens-health' && (() => {
                            let passedData = userData;
                            if (selectedProfile.id) {
                                const dep = dependents.find(d => d.id === selectedProfile.id);
                                if (dep) {
                                    passedData = { ...dep, subjectProfileId: dep.id };
                                }
                            }
                            return <WomensHealthMemory userData={passedData} onClose={() => setActiveTab('records')} />;
                        })()}

                    </div>
                </main>
            </div>

            <HealthBasicsModal
                isOpen={showBasicsModal}
                onClose={handleBasicsSaved}
                onSaveSuccess={handleBasicsSaved}
                patientId={onboardingTargetId || mainUserId}
                initialData={onboardingInitialData || userData}
            />
            <AddFamilyMemberModal isOpen={showAddMember} onClose={() => setShowAddMember(false)} onSuccess={handleFamilyMemberAdded} />

            {showUploadModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Select Document Type</h3>
                        <div className="space-y-3 mt-4">
                            <button onClick={() => confirmUpload('LAB_REPORT')} className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><FileText size={20} /></div>
                                <div className="text-left"><h4 className="font-bold text-slate-800">Medical Report</h4></div>
                            </button>
                            <button onClick={() => confirmUpload('PRESCRIPTION')} className="w-full p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-3">
                                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><ClipboardCheck size={20} /></div>
                                <div className="text-left"><h4 className="font-bold text-slate-800">Prescription</h4></div>
                            </button>
                            <button onClick={() => confirmUpload('INSURANCE')} className="w-full p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-3">
                                <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Shield size={20} /></div>
                                <div className="text-left"><h4 className="font-bold text-slate-800">Insurance</h4></div>
                            </button>
                        </div>
                        <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="w-full mt-4 py-3 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
