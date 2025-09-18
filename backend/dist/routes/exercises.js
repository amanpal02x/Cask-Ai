"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exerciseController_1 = require("../controllers/exerciseController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All exercise routes require authentication
router.use(auth_1.authMiddleware);
router.get('/', exerciseController_1.getExercises);
router.get('/:id', exerciseController_1.getExercise);
router.post('/', exerciseController_1.createExercise);
router.put('/:id', exerciseController_1.updateExercise);
router.delete('/:id', exerciseController_1.deleteExercise);
router.post('/seed', exerciseController_1.seedExercises);
exports.default = router;
//# sourceMappingURL=exercises.js.map