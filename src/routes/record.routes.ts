import express from 'express';
import { uploadRecord, getRecords, createPrescription, getOngoingMedicines } from '../controllers/record.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

router.use(authenticate); // Protect all routes

router.post('/', upload.single('file'), uploadRecord);
router.get('/', getRecords);

// Prescription Routes
router.post('/prescription', createPrescription);
router.get('/ongoing', getOngoingMedicines);

export default router;
