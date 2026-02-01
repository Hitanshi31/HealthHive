import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        let user: any = null;

        // Only attempt findById if it's a valid ObjectId (Primary Users)
        if (mongoose.Types.ObjectId.isValid(patientId)) {
            user = await User.findById(patientId).select('-passwordHash');
        }

        if (!user) {
            // Try identifying as Dependent
            const parentUser = await User.findOne({ 'dependents.id': patientId });
            if (parentUser && parentUser.dependents) {
                const dependent = parentUser.dependents.find(d => d.id === patientId);
                if (dependent) {
                    // Map to profile structure
                    user = {
                        _id: dependent.id,
                        fullName: dependent.name,
                        gender: dependent.gender,
                        phoneNumber: parentUser.phoneNumber, // Inherit or null
                        email: parentUser.email, // Inherit
                        role: 'DEPENDENT',
                        healthBasics: {
                            ...dependent.healthBasics,
                            dateOfBirth: dependent.dateOfBirth,
                            allergies: dependent.healthBasics?.allergies?.join(', ') || '',
                            chronicConditions: dependent.healthBasics?.chronicConditions?.join(', ') || '',
                            currentMedications: dependent.healthBasics?.currentMedications?.join(', ') || '',
                            bloodGroup: 'N/A'
                        },
                        womensHealth: (dependent as any).womensHealth,
                        emergencyContact: parentUser.emergencyContact, // Inherit default or null
                        patientCode: (dependent as any).patientCode,
                        createdAt: (dependent as any)._id?.getTimestamp ? (dependent as any)._id.getTimestamp() : new Date()
                    };
                }
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const updates = req.body; // Explicitly allowed fields handled by frontend or rigorous validation here

        // Basic protection: don't allow changing sensitive auth fields via this route
        delete updates.passwordHash;
        delete updates.email;
        delete updates.role;
        delete updates.patientCode; // Immutable

        const user = await User.findByIdAndUpdate(patientId, { $set: updates }, { new: true }).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
