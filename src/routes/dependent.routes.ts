import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createDependent, listDependents, updateDependent, deleteDependent } from '../controllers/dependent.controller';

const router = express.Router();

router.use(authenticate); // Protect all routes

router.post('/', createDependent);
router.get('/', listDependents);
router.put('/:id', updateDependent);
router.delete('/:id', deleteDependent);

export default router;
