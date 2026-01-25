import React from 'react';
import { ChevronDown, User, Plus } from 'lucide-react';

export type Profile = {
    id: string | null; // null for Primary (Me)
    name: string;
    relationship: string; // 'Me' or actual relationship
};

interface ProfileSwitcherProps {
    currentProfile: Profile;
    profiles: Profile[];
    onSelectProfile: (profile: Profile) => void;
    onAddFamilyMember: () => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ currentProfile, profiles, onSelectProfile, onAddFamilyMember }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm hover:bg-slate-50 transition-all"
            >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentProfile.id === null ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    <User size={16} />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 uppercase">{currentProfile.relationship}</p>
                    <p className="text-sm font-bold text-slate-900 leading-none">{currentProfile.name}</p>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-2">
                        {profiles.map(profile => (
                            <button
                                key={profile.id || 'me'}
                                onClick={() => {
                                    onSelectProfile(profile);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${currentProfile.id === profile.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile.id === null ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    <User size={14} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">{profile.name}</p>
                                    <p className="text-[10px] font-medium uppercase opacity-70">{profile.relationship}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 p-2">
                        <button
                            onClick={() => {
                                onAddFamilyMember();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 p-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            Add Family Member
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
        </div>
    );
};

export default ProfileSwitcher;
