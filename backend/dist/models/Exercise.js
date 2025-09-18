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
const ExerciseSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    instructions: [{ type: String, required: true }],
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    duration: { type: Number, required: true, min: 30, max: 3600 },
    targetMuscles: [{ type: String, required: true }],
    imageUrl: { type: String },
    videoUrl: { type: String },
    category: {
        type: String,
        enum: ['strength', 'cardio', 'flexibility', 'balance'],
        required: true
    },
    equipment: [{ type: String }],
    caloriesPerMinute: { type: Number, min: 0 },
    poseLandmarks: {
        keyPoints: [{ type: String }],
        angles: [{
                name: { type: String, required: true },
                points: [{ type: String, required: true }],
                targetRange: [{ type: Number, required: true }]
            }],
        repDetection: {
            trigger: { type: String, required: true },
            direction: { type: String, enum: ['up', 'down'], required: true },
            threshold: { type: Number, required: true }
        }
    },
    formGuidance: {
        correctForm: {
            description: { type: String, required: true },
            keyPoints: [{ type: String, required: true }],
            commonMistakes: [{ type: String, required: true }],
            tips: [{ type: String, required: true }]
        },
        visualGuide: {
            referenceImage: { type: String },
            referenceVideo: { type: String },
            landmarks: [{
                    name: { type: String, required: true },
                    position: { type: String, required: true },
                    importance: {
                        type: String,
                        enum: ['critical', 'important', 'optional'],
                        required: true
                    }
                }]
        },
        datasetInfo: {
            source: { type: String, required: true },
            sampleCount: { type: Number, required: true },
            accuracy: { type: Number, required: true },
            lastUpdated: { type: Date, required: true },
            version: { type: String, required: true }
        }
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
// Indexes for better performance
ExerciseSchema.index({ name: 'text', description: 'text' });
ExerciseSchema.index({ difficulty: 1, category: 1 });
ExerciseSchema.index({ createdBy: 1 });
ExerciseSchema.index({ isActive: 1 });
const Exercise = mongoose_1.default.models.Exercise || mongoose_1.default.model('Exercise', ExerciseSchema);
exports.default = Exercise;
//# sourceMappingURL=Exercise.js.map