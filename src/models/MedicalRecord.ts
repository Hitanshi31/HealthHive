import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
    patientId: mongoose.Types.ObjectId;
    subjectProfileId?: string;
    type: string;
    filePath?: string;
    source?: string;
    summary?: string;
    isComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
    aiSummary?: string;
    aiStructuredSummary?: {
        testName?: string;
        recordDate?: string;
        source?: string;
        keyFindings?: { name: string; value: string }[];
        clinicalNote?: string;
    };
    aiPatientSummary?: string;
    aiDoctorNote?: string;
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
}

const MedicalRecordSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectProfileId: { type: String, required: false }, // null = Primary User, set = Dependent ID
    type: { type: String, required: true },
    filePath: { type: String },
    source: { type: String },
    summary: { type: String },
    isComplete: { type: Boolean, default: true },
    aiSummary: { type: String }, // Fallback
    aiStructuredSummary: { // New Structured Field
        testName: String,
        recordDate: String,
        source: String,
        keyFindings: [{ name: String, value: String }],
        clinicalNote: String // kept for structure, but detailed note is below
    },
    aiPatientSummary: { type: String }, // Patient-friendly
    aiDoctorNote: { type: String }, // Clinical, concise
    aiContext: { // New field: Contextual AI data
        freshnessLabel: { type: String, enum: ['RECENT', 'OLD', 'OUTDATED'] },
        changeSummary: { type: String }
    },
    aiExtractedFields: { type: Map, of: mongoose.Schema.Types.Mixed }, // flexible JSON storage
    aiFlags: {
        duplicateTest: { type: Boolean, default: false },
        duplicateMedication: { type: Boolean, default: false },
        relatedRecordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
