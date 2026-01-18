import { Router } from 'express';
import { grantConsent, revokeConsent, getConsents } from '../controllers/consent.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, grantConsent);
router.get('/', authenticate, getConsents);
router.put('/:consentId/revoke', authenticate, revokeConsent);

export default router;
