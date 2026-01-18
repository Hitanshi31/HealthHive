import { Router } from 'express';
import { uploadRecord, getRecords } from '../controllers/record.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, uploadRecord);
router.get('/', authenticate, getRecords);

export default router;
