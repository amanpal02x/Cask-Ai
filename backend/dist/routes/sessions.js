"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionController_1 = require("../controllers/sessionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All session routes require authentication
router.use(auth_1.authMiddleware);
router.post('/start', sessionController_1.startSession);
router.post('/:sessionId/end', sessionController_1.endSession);
router.get('/history', sessionController_1.getSessionHistory);
router.get('/:sessionId', sessionController_1.getSession);
router.post('/:sessionId/video', sessionController_1.uploadSessionVideo);
router.post('/:sessionId/analyze', sessionController_1.analyzeFrame);
exports.default = router;
//# sourceMappingURL=sessions.js.map