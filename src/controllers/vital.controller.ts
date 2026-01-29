import { Request, Response } from 'express';
import Vital from '../models/Vital';

export const addVital = async (req: Request, res: Response) => {
    try {
        const { patientId, type, value, unit, source, timestamp, metadata } = req.body;

        const newVital = new Vital({
            patientId,
            type,
            value,
            unit,
            source,
            timestamp: timestamp || new Date(),
            metadata
        });

        const savedVital = await newVital.save();
        res.status(201).json(savedVital);
    } catch (error) {
        console.error('Error adding vital:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getVitals = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        // Fetch last 100 records for performance, sorted by timestamp desc
        const vitals = await Vital.find({ patientId }).sort({ timestamp: -1 }).limit(100);
        res.status(200).json(vitals);
    } catch (error) {
        console.error('Error fetching vitals:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
