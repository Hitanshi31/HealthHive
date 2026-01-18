import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import recordRoutes from './routes/record.routes';
import consentRoutes from './routes/consent.routes';
import emergencyRoutes from './routes/emergency.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/emergency', emergencyRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

export default app;
