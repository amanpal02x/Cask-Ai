import axios from "axios";

const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://localhost:8001";

/**
 * Maps database exercise names to ML engine expected enum values
 */
const mapExerciseType = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase();
  
  if (name.includes("squat")) return "squat";
  if (name.includes("pushup") || name.includes("push-up")) return "pushup";
  if (name.includes("lunge")) return "lunge";
  if (name.includes("plank")) return "plank";
  if (name.includes("knee extension")) return "knee_extension";
  if (name.includes("shoulder abduction")) return "shoulder_abduction";
  
  return "squat"; // Default fallback
};

/**
 * Transforms landmarks from array of arrays [x, y, z, v] to objects {x, y, z, visibility}
 */
const transformLandmarks = (landmarks: any[]) => {
  return landmarks.map(lm => {
    if (Array.isArray(lm)) {
      return {
        x: lm[0] || 0,
        y: lm[1] || 0,
        z: lm[2] || 0,
        visibility: lm[3] || 1.0
      };
    }
    return lm; // Already an object
  });
};

export const analyzePose = async (landmarks: any[], exerciseName: string = "squat", sessionId: string = "default") => {
  try {
    const exercise = mapExerciseType(exerciseName);
    const formattedLandmarks = transformLandmarks(landmarks);

    // Connect to Python ML backend with PoseData structure including sessionId
    const res = await axios.post(`${ML_BACKEND_URL}/predict`, { 
      landmarks: formattedLandmarks,
      exercise: exercise,
      sessionId: sessionId
    });
    
    return res.data;
  } catch (err) {
    console.log("ML backend not available, using mock analysis");
    
    // Mock analysis for development/testing
    return mockPoseAnalysis(landmarks, exerciseName);
  }
};

// Mock pose analysis function for development
// Updated to return fields consistent with the real ML engine
const mockPoseAnalysis = (landmarks: any, exerciseName: string) => {
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
    const sDiff = Array.isArray(leftShoulder) ? Math.abs(leftShoulder[1] - rightShoulder[1]) : Math.abs(leftShoulder.y - rightShoulder.y);
    if (sDiff > 0.1) {
      accuracy -= 15;
      feedback.push("Keep your shoulders level");
    }

    // Check hip alignment
    const hDiff = Array.isArray(leftHip) ? Math.abs(leftHip[1] - rightHip[1]) : Math.abs(leftHip.y - rightHip.y);
    if (hDiff > 0.1) {
      accuracy -= 10;
      feedback.push("Keep your hips level");
    }
  }

  // Randomly determine if this is a complete rep (for demo purposes)
  const isCorrectForm = accuracy > 75;

  return {
    exercise: exerciseName.toLowerCase(),
    accuracy: Math.max(60, Math.min(95, accuracy)),
    feedback: feedback,
    angles: angles,
    repCount: Math.floor(Math.random() * 5), // Mock rep count
    isCorrectForm: isCorrectForm,
    confidence: accuracy / 100
  };
};
