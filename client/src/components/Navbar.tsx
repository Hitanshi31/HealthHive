import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Shield, Activity, Check, Copy, Menu, LogOut } from 'lucide-react';
import { logout } from '../services/api';
import ProfileSwitcher, { type Profile } from './ProfileSwitcher';

interface NavbarProps {
    role: string;
    profiles?: Profile[];
    currentProfile?: Profile;
    onSelectProfile?: (profile: Profile) => void;
    onAddFamilyMember?: () => void;
    onDeleteProfile?: (profile: Profile) => void;
}

const Navbar = ({ role, profiles, currentProfile, onSelectProfile, onAddFamilyMember, onDeleteProfile }: NavbarProps) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const baseId = role === 'PATIENT' ? localStorage.getItem('patientCode') : localStorage.getItem('doctorCode');
    // If viewing a dependent profile, show their ID. Otherwise show main ID.
    const displayId = (role === 'PATIENT' && currentProfile?.patientCode) ? currentProfile.patientCode : baseId;

    const label = role === 'PATIENT' ? 'Patient ID' : 'Doctor ID';

    const handleCopy = () => {
        if (displayId) {
            navigator.clipboard.writeText(displayId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 font-sans shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center cursor-pointer gap-3" onClick={() => navigate(role === 'PATIENT' ? '/dashboard' : '/doctor')}>
                            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-xl text-slate-800 tracking-tight block leading-none">HealthHive</span>
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Shield size={10} className="text-blue-500" /> Secure Health
                                </span>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">{label}:</span>
                            <span className="text-sm font-mono font-bold text-blue-900">{displayId || 'N/A'}</span>
                            <button
                                onClick={handleCopy}
                                className="text-blue-400 hover:text-blue-700 transition-colors ml-1"
                                title="Copy ID"
                            >
                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Centered Emergency Button */}
                    {role === 'PATIENT' && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <button
                                onClick={() => navigate('/dashboard?tab=emergency')}
                                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-700 hover:shadow-lg transition-all"
                            >
                                <Activity size={18} />
                                Emergency
                            </button>
                        </div>
                    )}

                    <div className="hidden md:flex items-center gap-6">
                        {/* Profile Switcher (Right of ID) */}
                        {role === 'PATIENT' && profiles && currentProfile && onSelectProfile && onAddFamilyMember && (
                            <ProfileSwitcher
                                profiles={profiles}
                                currentProfile={currentProfile}
                                onSelectProfile={onSelectProfile}
                                onAddFamilyMember={onAddFamilyMember}
                                onDeleteProfile={onDeleteProfile}
                            />
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-3 shadow-lg absolute w-full">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Logged in as {role}</div>
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 text-red-600 bg-red-50 rounded-lg font-medium">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
