import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { enforceFHIRConsent } from '../middleware/fhirConsent';
import { getPatient, getDocumentReferences, createConsent } from '../controllers/fhir.controller';

const router = express.Router();

// Base Path: /api/fhir/v1

// All FHIR routes require Authentication AND Consent Enforcement
router.use(authenticate);
router.use(enforceFHIRConsent);

// 1. Patient Identity
router.get('/Patient/:id', getPatient);

// 2. Clinical Documents
router.get('/DocumentReference', getDocumentReferences);

// 3. Consent
router.post('/Consent', createConsent);

export default router;
