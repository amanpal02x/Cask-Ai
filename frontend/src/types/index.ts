// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  avatar?: string;
  createdAt: string;
}

// Patient Types
export interface Patient extends User {
  role: 'patient';
  doctorId?: string;
  medicalHistory?: string;
  currentExercises?: Exercise[];
}

// Doctor Types
export interface Doctor extends User {
  role: 'doctor';
  specialization?: string;
  patients?: Patient[];
  licenseNumber?: string;
}

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  videoUrl?: string;
  imageUrl?: string;
}

// Session Types
export interface ExerciseSession {
  id: string;
  patientId: string;
  exerciseId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'paused';
  videoUrl?: string;
  feedback?: SessionFeedback;
}

// Feedback Types
export interface SessionFeedback {
  id: string;
  sessionId: string;
  overallScore: number; // 0-100
  postureErrors: PostureError[];
  repCount: number;
  recommendations: string[];
  timestamp: string;
}

export interface PostureError {
  id: string;
  type: 'posture' | 'form' | 'timing';
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number; // in seconds from session start
  suggestion: string;
}

// Progress Types
export interface ProgressData {
  patientId: string;
  exerciseId: string;
  date: string;
  score: number;
  repCount: number;
  duration: number;
  errors: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Camera/Video Types
export interface CameraSettings {
  width: number;
  height: number;
  frameRate: number;
  facingMode: 'user' | 'environment';
}

// Real-time Feedback Types
export interface RealTimeFeedback {
  isCorrect: boolean;
  message: string;
  confidence: number;
  timestamp: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'reminder' | 'feedback' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Dashboard Data Types
export interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  totalExercises: number;
  streakDays: number;
  lastSessionDate?: string;
}

export interface ChartData {
  date: string;
  score: number;
  reps: number;
  duration: number;
  errors: number;
}
