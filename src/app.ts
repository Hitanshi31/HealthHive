import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import recordRoutes from './routes/record.routes';
import consentRoutes from './routes/consent.routes';
import emergencyRoutes from './routes/emergency.routes';
import fhirRoutes from './routes/fhir.routes';
import userRoutes from './routes/user.routes';
import dependentRoutes from './routes/dependent.routes';
import vitalRoutes from './routes/vital.routes';
import patientProfileRoutes from './routes/patientProfile.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/fhir/v1', fhirRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dependents', dependentRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/profile', patientProfileRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

export default app;
