"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.getNotificationStats = exports.archiveNotification = exports.markAllAsRead = exports.markMultipleAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const notificationService_1 = __importDefault(require("../services/notificationService"));
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit = 20, offset = 0, isRead, type, priority } = req.query;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const notifications = await notificationService_1.default.getNotifications(userId, {
            limit: Number(limit),
            offset: Number(offset),
            isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
            type: type,
            priority: priority
        });
        const response = {
            success: true,
            data: notifications,
            message: 'Notifications retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch notifications'
        };
        res.status(500).json(response);
    }
};
exports.getNotifications = getNotifications;
const getUnreadCount = async (req, res) => {
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
        const count = await notificationService_1.default.getUnreadCount(userId);
        const response = {
            success: true,
            data: { count },
            message: 'Unread count retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching unread count:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch unread count'
        };
        res.status(500).json(response);
    }
};
exports.getUnreadCount = getUnreadCount;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const success = await notificationService_1.default.markAsRead(notificationId, userId);
        const response = {
            success: true,
            data: { success },
            message: success ? 'Notification marked as read' : 'Failed to mark notification as read'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to mark notification as read'
        };
        res.status(500).json(response);
    }
};
exports.markAsRead = markAsRead;
const markMultipleAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notificationIds } = req.body;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        if (!notificationIds || !Array.isArray(notificationIds)) {
            const response = {
                success: false,
                data: null,
                message: 'Notification IDs array is required'
            };
            return res.status(400).json(response);
        }
        const success = await notificationService_1.default.markMultipleAsRead(notificationIds, userId);
        const response = {
            success: true,
            data: { success },
            message: success ? 'Notifications marked as read' : 'Failed to mark notifications as read'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error marking notifications as read:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to mark notifications as read'
        };
        res.status(500).json(response);
    }
};
exports.markMultipleAsRead = markMultipleAsRead;
const markAllAsRead = async (req, res) => {
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
        const success = await notificationService_1.default.markAllAsRead(userId);
        const response = {
            success: true,
            data: { success },
            message: success ? 'All notifications marked as read' : 'Failed to mark all notifications as read'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to mark all notifications as read'
        };
        res.status(500).json(response);
    }
};
exports.markAllAsRead = markAllAsRead;
const archiveNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const success = await notificationService_1.default.archiveNotification(notificationId, userId);
        const response = {
            success: true,
            data: { success },
            message: success ? 'Notification archived' : 'Failed to archive notification'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error archiving notification:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to archive notification'
        };
        res.status(500).json(response);
    }
};
exports.archiveNotification = archiveNotification;
const getNotificationStats = async (req, res) => {
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
        const stats = await notificationService_1.default.getNotificationStats(userId);
        const response = {
            success: true,
            data: stats,
            message: 'Notification statistics retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching notification stats:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch notification statistics'
        };
        res.status(500).json(response);
    }
};
exports.getNotificationStats = getNotificationStats;
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const success = await notificationService_1.default.deleteNotification(notificationId, userId);
        const response = {
            success: true,
            data: { success },
            message: success ? 'Notification deleted' : 'Failed to delete notification'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to delete notification'
        };
        res.status(500).json(response);
    }
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notificationController.js.map