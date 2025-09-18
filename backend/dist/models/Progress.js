"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ExerciseProgressSchema = new mongoose_1.Schema({
    exerciseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    sessionsCompleted: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, min: 0, max: 100 },
    totalReps: { type: Number, default: 0, min: 0 },
    improvement: { type: Number, default: 0 }
}, { _id: false });
const FormErrorSchema = new mongoose_1.Schema({
    error: { type: String, required: true },
    frequency: { type: Number, required: true, min: 0 },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true }
}, { _id: false });
const FormImprovementSchema = new mongoose_1.Schema({
    area: { type: String, required: true },
    improvement: { type: Number, required: true },
    description: { type: String, required: true }
}, { _id: false });
const GoalsSchema = new mongoose_1.Schema({
    targetSessions: { type: Number, min: 0 },
    targetScore: { type: Number, min: 0, max: 100 },
    targetReps: { type: Number, min: 0 },
    sessionsAchieved: { type: Boolean, default: false },
    scoreAchieved: { type: Boolean, default: false },
    repsAchieved: { type: Boolean, default: false }
}, { _id: false });
const ProgressSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exerciseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Exercise'
    },
    // Time period
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    // Performance metrics
    totalSessions: { type: Number, default: 0, min: 0 },
    totalDuration: { type: Number, default: 0, min: 0 },
    totalReps: { type: Number, default: 0, min: 0 },
    // Scores and quality
    averageScore: { type: Number, min: 0, max: 100 },
    maxScore: { type: Number, min: 0, max: 100 },
    minScore: { type: Number, min: 0, max: 100 },
    scoreImprovement: { type: Number, default: 0 },
    // Exercise-specific progress
    exerciseProgress: [ExerciseProgressSchema],
    // Form analysis
    formAnalysis: {
        commonErrors: [FormErrorSchema],
        improvements: [FormImprovementSchema]
    },
    // Goals and achievements
    goals: GoalsSchema,
    // Streak information
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
// Indexes for better performance
ProgressSchema.index({ patientId: 1, period: 1, periodStart: -1 });
ProgressSchema.index({ patientId: 1, periodEnd: -1 });
ProgressSchema.index({ exerciseId: 1, period: 1 });
ProgressSchema.index({ periodStart: 1, periodEnd: 1 });
// Compound indexes for common queries
ProgressSchema.index({ patientId: 1, period: 1, periodStart: 1, periodEnd: 1 }, { unique: true });
const Progress = mongoose_1.default.models.Progress || mongoose_1.default.model('Progress', ProgressSchema);
exports.default = Progress;
//# sourceMappingURL=Progress.js.map