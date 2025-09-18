"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All dashboard routes require authentication
router.use(auth_1.authMiddleware);
router.get('/stats', dashboardController_1.getDashboardStats);
router.get('/progress', dashboardController_1.getProgressData);
exports.default = router;
//# sourceMappingURL=dashboard.js.map