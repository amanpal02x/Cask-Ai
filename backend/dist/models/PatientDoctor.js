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
const PatientDoctorSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Relationship status
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'terminated'],
        default: 'pending'
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    // Assignment details
    assignedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignmentReason: { type: String },
    // Patient-specific settings
    patientSettings: {
        exercisePlan: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ExercisePlan' },
        goalReps: { type: Number, min: 1 },
        goalSessions: { type: Number, min: 1 },
        weeklyTarget: { type: Number, min: 1 },
        difficultyPreference: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced']
        },
        restrictions: [{ type: String }],
        notes: { type: String }
    },
    // Doctor monitoring preferences
    doctorSettings: {
        notificationsEnabled: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
        progressAlerts: { type: Boolean, default: true },
        formFeedback: { type: Boolean, default: true },
        customSchedule: {
            checkInFrequency: {
                type: String,
                enum: ['daily', 'weekly', 'monthly'],
                default: 'weekly'
            },
            lastCheckIn: { type: Date },
            nextCheckIn: { type: Date }
        }
    },
    // Communication
    lastInteraction: { type: Date },
    totalSessions: { type: Number, default: 0 },
    averageScore: { type: Number, min: 0, max: 100 }
}, { timestamps: true });
// Indexes for better performance
PatientDoctorSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });
PatientDoctorSchema.index({ patientId: 1, status: 1 });
PatientDoctorSchema.index({ doctorId: 1, status: 1 });
PatientDoctorSchema.index({ status: 1 });
PatientDoctorSchema.index({ assignedBy: 1 });
PatientDoctorSchema.index({ lastInteraction: -1 });
// Compound indexes for common queries
PatientDoctorSchema.index({ doctorId: 1, status: 1, lastInteraction: -1 });
PatientDoctorSchema.index({ patientId: 1, status: 1, createdAt: -1 });
const PatientDoctor = mongoose_1.default.models.PatientDoctor || mongoose_1.default.model('PatientDoctor', PatientDoctorSchema);
exports.default = PatientDoctor;
//# sourceMappingURL=PatientDoctor.js.map