import React from 'react';
import { ChevronDown, User, Plus, Trash2 } from 'lucide-react';

export type Profile = {
    id: string | null; // null for Primary (Me)
    name: string;
    relationship: string; // 'Me' or actual relationship
    gender?: string;
    patientCode?: string;
};

interface ProfileSwitcherProps {
    currentProfile: Profile;
    profiles: Profile[];
    onSelectProfile: (profile: Profile) => void;
    onAddFamilyMember: () => void;
    onDeleteProfile?: (profile: Profile) => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ currentProfile, profiles, onSelectProfile, onAddFamilyMember, onDeleteProfile }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

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
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-2 space-y-1">
                        {profiles.map(profile => (
                            <div key={profile.id || 'me'} className="flex items-center group relative">
                                <button
                                    onClick={() => {
                                        onSelectProfile(profile);
                                        setIsOpen(false);
                                    }}
                                    className={`flex-1 flex items-center gap-3 p-3 rounded-lg transition-colors ${currentProfile.id === profile.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile.id === null ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                        <User size={14} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm">{profile.name}</p>
                                        <p className="text-[10px] font-medium uppercase opacity-70">{profile.relationship}</p>
                                    </div>
                                </button>

                                {profile.id !== null && onDeleteProfile && (
                                    <div className="px-2">
                                        {deleteConfirmId === profile.id ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteProfile(profile);
                                                    setDeleteConfirmId(null);
                                                }}
                                                className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-700 whitespace-nowrap"
                                            >
                                                Confirm?
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmId(profile.id);
                                                    // Auto-clear confirm after 3s
                                                    setTimeout(() => setDeleteConfirmId(null), 3000);
                                                }}
                                                className="text-slate-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Profile"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
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
