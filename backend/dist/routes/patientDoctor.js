"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patientDoctorController_1 = require("../controllers/patientDoctorController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Get all patients assigned to doctor
router.get('/patients', patientDoctorController_1.getPatients);
// Assign patient to doctor
router.post('/assign', patientDoctorController_1.assignPatient);
// Patient requests connection to doctor
router.post('/request-connection', patientDoctorController_1.requestDoctorConnection);
// Patient cancels pending connection request
router.post('/cancel-connection', patientDoctorController_1.cancelConnectionRequest);
// Update connection status (approve/deny/suspend)
router.put('/patients/:patientId/status', patientDoctorController_1.updateConnectionStatus);
// Get patient progress
router.get('/patients/:patientId/progress', patientDoctorController_1.getPatientProgress);
// Get patient details
router.get('/patients/:patientId', patientDoctorController_1.getPatientDetails);
// Send recommendation to patient
router.post('/patients/:patientId/recommendations', patientDoctorController_1.sendRecommendation);
// Update patient settings
router.put('/patients/:patientId/settings', patientDoctorController_1.updatePatientSettings);
// Remove patient assignment
router.delete('/patients/:patientId', patientDoctorController_1.removePatient);
// Enhanced endpoints
router.get('/doctors', patientDoctorController_1.getDoctors);
router.get('/online-doctors', patientDoctorController_1.getOnlineDoctors);
router.get('/progress', patientDoctorController_1.getAllPatientProgress);
router.get('/suggestions', patientDoctorController_1.getSuggestions);
router.post('/suggestions', patientDoctorController_1.createSuggestion);
router.get('/connection-status', patientDoctorController_1.getPatientConnectionStatus);
router.get('/connection-requests', patientDoctorController_1.getConnectionRequests);
router.put('/online-status', patientDoctorController_1.updateUserOnlineStatus);
router.post('/disconnect', patientDoctorController_1.disconnectFromDoctor);
exports.default = router;
//# sourceMappingURL=patientDoctor.js.map