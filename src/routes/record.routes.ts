import express from 'express';
import { uploadRecord, getRecords, createPrescription, getOngoingMedicines, deleteRecord, retryAIProcessing } from '../controllers/record.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// All routes below this point will be protected by the authenticate middleware
router.use(authenticate);

router.post('/', upload.single('file'), uploadRecord);
router.get('/', getRecords);
router.delete('/:id', deleteRecord); // Add Delete Route
router.post('/:id/retry', retryAIProcessing); // New Route

// Prescription Routes
router.post('/prescription', createPrescription);
router.get('/ongoing', getOngoingMedicines);

export default router;
