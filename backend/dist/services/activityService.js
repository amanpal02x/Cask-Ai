"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const mongoose_1 = require("mongoose");
const Activity_1 = __importDefault(require("../models/Activity"));
const PatientDoctor_1 = __importDefault(require("../models/PatientDoctor"));
class ActivityService {
    // Get activity feed for a user
    static async getActivityFeed(userId, userRole, options = {}) {
        const { limit = 20, offset = 0, type, visibility } = options;
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        let query = {};
        if (userRole === 'patient') {
            // Patients see their own activities and public activities from their doctor
            const patientDoctorRelations = await PatientDoctor_1.default.find({
                patientId: userObjectId,
                status: 'active'
            }).select('doctorId');
            const doctorIds = patientDoctorRelations.map(pd => pd.doctorId);
            query = {
                $or: [
                    { userId: userObjectId },
                    {
                        relatedUserId: { $in: doctorIds },
                        visibility: { $in: ['public', 'patient_only'] }
                    }
                ]
            };
        }
        else {
            // Doctors see activities from their patients
            const doctorPatientRelations = await PatientDoctor_1.default.find({
                doctorId: userObjectId,
                status: 'active'
            }).select('patientId');
            const patientIds = doctorPatientRelations.map(pd => pd.patientId);
            query = {
                $or: [
                    { userId: { $in: patientIds } },
                    {
                        relatedUserId: userObjectId,
                        visibility: { $in: ['public', 'doctor_only'] }
                    }
                ]
            };
        }
        if (type) {
            query.type = type;
        }
        if (visibility) {
            query.visibility = visibility;
        }
        const activities = await Activity_1.default.find(query)
            .populate('userId', 'name email role')
            .populate('relatedUserId', 'name email role')
            .populate('sessionId', 'averageScore totalReps')
            .populate('exerciseId', 'name')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
        return activities.map(activity => ({
            id: activity._id.toString(),
            type: activity.type,
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata,
            createdAt: activity.createdAt.toISOString(),
            user: activity.userId ? {
                id: activity.userId._id.toString(),
                name: activity.userId.name,
                role: activity.userId.role
            } : undefined,
            session: activity.sessionId ? {
                id: activity.sessionId._id.toString(),
                score: activity.sessionId.averageScore,
                reps: activity.sessionId.totalReps
            } : undefined,
            exercise: activity.exerciseId ? {
                id: activity.exerciseId._id.toString(),
                name: activity.exerciseId.name
            } : undefined
        }));
    }
    // Get recent activity for dashboard
    static async getRecentActivity(userId, userRole, limit = 10) {
        return this.getActivityFeed(userId, userRole, { limit });
    }
    // Create a new activity
    static async createActivity(activityData) {
        const activity = new Activity_1.default({
            userId: new mongoose_1.Types.ObjectId(activityData.userId),
            relatedUserId: activityData.relatedUserId ? new mongoose_1.Types.ObjectId(activityData.relatedUserId) : undefined,
            sessionId: activityData.sessionId ? new mongoose_1.Types.ObjectId(activityData.sessionId) : undefined,
            exerciseId: activityData.exerciseId ? new mongoose_1.Types.ObjectId(activityData.exerciseId) : undefined,
            type: activityData.type,
            title: activityData.title,
            description: activityData.description,
            metadata: activityData.metadata || {},
            visibility: (activityData.visibility || 'public'),
            targetRoles: activityData.targetRoles || []
        });
        await activity.save();
        await activity.populate('userId', 'name email role');
        await activity.populate('sessionId', 'averageScore totalReps');
        await activity.populate('exerciseId', 'name');
        return {
            id: activity._id.toString(),
            type: activity.type,
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata,
            createdAt: activity.createdAt.toISOString(),
            user: activity.userId ? {
                id: activity.userId._id.toString(),
                name: activity.userId.name,
                role: activity.userId.role
            } : undefined,
            session: activity.sessionId ? {
                id: activity.sessionId._id.toString(),
                score: activity.sessionId.averageScore,
                reps: activity.sessionId.totalReps
            } : undefined,
            exercise: activity.exerciseId ? {
                id: activity.exerciseId._id.toString(),
                name: activity.exerciseId.name
            } : undefined
        };
    }
    // Get activity statistics
    static async getActivityStats(userId, userRole, period = 'week') {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const now = new Date();
        let startDate;
        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        let query = {
            createdAt: { $gte: startDate }
        };
        if (userRole === 'patient') {
            query.userId = userObjectId;
        }
        else {
            // For doctors, get activities from their patients
            const doctorPatientRelations = await PatientDoctor_1.default.find({
                doctorId: userObjectId,
                status: 'active'
            }).select('patientId');
            const patientIds = doctorPatientRelations.map(pd => pd.patientId);
            query.userId = { $in: patientIds };
        }
        const [currentPeriodStats, previousPeriodStats] = await Promise.all([
            Activity_1.default.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalActivities: { $sum: 1 },
                        activitiesByType: { $push: '$type' }
                    }
                }
            ]),
            Activity_1.default.aggregate([
                {
                    $match: {
                        ...query,
                        createdAt: {
                            $gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
                            $lt: startDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalActivities: { $sum: 1 }
                    }
                }
            ])
        ]);
        const currentStats = currentPeriodStats[0] || { totalActivities: 0, activitiesByType: [] };
        const previousStats = previousPeriodStats[0] || { totalActivities: 0 };
        // Count activities by type
        const activitiesByType = {};
        currentStats.activitiesByType.forEach((type) => {
            activitiesByType[type] = (activitiesByType[type] || 0) + 1;
        });
        // Determine trend
        let recentTrend = 'stable';
        if (currentStats.totalActivities > previousStats.totalActivities) {
            recentTrend = 'up';
        }
        else if (currentStats.totalActivities < previousStats.totalActivities) {
            recentTrend = 'down';
        }
        return {
            totalActivities: currentStats.totalActivities,
            activitiesByType,
            recentTrend
        };
    }
    // Mark activities as read
    static async markActivitiesAsRead(activityIds, userId) {
        if (!activityIds.length)
            return true;
        const objectIds = activityIds
            .filter(id => mongoose_1.Types.ObjectId.isValid(id))
            .map(id => new mongoose_1.Types.ObjectId(id));
        if (objectIds.length === 0)
            return false;
        const result = await Activity_1.default.updateMany({
            _id: { $in: objectIds },
            userId: new mongoose_1.Types.ObjectId(userId)
        }, { isRead: true });
        return result.modifiedCount > 0;
    }
    // Archive activities
    static async archiveActivities(activityIds, userId) {
        if (!activityIds.length)
            return true;
        const objectIds = activityIds
            .filter(id => mongoose_1.Types.ObjectId.isValid(id))
            .map(id => new mongoose_1.Types.ObjectId(id));
        if (objectIds.length === 0)
            return false;
        const result = await Activity_1.default.updateMany({
            _id: { $in: objectIds },
            userId: new mongoose_1.Types.ObjectId(userId)
        }, { isArchived: true });
        return result.modifiedCount > 0;
    }
    // Get activity by ID
    static async getActivityById(activityId) {
        if (!mongoose_1.Types.ObjectId.isValid(activityId)) {
            return null;
        }
        const activity = await Activity_1.default.findById(activityId)
            .populate('userId', 'name email role')
            .populate('relatedUserId', 'name email role')
            .populate('sessionId', 'averageScore totalReps')
            .populate('exerciseId', 'name');
        if (!activity) {
            return null;
        }
        return {
            id: activity._id.toString(),
            type: activity.type,
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata,
            createdAt: activity.createdAt.toISOString(),
            user: activity.userId ? {
                id: activity.userId._id.toString(),
                name: activity.userId.name,
                role: activity.userId.role
            } : undefined,
            session: activity.sessionId ? {
                id: activity.sessionId._id.toString(),
                score: activity.sessionId.averageScore,
                reps: activity.sessionId.totalReps
            } : undefined,
            exercise: activity.exerciseId ? {
                id: activity.exerciseId._id.toString(),
                name: activity.exerciseId.name
            } : undefined
        };
    }
    // Delete activity (admin only)
    static async deleteActivity(activityId) {
        if (!mongoose_1.Types.ObjectId.isValid(activityId)) {
            return false;
        }
        const result = await Activity_1.default.deleteOne({ _id: activityId });
        return result.deletedCount > 0;
    }
}
exports.ActivityService = ActivityService;
exports.default = ActivityService;
//# sourceMappingURL=activityService.js.map