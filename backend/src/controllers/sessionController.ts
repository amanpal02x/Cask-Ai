import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import SessionService from '../services/sessionService';

export const startSession = async (req: Request, res: Response) => {
  try {
    const { exerciseId, doctorId } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
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
      const { ExerciseService } = await import('../services/exerciseService');
      const defaultExercise = await ExerciseService.getOrCreateDefaultExercise(userId);
      validExerciseId = defaultExercise.id;
    }
    
    const newSession = await SessionService.startSession(
      userId, 
      validExerciseId, 
      doctorId,
      req.headers['user-agent']
    );
    
    const response: ApiResponse<typeof newSession> = {
      success: true,
      data: newSession,
      message: 'Session started successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error starting session:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to start session'
    };
    res.status(500).json(response);
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const endData = req.body;
    
    const updatedSession = await SessionService.endSession(sessionId, {
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
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof updatedSession> = {
      success: true,
      data: updatedSession,
      message: 'Session ended successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error ending session:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to end session'
    };
    res.status(500).json(response);
  }
};

export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const { limit = 10, offset = 0, exerciseId, status } = req.query;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const sessions = await SessionService.getUserSessions(userId, {
      limit: Number(limit),
      offset: Number(offset),
      exerciseId: exerciseId as string,
      status: status as string
    });
    
    const response: ApiResponse<typeof sessions> = {
      success: true,
      data: sessions,
      message: 'Session history retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching session history:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch session history'
    };
    res.status(500).json(response);
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await SessionService.getSessionById(sessionId);
    
    if (!session) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof session> = {
      success: true,
      data: session,
      message: 'Session retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching session:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch session'
    };
    res.status(500).json(response);
  }
};

export const uploadSessionVideo = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { videoUrl, thumbnailUrl } = req.body;
    
    if (!videoUrl) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Video URL is required'
      };
      return res.status(400).json(response);
    }
    
    const uploaded = await SessionService.uploadSessionVideo(sessionId, videoUrl, thumbnailUrl);
    
    if (!uploaded) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<{ videoUrl: string }> = {
      success: true,
      data: { videoUrl },
      message: 'Video uploaded successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error uploading session video:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to upload video'
    };
    res.status(500).json(response);
  }
};

export const analyzeFrame = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { landmarks } = req.body;
    
    if (!landmarks) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Landmarks are required'
      };
      return res.status(400).json(response);
    }

    // Import the ML service function
    const { analyzePose } = await import('../services/mlService');
    
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

    await SessionService.addPoseFrame(sessionId, frameData);

    // Calculate rep count if this is a new rep
    let repCount = 0;
    if (result.isRepComplete) {
      const session = await SessionService.getSession(sessionId);
      if (session) {
        repCount = (session.reps || 0) + 1;
        await SessionService.updateSessionReps(sessionId, repCount);
      }
    }

    const response: ApiResponse<{
      accuracy: number;
      feedback: string[];
      repCount?: number;
      angles?: any;
      isCorrectForm: boolean;
    }> = {
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
  } catch (error) {
    console.error('Error analyzing frame:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to analyze frame'
    };
    res.status(500).json(response);
  }
};
