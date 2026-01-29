import express from 'express';
import { getProfile, updateProfile } from '../controllers/patientProfile.controller';

const router = express.Router();

router.get('/:patientId', getProfile);
router.put('/:patientId', updateProfile);

export default router;
