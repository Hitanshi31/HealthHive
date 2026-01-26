
import React from 'react';

interface RiskFlag {
    type: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Props {
    risks: RiskFlag[];
}

const RiskAlerts: React.FC<Props> = ({ risks }) => {
    if (!risks || risks.length === 0) return null;

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'HIGH':
                return 'bg-red-50 border-red-400 text-red-800';
            case 'MEDIUM':
                return 'bg-yellow-50 border-yellow-400 text-yellow-800';
            default:
                return 'bg-gray-50 border-gray-300 text-gray-800';
        }
    };

    return (
        <div className="space-y-4 mb-6">
            <h3 className="text-xl font-bold text-red-600 uppercase tracking-wider flex items-center">
                <span className="mr-2">⚠️</span> Critical Risk Alerts
            </h3>
            {risks.map((risk, idx) => (
                <div
                    key={idx}
                    className={`p-4 border-l-4 rounded-r-md shadow-sm ${getSeverityStyles(risk.severity)}`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="block font-bold text-sm uppercase opacity-75">{risk.type}</span>
                            <p className="mt-1 font-semibold">{risk.message}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-white bg-opacity-50">
                            {risk.severity}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RiskAlerts;
