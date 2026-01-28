import React from 'react';
import { Home, Activity, Users, UserCircle } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 py-2 px-6 safe-area-pb z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <button
                    onClick={() => onTabChange('vault')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'vault' ? 'text-teal-600' : 'text-slate-400'}`}
                >
                    <Home size={24} strokeWidth={activeTab === 'vault' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Vault</span>
                </button>

                <button
                    onClick={() => onTabChange('emergency')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'emergency' ? 'text-red-600' : 'text-slate-400'}`}
                >
                    <Activity size={24} strokeWidth={activeTab === 'emergency' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Emergency</span>
                </button>

                <button
                    onClick={() => onTabChange('family')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'family' ? 'text-blue-600' : 'text-slate-400'}`}
                >
                    <Users size={24} strokeWidth={activeTab === 'family' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Family</span>
                </button>

                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-slate-800' : 'text-slate-400'}`}
                >
                    <UserCircle size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Profile</span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
