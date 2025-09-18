"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ExerciseResult_1 = __importDefault(require("../models/ExerciseResult"));
const axios_1 = __importDefault(require("axios"));
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://localhost:8001";
const router = express_1.default.Router();
// POST: analyze pose and save result
router.post("/analyze", async (req, res) => {
    try {
        const { patientId, exercise, landmarks } = req.body;
        // Call Python ML backend
        const mlResponse = await axios_1.default.post(`${ML_BACKEND_URL}/predict`, {
            exercise,
            landmarks,
        });
        const { accuracy, feedback } = mlResponse.data;
        // Save result in MongoDB
        const newResult = new ExerciseResult_1.default({
            patientId,
            exercise,
            accuracy,
            feedback,
        });
        await newResult.save();
        res.json({
            message: "Exercise result saved",
            result: newResult,
        });
    }
    catch (err) {
        if (err instanceof Error) {
            console.error("Error saving result:", err.message);
        }
        else {
            console.error("Error saving result:", err);
        }
        res.status(500).json({ error: "Server error" });
    }
});
// GET: fetch results for a patient
router.get("/:patientId", async (req, res) => {
    try {
        const results = await ExerciseResult_1.default.find({
            patientId: req.params.patientId,
        }).sort({ createdAt: -1 });
        res.json(results);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch results" });
    }
});
exports.default = router;
//# sourceMappingURL=exerciseResults.js.map