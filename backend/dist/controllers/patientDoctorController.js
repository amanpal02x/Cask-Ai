"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectFromDoctor = exports.updateUserOnlineStatus = exports.getConnectionRequests = exports.getOnlineDoctors = exports.getPatientConnectionStatus = exports.createSuggestion = exports.getSuggestions = exports.getAllPatientProgress = exports.getDoctors = exports.removePatient = exports.getPatientDetails = exports.updatePatientSettings = exports.sendRecommendation = exports.getPatientProgress = exports.updateConnectionStatus = exports.cancelConnectionRequest = exports.requestDoctorConnection = exports.assignPatient = exports.getPatients = void 0;
const PatientDoctor_1 = __importDefault(require("../models/PatientDoctor"));
const User_1 = __importDefault(require("../models/User"));
const sessionService_1 = __importDefault(require("../services/sessionService"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const getPatients = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const patientRelations = await PatientDoctor_1.default.find({
            doctorId: doctorId,
            status: 'active'
        })
            .populate('patientId', 'name email role avatar createdAt')
            .sort({ lastInteraction: -1 });
        const patients = patientRelations.map(relation => ({
            id: relation.patientId._id.toString(),
            name: relation.patientId.name,
            email: relation.patientId.email,
            role: relation.patientId.role,
            avatar: relation.patientId.avatar,
            createdAt: relation.patientId.createdAt.toISOString(),
            lastInteraction: relation.lastInteraction?.toISOString(),
            totalSessions: relation.totalSessions || 0,
            averageScore: relation.averageScore || 0,
            status: relation.status
        }));
        const response = {
            success: true,
            data: patients,
            message: 'Patients retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching patients:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch patients'
        };
        res.status(500).json(response);
    }
};
exports.getPatients = getPatients;
const assignPatient = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId, assignmentReason } = req.body;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!patientId) {
            const response = {
                success: false,
                data: null,
                message: 'Patient ID is required'
            };
            return res.status(400).json(response);
        }
        // Check if patient exists
        const patient = await User_1.default.findById(patientId);
        if (!patient || patient.role !== 'patient') {
            const response = {
                success: false,
                data: null,
                message: 'Patient not found'
            };
            return res.status(404).json(response);
        }
        // Check if relationship already exists
        const existingRelation = await PatientDoctor_1.default.findOne({
            patientId: patientId,
            doctorId: doctorId
        });
        if (existingRelation) {
            const response = {
                success: false,
                data: null,
                message: 'Patient is already assigned to this doctor'
            };
            return res.status(400).json(response);
        }
        // Create new relationship
        const newRelation = new PatientDoctor_1.default({
            patientId: patientId,
            doctorId: doctorId,
            assignedBy: doctorId,
            assignmentReason: assignmentReason,
            status: 'active'
        });
        await newRelation.save();
        // Send notification to patient
        await notificationService_1.default.createNotification({
            recipientId: patientId,
            senderId: doctorId,
            type: 'info',
            title: 'Assigned to Doctor',
            message: 'You have been assigned to a doctor for personalized exercise guidance.',
            data: {
                priority: 'medium',
                category: 'assignment'
            }
        });
        const response = {
            success: true,
            data: { success: true },
            message: 'Patient assigned successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error assigning patient:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to assign patient'
        };
        res.status(500).json(response);
    }
};
exports.assignPatient = assignPatient;
const requestDoctorConnection = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { doctorId, requestReason } = req.body;
        if (!patientId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'Doctor ID is required'
            };
            return res.status(400).json(response);
        }
        // Check if doctor exists
        const doctor = await User_1.default.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            const response = {
                success: false,
                data: null,
                message: 'Doctor not found'
            };
            return res.status(404).json(response);
        }
        // Block only if already active or pending with the SAME doctor
        const existingRelation = await PatientDoctor_1.default.findOne({
            patientId: patientId,
            doctorId: doctorId,
            status: { $in: ['active', 'pending'] }
        });
        if (existingRelation) {
            const response = {
                success: false,
                data: null,
                message: 'Connection request already exists or you are already connected'
            };
            return res.status(400).json(response);
        }
        // If patient has a pending request with a DIFFERENT doctor, cancel it automatically
        await PatientDoctor_1.default.updateMany({ patientId: patientId, status: 'pending', doctorId: { $ne: doctorId } }, { $set: { status: 'terminated', endedAt: new Date() } });
        // Create new relationship with pending status
        const newRelation = new PatientDoctor_1.default({
            patientId: patientId,
            doctorId: doctorId,
            assignedBy: patientId,
            assignmentReason: requestReason || 'Patient requested connection',
            status: 'pending'
        });
        await newRelation.save();
        // Send notification to doctor
        await notificationService_1.default.createNotification({
            recipientId: doctorId,
            senderId: patientId,
            type: 'info',
            title: 'New Connection Request',
            message: `A patient has requested to connect with you for exercise guidance.`,
            data: {
                priority: 'medium',
                category: 'connection_request'
            }
        });
        const response = {
            success: true,
            data: { success: true },
            message: 'Connection request sent successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error requesting doctor connection:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to send connection request'
        };
        res.status(500).json(response);
    }
};
exports.requestDoctorConnection = requestDoctorConnection;
const cancelConnectionRequest = async (req, res) => {
    try {
        const patientId = req.user?.id;
        if (!patientId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const relation = await PatientDoctor_1.default.findOne({
            patientId,
            status: 'pending'
        });
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'No pending request found'
            };
            return res.status(404).json(response);
        }
        await relation.deleteOne();
        const response = {
            success: true,
            data: { success: true },
            message: 'Connection request cancelled'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error cancelling connection request:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to cancel request'
        };
        res.status(500).json(response);
    }
};
exports.cancelConnectionRequest = cancelConnectionRequest;
const updateConnectionStatus = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId } = req.params;
        const { status } = req.body;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!['pending', 'active', 'suspended', 'terminated'].includes(status)) {
            const response = {
                success: false,
                data: null,
                message: 'Invalid status'
            };
            return res.status(400).json(response);
        }
        // Find the relationship
        const relation = await PatientDoctor_1.default.findOne({
            patientId: patientId,
            doctorId: doctorId
        });
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'Connection not found'
            };
            return res.status(404).json(response);
        }
        // Update status
        relation.status = status;
        if (status === 'active') {
            relation.startedAt = new Date();
        }
        await relation.save();
        // Send notification to patient
        const notificationMessage = status === 'active'
            ? 'Your connection request has been approved! You can now communicate with your doctor.'
            : status === 'suspended'
                ? 'Your connection has been suspended. Please contact your doctor for more information.'
                : 'Your connection has been terminated.';
        await notificationService_1.default.createNotification({
            recipientId: patientId,
            senderId: doctorId,
            type: 'info',
            title: `Connection ${status === 'active' ? 'Approved' : status === 'suspended' ? 'Suspended' : 'Terminated'}`,
            message: notificationMessage,
            data: {
                priority: 'high',
                category: 'connection_update'
            }
        });
        const response = {
            success: true,
            data: { success: true },
            message: `Connection ${status} successfully`
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating connection status:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to update connection status'
        };
        res.status(500).json(response);
    }
};
exports.updateConnectionStatus = updateConnectionStatus;
const getPatientProgress = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId } = req.params;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Verify doctor-patient relationship
        const relation = await PatientDoctor_1.default.findOne({
            doctorId: doctorId,
            patientId: patientId,
            status: 'active'
        });
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'Patient not found or not assigned to you'
            };
            return res.status(404).json(response);
        }
        const sessions = await sessionService_1.default.getDoctorPatientSessions(doctorId, {
            patientId: patientId,
            limit: 50
        });
        const response = {
            success: true,
            data: sessions,
            message: 'Patient progress retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching patient progress:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch patient progress'
        };
        res.status(500).json(response);
    }
};
exports.getPatientProgress = getPatientProgress;
const sendRecommendation = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId } = req.params;
        const { message, type = 'recommendation' } = req.body;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!message) {
            const response = {
                success: false,
                data: null,
                message: 'Message is required'
            };
            return res.status(400).json(response);
        }
        // Verify doctor-patient relationship
        const relation = await PatientDoctor_1.default.findOne({
            doctorId: doctorId,
            patientId: patientId,
            status: 'active'
        });
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'Patient not found or not assigned to you'
            };
            return res.status(404).json(response);
        }
        // Send notification to patient
        await notificationService_1.default.createNotification({
            recipientId: patientId,
            senderId: doctorId,
            type: type,
            title: 'Doctor Recommendation',
            message: message,
            data: {
                priority: 'high',
                category: 'recommendation',
                metadata: { doctorId, timestamp: new Date().toISOString() }
            }
        });
        // Update last interaction
        relation.lastInteraction = new Date();
        await relation.save();
        const response = {
            success: true,
            data: { success: true },
            message: 'Recommendation sent successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error sending recommendation:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to send recommendation'
        };
        res.status(500).json(response);
    }
};
exports.sendRecommendation = sendRecommendation;
const updatePatientSettings = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId } = req.params;
        const { patientSettings, doctorSettings } = req.body;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Verify doctor-patient relationship
        const relation = await PatientDoctor_1.default.findOne({
            doctorId: doctorId,
            patientId: patientId,
            status: 'active'
        });
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'Patient not found or not assigned to you'
            };
            return res.status(404).json(response);
        }
        // Update settings
        if (patientSettings) {
            relation.patientSettings = { ...relation.patientSettings, ...patientSettings };
        }
        if (doctorSettings) {
            relation.doctorSettings = { ...relation.doctorSettings, ...doctorSettings };
        }
        await relation.save();
        const response = {
            success: true,
            data: { success: true },
            message: 'Patient settings updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating patient settings:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to update patient settings'
        };
        res.status(500).json(response);
    }
};
exports.updatePatientSettings = updatePatientSettings;
const getPatientDetails = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId } = req.params;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Get patient relationship with details
        const relation = await PatientDoctor_1.default.findOne({
            doctorId: doctorId,
            patientId: patientId,
            status: 'active'
        })
            .populate('patientId', 'name email role avatar createdAt');
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'Patient not found or not assigned to you'
            };
            return res.status(404).json(response);
        }
        const patientDetails = {
            id: relation.patientId._id.toString(),
            name: relation.patientId.name,
            email: relation.patientId.email,
            role: relation.patientId.role,
            avatar: relation.patientId.avatar,
            createdAt: relation.patientId.createdAt.toISOString(),
            lastInteraction: relation.lastInteraction?.toISOString(),
            totalSessions: relation.totalSessions || 0,
            averageScore: relation.averageScore || 0,
            status: relation.status,
            patientSettings: relation.patientSettings,
            doctorSettings: relation.doctorSettings,
            assignmentReason: relation.assignmentReason,
            startedAt: relation.startedAt.toISOString()
        };
        const response = {
            success: true,
            data: patientDetails,
            message: 'Patient details retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching patient details:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch patient details'
        };
        res.status(500).json(response);
    }
};
exports.getPatientDetails = getPatientDetails;
const removePatient = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId } = req.params;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Find and update relationship
        const relation = await PatientDoctor_1.default.findOneAndUpdate({
            doctorId: doctorId,
            patientId: patientId,
            status: 'active'
        }, {
            status: 'terminated',
            endedAt: new Date()
        }, { new: true });
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'Patient not found or not assigned to you'
            };
            return res.status(404).json(response);
        }
        // Send notification to patient
        await notificationService_1.default.createNotification({
            recipientId: patientId,
            senderId: doctorId,
            type: 'info',
            title: 'Doctor Assignment Ended',
            message: 'Your assignment with your doctor has been terminated.',
            data: {
                priority: 'medium',
                category: 'assignment'
            }
        });
        const response = {
            success: true,
            data: { success: true },
            message: 'Patient removed successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error removing patient:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to remove patient'
        };
        res.status(500).json(response);
    }
};
exports.removePatient = removePatient;
// Enhanced endpoints for the new functionality
const getDoctors = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Get all registered doctors (no isActive field in schema)
        const doctors = await User_1.default.find({
            role: 'doctor'
        }).select('name email role avatar specialization licenseNumber isOnline lastSeen');
        // Convert _id to id for frontend compatibility
        const doctorsWithId = doctors.map(doctor => ({
            id: doctor._id.toString(),
            name: doctor.name,
            email: doctor.email,
            role: doctor.role,
            avatar: doctor.avatar,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber,
            isOnline: doctor.isOnline,
            lastSeen: doctor.lastSeen
        }));
        const response = {
            success: true,
            data: doctorsWithId,
            message: 'Doctors retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching doctors:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch doctors'
        };
        res.status(500).json(response);
    }
};
exports.getDoctors = getDoctors;
const getAllPatientProgress = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Get all patients assigned to this doctor with their progress
        const relationships = await PatientDoctor_1.default.find({
            doctorId: doctorId,
            status: 'active'
        }).populate('patientId', 'name email');
        const progressData = relationships.map(rel => ({
            id: rel._id.toString(),
            patientId: rel.patientId._id.toString(),
            patientName: rel.patientId.name,
            totalSessions: rel.totalSessions || 0,
            averageScore: rel.averageScore || 0,
            lastSessionDate: rel.lastInteraction?.toISOString() || new Date().toISOString(),
            improvementRate: Math.random() * 20 + 5, // Mock data - would be calculated from actual progress
            currentStreak: Math.floor(Math.random() * 10) + 1, // Mock data
            weeklyGoal: rel.patientSettings?.weeklyTarget || 5,
            weeklyProgress: Math.floor(Math.random() * 7) // Mock data
        }));
        const response = {
            success: true,
            data: progressData,
            message: 'Patient progress retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching patient progress:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch patient progress'
        };
        res.status(500).json(response);
    }
};
exports.getAllPatientProgress = getAllPatientProgress;
const getSuggestions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Get all suggestions for this user (as doctor or patient)
        const user = await User_1.default.findById(userId);
        if (!user) {
            const response = {
                success: false,
                data: null,
                message: 'User not found'
            };
            return res.status(404).json(response);
        }
        // Mock suggestions data - in real implementation, this would come from a suggestions collection
        const suggestions = [
            {
                id: '1',
                doctorId: 'doctor1',
                doctorName: 'Dr. Smith',
                patientId: 'patient1',
                patientName: 'John Doe',
                suggestion: 'Try to maintain better posture during squats. Keep your chest up and back straight.',
                type: 'form',
                priority: 'high',
                status: 'pending',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                doctorId: 'doctor1',
                doctorName: 'Dr. Smith',
                patientId: 'patient1',
                patientName: 'John Doe',
                suggestion: 'Consider increasing your exercise frequency to 4 times per week for better results.',
                type: 'schedule',
                priority: 'medium',
                status: 'read',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        // Filter suggestions based on user role
        const filteredSuggestions = user.role === 'doctor'
            ? suggestions.filter(s => s.doctorId === userId)
            : suggestions.filter(s => s.patientId === userId);
        const response = {
            success: true,
            data: filteredSuggestions,
            message: 'Suggestions retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching suggestions:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch suggestions'
        };
        res.status(500).json(response);
    }
};
exports.getSuggestions = getSuggestions;
const createSuggestion = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { patientId, suggestion, type, priority } = req.body;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!patientId || !suggestion) {
            const response = {
                success: false,
                data: null,
                message: 'Patient ID and suggestion are required'
            };
            return res.status(400).json(response);
        }
        // Verify doctor-patient relationship
        const relation = await PatientDoctor_1.default.findOne({
            doctorId: doctorId,
            patientId: patientId,
            status: 'active'
        });
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'Patient not found or not assigned to you'
            };
            return res.status(404).json(response);
        }
        // Get doctor and patient names
        const doctor = await User_1.default.findById(doctorId);
        const patient = await User_1.default.findById(patientId);
        // Create suggestion (in real implementation, this would be saved to a suggestions collection)
        const newSuggestion = {
            id: Date.now().toString(),
            doctorId: doctorId,
            doctorName: doctor?.name || 'Unknown Doctor',
            patientId: patientId,
            patientName: patient?.name || 'Unknown Patient',
            suggestion: suggestion,
            type: type || 'general',
            priority: priority || 'medium',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        // Send notification to patient
        await notificationService_1.default.createNotification({
            recipientId: patientId,
            senderId: doctorId,
            type: 'info',
            title: 'New Suggestion',
            message: suggestion,
            data: {
                priority: priority || 'medium',
                category: 'suggestion',
                metadata: { suggestionId: newSuggestion.id, type: type || 'general' }
            }
        });
        // Update last interaction
        relation.lastInteraction = new Date();
        await relation.save();
        const response = {
            success: true,
            data: newSuggestion,
            message: 'Suggestion created successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error creating suggestion:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to create suggestion'
        };
        res.status(500).json(response);
    }
};
exports.createSuggestion = createSuggestion;
const getPatientConnectionStatus = async (req, res) => {
    try {
        const patientId = req.user?.id;
        if (!patientId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Check if patient has an active connection with any doctor
        const relation = await PatientDoctor_1.default.findOne({
            patientId: patientId,
            status: { $in: ['active', 'pending'] }
        }).populate('doctorId', 'name email specialization isOnline lastSeen');
        const connectionStatus = {
            isConnected: !!relation,
            doctor: relation ? {
                id: relation.doctorId._id.toString(),
                name: relation.doctorId.name,
                email: relation.doctorId.email,
                specialization: relation.doctorId.specialization,
                isOnline: relation.doctorId.isOnline || false,
                lastSeen: relation.doctorId.lastSeen?.toISOString() || null
            } : null,
            status: relation?.status || null,
            connectionDate: relation?.startedAt?.toISOString() || null
        };
        const response = {
            success: true,
            data: connectionStatus,
            message: 'Connection status retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching connection status:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch connection status'
        };
        res.status(500).json(response);
    }
};
exports.getPatientConnectionStatus = getPatientConnectionStatus;
const getOnlineDoctors = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Get all online doctors
        const doctors = await User_1.default.find({
            role: 'doctor',
            isOnline: true
        }).select('name email specialization licenseNumber isOnline lastSeen');
        // Convert _id to id for frontend compatibility
        const doctorsWithId = doctors.map(doctor => ({
            id: doctor._id.toString(),
            name: doctor.name,
            email: doctor.email,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber,
            isOnline: doctor.isOnline,
            lastSeen: doctor.lastSeen
        }));
        const response = {
            success: true,
            data: doctorsWithId,
            message: 'Online doctors retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching online doctors:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch online doctors'
        };
        res.status(500).json(response);
    }
};
exports.getOnlineDoctors = getOnlineDoctors;
const getConnectionRequests = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Get all pending connection requests for this doctor
        const requests = await PatientDoctor_1.default.find({
            doctorId: doctorId,
            status: 'pending'
        }).populate('patientId', 'name email avatar');
        const connectionRequests = requests.map(request => ({
            id: request._id.toString(),
            patientId: request.patientId._id.toString(),
            patientName: request.patientId.name,
            patientEmail: request.patientId.email,
            patientAvatar: request.patientId.avatar,
            assignmentReason: request.assignmentReason,
            requestedAt: request.createdAt.toISOString()
        }));
        const response = {
            success: true,
            data: connectionRequests,
            message: 'Connection requests retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching connection requests:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch connection requests'
        };
        res.status(500).json(response);
    }
};
exports.getConnectionRequests = getConnectionRequests;
const updateUserOnlineStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { isOnline } = req.body;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        await User_1.default.findByIdAndUpdate(userId, {
            isOnline: isOnline,
            lastSeen: new Date()
        });
        const response = {
            success: true,
            data: { success: true },
            message: 'Online status updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating online status:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to update online status'
        };
        res.status(500).json(response);
    }
};
exports.updateUserOnlineStatus = updateUserOnlineStatus;
const disconnectFromDoctor = async (req, res) => {
    try {
        const patientId = req.user?.id;
        if (!patientId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Find and update the active connection
        const relation = await PatientDoctor_1.default.findOneAndUpdate({
            patientId: patientId,
            status: { $in: ['active', 'pending'] }
        }, {
            status: 'terminated',
            endedAt: new Date()
        }, { new: true }).populate('doctorId', 'name email');
        if (!relation) {
            const response = {
                success: false,
                data: null,
                message: 'No active connection found'
            };
            return res.status(404).json(response);
        }
        // Send notification to doctor
        await notificationService_1.default.createNotification({
            recipientId: relation.doctorId._id.toString(),
            senderId: patientId,
            type: 'info',
            title: 'Patient Disconnected',
            message: `Patient has disconnected from your care.`,
            data: {
                priority: 'medium',
                category: 'connection_update'
            }
        });
        const response = {
            success: true,
            data: { success: true },
            message: 'Successfully disconnected from doctor'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error disconnecting from doctor:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to disconnect from doctor'
        };
        res.status(500).json(response);
    }
};
exports.disconnectFromDoctor = disconnectFromDoctor;
//# sourceMappingURL=patientDoctorController.js.map