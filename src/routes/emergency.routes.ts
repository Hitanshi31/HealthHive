import { Router } from 'express';
import { getEmergencyProfile, generateQR } from '../controllers/emergency.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/generate', authenticate, generateQR);
router.get('/:qrToken', getEmergencyProfile);

export default router;
