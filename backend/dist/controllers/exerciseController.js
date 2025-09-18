"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedExercises = exports.analyzeExercise = exports.deleteExercise = exports.updateExercise = exports.createExercise = exports.getExercise = exports.getExercises = void 0;
const mlService_1 = require("../services/mlService");
const exerciseService_1 = __importDefault(require("../services/exerciseService"));
const sessionService_1 = __importDefault(require("../services/sessionService"));
const exerciseSeedService_1 = require("../services/exerciseSeedService");
// =======================
// CRUD for Exercises
// =======================
const getExercises = async (req, res) => {
    try {
        const { difficulty, category, targetMuscles, search } = req.query;
        const filters = {};
        if (difficulty)
            filters.difficulty = difficulty;
        if (category)
            filters.category = category;
        if (targetMuscles)
            filters.targetMuscles = Array.isArray(targetMuscles) ? targetMuscles : [targetMuscles];
        if (search)
            filters.search = search;
        const exercises = await exerciseService_1.default.getExercises(filters);
        const response = {
            success: true,
            data: exercises,
            message: "Exercises retrieved successfully",
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching exercises:", error);
        const response = {
            success: false,
            data: null,
            message: "Failed to fetch exercises",
        };
        res.status(500).json(response);
    }
};
exports.getExercises = getExercises;
const getExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const exercise = await exerciseService_1.default.getExerciseById(id);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Exercise not found",
            });
        }
        const response = {
            success: true,
            data: exercise,
            message: "Exercise retrieved successfully",
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching exercise:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to fetch exercise",
        });
    }
};
exports.getExercise = getExercise;
const createExercise = async (req, res) => {
    try {
        const exerciseData = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                message: "User not authenticated",
            });
        }
        const newExercise = await exerciseService_1.default.createExercise(exerciseData, userId);
        const response = {
            success: true,
            data: newExercise,
            message: "Exercise created successfully",
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("Error creating exercise:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to create exercise",
        });
    }
};
exports.createExercise = createExercise;
const updateExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                message: "User not authenticated",
            });
        }
        const updatedExercise = await exerciseService_1.default.updateExercise(id, updateData, userId);
        if (!updatedExercise) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Exercise not found",
            });
        }
        const response = {
            success: true,
            data: updatedExercise,
            message: "Exercise updated successfully",
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error updating exercise:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to update exercise",
        });
    }
};
exports.updateExercise = updateExercise;
const deleteExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await exerciseService_1.default.deleteExercise(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Exercise not found",
            });
        }
        const response = {
            success: true,
            data: null,
            message: "Exercise deleted successfully",
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error deleting exercise:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to delete exercise",
        });
    }
};
exports.deleteExercise = deleteExercise;
// =======================
// Analyze Exercise (ML + DB)
// =======================
const analyzeExercise = async (req, res) => {
    try {
        const { sessionId, landmarks, exercise } = req.body;
        if (!sessionId || !landmarks) {
            return res.status(400).json({
                success: false,
                message: "Session ID and landmarks are required"
            });
        }
        // Call Python ML backend
        const result = await (0, mlService_1.analyzePose)(landmarks);
        // Add pose frame to session
        const frameData = {
            timestamp: Date.now(),
            landmarks: landmarks,
            angles: result.angles || {},
            isCorrectForm: result.accuracy > 70,
            confidence: result.accuracy / 100
        };
        await sessionService_1.default.addPoseFrame(sessionId, frameData);
        const response = {
            success: true,
            data: {
                accuracy: result.accuracy,
                feedback: result.feedback,
                angles: result.angles,
                isCorrectForm: frameData.isCorrectForm,
                confidence: frameData.confidence
            }
        };
        res.json(response);
    }
    catch (err) {
        console.error("Error analyzing exercise:", err);
        res.status(500).json({
            success: false,
            message: "Failed to analyze exercise",
            error: err.message
        });
    }
};
exports.analyzeExercise = analyzeExercise;
// =======================
// Seed Exercises
// =======================
const seedExercises = async (req, res) => {
    try {
        await exerciseSeedService_1.ExerciseSeedService.seedExercises();
        const response = {
            success: true,
            data: null,
            message: "Exercises seeded successfully",
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error seeding exercises:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to seed exercises",
        });
    }
};
exports.seedExercises = seedExercises;
//# sourceMappingURL=exerciseController.js.map