import { Router } from 'express';
import { runSafetyCheck } from '../controllers/safety.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect with auth. 
// In future, could add role check like verifyDoctorOrOwner
router.post('/check/:patientId', authenticate, runSafetyCheck);

export default router;
