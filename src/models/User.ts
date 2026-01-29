import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: 'PATIENT' | 'DOCTOR';
    gender?: 'Male' | 'Female' | 'Other';
    patientCode?: string;
    doctorCode?: string;

    fullName?: string;
    phoneNumber?: string;
    organDonor?: boolean;
    emergencyContact?: {
        name: string;
        phone: string;
    };
    createdAt: Date;
    hasSeenBasicsPrompt?: boolean;
    healthBasics?: {
        allergies?: string;
        chronicConditions?: string;
        currentMedications?: string;
        bloodGroup?: string;
        dateOfBirth?: Date;
    };
    womensHealth?: {
        isPregnant: boolean;
        pregnancyDetails?: {
            dueDate?: Date;
            lastPeriodDate?: Date;
            weeksPregnant?: number;
            lastUltrasoundDate?: Date;
            checklist: {
                title: string;
                isCompleted: boolean;
                completedDate?: Date;
            }[];
            notes?: string;
            pastPregnancies: {
                year: number;
                outcome: 'Normal Delivery' | 'C-section' | 'Miscarriage' | 'Abortion';
            }[];
        };
        periodLog: {
            startDate: Date;
            endDate?: Date;
            flowIntensity?: 'Light' | 'Medium' | 'Heavy';
            painLevel?: 'None' | 'Mild' | 'Severe';
            notes?: string;
        }[];
        conditions: string[];
        privacy: {
            shareWithEmergency: boolean;
            shareWithDoctor: boolean;
        };
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
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
    patientCode: { type: String, unique: true, sparse: true },
    doctorCode: { type: String, unique: true, sparse: true },

    fullName: String,
    phoneNumber: String,
    organDonor: { type: Boolean, default: false },
    emergencyContact: {
        name: String,
        phone: String
    },
    createdAt: { type: Date, default: Date.now },
    hasSeenBasicsPrompt: { type: Boolean, default: false },
    healthBasics: {
        allergies: String,
        chronicConditions: String,
        currentMedications: String,
        bloodGroup: String,
        dateOfBirth: Date
    },
    womensHealth: {
        isPregnant: { type: Boolean, default: false },
        pregnancyDetails: {
            dueDate: Date,
            lastPeriodDate: Date,
            weeksPregnant: Number,
            lastUltrasoundDate: Date,
            checklist: [{
                title: String,
                isCompleted: { type: Boolean, default: false },
                completedDate: Date
            }],
            notes: String,
            pastPregnancies: [{
                year: Number,
                outcome: { type: String, enum: ['Normal Delivery', 'C-section', 'Miscarriage', 'Abortion'] }
            }]
        },
        periodLog: [{
            startDate: Date,
            endDate: Date,
            flowIntensity: { type: String, enum: ['Light', 'Medium', 'Heavy'] },
            painLevel: { type: String, enum: ['None', 'Mild', 'Severe'] },
            notes: String
        }],
        conditions: [String],
        privacy: {
            shareWithEmergency: { type: Boolean, default: false },
            shareWithDoctor: { type: Boolean, default: false }
        }
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
        },
        womensHealth: {
            isPregnant: { type: Boolean, default: false },
            pregnancyDetails: {
                dueDate: Date,
                lastPeriodDate: Date,
                weeksPregnant: Number,
                lastUltrasoundDate: Date,
                checklist: [{
                    title: String,
                    isCompleted: { type: Boolean, default: false },
                    completedDate: Date
                }],
                notes: String,
                pastPregnancies: [{
                    year: Number,
                    outcome: { type: String, enum: ['Normal Delivery', 'C-section', 'Miscarriage', 'Abortion'] }
                }]
            },
            periodLog: [{
                startDate: Date,
                endDate: Date,
                flowIntensity: { type: String, enum: ['Light', 'Medium', 'Heavy'] },
                painLevel: { type: String, enum: ['None', 'Mild', 'Severe'] },
                notes: String
            }],
            conditions: [String],
            privacy: {
                shareWithEmergency: { type: Boolean, default: false },
                shareWithDoctor: { type: Boolean, default: false }
            }
        }
    }]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IUser>('User', UserSchema);
