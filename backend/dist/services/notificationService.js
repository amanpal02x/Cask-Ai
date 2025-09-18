"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = require("mongoose");
const Notification_1 = __importDefault(require("../models/Notification"));
const PatientDoctor_1 = __importDefault(require("../models/PatientDoctor"));
class NotificationService {
    // Get notifications for a user
    static async getNotifications(userId, options = {}) {
        const { limit = 20, offset = 0, isRead, type, priority } = options;
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const query = {
            recipientId: userObjectId,
            isArchived: false
        };
        if (typeof isRead === 'boolean') {
            query.isRead = isRead;
        }
        if (type) {
            query.type = type;
        }
        if (priority) {
            query['data.priority'] = priority;
        }
        // Filter out expired notifications
        query.$or = [
            { 'data.expiresAt': { $exists: false } },
            { 'data.expiresAt': { $gt: new Date() } }
        ];
        const notifications = await Notification_1.default.find(query)
            .populate('senderId', 'name email role')
            .populate('sessionId', 'averageScore')
            .populate('exerciseId', 'name')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
        return notifications.map(notification => ({
            id: notification._id.toString(),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            isRead: notification.isRead,
            readAt: notification.readAt?.toISOString(),
            createdAt: notification.createdAt.toISOString(),
            sender: notification.senderId ? {
                id: notification.senderId._id.toString(),
                name: notification.senderId.name,
                role: notification.senderId.role
            } : undefined,
            session: notification.sessionId ? {
                id: notification.sessionId._id.toString(),
                score: notification.sessionId.averageScore
            } : undefined,
            exercise: notification.exerciseId ? {
                id: notification.exerciseId._id.toString(),
                name: notification.exerciseId.name
            } : undefined
        }));
    }
    // Get unread notification count
    static async getUnreadCount(userId) {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        return Notification_1.default.countDocuments({
            recipientId: userObjectId,
            isRead: false,
            isArchived: false,
            $or: [
                { 'data.expiresAt': { $exists: false } },
                { 'data.expiresAt': { $gt: new Date() } }
            ]
        });
    }
    // Mark notification as read
    static async markAsRead(notificationId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            return false;
        }
        const result = await Notification_1.default.updateOne({
            _id: notificationId,
            recipientId: new mongoose_1.Types.ObjectId(userId)
        }, {
            isRead: true,
            readAt: new Date()
        });
        return result.modifiedCount > 0;
    }
    // Mark multiple notifications as read
    static async markMultipleAsRead(notificationIds, userId) {
        if (!notificationIds.length)
            return true;
        const objectIds = notificationIds
            .filter(id => mongoose_1.Types.ObjectId.isValid(id))
            .map(id => new mongoose_1.Types.ObjectId(id));
        if (objectIds.length === 0)
            return false;
        const result = await Notification_1.default.updateMany({
            _id: { $in: objectIds },
            recipientId: new mongoose_1.Types.ObjectId(userId)
        }, {
            isRead: true,
            readAt: new Date()
        });
        return result.modifiedCount > 0;
    }
    // Mark all notifications as read for a user
    static async markAllAsRead(userId) {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const result = await Notification_1.default.updateMany({
            recipientId: userObjectId,
            isRead: false,
            isArchived: false
        }, {
            isRead: true,
            readAt: new Date()
        });
        return result.modifiedCount > 0;
    }
    // Archive notification
    static async archiveNotification(notificationId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            return false;
        }
        const result = await Notification_1.default.updateOne({
            _id: notificationId,
            recipientId: new mongoose_1.Types.ObjectId(userId)
        }, { isArchived: true });
        return result.modifiedCount > 0;
    }
    // Create a new notification
    static async createNotification(notificationData) {
        const notification = new Notification_1.default({
            recipientId: new mongoose_1.Types.ObjectId(notificationData.recipientId),
            senderId: notificationData.senderId ? new mongoose_1.Types.ObjectId(notificationData.senderId) : undefined,
            sessionId: notificationData.sessionId ? new mongoose_1.Types.ObjectId(notificationData.sessionId) : undefined,
            exerciseId: notificationData.exerciseId ? new mongoose_1.Types.ObjectId(notificationData.exerciseId) : undefined,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || {},
            deliveryMethod: notificationData.deliveryMethod || ['in_app']
        });
        await notification.save();
        await notification.populate('senderId', 'name email role');
        await notification.populate('sessionId', 'averageScore');
        await notification.populate('exerciseId', 'name');
        return {
            id: notification._id.toString(),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            isRead: notification.isRead,
            readAt: notification.readAt?.toISOString(),
            createdAt: notification.createdAt.toISOString(),
            sender: notification.senderId ? {
                id: notification.senderId._id.toString(),
                name: notification.senderId.name,
                role: notification.senderId.role
            } : undefined,
            session: notification.sessionId ? {
                id: notification.sessionId._id.toString(),
                score: notification.sessionId.averageScore
            } : undefined,
            exercise: notification.exerciseId ? {
                id: notification.exerciseId._id.toString(),
                name: notification.exerciseId.name
            } : undefined
        };
    }
    // Create notification for all patients of a doctor
    static async createNotificationForDoctorPatients(doctorId, notificationData) {
        const doctorObjectId = new mongoose_1.Types.ObjectId(doctorId);
        // Get all active patients of the doctor
        const patientRelations = await PatientDoctor_1.default.find({
            doctorId: doctorObjectId,
            status: 'active'
        }).select('patientId');
        const patientIds = patientRelations.map(pd => pd.patientId);
        if (patientIds.length === 0) {
            return 0;
        }
        // Create notifications for all patients
        const notifications = patientIds.map(patientId => ({
            recipientId: patientId,
            senderId: doctorObjectId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || {},
            deliveryMethod: ['in_app']
        }));
        await Notification_1.default.insertMany(notifications);
        return notifications.length;
    }
    // Create notification for a specific patient's doctor
    static async createNotificationForPatientDoctor(patientId, notificationData) {
        const patientObjectId = new mongoose_1.Types.ObjectId(patientId);
        // Find the patient's active doctor
        const patientDoctor = await PatientDoctor_1.default.findOne({
            patientId: patientObjectId,
            status: 'active'
        }).select('doctorId');
        if (!patientDoctor) {
            return null;
        }
        return this.createNotification({
            recipientId: patientDoctor.doctorId.toString(),
            senderId: patientId,
            sessionId: notificationData.sessionId,
            exerciseId: notificationData.exerciseId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data
        });
    }
    // Send progress alert notification
    static async sendProgressAlert(patientId, sessionId, score, previousScore) {
        const message = previousScore
            ? `Exercise completed! Score: ${score}% (${score > previousScore ? 'improved' : 'decreased'} from ${previousScore}%)`
            : `Exercise completed! Score: ${score}%`;
        await this.createNotificationForPatientDoctor(patientId, {
            type: 'progress_alert',
            title: 'Exercise Progress Update',
            message,
            data: {
                priority: score < 60 ? 'high' : score < 80 ? 'medium' : 'low',
                category: 'progress',
                actionUrl: `/doctor/sessions/${sessionId}`,
                actionText: 'View Session',
                metadata: { score, previousScore }
            },
            sessionId
        });
    }
    // Send form feedback notification
    static async sendFormFeedback(patientId, sessionId, feedback) {
        await this.createNotificationForPatientDoctor(patientId, {
            type: 'form_feedback',
            title: 'Form Feedback Available',
            message: `New form feedback: ${feedback[0] || 'Check your form'}`,
            data: {
                priority: 'medium',
                category: 'feedback',
                actionUrl: `/doctor/sessions/${sessionId}`,
                actionText: 'View Feedback',
                metadata: { feedback }
            },
            sessionId
        });
    }
    // Send goal achievement notification
    static async sendGoalAchievement(patientId, goalType, achievement) {
        await this.createNotificationForPatientDoctor(patientId, {
            type: 'achievement',
            title: 'Goal Achieved!',
            message: `Patient achieved ${goalType}: ${achievement}`,
            data: {
                priority: 'medium',
                category: 'achievement',
                metadata: { goalType, achievement }
            }
        });
    }
    // Get notification statistics
    static async getNotificationStats(userId) {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const [total, unread, byType, byPriority] = await Promise.all([
            Notification_1.default.countDocuments({
                recipientId: userObjectId,
                isArchived: false
            }),
            Notification_1.default.countDocuments({
                recipientId: userObjectId,
                isRead: false,
                isArchived: false
            }),
            Notification_1.default.aggregate([
                {
                    $match: {
                        recipientId: userObjectId,
                        isArchived: false
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Notification_1.default.aggregate([
                {
                    $match: {
                        recipientId: userObjectId,
                        isArchived: false
                    }
                },
                {
                    $group: {
                        _id: '$data.priority',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        const typeStats = {};
        byType.forEach(item => {
            typeStats[item._id] = item.count;
        });
        const priorityStats = {};
        byPriority.forEach(item => {
            priorityStats[item._id || 'medium'] = item.count;
        });
        return {
            total,
            unread,
            byType: typeStats,
            byPriority: priorityStats
        };
    }
    // Delete notification
    static async deleteNotification(notificationId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            return false;
        }
        const result = await Notification_1.default.deleteOne({
            _id: notificationId,
            recipientId: new mongoose_1.Types.ObjectId(userId)
        });
        return result.deletedCount > 0;
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
//# sourceMappingURL=notificationService.js.map