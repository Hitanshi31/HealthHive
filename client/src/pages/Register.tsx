import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('PATIENT');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/register', { email, password, role });
            if (res.data.doctorCode) {
                alert(`Registration successful! Your Doctor ID is: ${res.data.doctorCode}. Please login.`);
            } else {
                alert('Registration successful! Please login.');
            }
            navigate('/login');
        } catch (err) {
            alert('Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="bg-green-600 p-6 text-center">
                    <Shield size={32} className="text-white mx-auto mb-2" />
                    <h2 className="text-2xl font-bold text-white">Join HealthHive</h2>
                    <p className="text-green-100 text-sm">Create your secure health identity</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                            >
                                <option value="PATIENT">Patient (I want to control my data)</option>
                                <option value="DOCTOR">Doctor (I treat patients)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-white bg-green-600 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md mt-4 disabled:opacity-70"
                        >
                            {loading ? 'Creating Account...' : 'Register Now'}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account? <a href="/login" className="text-green-600 font-bold hover:underline">Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
