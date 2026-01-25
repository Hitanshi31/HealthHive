import mongoose, { Schema, Document } from 'mongoose';

export interface IConsent extends Document {
    patientId: mongoose.Types.ObjectId;
    subjectProfileId?: string;
    doctorId: mongoose.Types.ObjectId;
    status: 'ACTIVE' | 'REVOKED';
    validFrom: Date;
    validUntil: Date;
}

const ConsentSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectProfileId: { type: String, required: false },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ACTIVE', 'REVOKED'], required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IConsent>('Consent', ConsentSchema);
