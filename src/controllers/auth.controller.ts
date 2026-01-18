import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper to generate short patient code
const generatePatientCode = () => {
    return 'HH-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

// Helper to generate short doctor code
const generateDoctorCode = () => {
    return 'DOC-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const patientCode = role === 'PATIENT' ? generatePatientCode() : null;
        const doctorCode = role === 'DOCTOR' ? generateDoctorCode() : null;

        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                role,
                patientCode,
                doctorCode
            } as any, // Cast to any to bypass stale Prisma types
        });

        res.status(201).json({
            message: 'User created',
            userId: user.id,
            patientCode: (user as any).patientCode,
            doctorCode: (user as any).doctorCode
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            userId: user.id,
            role: user.role,
            patientCode: (user as any).patientCode,
            doctorCode: (user as any).doctorCode
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
