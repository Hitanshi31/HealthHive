import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    actorId?: mongoose.Types.ObjectId | string; // Nullable or string for anon/system
    patientId: mongoose.Types.ObjectId;
    action: string;
    resource: string;
    purpose: string;
    details?: string;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    actorId: { type: mongoose.Schema.Types.Mixed }, // Can be ObjectId or String (for anon)
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    purpose: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
