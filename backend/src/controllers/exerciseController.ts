import { Request, Response } from 'express';
import { ApiResponse } from '../types';

// Mock data for now - replace with actual database queries later
const mockExercises = [
  {
    id: '1',
    name: 'Squats',
    description: 'Basic squat exercise for leg strength',
    instructions: ['Stand with feet shoulder-width apart', 'Lower your body as if sitting back into a chair', 'Return to starting position'],
    difficulty: 'beginner',
    duration: 300, // 5 minutes
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    imageUrl: '/images/squats.jpg',
    videoUrl: '/videos/squats.mp4'
  },
  {
    id: '2',
    name: 'Push-ups',
    description: 'Upper body strength exercise',
    instructions: ['Start in plank position', 'Lower your chest to the ground', 'Push back up to starting position'],
    difficulty: 'intermediate',
    duration: 240, // 4 minutes
    targetMuscles: ['chest', 'shoulders', 'triceps'],
    imageUrl: '/images/pushups.jpg',
    videoUrl: '/videos/pushups.mp4'
  },
  {
    id: '3',
    name: 'Lunges',
    description: 'Single leg strength and balance exercise',
    instructions: ['Step forward with one leg', 'Lower your hips until both knees are bent at 90 degrees', 'Push back to starting position'],
    difficulty: 'beginner',
    duration: 360, // 6 minutes
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    imageUrl: '/images/lunges.jpg',
    videoUrl: '/videos/lunges.mp4'
  }
];

export const getExercises = async (req: Request, res: Response) => {
  try {
    // TODO: Replace with actual database query
    // const exercises = await ExerciseService.getAllExercises();
    
    const response: ApiResponse<typeof mockExercises> = {
      success: true,
      data: mockExercises,
      message: 'Exercises retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch exercises'
    };
    res.status(500).json(response);
  }
};

export const getExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Replace with actual database query
    // const exercise = await ExerciseService.getExerciseById(id);
    
    const exercise = mockExercises.find(ex => ex.id === id);
    
    if (!exercise) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Exercise not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof exercise> = {
      success: true,
      data: exercise,
      message: 'Exercise retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch exercise'
    };
    res.status(500).json(response);
  }
};

export const createExercise = async (req: Request, res: Response) => {
  try {
    const exerciseData = req.body;
    
    // TODO: Replace with actual database operation
    // const newExercise = await ExerciseService.createExercise(exerciseData);
    
    const newExercise = {
      id: Date.now().toString(),
      ...exerciseData,
      createdAt: new Date().toISOString()
    };
    
    const response: ApiResponse<typeof newExercise> = {
      success: true,
      data: newExercise,
      message: 'Exercise created successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating exercise:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to create exercise'
    };
    res.status(500).json(response);
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // TODO: Replace with actual database operation
    // const updatedExercise = await ExerciseService.updateExercise(id, updateData);
    
    const exerciseIndex = mockExercises.findIndex(ex => ex.id === id);
    if (exerciseIndex === -1) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Exercise not found'
      };
      return res.status(404).json(response);
    }
    
    const updatedExercise = {
      ...mockExercises[exerciseIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    const response: ApiResponse<typeof updatedExercise> = {
      success: true,
      data: updatedExercise,
      message: 'Exercise updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating exercise:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to update exercise'
    };
    res.status(500).json(response);
  }
};

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Replace with actual database operation
    // await ExerciseService.deleteExercise(id);
    
    const exerciseIndex = mockExercises.findIndex(ex => ex.id === id);
    if (exerciseIndex === -1) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Exercise not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Exercise deleted successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error deleting exercise:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to delete exercise'
    };
    res.status(500).json(response);
  }
};
