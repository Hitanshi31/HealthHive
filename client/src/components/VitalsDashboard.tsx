import React, { useEffect, useState } from 'react';
import { scanForDevices, connectToDevice, startNotifications } from '../services/ble.service';
import { saveVital, getVitals } from '../services/vitals.service';
import { Activity, Bluetooth, RefreshCw, Thermometer, Droplets, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VitalCardProps {
    title: string;
    value: string | number;
    unit: string;
    status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
    icon: React.ReactNode;
    color: string;
    history: number[];
}

const VitalCard: React.FC<VitalCardProps> = ({ title, value, unit, status, icon, color, history }) => {
    // Simple SVG Sparkline
    const width = 120;
    const height = 40;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    const points = history.map((val, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const statusColor = status === 'NORMAL' ? 'text-green-600 bg-green-50' :
        status === 'ELEVATED' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Activity size={80} />
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-slate-700`}>
                    {icon}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${statusColor}`}>
                    {status}
                </span>
            </div>

            <h4 className="text-slate-500 font-medium text-xs uppercase tracking-wide relative z-10">{title}</h4>
            <div className="flex items-baseline gap-1 mt-1 mb-4 relative z-10">
                <span className="text-3xl font-extrabold text-slate-800">{value}</span>
                <span className="text-sm font-medium text-slate-400">{unit}</span>
            </div>

            {history.length > 1 && (
                <svg width="100%" height={height} className="overflow-visible opacity-50 stroke-current text-slate-400">
                    <polyline points={points} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </div>
    );
};

interface VitalsDashboardProps {
    patientId: string | null;
    subjectProfileId?: string | null;
}

const VitalsDashboard: React.FC<VitalsDashboardProps> = ({ patientId, subjectProfileId }) => {
    const [connectedDevice, setConnectedDevice] = useState<any>(null);
    const [scanning, setScanning] = useState(false);
    // const [vitals, setVitals] = useState<any[]>([]); // Unused for now


    // Mock current values for display if no real device
    const [currentReadings, setCurrentReadings] = useState<any>({
        HR: { val: 72, history: [68, 70, 72, 71, 75, 72] },
        BP: { val: '120/80', history: [118, 119, 121, 120, 122, 120] }, // History of systolic
        SPO2: { val: 98, history: [97, 98, 99, 98, 98, 98] },
        TEMP: { val: 36.6, history: [36.5, 36.6, 36.7, 36.6, 36.5, 36.6] },
        GLUCOSE: { val: 105, history: [98, 102, 110, 108, 105, 105] }
    });

    useEffect(() => {
        if (patientId) {
            loadVitals();
        }
    }, [patientId, subjectProfileId]);

    const loadVitals = async () => {
        if (!patientId) return;
        const history = await getVitals(patientId, subjectProfileId);
        // setVitals(history);
        console.log("Loaded vitals history:", history.length);
    };

    const handleScan = async () => {
        try {
            setScanning(true);
            const device = await scanForDevices();
            if (device) {
                setConnectedDevice(device);
                const server = await connectToDevice(device, () => setConnectedDevice(null));

                const HR_SERVICE = 0x180D;
                const HR_CHAR = 0x2A37;
                const TEMP_SERVICE = 0x1809;
                const TEMP_CHAR = 0x2A1C;

                const handleVitalUpdate = async (data: any) => {
                    setCurrentReadings((prev: any) => {
                        const type = data.type;
                        if (!prev[type]) return prev;

                        const newHistory = [...prev[type].history, data.value].slice(-10);
                        return {
                            ...prev,
                            [type]: {
                                ...prev[type],
                                val: data.value,
                                history: newHistory
                            }
                        };
                    });

                    // Auto-save
                    if (patientId) {
                        try {
                            const payload: any = {
                                patientId,
                                type: data.type,
                                value: data.value,
                                unit: data.unit,
                                source: 'device',
                                timestamp: new Date()
                            };
                            if (subjectProfileId) payload.subjectProfileId = subjectProfileId;

                            await saveVital(payload);
                        } catch (e) {
                            console.error("Failed to auto-save vital", e);
                        }
                    }
                };

                // Try measuring Heart Rate
                try {
                    await startNotifications(server, HR_SERVICE, HR_CHAR, handleVitalUpdate);
                } catch (e) {
                    console.log("HR service not found or accessible on this device");
                }

                // Try measuring Thermometer
                try {
                    await startNotifications(server, TEMP_SERVICE, TEMP_CHAR, handleVitalUpdate);
                } catch (e) {
                    console.log("Thermometer service not found");
                }

                alert(`Connected to ${device.name}`);
            }
        } catch (error: any) {
            console.error(error);
            if (error.name === 'NotFoundError' || error.message.includes('User cancelled')) {
                // User cancelled
            } else {
                alert("Bluetooth not supported or permission denied.");
            }
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Bluetooth className="text-blue-600" /> Connected Devices
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time health monitoring via Bluetooth Low Energy.</p>
                </div>
                <div className="flex items-center gap-4">
                    {connectedDevice ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
                            <CheckCircle2 size={16} />
                            Connected: {connectedDevice.name}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400 font-medium">No devices connected</div>
                    )}

                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {scanning ? <RefreshCw className="animate-spin" size={18} /> : <Bluetooth size={18} />}
                        {scanning ? 'Scanning...' : 'Scan for Devices'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <VitalCard
                    title="Blood Pressure"
                    value={currentReadings.BP.val}
                    unit="mmHg"
                    status="NORMAL"
                    icon={<Activity size={24} className="text-rose-500" />}
                    color="bg-rose-500 text-rose-500"
                    history={currentReadings.BP.history}
                />
                <VitalCard
                    title="Heart Rate"
                    value={currentReadings.HR.val}
                    unit="bpm"
                    status="ELEVATED"
                    icon={<Heart size={24} className="text-red-500" />}
                    color="bg-red-500 text-red-500"
                    history={currentReadings.HR.history}
                />
                <VitalCard
                    title="SpO2 Saturation"
                    value={currentReadings.SPO2.val}
                    unit="%"
                    status="NORMAL"
                    icon={<Droplets size={24} className="text-sky-500" />}
                    color="bg-sky-500 text-sky-500"
                    history={currentReadings.SPO2.history}
                />
                <VitalCard
                    title="Body Temperature"
                    value={currentReadings.TEMP.val}
                    unit="°C"
                    status="NORMAL"
                    icon={<Thermometer size={24} className="text-amber-500" />}
                    color="bg-amber-500 text-amber-500"
                    history={currentReadings.TEMP.history}
                />
                <VitalCard
                    title="Glucose Level"
                    value={currentReadings.GLUCOSE.val}
                    unit="mg/dL"
                    status="CRITICAL"
                    icon={<Activity size={24} className="text-purple-500" />}
                    color="bg-purple-500 text-purple-500"
                    history={currentReadings.GLUCOSE.history}
                />
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex items-start gap-3 border border-blue-100">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">Bluetooth Permission Required</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        To connect medical devices, your browser requires explicit permission.
                        Ensure your device is in pairing mode and you are using a supported browser (Chrome/Edge/Opera).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VitalsDashboard;
