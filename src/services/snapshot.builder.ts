
import mongoose from 'mongoose';
import { IUser } from '../models/User';
import { IMedicalRecord } from '../models/MedicalRecord';
import { RiskEngineService } from './risk.engine';
import { FHIRAdapterService } from './fhir.adapter';
import EmergencySnapshot, { IEmergencySnapshot } from '../models/EmergencySnapshot';

export class SnapshotBuilder {
    private patientId: mongoose.Types.ObjectId | null = null;
    private criticalSummary = {
        bloodGroup: 'Unknown',
        majorAllergies: [] as string[],
        chronicConditions: [] as string[],
        currentMedications: [] as string[]
    };
    private riskFlags: any[] = [];
    private recentReports: any[] = [];
    private vitals: any = {};
    private womensHealth: any = undefined;
    private tokenHash: string | null = null;
    private expiresAt: Date | null = null;

    constructor() { }

    setPatient(user: IUser) {
        this.patientId = user._id as mongoose.Types.ObjectId;

        // Populate critical summary from User profile if available
        if (user.healthBasics) {
            if (user.healthBasics.allergies) {
                this.criticalSummary.majorAllergies = user.healthBasics.allergies.split(',').map(s => s.trim()).filter(Boolean);
            }
            if (user.healthBasics.chronicConditions) {
                this.criticalSummary.chronicConditions = user.healthBasics.chronicConditions.split(',').map(s => s.trim()).filter(Boolean);
            }
            if (user.healthBasics.currentMedications) {
                this.criticalSummary.currentMedications = user.healthBasics.currentMedications.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        // Populate Women's Health if shared
        if (user.gender === 'Female' && user.womensHealth && user.womensHealth.privacy?.shareWithEmergency) {
            // Only include minimal critical data
            this.womensHealth = {
                isPregnant: user.womensHealth.isPregnant,
                conditions: user.womensHealth.conditions || []
            };
        }

        return this;
    }

    // In a real system, we might parse records to find more history. 
    // For now, we use records to populate 'Recent Reports' and refined Meds/Vitals
    addMedicalRecords(records: IMedicalRecord[]) {
        // 1. Extract recent reports
        this.recentReports = records
            .filter(r => r.type === 'LAB_REPORT' || r.type === 'DISCHARGE_SUMMARY')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5) // Last 5
            .map(r => ({
                title: r.source || 'Unknown Report',
                date: r.createdAt,
                summary: r.aiSummary || r.summary || 'No summary available',
                criticalHighlights: [] // TODO: Populate via AI service if needed
            }));

        // 2. Try to find latest Vitals from records (Mock logic)
        const vitalRecord = records.find(r => r.type === 'VITALS');
        if (vitalRecord && vitalRecord.aiExtractedFields) {
            this.vitals = vitalRecord.aiExtractedFields;
        }

        return this;
    }

    calculateRisks() {
        this.riskFlags = RiskEngineService.evaluateRisks(
            this.criticalSummary.majorAllergies,
            this.criticalSummary.currentMedications,
            this.criticalSummary.chronicConditions,
            this.vitals
        );
        return this;
    }

    setSecurity(tokenHash: string, expiresInHours: number = 1) {
        this.tokenHash = tokenHash;
        this.expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
        return this;
    }

    async build(): Promise<IEmergencySnapshot> {
        if (!this.patientId || !this.tokenHash || !this.expiresAt) {
            throw new Error('Snapshot incomplete: Missing patient, token, or expiry.');
        }

        const snapshotData: Partial<IEmergencySnapshot> = {
            patientId: this.patientId,
            tokenHash: this.tokenHash,
            createdAt: new Date(),
            expiresAt: this.expiresAt,
            criticalSummary: this.criticalSummary,
            riskFlags: this.riskFlags,
            recentReports: this.recentReports,
            vitals: this.vitals,
            womensHealth: this.womensHealth
        };

        // Create temporary object to generate FHIR bundle
        // (casting because complete document props like _id are missing but fine for adapter)
        const partialSnapshot = snapshotData as IEmergencySnapshot;
        snapshotData.fhirBundle = FHIRAdapterService.toFHIRBundle(partialSnapshot);

        const snapshot = new EmergencySnapshot(snapshotData);
        return snapshot;
    }
}
