
import crypto from 'crypto';
import User from '../models/User';
import MedicalRecord from '../models/MedicalRecord';
import EmergencySnapshot from '../models/EmergencySnapshot';
import { SnapshotBuilder } from './snapshot.builder';

export class EmergencyService {

    /**
     * Generates a new emergency snapshot and returns the raw access token.
     * The token is NOT stored in the DB; only its hash is.
     */
    static async generateSnapshot(userId: string): Promise<{ token: string, expiresAt: Date }> {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const records = await MedicalRecord.find({ patientId: userId });

        // 1. Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');

        // 2. Hash it
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // 3. Build Snapshot
        const builder = new SnapshotBuilder();
        const snapshot = await builder
            .setPatient(user)
            .addMedicalRecords(records)
            .calculateRisks()
            .setSecurity(tokenHash, 1) // 1 Hour expiry
            .build();

        await snapshot.save();

        return { token, expiresAt: snapshot.expiresAt };
    }

    /**
     * Retrieves a snapshot by validating the provided token.
     */
    static async getSnapshot(token: string) {
        // Re-hash incoming token to find match
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const snapshot = await EmergencySnapshot.findOne({ tokenHash });

        if (!snapshot) {
            throw new Error('Invalid or expired token.');
        }

        if (new Date() > snapshot.expiresAt) {
            throw new Error('Token has expired.');
        }

        // Ideally we might want to clean up expired snapshots here or via cron
        return snapshot;
    }
}
