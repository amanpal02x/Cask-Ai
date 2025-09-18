"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseService = void 0;
const mongoose_1 = require("mongoose");
const Exercise_1 = __importDefault(require("../models/Exercise"));
class ExerciseService {
    // Get all active exercises
    static async getExercises(filters) {
        const query = { isActive: true };
        if (filters?.difficulty) {
            query.difficulty = filters.difficulty;
        }
        if (filters?.category) {
            query.category = filters.category;
        }
        if (filters?.targetMuscles && filters.targetMuscles.length > 0) {
            query.targetMuscles = { $in: filters.targetMuscles };
        }
        if (filters?.search) {
            query.$text = { $search: filters.search };
        }
        const exercises = await Exercise_1.default.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        return exercises.map(exercise => ({
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        }));
    }
    // Get exercise by ID
    static async getExerciseById(exerciseId) {
        if (!mongoose_1.Types.ObjectId.isValid(exerciseId)) {
            return null;
        }
        const exercise = await Exercise_1.default.findOne({
            _id: exerciseId,
            isActive: true
        }).populate('createdBy', 'name email');
        if (!exercise) {
            return null;
        }
        return {
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        };
    }
    // Create new exercise (doctor only)
    static async createExercise(exerciseData, createdBy) {
        const exercise = new Exercise_1.default({
            ...exerciseData,
            createdBy: new mongoose_1.Types.ObjectId(createdBy)
        });
        await exercise.save();
        await exercise.populate('createdBy', 'name email');
        return {
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        };
    }
    // Update exercise
    static async updateExercise(exerciseId, updateData, updatedBy) {
        if (!mongoose_1.Types.ObjectId.isValid(exerciseId)) {
            return null;
        }
        const exercise = await Exercise_1.default.findOne({
            _id: exerciseId,
            isActive: true
        });
        if (!exercise) {
            return null;
        }
        // Update fields
        Object.assign(exercise, updateData);
        exercise.updatedAt = new Date();
        await exercise.save();
        await exercise.populate('createdBy', 'name email');
        return {
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        };
    }
    // Get or create default exercise for live sessions
    static async getOrCreateDefaultExercise(userId) {
        // First, try to find an existing default exercise
        let exercise = await Exercise_1.default.findOne({
            name: 'Live Exercise Session',
            createdBy: new mongoose_1.Types.ObjectId(userId)
        });
        if (!exercise) {
            // Create a new default exercise
            exercise = new Exercise_1.default({
                name: 'Live Exercise Session',
                description: 'Real-time exercise analysis session',
                instructions: [
                    'Position yourself in front of the camera',
                    'Start the session when ready',
                    'Follow the real-time feedback for proper form'
                ],
                difficulty: 'beginner',
                duration: 600, // 10 minutes
                targetMuscles: ['full body'],
                category: 'strength',
                poseLandmarks: {
                    keyPoints: ['nose', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
                    angles: [
                        {
                            name: 'elbow_angle',
                            points: ['shoulder', 'elbow', 'wrist'],
                            targetRange: [90, 180]
                        }
                    ],
                    repDetection: {
                        trigger: 'wrist',
                        direction: 'up',
                        threshold: 0.5
                    }
                },
                createdBy: new mongoose_1.Types.ObjectId(userId),
                isActive: true
            });
            await exercise.save();
        }
        return {
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        };
    }
    // Delete exercise (soft delete)
    static async deleteExercise(exerciseId) {
        if (!mongoose_1.Types.ObjectId.isValid(exerciseId)) {
            return false;
        }
        const result = await Exercise_1.default.updateOne({ _id: exerciseId }, { isActive: false, updatedAt: new Date() });
        return result.modifiedCount > 0;
    }
    // Get exercises by difficulty
    static async getExercisesByDifficulty(difficulty) {
        const exercises = await Exercise_1.default.find({
            difficulty,
            isActive: true
        })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        return exercises.map(exercise => ({
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        }));
    }
    // Get exercises by category
    static async getExercisesByCategory(category) {
        const exercises = await Exercise_1.default.find({
            category,
            isActive: true
        })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        return exercises.map(exercise => ({
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        }));
    }
    // Search exercises
    static async searchExercises(searchTerm) {
        const exercises = await Exercise_1.default.find({
            $text: { $search: searchTerm },
            isActive: true
        })
            .populate('createdBy', 'name email')
            .sort({ score: { $meta: 'textScore' } });
        return exercises.map(exercise => ({
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        }));
    }
    // Get exercises created by a specific doctor
    static async getExercisesByDoctor(doctorId) {
        if (!mongoose_1.Types.ObjectId.isValid(doctorId)) {
            return [];
        }
        const exercises = await Exercise_1.default.find({
            createdBy: new mongoose_1.Types.ObjectId(doctorId),
            isActive: true
        })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        return exercises.map(exercise => ({
            id: exercise._id.toString(),
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            targetMuscles: exercise.targetMuscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            category: exercise.category,
            equipment: exercise.equipment,
            caloriesPerMinute: exercise.caloriesPerMinute,
            createdAt: exercise.createdAt.toISOString(),
            updatedAt: exercise.updatedAt.toISOString()
        }));
    }
    // Get exercise statistics
    static async getExerciseStats(exerciseId) {
        if (!mongoose_1.Types.ObjectId.isValid(exerciseId)) {
            return null;
        }
        const ExerciseSession = require('../models/ExerciseSession').default;
        const stats = await ExerciseSession.aggregate([
            {
                $match: {
                    exerciseId: new mongoose_1.Types.ObjectId(exerciseId),
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    averageScore: { $avg: '$averageScore' },
                    totalReps: { $sum: '$totalReps' }
                }
            }
        ]);
        if (stats.length === 0) {
            return {
                totalSessions: 0,
                averageScore: 0,
                totalReps: 0,
                popularity: 0
            };
        }
        const stat = stats[0];
        // Calculate popularity based on recent usage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSessions = await ExerciseSession.countDocuments({
            exerciseId: new mongoose_1.Types.ObjectId(exerciseId),
            status: 'completed',
            startTime: { $gte: thirtyDaysAgo }
        });
        return {
            totalSessions: stat.totalSessions,
            averageScore: Math.round(stat.averageScore || 0),
            totalReps: stat.totalReps,
            popularity: recentSessions
        };
    }
}
exports.ExerciseService = ExerciseService;
exports.default = ExerciseService;
//# sourceMappingURL=exerciseService.js.map