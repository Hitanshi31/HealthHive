import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
    patientId: mongoose.Types.ObjectId;
    subjectProfileId?: string;
    type: string;
    filePath?: string;
    source?: string;
    summary?: string; // Restored
    isComplete: boolean;
    trustIndicator?: 'GREEN' | 'YELLOW' | 'RED';

    // AI Fields
    aiSummary?: string;
    aiPatientSummary?: string;
    aiDoctorNote?: string;
    showClinical?: boolean;
    aiStructuredSummary?: {
        testName?: string;
        recordDate?: string;
        source?: string;
        keyFindings?: { name: string, value: string }[],
        recommendations?: string[];
        clinicalNote?: string;
    };

    // AI Context & flags (Restored)
    aiContext?: {
        freshnessLabel?: 'RECENT' | 'OLD' | 'OUTDATED';
        changeSummary?: string;
    };
    aiExtractedFields?: any;
    aiFlags?: {
        duplicateTest?: boolean;
        duplicateMedication?: boolean;
        relatedRecordIds?: mongoose.Types.ObjectId[];
    };

    // Prescription Fields
    prescription?: {
        medicines: {
            name: string;
            dosage: string;
            frequency: string;
            duration: string;
            startDate: Date;
            instructions?: string;
        }[];
        doctorId: string; // User ID of the doctor
        issuedAt: Date;
    };

    createdAt: Date;
    updatedAt: Date;
}

const MedicalRecordSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectProfileId: { type: String, default: null }, // Dependent UUID or null
    type: { type: String, required: true }, // ENUM validation handled by app logic or extended here if strict
    summary: { type: String },
    filePath: { type: String },
    source: { type: String },
    isComplete: { type: Boolean, default: false },
    trustIndicator: { type: String, enum: ['GREEN', 'YELLOW', 'RED'] },

    // AI Fields
    aiSummary: { type: String },
    aiPatientSummary: { type: String },
    aiDoctorNote: { type: String },
    showClinical: { type: Boolean, default: false },
    aiStructuredSummary: {
        keyFindings: [{ name: String, value: String }],
    },
    aiExtractedFields: { type: Map, of: mongoose.Schema.Types.Mixed }, // flexible JSON storage
    aiFlags: {
        duplicateTest: { type: Boolean, default: false },
        duplicateMedication: { type: Boolean, default: false },
        relatedRecordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' }]
    },
    prescription: {
        medicines: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
            startDate: Date,
            instructions: String
        }],
        doctorId: String,
        issuedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
