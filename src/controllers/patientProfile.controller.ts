import { Request, Response } from 'express';
import User from '../models/User';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const user = await User.findById(patientId).select('-passwordHash');

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
