
export interface RiskFlag {
    type: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    source: 'RiskEngine';
}

export class RiskEngineService {

    /**
     * Evaluates risks based on patient data.
     * @param allergies List of allergies
     * @param medications List of current medications
     * @param conditions List of chronic conditions
     * @param vitals Recent vitals (optional)
     */
    static evaluateRisks(
        allergies: string[],
        medications: string[],
        conditions: string[],
        vitals?: { bp?: string }
    ): RiskFlag[] {
        const risks: RiskFlag[] = [];

        // 1. Drug-Allergy Interaction (Mock Example)
        // In a real system, we'd check a medical database.
        if (allergies.some(a => a.toLowerCase().includes('penicillin')) &&
            medications.some(m => m.toLowerCase().includes('amoxicillin'))) {
            risks.push({
                type: 'CONTRAINDICATION',
                message: 'Potential Allergic Reaction: Penicillin allergy conflicting with Amoxicillin.',
                severity: 'HIGH',
                source: 'RiskEngine'
            });
        }

        // 2. Condition-Vitals Conflict (Hypertension + High BP)
        if (conditions.some(c => c.toLowerCase().includes('hypertension'))) {
            if (vitals?.bp) {
                const [sys, dia] = vitals.bp.split('/').map(Number);
                if (sys > 180 || dia > 120) {
                    risks.push({
                        type: 'CRITICAL_VITALS',
                        message: `Hypertensive Crisis Alert: BP ${vitals.bp} in patient with Hypertension.`,
                        severity: 'HIGH',
                        source: 'RiskEngine'
                    });
                } else if (sys > 140 || dia > 90) {
                    risks.push({
                        type: 'VITALS_WARNING',
                        message: `Elevated BP ${vitals.bp} detected.`,
                        severity: 'MEDIUM',
                        source: 'RiskEngine'
                    });
                }
            }
        }

        // 3. Duplicate/Polypharmacy Warning (Simple count check)
        if (medications.length > 10) {
            risks.push({
                type: 'POLYPHARMACY',
                message: 'Patient is on >10 medications. Monitor for interactions.',
                severity: 'LOW',
                source: 'RiskEngine'
            });
        }

        return risks;
    }
}
