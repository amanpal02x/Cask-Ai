"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const mongoose_1 = require("mongoose");
const ExerciseSession_1 = __importDefault(require("../models/ExerciseSession"));
const Activity_1 = __importDefault(require("../models/Activity"));
const Notification_1 = __importDefault(require("../models/Notification"));
class SessionService {
    // Start a new exercise session
    static async startSession(patientId, exerciseId, doctorId, deviceInfo) {
        // Validate ObjectIds
        if (!mongoose_1.Types.ObjectId.isValid(patientId)) {
            throw new Error('Invalid patient ID');
        }
        if (!mongoose_1.Types.ObjectId.isValid(exerciseId)) {
            throw new Error('Invalid exercise ID');
        }
        if (doctorId && !mongoose_1.Types.ObjectId.isValid(doctorId)) {
            throw new Error('Invalid doctor ID');
        }
        const session = new ExerciseSession_1.default({
            patientId: new mongoose_1.Types.ObjectId(patientId),
            doctorId: doctorId ? new mongoose_1.Types.ObjectId(doctorId) : undefined,
            exerciseId: new mongoose_1.Types.ObjectId(exerciseId),
            startTime: new Date(),
            status: 'active',
            deviceInfo
        });
        await session.save();
        // Create activity log
        await this.createActivity({
            userId: patientId,
            relatedUserId: doctorId,
            sessionId: session._id.toString(),
            exerciseId,
            type: 'exercise_started',
            title: 'Exercise Session Started',
            description: 'Started a new exercise session',
            metadata: { exerciseId },
            visibility: 'public'
        });
        return {
            id: session._id.toString(),
            exerciseId: exerciseId,
            userId: patientId,
            doctorId,
            startTime: session.startTime.toISOString(),
            endTime: null,
            duration: 0,
            status: session.status,
            score: null,
            reps: 0,
            feedback: null,
            videoUrl: null
        };
    }
    // End an exercise session
    static async endSession(sessionId, endData) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return null;
        }
        const session = await ExerciseSession_1.default.findById(sessionId);
        if (!session || session.status === 'completed') {
            return null;
        }
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
        // Update session
        Object.assign(session, {
            ...endData,
            endTime,
            duration,
            status: 'completed'
        });
        await session.save();
        // Create activity log
        await this.createActivity({
            userId: session.patientId.toString(),
            relatedUserId: session.doctorId?.toString(),
            sessionId: sessionId,
            exerciseId: session.exerciseId.toString(),
            type: 'exercise_completed',
            title: 'Exercise Session Completed',
            description: `Completed exercise session with ${endData.totalReps} reps and ${endData.averageScore}% average score`,
            metadata: {
                score: endData.averageScore,
                reps: endData.totalReps,
                duration,
                improvement: endData.improvementAreas.length > 0 ? endData.improvementAreas[0] : null
            },
            visibility: 'public'
        });
        // Send notification to doctor if assigned
        if (session.doctorId) {
            await this.createNotification({
                recipientId: session.doctorId.toString(),
                senderId: session.patientId.toString(),
                sessionId: sessionId,
                exerciseId: session.exerciseId.toString(),
                type: 'progress_alert',
                title: 'Patient Completed Exercise',
                message: `Patient completed exercise session with ${endData.averageScore}% score`,
                data: {
                    priority: 'medium',
                    category: 'progress',
                    actionUrl: `/doctor/sessions/${sessionId}`,
                    actionText: 'View Session',
                    metadata: {
                        score: endData.averageScore,
                        reps: endData.totalReps,
                        duration
                    }
                },
                deliveryMethod: ['in_app']
            });
        }
        return {
            id: session._id.toString(),
            exerciseId: session.exerciseId.toString(),
            userId: session.patientId.toString(),
            doctorId: session.doctorId?.toString(),
            startTime: session.startTime.toISOString(),
            endTime: session.endTime?.toISOString() || null,
            duration: session.duration || 0,
            status: session.status,
            score: session.averageScore || 0,
            reps: session.totalReps || 0,
            feedback: session.overallFeedback?.join(', ') || null,
            videoUrl: session.videoUrl || null
        };
    }
    // Add pose frame to session
    static async addPoseFrame(sessionId, frameData) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return false;
        }
        const session = await ExerciseSession_1.default.findById(sessionId);
        if (!session || session.status === 'completed') {
            return false;
        }
        session.poseFrames.push(frameData);
        await session.save();
        return true;
    }
    // Get session by ID
    static async getSession(sessionId) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return null;
        }
        const session = await ExerciseSession_1.default.findById(sessionId).populate('exerciseId', 'name description');
        if (!session) {
            return null;
        }
        return {
            id: session._id.toString(),
            exerciseId: session.exerciseId._id.toString(),
            userId: session.patientId.toString(),
            doctorId: session.doctorId?.toString(),
            startTime: session.startTime.toISOString(),
            endTime: session.endTime?.toISOString() || null,
            duration: session.duration || 0,
            status: session.status,
            score: session.averageScore || null,
            reps: session.totalReps || 0,
            feedback: session.feedback ? {
                overallScore: session.averageScore || 0,
                strengths: session.strengths || [],
                improvementAreas: session.improvementAreas || [],
                recommendations: session.recommendations || []
            } : null,
            videoUrl: session.videoUrl || null
        };
    }
    // Update session rep count
    static async updateSessionReps(sessionId, repCount) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return false;
        }
        const session = await ExerciseSession_1.default.findById(sessionId);
        if (!session) {
            return false;
        }
        session.totalReps = repCount;
        await session.save();
        return true;
    }
    // Get session by ID (alias for compatibility)
    static async getSessionById(sessionId) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return null;
        }
        const session = await ExerciseSession_1.default.findById(sessionId)
            .populate('exerciseId', 'name description')
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email');
        if (!session) {
            return null;
        }
        return {
            id: session._id.toString(),
            exerciseId: session.exerciseId._id.toString(),
            userId: session.patientId._id.toString(),
            doctorId: session.doctorId?._id.toString(),
            startTime: session.startTime.toISOString(),
            endTime: session.endTime?.toISOString() || null,
            duration: session.duration || 0,
            status: session.status,
            score: session.averageScore || 0,
            reps: session.totalReps || 0,
            feedback: session.overallFeedback?.join(', ') || null,
            videoUrl: session.videoUrl || null
        };
    }
    // Get user's session history
    static async getUserSessions(userId, options = {}) {
        const { limit = 10, offset = 0, exerciseId, status } = options;
        const query = { patientId: new mongoose_1.Types.ObjectId(userId) };
        if (exerciseId && mongoose_1.Types.ObjectId.isValid(exerciseId)) {
            query.exerciseId = new mongoose_1.Types.ObjectId(exerciseId);
        }
        if (status) {
            query.status = status;
        }
        const sessions = await ExerciseSession_1.default.find(query)
            .populate('exerciseId', 'name description')
            .populate('doctorId', 'name email')
            .sort({ startTime: -1 })
            .skip(offset)
            .limit(limit);
        return sessions.map(session => ({
            id: session._id.toString(),
            exerciseId: session.exerciseId._id.toString(),
            userId: session.patientId.toString(),
            doctorId: session.doctorId?._id.toString(),
            startTime: session.startTime.toISOString(),
            endTime: session.endTime?.toISOString() || null,
            duration: session.duration || 0,
            status: session.status,
            score: session.averageScore || 0,
            reps: session.totalReps || 0,
            feedback: session.overallFeedback?.join(', ') || null,
            videoUrl: session.videoUrl || null
        }));
    }
    // Get doctor's patient sessions
    static async getDoctorPatientSessions(doctorId, options = {}) {
        const { limit = 10, offset = 0, patientId, exerciseId } = options;
        const query = { doctorId: new mongoose_1.Types.ObjectId(doctorId) };
        if (patientId && mongoose_1.Types.ObjectId.isValid(patientId)) {
            query.patientId = new mongoose_1.Types.ObjectId(patientId);
        }
        if (exerciseId && mongoose_1.Types.ObjectId.isValid(exerciseId)) {
            query.exerciseId = new mongoose_1.Types.ObjectId(exerciseId);
        }
        const sessions = await ExerciseSession_1.default.find(query)
            .populate('exerciseId', 'name description')
            .populate('patientId', 'name email')
            .sort({ startTime: -1 })
            .skip(offset)
            .limit(limit);
        return sessions.map(session => ({
            id: session._id.toString(),
            exerciseId: session.exerciseId._id.toString(),
            userId: session.patientId._id.toString(),
            doctorId: session.doctorId?.toString(),
            startTime: session.startTime.toISOString(),
            endTime: session.endTime?.toISOString() || null,
            duration: session.duration || 0,
            status: session.status,
            score: session.averageScore || 0,
            reps: session.totalReps || 0,
            feedback: session.overallFeedback?.join(', ') || null,
            videoUrl: session.videoUrl || null
        }));
    }
    // Upload session video
    static async uploadSessionVideo(sessionId, videoUrl, thumbnailUrl) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return false;
        }
        const session = await ExerciseSession_1.default.findById(sessionId);
        if (!session) {
            return false;
        }
        session.videoUrl = videoUrl;
        if (thumbnailUrl) {
            session.thumbnailUrl = thumbnailUrl;
        }
        await session.save();
        // Create activity log
        await this.createActivity({
            userId: session.patientId.toString(),
            relatedUserId: session.doctorId?.toString(),
            sessionId: sessionId,
            exerciseId: session.exerciseId.toString(),
            type: 'session_uploaded',
            title: 'Session Video Uploaded',
            description: 'Uploaded video for exercise session',
            metadata: { videoUrl },
            visibility: 'public'
        });
        return true;
    }
    // Pause session
    static async pauseSession(sessionId) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return false;
        }
        const result = await ExerciseSession_1.default.updateOne({ _id: sessionId, status: 'active' }, { status: 'paused' });
        return result.modifiedCount > 0;
    }
    // Resume session
    static async resumeSession(sessionId) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return false;
        }
        const result = await ExerciseSession_1.default.updateOne({ _id: sessionId, status: 'paused' }, { status: 'active' });
        return result.modifiedCount > 0;
    }
    // Cancel session
    static async cancelSession(sessionId) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            return false;
        }
        const session = await ExerciseSession_1.default.findById(sessionId);
        if (!session || session.status === 'completed') {
            return false;
        }
        session.status = 'cancelled';
        session.endTime = new Date();
        await session.save();
        // Create activity log
        await this.createActivity({
            userId: session.patientId.toString(),
            relatedUserId: session.doctorId?.toString(),
            sessionId: sessionId,
            exerciseId: session.exerciseId.toString(),
            type: 'exercise_cancelled',
            title: 'Exercise Session Cancelled',
            description: 'Cancelled exercise session',
            metadata: { reason: 'user_cancelled' },
            visibility: 'public'
        });
        return true;
    }
    // Helper method to create activity
    static async createActivity(activityData) {
        const activity = new Activity_1.default({
            userId: new mongoose_1.Types.ObjectId(activityData.userId),
            relatedUserId: activityData.relatedUserId ? new mongoose_1.Types.ObjectId(activityData.relatedUserId) : undefined,
            sessionId: activityData.sessionId ? new mongoose_1.Types.ObjectId(activityData.sessionId) : undefined,
            exerciseId: activityData.exerciseId ? new mongoose_1.Types.ObjectId(activityData.exerciseId) : undefined,
            type: activityData.type,
            title: activityData.title,
            description: activityData.description,
            metadata: activityData.metadata,
            visibility: activityData.visibility
        });
        await activity.save();
    }
    // Helper method to create notification
    static async createNotification(notificationData) {
        const notification = new Notification_1.default({
            recipientId: new mongoose_1.Types.ObjectId(notificationData.recipientId),
            senderId: notificationData.senderId ? new mongoose_1.Types.ObjectId(notificationData.senderId) : undefined,
            sessionId: notificationData.sessionId ? new mongoose_1.Types.ObjectId(notificationData.sessionId) : undefined,
            exerciseId: notificationData.exerciseId ? new mongoose_1.Types.ObjectId(notificationData.exerciseId) : undefined,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data,
            deliveryMethod: notificationData.deliveryMethod
        });
        await notification.save();
    }
}
exports.SessionService = SessionService;
exports.default = SessionService;
//# sourceMappingURL=sessionService.js.map