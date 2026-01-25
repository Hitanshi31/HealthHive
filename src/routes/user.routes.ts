import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { updateHealthBasics, getHealthBasics } from '../controllers/user.controller';

const router = express.Router();

router.use(authenticate);

// PUT /api/user/health-basics
router.put('/health-basics', updateHealthBasics);

// GET /api/user/:id/health-basics
router.get('/:id/health-basics', getHealthBasics);

export default router;
