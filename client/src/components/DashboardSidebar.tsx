import { FileText, Clock, Users, Activity, User, LogOut, Droplets } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout?: () => void;
    showWomensHealth?: boolean;
}

const DashboardSidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, showWomensHealth }) => {

    const navItems = [
        { id: 'records', label: 'My Records', icon: <FileText size={20} /> },
        { id: 'timeline', label: 'Health Timeline', icon: <Clock size={20} /> },
        { id: 'vitals', label: 'Vitals & Devices', icon: <Activity size={20} /> },
        { id: 'consent', label: 'Data Access', icon: <Users size={20} /> },
        { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
    ];

    if (showWomensHealth) {
        navItems.push({ id: 'womens-health', label: "Women's Health", icon: <Droplets size={20} /> });
    }



    return (
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16">
            <div className="p-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Menu</h2>
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
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

export default DashboardSidebar;
