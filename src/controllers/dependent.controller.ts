import { Request, Response } from 'express';
import User from '../models/User';
import Consent from '../models/Consent';
import { randomUUID } from 'crypto';

interface AuthRequest extends Request {
    user?: any;
}

const generatePatientCode = () => {
    return 'HH-PAT-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const createDependent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user;
        const { name, dateOfBirth, gender, relationship, healthBasics } = req.body;

        if (!name || !dateOfBirth || !gender || !relationship) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const newDependent = {
            id: randomUUID(),
            patientCode: generatePatientCode(),
            name,
            dateOfBirth,
            gender,
            relationship,
            healthBasics: healthBasics || {
                allergies: [],
                chronicConditions: [],
                currentMedications: []
            }
        };

        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { dependents: newDependent } },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(201).json(newDependent);
    } catch (error) {
        console.error('Error creating dependent:', error);
        res.status(500).json({ error: 'Failed to create dependent' });
    }
};

export const listDependents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user;
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user.dependents || []);
    } catch (error) {
        console.error('Error listing dependents:', error);
        res.status(500).json({ error: 'Failed to list dependents' });
    }
};

export const updateDependent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const updates = req.body;

        // Cannot update ID
        delete updates.id;

        // Construct update object for array element
        const updateQuery: any = {};
        for (const key in updates) {
            updateQuery[`dependents.$.${key}`] = updates[key];
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, 'dependents.id': id },
            { $set: updateQuery },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ error: 'Dependent not found or user mismatch' });
            return;
        }

        const dependent = user.dependents?.find((d: any) => d.id === id);
        res.json(dependent);
    } catch (error) {
        console.error('Error updating dependent:', error);
        res.status(500).json({ error: 'Failed to update dependent' });
    }
};

export const deleteDependent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        console.log(`[DELETE] Request to delete dependent ${id} from user ${userId}`);

        const user = await User.findById(userId);

        if (!user) {
            console.log('[DELETE] User not found');
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if dependent exists
        const exists = user.dependents?.some(d => d.id === id);
        if (!exists) {
            console.log('[DELETE] Dependent not found in list');
            res.status(404).json({ error: 'Dependent not found' });
            return;
        }

        // Filter out the dependent
        if (user.dependents) {
            user.dependents = user.dependents.filter(d => d.id !== id);
        }

        await user.save();
        console.log('[DELETE] Successfully removed dependent');

        // Clean up associated consents
        await Consent.updateMany(
            { subjectProfileId: id, status: 'ACTIVE' },
            { status: 'REVOKED' }
        );
        console.log(`[DELETE] Revoked consents for dependent ${id}`);

        res.json({ message: 'Dependent deleted successfully' });
    } catch (error) {
        console.error('Error deleting dependent:', error);
        res.status(500).json({ error: 'Failed to delete dependent' });
    }
};
