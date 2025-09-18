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
const NotificationSchema = new mongoose_1.Schema({
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderId: {
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
            'info', 'warning', 'success', 'error', 'recommendation', 'reminder',
            'progress_alert', 'goal_reminder', 'form_feedback', 'achievement',
            'doctor_message', 'system_update'
        ],
        required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // Notification-specific data
    data: {
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        category: { type: String },
        actionUrl: { type: String },
        actionText: { type: String },
        expiresAt: { type: Date },
        metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed, default: {} }
    },
    // Status
    isRead: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    readAt: { type: Date },
    // Delivery
    deliveryMethod: [{
            type: String,
            enum: ['in_app', 'email', 'push']
        }],
    deliveredAt: { type: Date },
    failedAt: { type: Date }
}, { timestamps: true });
// Indexes for better performance
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ senderId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ 'data.priority': 1, createdAt: -1 });
NotificationSchema.index({ isArchived: 1 });
NotificationSchema.index({ 'data.expiresAt': 1 });
NotificationSchema.index({ sessionId: 1 });
NotificationSchema.index({ exerciseId: 1 });
// Compound indexes for common queries
NotificationSchema.index({ recipientId: 1, type: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, isArchived: 1, createdAt: -1 });
// TTL index for expired notifications
NotificationSchema.index({ 'data.expiresAt': 1 }, { expireAfterSeconds: 0, partialFilterExpression: { 'data.expiresAt': { $exists: true } } });
const Notification = mongoose_1.default.models.Notification || mongoose_1.default.model('Notification', NotificationSchema);
exports.default = Notification;
//# sourceMappingURL=Notification.js.map