import { Router } from 'express';
import { getEmergencyProfile } from '../controllers/emergency.controller';

const router = Router();

router.get('/:qrToken', getEmergencyProfile);

export default router;
