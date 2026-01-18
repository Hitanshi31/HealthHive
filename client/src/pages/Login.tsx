import React, { useState } from 'react';
import api, { saveToken, getUserRole } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            saveToken(res.data.token);

            // Save identifiers
            if (res.data.doctorCode) localStorage.setItem('doctorCode', res.data.doctorCode);
            if (res.data.patientCode) localStorage.setItem('patientCode', res.data.patientCode);

            const role = getUserRole();
            if (role === 'PATIENT') navigate('/dashboard');
            else if (role === 'DOCTOR') navigate('/doctor');
        } catch (err) {
            alert('Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">HealthHive</h2>
                    <p className="text-blue-100 text-sm mt-2">Secure Patient-Controlled Health Data</p>
                    <div className="mt-6 flex justify-center space-x-2 text-xs text-blue-200">
                        <span className="bg-blue-700/50 px-2 py-1 rounded">Interoperable</span>
                        <span className="bg-blue-700/50 px-2 py-1 rounded">Consent-Based</span>
                    </div>
                </div>

                <div className="p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h3>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-white bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-70"
                        >
                            {loading ? 'Logging in...' : 'Secure Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            New to HealthHive? <a href="/register" className="text-blue-600 font-bold hover:underline">Create Account</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
