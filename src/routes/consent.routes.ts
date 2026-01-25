import { Router } from 'express';
import { grantConsent, revokeConsent, getConsents, getDoctorPatients } from '../controllers/consent.controller';
import { authenticate as authMiddleware, authorize as checkRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, grantConsent);
// Get list of actively consented patients for a doctor
router.get('/doctor-patients', authMiddleware, checkRole(['DOCTOR']), getDoctorPatients);

router.get('/', authMiddleware, getConsents);
// router.get('/:id', authMiddleware, getConsent);
router.put('/:consentId/revoke', authMiddleware, revokeConsent);

export default router;
