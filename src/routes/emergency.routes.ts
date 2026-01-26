
import express from 'express';
import { generateEmergencyToken, viewEmergencySnapshot } from '../controllers/emergency.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Patient generates a token (Protected)
router.post('/generate', authenticate, generateEmergencyToken);

// Doctor/EMT views snapshot (Public, secured by token)
router.get('/view/:token', viewEmergencySnapshot);

export default router;
