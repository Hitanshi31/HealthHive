import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { Shield, LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';

const Navbar = ({ role }: { role: string }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 font-sans shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center cursor-pointer gap-3" onClick={() => navigate(role === 'PATIENT' ? '/dashboard' : '/doctor')}>
                        <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-xl text-slate-800 tracking-tight block leading-none">HealthHive</span>
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Secure Health</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${role === 'PATIENT' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                            <User size={14} />
                            <span>{role === 'PATIENT' ? 'PATIENT PORTAL' : 'DOCTOR ACCESS'}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors group"
                        >
                            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                            Logout
                        </button>
                    </div>

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
