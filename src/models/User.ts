import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: 'PATIENT' | 'DOCTOR';
    patientCode?: string;
    doctorCode?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['PATIENT', 'DOCTOR'] },
    patientCode: { type: String, unique: true, sparse: true },
    doctorCode: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IUser>('User', UserSchema);
