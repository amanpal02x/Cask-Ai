"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activityController_1 = require("../controllers/activityController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Get activity feed
router.get('/', activityController_1.getActivityFeed);
// Get recent activity for dashboard
router.get('/recent', activityController_1.getRecentActivity);
// Get activity statistics
router.get('/stats', activityController_1.getActivityStats);
// Mark activities as read
router.put('/mark-read', activityController_1.markActivitiesAsRead);
// Archive activities
router.put('/archive', activityController_1.archiveActivities);
// Get specific activity
router.get('/:activityId', activityController_1.getActivityById);
exports.default = router;
//# sourceMappingURL=activities.js.map