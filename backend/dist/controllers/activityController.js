"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityById = exports.archiveActivities = exports.markActivitiesAsRead = exports.getActivityStats = exports.getRecentActivity = exports.getActivityFeed = void 0;
const activityService_1 = __importDefault(require("../services/activityService"));
const getActivityFeed = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { limit = 20, offset = 0, type, visibility } = req.query;
        if (!userId || !userRole) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const activities = await activityService_1.default.getActivityFeed(userId, userRole, {
            limit: Number(limit),
            offset: Number(offset),
            type: type,
            visibility: visibility
        });
        const response = {
            success: true,
            data: activities,
            message: 'Activity feed retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching activity feed:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch activity feed'
        };
        res.status(500).json(response);
    }
};
exports.getActivityFeed = getActivityFeed;
const getRecentActivity = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { limit = 10 } = req.query;
        if (!userId || !userRole) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const activities = await activityService_1.default.getRecentActivity(userId, userRole, Number(limit));
        const response = {
            success: true,
            data: activities,
            message: 'Recent activity retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching recent activity:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch recent activity'
        };
        res.status(500).json(response);
    }
};
exports.getRecentActivity = getRecentActivity;
const getActivityStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { period = 'week' } = req.query;
        if (!userId || !userRole) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const stats = await activityService_1.default.getActivityStats(userId, userRole, period);
        const response = {
            success: true,
            data: stats,
            message: 'Activity statistics retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching activity stats:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch activity statistics'
        };
        res.status(500).json(response);
    }
};
exports.getActivityStats = getActivityStats;
const markActivitiesAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { activityIds } = req.body;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!activityIds || !Array.isArray(activityIds)) {
            const response = {
                success: false,
                data: null,
                message: 'Activity IDs array is required'
            };
            return res.status(400).json(response);
        }
        const success = await activityService_1.default.markActivitiesAsRead(activityIds, userId);
        const response = {
            success: true,
            data: { success },
            message: success ? 'Activities marked as read' : 'Failed to mark activities as read'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error marking activities as read:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to mark activities as read'
        };
        res.status(500).json(response);
    }
};
exports.markActivitiesAsRead = markActivitiesAsRead;
const archiveActivities = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { activityIds } = req.body;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!activityIds || !Array.isArray(activityIds)) {
            const response = {
                success: false,
                data: null,
                message: 'Activity IDs array is required'
            };
            return res.status(400).json(response);
        }
        const success = await activityService_1.default.archiveActivities(activityIds, userId);
        const response = {
            success: true,
            data: { success },
            message: success ? 'Activities archived' : 'Failed to archive activities'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error archiving activities:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to archive activities'
        };
        res.status(500).json(response);
    }
};
exports.archiveActivities = archiveActivities;
const getActivityById = async (req, res) => {
    try {
        const { activityId } = req.params;
        const activity = await activityService_1.default.getActivityById(activityId);
        if (!activity) {
            const response = {
                success: false,
                data: null,
                message: 'Activity not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: activity,
            message: 'Activity retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching activity:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch activity'
        };
        res.status(500).json(response);
    }
};
exports.getActivityById = getActivityById;
//# sourceMappingURL=activityController.js.map