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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFrame = exports.uploadSessionVideo = exports.getSession = exports.getSessionHistory = exports.endSession = exports.startSession = void 0;
const sessionService_1 = __importDefault(require("../services/sessionService"));
const startSession = async (req, res) => {
    try {
        const { exerciseId, doctorId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        // Handle default exercise case
        let validExerciseId = exerciseId;
        if (exerciseId === 'default') {
            // For default exercises, we'll use a special handling
            // First, try to find or create a default exercise
            const { ExerciseService } = await Promise.resolve().then(() => __importStar(require('../services/exerciseService')));
            const defaultExercise = await ExerciseService.getOrCreateDefaultExercise(userId);
            validExerciseId = defaultExercise.id;
        }
        const newSession = await sessionService_1.default.startSession(userId, validExerciseId, doctorId, req.headers['user-agent']);
        const response = {
            success: true,
            data: newSession,
            message: 'Session started successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error starting session:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to start session'
        };
        res.status(500).json(response);
    }
};
exports.startSession = startSession;
const endSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const endData = req.body;
        const updatedSession = await sessionService_1.default.endSession(sessionId, {
            totalReps: endData.totalReps || 0,
            averageScore: endData.averageScore || 0,
            maxScore: endData.maxScore || 0,
            minScore: endData.minScore || 0,
            overallFeedback: endData.overallFeedback || [],
            improvementAreas: endData.improvementAreas || [],
            strengths: endData.strengths || [],
            repAnalysis: endData.repAnalysis || [],
            videoUrl: endData.videoUrl
        });
        if (!updatedSession) {
            const response = {
                success: false,
                data: null,
                message: 'Session not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: updatedSession,
            message: 'Session ended successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error ending session:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to end session'
        };
        res.status(500).json(response);
    }
};
exports.endSession = endSession;
const getSessionHistory = async (req, res) => {
    try {
        const { limit = 10, offset = 0, exerciseId, status } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const sessions = await sessionService_1.default.getUserSessions(userId, {
            limit: Number(limit),
            offset: Number(offset),
            exerciseId: exerciseId,
            status: status
        });
        const response = {
            success: true,
            data: sessions,
            message: 'Session history retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching session history:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch session history'
        };
        res.status(500).json(response);
    }
};
exports.getSessionHistory = getSessionHistory;
const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await sessionService_1.default.getSessionById(sessionId);
        if (!session) {
            const response = {
                success: false,
                data: null,
                message: 'Session not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: session,
            message: 'Session retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching session:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch session'
        };
        res.status(500).json(response);
    }
};
exports.getSession = getSession;
const uploadSessionVideo = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { videoUrl, thumbnailUrl } = req.body;
        if (!videoUrl) {
            const response = {
                success: false,
                data: null,
                message: 'Video URL is required'
            };
            return res.status(400).json(response);
        }
        const uploaded = await sessionService_1.default.uploadSessionVideo(sessionId, videoUrl, thumbnailUrl);
        if (!uploaded) {
            const response = {
                success: false,
                data: null,
                message: 'Session not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: { videoUrl },
            message: 'Video uploaded successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error uploading session video:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to upload video'
        };
        res.status(500).json(response);
    }
};
exports.uploadSessionVideo = uploadSessionVideo;
const analyzeFrame = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { landmarks } = req.body;
        if (!landmarks) {
            const response = {
                success: false,
                data: null,
                message: 'Landmarks are required'
            };
            return res.status(400).json(response);
        }
        // Import the ML service function
        const { analyzePose } = await Promise.resolve().then(() => __importStar(require('../services/mlService')));
        // Call Python ML backend for pose analysis
        const result = await analyzePose(landmarks);
        // Add pose frame to session
        const frameData = {
            timestamp: Date.now(),
            landmarks: landmarks,
            angles: result.angles || {},
            isCorrectForm: result.accuracy > 70,
            confidence: result.accuracy / 100
        };
        await sessionService_1.default.addPoseFrame(sessionId, frameData);
        // Calculate rep count if this is a new rep
        let repCount = 0;
        if (result.isRepComplete) {
            const session = await sessionService_1.default.getSession(sessionId);
            if (session) {
                repCount = (session.reps || 0) + 1;
                await sessionService_1.default.updateSessionReps(sessionId, repCount);
            }
        }
        const response = {
            success: true,
            data: {
                accuracy: result.accuracy,
                feedback: result.feedback || ['Good form!'],
                repCount: repCount > 0 ? repCount : undefined,
                angles: result.angles,
                isCorrectForm: frameData.isCorrectForm
            },
            message: 'Pose analyzed successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error analyzing frame:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to analyze frame'
        };
        res.status(500).json(response);
    }
};
exports.analyzeFrame = analyzeFrame;
//# sourceMappingURL=sessionController.js.map