"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePose = void 0;
const axios_1 = __importDefault(require("axios"));
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://localhost:8001";
const analyzePose = async (landmarks) => {
    try {
        // Try to connect to Python ML backend
        const res = await axios_1.default.post(`${ML_BACKEND_URL}/predict`, { landmarks });
        return res.data;
    }
    catch (err) {
        console.log("ML backend not available, using mock analysis");
        // Mock analysis for development/testing
        return mockPoseAnalysis(landmarks);
    }
};
exports.analyzePose = analyzePose;
// Mock pose analysis function for development
const mockPoseAnalysis = (landmarks) => {
    // Simple mock analysis based on landmark positions
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    let accuracy = 85; // Base accuracy
    let feedback = ["Good posture!"];
    let angles = {};
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
        // Check shoulder alignment
        const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
        if (shoulderDiff > 0.1) {
            accuracy -= 15;
            feedback.push("Keep your shoulders level");
        }
        // Check hip alignment
        const hipDiff = Math.abs(leftHip.y - rightHip.y);
        if (hipDiff > 0.1) {
            accuracy -= 10;
            feedback.push("Keep your hips level");
        }
        // Check knee position for squats
        if (leftKnee && rightKnee) {
            const kneeHeight = (leftKnee.y + rightKnee.y) / 2;
            const hipHeight = (leftHip.y + rightHip.y) / 2;
            if (kneeHeight > hipHeight - 0.1) {
                feedback.push("Great squat depth!");
            }
            else {
                feedback.push("Try to go deeper in your squat");
            }
        }
    }
    // Randomly determine if this is a complete rep (for demo purposes)
    const isRepComplete = Math.random() < 0.1; // 10% chance per frame
    return {
        accuracy: Math.max(60, Math.min(95, accuracy)),
        feedback: feedback,
        angles: angles,
        isRepComplete: isRepComplete
    };
};
//# sourceMappingURL=mlService.js.map