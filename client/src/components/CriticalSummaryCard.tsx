
import React from 'react';

interface Props {
    summary: {
        bloodGroup: string;
        majorAllergies: string[];
        chronicConditions: string[];
        currentMedications: string[];
    };
}

const CriticalSummaryCard: React.FC<Props> = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Blood Group */}
            <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-blue-500">
                <h4 className="text-gray-500 text-sm font-medium uppercase">Blood Group</h4>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.bloodGroup}</p>
            </div>

            {/* Major Allergies */}
            <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-red-500">
                <h4 className="text-gray-500 text-sm font-medium uppercase">Major Allergies</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                    {summary.majorAllergies.length > 0 ? (
                        summary.majorAllergies.map((a, i) => (
                            <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                                {a}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 italic">None known</span>
                    )}
                </div>
            </div>

            {/* Chronic Conditions */}
            <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-yellow-500">
                <h4 className="text-gray-500 text-sm font-medium uppercase">Chronic Conditions</h4>
                <ul className="mt-2 text-sm text-gray-800 list-disc list-inside">
                    {summary.chronicConditions.length > 0 ? (
                        summary.chronicConditions.map((c, i) => <li key={i}>{c}</li>)
                    ) : (
                        <span className="text-gray-400 italic">None listed</span>
                    )}
                </ul>
            </div>

            {/* Current Medications */}
            <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-green-500">
                <h4 className="text-gray-500 text-sm font-medium uppercase">Current Medications</h4>
                <ul className="mt-2 text-sm text-gray-800 list-disc list-inside">
                    {summary.currentMedications.length > 0 ? (
                        summary.currentMedications.map((m, i) => <li key={i}>{m}</li>)
                    ) : (
                        <span className="text-gray-400 italic">None active</span>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CriticalSummaryCard;
