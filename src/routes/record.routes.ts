import { Router } from 'express';
import { uploadRecord, getRecords } from '../controllers/record.controller';
import { authenticate } from '../middleware/auth.middleware';

import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadRecord);
router.get('/', authenticate, getRecords);

export default router;
