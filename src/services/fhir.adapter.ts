
import { IEmergencySnapshot } from '../models/EmergencySnapshot';

export class FHIRAdapterService {

    /**
     * Converts an internal EmergencySnapshot to a FHIR Bundle.
     */
    static toFHIRBundle(snapshot: IEmergencySnapshot): any {
        const bundle = {
            resourceType: 'Bundle',
            type: 'collection',
            timestamp: new Date().toISOString(),
            entry: [] as any[]
        };

        // 1. Patient Resource
        const patientResource = {
            resourceType: 'Patient',
            id: snapshot.patientId.toString(),
            active: true,
            // In a real scenario, we would map name, dob, etc. from User model if available in snapshot context
            // For now limited to what we have in snapshot summary
        };
        bundle.entry.push({ resource: patientResource });

        // 2. AllergyIntolerance
        snapshot.criticalSummary.majorAllergies.forEach((allergy, index) => {
            bundle.entry.push({
                resource: {
                    resourceType: 'AllergyIntolerance',
                    id: `allergy-${index}`,
                    patient: { reference: `Patient/${snapshot.patientId}` },
                    code: { text: allergy },
                    clinicalStatus: {
                        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }]
                    }
                }
            });
        });

        // 3. Condition (Chronic Conditions)
        snapshot.criticalSummary.chronicConditions.forEach((condition, index) => {
            bundle.entry.push({
                resource: {
                    resourceType: 'Condition',
                    id: `condition-${index}`,
                    subject: { reference: `Patient/${snapshot.patientId}` },
                    code: { text: condition },
                    clinicalStatus: {
                        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
                    }
                }
            });
        });

        // 4. MedicationStatement
        snapshot.criticalSummary.currentMedications.forEach((med, index) => {
            bundle.entry.push({
                resource: {
                    resourceType: 'MedicationStatement',
                    id: `medication-${index}`,
                    subject: { reference: `Patient/${snapshot.patientId}` },
                    medicationCodeableConcept: { text: med },
                    status: 'active'
                }
            });
        });

        return bundle;
    }

    /**
     * Conceptual placeholder for converting FHIR Bundle back to Snapshot parts.
     * (Not strictly needed for the outbound View flow, but good for bidirectional completeness)
     */
    static fromFHIRBundle(bundle: any): Partial<IEmergencySnapshot> {
        // Implementation would parse bundle.entry and extract allergies, meds, etc.
        return {};
    }
}
