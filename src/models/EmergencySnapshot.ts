import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencySnapshot extends Document {
    patientId: mongoose.Types.ObjectId;
    tokenHash: string; // SHA-256 hash of the access token
    createdAt: Date;
    expiresAt: Date;

    // Critical Identification & Summary
    criticalSummary: {
        bloodGroup: string;
        majorAllergies: string[];
        chronicConditions: string[];
        currentMedications: string[];
    };

    // Risk Analysis
    riskFlags: {
        type: string;
        message: string;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
        source: string;
    }[];

    // Detailed Data
    recentReports: {
        title: string;
        date: Date;
        summary?: string;
        criticalHighlights?: string[]; // AI-extracted critical sentences
    }[];

    vitals?: {
        bp?: string;
        heartRate?: number;
        temp?: number;
        recordedAt?: Date;
    };
    womensHealth?: {
        isPregnant: boolean;
        conditions: string[];
    };
    // Interoperability
    fhirBundle?: any; // Store generated FHIR Bundle for portability
}

const EmergencySnapshotSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },

    criticalSummary: {
        bloodGroup: { type: String, default: 'Unknown' },
        majorAllergies: [String],
        chronicConditions: [String],
        currentMedications: [String]
    },

    riskFlags: [{
        type: { type: String, required: true },
        message: { type: String, required: true },
        severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
        source: { type: String }
    }],

    recentReports: [{
        title: String,
        date: Date,
        summary: String,
        criticalHighlights: [String]
    }],

    vitals: {
        bp: String,
        heartRate: Number,
        temp: Number,
        recordedAt: Date
    },

    womensHealth: {
        isPregnant: Boolean,
        conditions: [String]
    },

    fhirBundle: { type: mongoose.Schema.Types.Mixed }
}, {
    timestamps: true
});

// Index for expiry cleanup
EmergencySnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IEmergencySnapshot>('EmergencySnapshot', EmergencySnapshotSchema);
