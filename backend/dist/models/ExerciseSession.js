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
const PoseFrameSchema = new mongoose_1.Schema({
    timestamp: { type: Number, required: true },
    landmarks: [{
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            z: { type: Number },
            visibility: { type: Number, min: 0, max: 1 }
        }],
    angles: { type: Map, of: Number },
    repCount: { type: Number, min: 0 },
    isCorrectForm: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0 }
}, { _id: false });
const RepAnalysisSchema = new mongoose_1.Schema({
    repNumber: { type: Number, required: true, min: 1 },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: [{ type: String }],
    angles: { type: Map, of: Number }
}, { _id: false });
const ExerciseSessionSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    exerciseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number, min: 0 },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'cancelled'],
        default: 'active'
    },
    // Exercise Performance
    totalReps: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, min: 0, max: 100 },
    maxScore: { type: Number, min: 0, max: 100 },
    minScore: { type: Number, min: 0, max: 100 },
    // Detailed Tracking
    poseFrames: [PoseFrameSchema],
    repAnalysis: [RepAnalysisSchema],
    // Feedback and Analysis
    overallFeedback: [{ type: String }],
    improvementAreas: [{ type: String }],
    strengths: [{ type: String }],
    // Media
    videoUrl: { type: String },
    thumbnailUrl: { type: String },
    // Metadata
    deviceInfo: {
        platform: { type: String },
        browser: { type: String },
        cameraResolution: { type: String }
    }
}, { timestamps: true });
// Indexes for better performance
ExerciseSessionSchema.index({ patientId: 1, createdAt: -1 });
ExerciseSessionSchema.index({ doctorId: 1, createdAt: -1 });
ExerciseSessionSchema.index({ exerciseId: 1 });
ExerciseSessionSchema.index({ status: 1 });
ExerciseSessionSchema.index({ startTime: -1 });
// Virtual for calculating duration if not set
ExerciseSessionSchema.virtual('calculatedDuration').get(function () {
    if (this.duration)
        return this.duration;
    if (this.endTime && this.startTime) {
        return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
    }
    return null;
});
const ExerciseSession = mongoose_1.default.models.ExerciseSession || mongoose_1.default.model('ExerciseSession', ExerciseSessionSchema);
exports.default = ExerciseSession;
//# sourceMappingURL=ExerciseSession.js.map