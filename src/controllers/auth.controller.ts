import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Helper to generate short patient code
const generatePatientCode = () => {
    return 'HH-PAT-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

// Helper to generate short doctor code
const generateDoctorCode = () => {
    return 'DOC-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        const patientCode = role === 'PATIENT' ? generatePatientCode() : undefined;
        const doctorCode = role === 'DOCTOR' ? generateDoctorCode() : undefined;

        const user = await User.create({
            email,
            passwordHash,
            role,
            patientCode,
            doctorCode
        });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User created',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                patientCode: user.patientCode,
                doctorCode: user.doctorCode
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            userId: user._id,
            role: user.role,
            patientCode: user.patientCode,
            doctorCode: user.doctorCode,
            hasSeenBasicsPrompt: user.hasSeenBasicsPrompt,
            healthBasics: user.healthBasics
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Login failed' });
    }
};
