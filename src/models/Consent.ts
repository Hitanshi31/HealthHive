import mongoose, { Schema, Document } from 'mongoose';

export interface IConsent extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: 'ACTIVE' | 'REVOKED';
    validFrom: Date;
    validUntil: Date;
}

const ConsentSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ACTIVE', 'REVOKED'], required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IConsent>('Consent', ConsentSchema);
