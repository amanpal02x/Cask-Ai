"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Get notifications
router.get('/', notificationController_1.getNotifications);
// Get unread notification count
router.get('/unread-count', notificationController_1.getUnreadCount);
// Get notification statistics
router.get('/stats', notificationController_1.getNotificationStats);
// Mark notification as read
router.put('/:notificationId/read', notificationController_1.markAsRead);
// Mark multiple notifications as read
router.put('/mark-read', notificationController_1.markMultipleAsRead);
// Mark all notifications as read
router.put('/mark-all-read', notificationController_1.markAllAsRead);
// Archive notification
router.put('/:notificationId/archive', notificationController_1.archiveNotification);
// Delete notification
router.delete('/:notificationId', notificationController_1.deleteNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map