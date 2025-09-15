import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import PostureGuidance from '../components/PostureGuidance';
import ExerciseFormGuidance from '../components/ExerciseFormGuidance';
import ExerciseSelector from '../components/ExerciseSelector';
import { Pose } from '@mediapipe/pose';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

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
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [currentPosture, setCurrentPosture] = useState<string>('');
  const [poseDetected, setPoseDetected] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      if (exerciseId && exerciseId !== 'new') {
        try {
          const response = await apiService.getExercise(exerciseId);
          if (response.success && response.data) {
            setExercise(response.data);
          } else {
            setError('Failed to load exercise details: ' + (response.message || 'Unknown error'));
          }
        } catch (error) {
          console.error('Failed to fetch exercise:', error);
          setError('Failed to load exercise details: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } else if (exerciseId === 'new') {
        // For new exercises, create a default exercise object
        setExercise({
          id: 'default',
          name: 'Live Exercise Session',
          description: 'Real-time exercise analysis session',
          targetMuscles: ['full body'],
          instructions: [
            'Position yourself in front of the camera',
            'Start the session when ready',
            'Follow the real-time feedback for proper form'
          ],
          difficulty: 'beginner',
          duration: 10,
          category: 'strength',
          videoUrl: '',
          imageUrl: ''
        });
      }
      setLoading(false);
    };

    fetchExercise();
  }, [exerciseId]);

  const analyzePose = useCallback(async (landmarks: any[]) => {
    if (!session) return;

    try {
      // Transform MediaPipe landmarks to the format expected by the backend
      const transformedLandmarks = landmarks.map(landmark => [
        landmark.x,
        landmark.y,
        landmark.z,
        landmark.visibility || 0
      ]);

      const response = await apiService.analyzePose(session.id, transformedLandmarks);
      
      if (response.success && response.data) {
        setAccuracy(response.data.accuracy);
        
        // Update rep count if provided
        if (response.data.repCount !== undefined) {
          setRepCount(response.data.repCount);
        }

        // Set feedback
        const feedbackMessage = response.data.feedback.join(' ');    
        setFeedback({
          isCorrect: response.data.accuracy > 70,
          message: feedbackMessage,
          confidence: response.data.accuracy / 100,
          timestamp: Date.now()
        });

        // Determine current posture based on landmarks
        determineCurrentPosture(landmarks);
      }
    } catch (error) {
      console.error('Error analyzing pose:', error);
    }
  }, [session]);

  const initializeMediaPipe = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('MediaPipe initialization skipped: missing video or canvas ref');
      return;
    }

    // Clean up any existing MediaPipe resources first
    if (poseRef.current) {
      console.log('Cleaning up existing MediaPipe pose...');
      try {
        poseRef.current.close();
      } catch (error) {
        console.warn('Error closing existing pose:', error);
      }
      poseRef.current = null;
    }
    
    if (cameraRef.current) {
      console.log('Cleaning up existing MediaPipe camera...');
      try {
        cameraRef.current.stop();
      } catch (error) {
        console.warn('Error stopping existing camera:', error);
      }
      cameraRef.current = null;
    }

    console.log('Initializing MediaPipe Pose...');

    try {
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        if (!canvasCtx) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Only draw pose landmarks and connections, not the video frame
        // The video element will handle displaying the video
        if (results.poseLandmarks) {
          setPoseDetected(true);
          
          // Draw pose landmarks
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2
          });
          
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3
          });

          // Analyze pose if session is active
          if (isRecording && session) {
            analyzePose(results.poseLandmarks);
          }
        } else {
          setPoseDetected(false);
        }

        canvasCtx.restore();
      });

      // Wait for video to be ready before starting MediaPipe camera
      const startMediaPipeCamera = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          console.log('Starting MediaPipe camera with video dimensions:', {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });

          try {
            const camera = new MediaPipeCamera(videoRef.current, {
              onFrame: async () => {
                if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
                  try {
                    await pose.send({ image: videoRef.current });
                  } catch (error) {
                    console.warn('Error sending frame to MediaPipe:', error);
                  }
                }
              },
              width: videoRef.current.videoWidth || 1280,
              height: videoRef.current.videoHeight || 720
            });

            poseRef.current = pose;
            cameraRef.current = camera;
            camera.start();
            console.log('MediaPipe camera started successfully');
          } catch (error) {
            console.error('Error starting MediaPipe camera:', error);
          }
        } else {
          console.log('Video not ready, retrying MediaPipe camera initialization...');
          setTimeout(startMediaPipeCamera, 100);
        }
      };

      startMediaPipeCamera();
    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
    }
  }, [isRecording, session, analyzePose]);

  // Initialize MediaPipe Pose
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      // Wait for video to be ready before initializing MediaPipe
      const checkVideoReady = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          console.log('Video is ready, initializing MediaPipe...');
          // Add a small delay to ensure video is fully loaded
          setTimeout(() => {
            initializeMediaPipe();
          }, 500);
        } else {
          console.log('Video not ready yet, waiting...');
          setTimeout(checkVideoReady, 200);
        }
      };
      
      checkVideoReady();
    }

    return () => {
      console.log('Cleaning up MediaPipe resources...');
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (error) {
          console.warn('Error closing pose during cleanup:', error);
        }
        poseRef.current = null;
      }
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (error) {
          console.warn('Error stopping camera during cleanup:', error);
        }
        cameraRef.current = null;
      }
    };
  }, [cameraActive, initializeMediaPipe]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && cameraActive) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cameraActive]);

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

  // Debug cameraActive state changes
  useEffect(() => {
    console.log('cameraActive state changed:', cameraActive);
  }, [cameraActive]);


  const determineCurrentPosture = (landmarks: any[]) => {
    // Simple posture detection based on landmark positions
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    // const leftAnkle = landmarks[27];
    // const rightAnkle = landmarks[28];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      setCurrentPosture('Unknown');
      return;
    }

    // Calculate angles and positions for posture detection
    const shoulderDistance = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipDistance = Math.abs(leftHip.y - rightHip.y);
    const kneeHeight = (leftKnee?.y || 0) + (rightKnee?.y || 0) / 2;
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    if (kneeHeight > hipHeight - 0.1) {
      setCurrentPosture('Squatting');
    } else if (shoulderDistance < 0.05 && hipDistance < 0.05) {
      setCurrentPosture('Standing Straight');
    } else if (leftShoulder.y < rightShoulder.y - 0.05) {
      setCurrentPosture('Leaning Left');
    } else if (rightShoulder.y < leftShoulder.y - 0.05) {
      setCurrentPosture('Leaning Right');
    } else {
      setCurrentPosture('Standing');
    }
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks());

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        streamRef.current = stream;
        
        console.log('Video element setup:', {
          srcObject: video.srcObject,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          currentTime: video.currentTime,
          style: {
            display: video.style.display,
            opacity: video.style.opacity,
            visibility: video.style.visibility
          },
          computedStyle: {
            display: window.getComputedStyle(video).display,
            opacity: window.getComputedStyle(video).opacity,
            visibility: window.getComputedStyle(video).visibility
          }
        });
        
        // Add multiple event listeners to ensure video loads properly
        
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
            duration: video.duration
          });
          
          // Ensure video is visible immediately
          video.style.display = 'block';
          video.style.opacity = '1';
          video.style.visibility = 'visible';
          
          console.log('Video styles set after metadata loaded:', {
            display: video.style.display,
            opacity: video.style.opacity,
            visibility: video.style.visibility,
            computedDisplay: window.getComputedStyle(video).display,
            computedOpacity: window.getComputedStyle(video).opacity,
            computedVisibility: window.getComputedStyle(video).visibility
          });
          
          // Force video to play
          video.play().then(() => {
            console.log('Video started playing successfully');
            console.log('Setting cameraActive to true');
            setCameraActive(true);
            
            // Set up canvas dimensions after video is ready
            setTimeout(() => {
              if (canvasRef.current) {
                const container = canvasRef.current.parentElement;
                if (container) {
                  const rect = container.getBoundingClientRect();
                  canvasRef.current.width = rect.width;
                  canvasRef.current.height = rect.height;
                  console.log('Canvas dimensions set:', rect.width, 'x', rect.height);
                }
              }
            }, 100);
            
          }).catch((playError) => {
            console.error('Failed to play video:', playError);
            setError('Failed to start video playback: ' + playError.message);
          });
        };

        const handleCanPlay = () => {
          console.log('Video can play');
        };

        const handlePlaying = () => {
          console.log('Video is playing');
          // Ensure video is visible when it starts playing
          video.style.display = 'block';
          video.style.opacity = '1';
          video.style.visibility = 'visible';
        };

        const handleError = (error: Event) => {
          console.error('Video error:', error);
          setError('Video playback error occurred: ' + (error instanceof Error ? error.message : 'Unknown error'));
        };

        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('error', handleError);
        
        // Cleanup function
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('playing', handlePlaying);
          video.removeEventListener('error', handleError);
        };
        
        // Store cleanup function for later use
        (video as any)._cameraCleanup = cleanup;
        
        // Fallback: Force video to be visible after a short delay
        setTimeout(() => {
          if (video.srcObject && !cameraActive) {
            console.log('Fallback: Forcing video visibility');
            video.style.display = 'block';
            video.style.opacity = '1';
            video.style.visibility = 'visible';
            setCameraActive(true);
          }
          
          // Additional debugging
          console.log('Fallback check - Video element state:', {
            srcObject: video.srcObject,
            cameraActive: cameraActive,
            videoInDOM: document.contains(video),
            videoParent: video.parentElement,
            videoDimensions: {
              width: video.offsetWidth,
              height: video.offsetHeight,
              clientWidth: video.clientWidth,
              clientHeight: video.clientHeight
            }
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Failed to access camera. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Camera permission denied. Please allow camera access and refresh the page.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Camera is already in use by another application.';
        } else {
          errorMessage += error.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      // Clean up event listeners
      if ((videoRef.current as any)._cameraCleanup) {
        (videoRef.current as any)._cameraCleanup();
      }
      
      videoRef.current.srcObject = null;
      videoRef.current.style.display = 'none';
      videoRef.current.style.opacity = '0';
    }
    
    // Clean up MediaPipe resources
    if (poseRef.current) {
      try {
        poseRef.current.close();
      } catch (error) {
        console.warn('Error closing pose in stopCamera:', error);
      }
      poseRef.current = null;
    }
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (error) {
        console.warn('Error stopping camera in stopCamera:', error);
      }
      cameraRef.current = null;
    }
    
    setCameraActive(false);
    setPoseDetected(false);
    setAccuracy(undefined);
    setCurrentPosture('');
    
    console.log('Camera stopped successfully');
  };

  const handleExerciseSelect = (selectedExercise: Exercise) => {
    setExercise(selectedExercise);
    setShowExerciseSelector(false);
  };

  const startSession = async () => {
    try {
      if (!exercise) {
        setError('No exercise selected');
        return;
      }

      console.log('Starting session for exercise:', exercise.id);
      const response = await apiService.startSession(exercise.id);
      console.log('Session response:', response);
      
      if (response.success && response.data) {
        setSession(response.data);
        setIsRecording(true);
        sessionStartTime.current = new Date();
        setSessionTime(0);
        setRepCount(0);
        setFeedback(null);
        console.log('Session started successfully');
      } else {
        setError('Failed to start session: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      setError('Failed to start exercise session: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
                {/* Always render video element but conditionally show it */}
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#000',
                      display: cameraActive ? 'block' : 'none',
                      opacity: cameraActive ? 1 : 0
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                    style={{ zIndex: 10, display: cameraActive ? 'block' : 'none' }}
                  />
                  
                  {/* Pose detection indicator */}
                  {poseDetected && cameraActive && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-medium">Pose Detected</span>
                    </div>
                  )}
                  
                  {/* Current posture indicator */}
                  {currentPosture && cameraActive && (
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">
                      Posture: {currentPosture}
                    </div>
                  )}
                </div>
                
                {/* Show placeholder when camera is not active */}
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
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
          {/* Exercise Selection */}
          {!isRecording && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Exercise Selection</h3>
                  <button
                    onClick={() => setShowExerciseSelector(!showExerciseSelector)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {exercise ? 'Change Exercise' : 'Select Exercise'}
                  </button>
                </div>
                
                {exercise ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{exercise.name}</h4>
                        <p className="text-sm text-gray-600">{exercise.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="capitalize">{exercise.difficulty}</span>
                          <span>{exercise.duration} min</span>
                          <span>{exercise.targetMuscles.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Select an exercise to begin your session
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercise Selector Modal */}
          {showExerciseSelector && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Select Exercise</h3>
                    <button
                      onClick={() => setShowExerciseSelector(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <ExerciseSelector
                    onExerciseSelect={handleExerciseSelect}
                    selectedExerciseId={exercise?.id}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Session Controls */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Controls</h3>
              
              <div className="space-y-3">
                {!isRecording ? (
                  <button
                    onClick={startSession}
                    disabled={!cameraActive || !exercise}
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

                {accuracy !== null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Accuracy</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      accuracy !== undefined && accuracy >= 80 ? 'text-green-600' : 
                      accuracy !== undefined && accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {accuracy !== undefined ? Math.round(accuracy) : 0}%
                    </span>
                  </div>
                )}
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
              ) : poseDetected ? (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Pose detected successfully
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Start your session to begin posture analysis
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    {cameraActive ? 'Position yourself in front of the camera' : 'Start your camera to receive real-time feedback'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Exercise Form Guidance */}
          <ExerciseFormGuidance
            exercise={exercise}
            isSessionActive={isRecording}
            currentAccuracy={accuracy}
          />

          {/* Posture Guidance */}
          <PostureGuidance
            accuracy={accuracy}
            currentPosture={currentPosture}
            feedback={feedback ? [feedback.message] : []}
            isRecording={isRecording}
          />

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
