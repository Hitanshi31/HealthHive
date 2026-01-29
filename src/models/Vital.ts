import mongoose, { Schema, Document } from 'mongoose';

export interface IVital extends Document {
    patientId: mongoose.Types.ObjectId;
    type: 'BP' | 'SPO2' | 'HR' | 'GLUCOSE' | 'TEMP';
    value: string | number;
    unit: string;
    source: 'manual' | 'device';
    timestamp: Date;
    metadata?: any;
    createdAt: Date;
}

const VitalSchema: Schema = new Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['BP', 'SPO2', 'HR', 'GLUCOSE', 'TEMP'],
        required: true
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Mixed to allow "120/80" string for BP
    unit: { type: String, required: true },
    source: {
        type: String,
        enum: ['manual', 'device'],
        default: 'manual'
    },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object }
}, {
    timestamps: true
});

export default mongoose.model<IVital>('Vital', VitalSchema);
