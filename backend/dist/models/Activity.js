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
const ActivitySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    relatedUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ExerciseSession'
    },
    exerciseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Exercise'
    },
    type: {
        type: String,
        enum: [
            'exercise_started', 'exercise_completed', 'exercise_paused', 'exercise_cancelled',
            'session_uploaded', 'goal_achieved', 'milestone_reached', 'doctor_recommendation',
            'progress_update', 'form_improvement', 'streak_achieved', 'new_exercise_assigned'
        ],
        required: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    // Activity-specific data
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    // Visibility and targeting
    visibility: {
        type: String,
        enum: ['public', 'private', 'doctor_only', 'patient_only'],
        default: 'public'
    },
    targetRoles: [{
            type: String,
            enum: ['patient', 'doctor']
        }],
    // Status
    isRead: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false }
}, { timestamps: true });
// Indexes for better performance
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ relatedUserId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ visibility: 1, targetRoles: 1 });
ActivitySchema.index({ isRead: 1, isArchived: 1 });
ActivitySchema.index({ sessionId: 1 });
ActivitySchema.index({ exerciseId: 1 });
// Compound indexes for common queries
ActivitySchema.index({ userId: 1, type: 1, createdAt: -1 });
ActivitySchema.index({ relatedUserId: 1, visibility: 1, createdAt: -1 });
const Activity = mongoose_1.default.models.Activity || mongoose_1.default.model('Activity', ActivitySchema);
exports.default = Activity;
//# sourceMappingURL=Activity.js.map