import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
    patientId: mongoose.Types.ObjectId;
    type: string;
    filePath?: string;
    source?: string;
    summary?: string;
    isComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MedicalRecordSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    filePath: { type: String },
    source: { type: String },
    summary: { type: String },
    isComplete: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
