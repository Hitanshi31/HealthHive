import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: 'PATIENT' | 'DOCTOR';
    patientCode?: string;
    doctorCode?: string;
    createdAt: Date;
    hasSeenBasicsPrompt?: boolean;
    healthBasics?: {
        allergies?: string;
        chronicConditions?: string;
        currentMedications?: string;
        bloodGroup?: string;
        dateOfBirth?: Date;
    };
    dependents?: {
        id: string;
        name: string;
        dateOfBirth: Date;
        gender: 'Male' | 'Female' | 'Other';
        relationship: string;
        healthBasics?: {
            allergies?: string[];
            chronicConditions?: string[];
            currentMedications?: string[];
        };
    }[];
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['PATIENT', 'DOCTOR'] },
    patientCode: { type: String, unique: true, sparse: true },
    doctorCode: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
    hasSeenBasicsPrompt: { type: Boolean, default: false },
    healthBasics: {
        allergies: String,
        chronicConditions: String,
        currentMedications: String,
        bloodGroup: String,
        dateOfBirth: Date
    },
    dependents: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
        relationship: { type: String, required: true },
        healthBasics: {
            allergies: [String],
            chronicConditions: [String],
            currentMedications: [String]
        }
    }]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IUser>('User', UserSchema);
