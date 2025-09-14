import express from 'express';
import {
  getPatients,
  assignPatient,
  getPatientProgress,
  sendRecommendation,
  updatePatientSettings,
  getPatientDetails,
  removePatient
} from '../controllers/patientDoctorController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all patients assigned to doctor
router.get('/patients', getPatients);

// Assign patient to doctor
router.post('/assign', assignPatient);

// Get patient progress
router.get('/patients/:patientId/progress', getPatientProgress);

// Get patient details
router.get('/patients/:patientId', getPatientDetails);

// Send recommendation to patient
router.post('/patients/:patientId/recommendations', sendRecommendation);

// Update patient settings
router.put('/patients/:patientId/settings', updatePatientSettings);

// Remove patient assignment
router.delete('/patients/:patientId', removePatient);

export default router;
