
import { Request, Response } from 'express';
import { EmergencyService } from '../services/emergency.service';

export const generateEmergencyToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const result = await EmergencyService.generateSnapshot(userId);
        res.json(result);
    } catch (error: any) {
        console.error('Error generating emergency token:', error);
        res.status(500).json({ message: error.message });
    }
};

export const viewEmergencySnapshot = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const snapshot = await EmergencyService.getSnapshot(token);
        res.json(snapshot);
    } catch (error: any) {
        console.error('Error viewing emergency snapshot:', error);
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
            res.status(403).json({ message: 'Access denied: ' + error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};
