// Common API response type
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  createdAt: string;
  updatedAt: string;
}

// Exercise types
export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in seconds
  targetMuscles: string[];
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Session types
export interface ExerciseSession {
  id: string;
  exerciseId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  status: 'active' | 'completed' | 'cancelled';
  score?: number;
  reps: number;
  feedback?: string;
  videoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Dashboard types
export interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  totalExercises: number;
  streakDays: number;
}

export interface ChartData {
  date: string;
  score: number;
  reps: number;
}

// Patient types
export interface Patient {
  id: string;
  userId: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  medicalHistory?: string;
  currentCondition?: string;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
}

// Request types for middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
