import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyProfile extends Document {
    patientId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    bloodGroup: string;
    allergies: string;
    chronicConditions: string;
    activeMedications: string;
}

const EmergencyProfileSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    bloodGroup: { type: String, default: 'Not Specified' },
    allergies: { type: String, default: 'None' },
    chronicConditions: { type: String, default: 'None' },
    activeMedications: { type: String, default: 'None' }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IEmergencyProfile>('EmergencyProfile', EmergencyProfileSchema);
