import { Request, Response } from 'express';
import User from '../models/User';
import aiService, { SafetyCheckInput } from '../services/ai.service'; // Ensure correct import

export const runSafetyCheck = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(503).json({ message: 'AI Service unavailable (Missing API Key)' });
        }

        // 1. Fetch Patient Data (Support both Primary and Dependent logic if needed, 
        // using the same logic as getProfile or just User.findById for now)
        // Simplest: Find User or Dependent
        let user: any = await User.findById(patientId);

        if (!user) {
            // Check dependents
            const parentUser = await User.findOne({ 'dependents.id': patientId });
            if (parentUser && parentUser.dependents) {
                user = parentUser.dependents.find(d => d.id === patientId);
                // Map dependent structure to roughly match what we need (healthBasics)
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // 2. Prepare Context
        // Handle both flat user object and dependent object structures
        const healthBasics = user.healthBasics || {};
        const womensHealth = user.womensHealth || {};

        // Ensure arrays
        const medications = typeof healthBasics.currentMedications === 'string'
            ? healthBasics.currentMedications.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(healthBasics.currentMedications) ? healthBasics.currentMedications : []);

        const allergies = typeof healthBasics.allergies === 'string'
            ? healthBasics.allergies.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(healthBasics.allergies) ? healthBasics.allergies : []);

        const conditions = typeof healthBasics.chronicConditions === 'string'
            ? healthBasics.chronicConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(healthBasics.chronicConditions) ? healthBasics.chronicConditions : []);

        const context: SafetyCheckInput = {
            medications,
            allergies,
            conditions,
            isPregnant: !!womensHealth.isPregnant
        };

        console.log(`[SafetyCheck] Running for ${user.fullName || user.name} with ${medications.length} meds.`);

        // 3. Call AI Service
        const analysis = await aiService.generateSafetyAnalysis(context, apiKey);

        res.json(analysis);

    } catch (error) {
        console.error("Safety check error:", error);
        res.status(500).json({ message: 'Safety check failed' });
    }
};
