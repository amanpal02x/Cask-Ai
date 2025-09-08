import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Square, 
  Camera, 
  CameraOff, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { Exercise, RealTimeFeedback, ExerciseSession } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const LiveExercisePage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [feedback, setFeedback] = useState<RealTimeFeedback | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<Date | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      if (exerciseId && exerciseId !== 'new') {
        try {
          const response = await apiService.getExercise(exerciseId);
          if (response.success && response.data) {
            setExercise(response.data);
          }
        } catch (error) {
          console.error('Failed to fetch exercise:', error);
          setError('Failed to load exercise details');
        }
      }
      setLoading(false);
    };

    fetchExercise();
  }, [exerciseId]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startSession = async () => {
    try {
      if (!exercise) {
        setError('No exercise selected');
        return;
      }

      const response = await apiService.startSession(exercise.id);
      if (response.success && response.data) {
        setSession(response.data);
        setIsRecording(true);
        sessionStartTime.current = new Date();
        setSessionTime(0);
        setRepCount(0);
        setFeedback(null);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      setError('Failed to start exercise session');
    }
  };

  const pauseSession = () => {
    setIsPaused(!isPaused);
  };

  const endSession = async () => {
    try {
      if (session) {
        await apiService.endSession(session.id);
      }
      setIsRecording(false);
      setIsPaused(false);
      setSession(null);
      setSessionTime(0);
      setRepCount(0);
      setFeedback(null);
      stopCamera();
      navigate('/patient/dashboard');
    } catch (error) {
      console.error('Failed to end session:', error);
      setError('Failed to end session');
    }
  };

  const resetSession = () => {
    setSessionTime(0);
    setRepCount(0);
    setFeedback(null);
    sessionStartTime.current = new Date();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {exercise ? exercise.name : 'Live Exercise Session'}
              </h1>
              {exercise && (
                <p className="mt-1 text-sm text-gray-500">
                  {exercise.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {formatTime(sessionTime)}
                </div>
                <div className="text-sm text-gray-500">Session Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Camera Off</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Click "Start Camera" to begin
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">
                      {isPaused ? 'PAUSED' : 'RECORDING'}
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="mt-4 flex justify-center space-x-4">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Feedback */}
        <div className="space-y-6">
          {/* Session Controls */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Controls</h3>
              
              <div className="space-y-3">
                {!isRecording ? (
                  <button
                    onClick={startSession}
                    disabled={!cameraActive}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </button>
                ) : (
                  <>
                    <button
                      onClick={pauseSession}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={endSession}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      End Session
                    </button>
                    
                    <button
                      onClick={resetSession}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Stats */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Reps</span>
                  </div>
                  <span className="text-2xl font-bold text-primary-600">{repCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Duration</span>
                  </div>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatTime(sessionTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Feedback */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Feedback</h3>
              
              {feedback ? (
                <div className={`p-4 rounded-lg ${
                  feedback.isCorrect 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {feedback.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${
                      feedback.isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {feedback.message}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Confidence: {Math.round(feedback.confidence * 100)}%
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Start your session to receive real-time feedback
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Exercise Instructions */}
          {exercise && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
                <div className="space-y-2">
                  {exercise.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-700">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveExercisePage;
