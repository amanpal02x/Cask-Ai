import math
import numpy as np

# ----------------------------
# Enhanced utility functions
# ----------------------------
def calculate_angle(a, b, c):
    """Calculate angle between 3 points in degrees"""
    if not all(isinstance(point, dict) for point in [a, b, c]):
        # Handle array format landmarks
        if len(a) >= 2 and len(b) >= 2 and len(c) >= 2:
            ab = (a[0] - b[0], a[1] - b[1])
            cb = (c[0] - b[0], c[1] - b[1])
        else:
            return 0
    else:
        # Handle dict format landmarks
        ab = (a['x'] - b['x'], a['y'] - b['y'])
        cb = (c['x'] - b['x'], c['y'] - b['y'])

    dot = ab[0]*cb[0] + ab[1]*cb[1]
    mag_ab = math.sqrt(ab[0]**2 + ab[1]**2)
    mag_cb = math.sqrt(cb[0]**2 + cb[1]**2)

    if mag_ab * mag_cb == 0:
        return 0

    angle = math.acos(max(-1, min(1, dot / (mag_ab * mag_cb))))
    return int(math.degrees(angle))

def calculate_distance(a, b):
    """Calculate distance between two points"""
    if isinstance(a, dict) and isinstance(b, dict):
        return math.sqrt((a['x'] - b['x'])**2 + (a['y'] - b['y'])**2)
    elif len(a) >= 2 and len(b) >= 2:
        return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
    return 0

def get_landmark_coords(landmarks, index):
    """Get coordinates for a landmark, handling different formats"""
    if isinstance(landmarks, list) and len(landmarks) > index:
        landmark = landmarks[index]
        if isinstance(landmark, dict):
            return {'x': landmark.get('x', 0), 'y': landmark.get('y', 0), 'z': landmark.get('z', 0)}
        elif isinstance(landmark, (list, tuple)) and len(landmark) >= 2:
            return {'x': landmark[0], 'y': landmark[1], 'z': landmark[2] if len(landmark) > 2 else 0}
    return {'x': 0, 'y': 0, 'z': 0}

def is_landmark_visible(landmark):
    """Check if landmark is visible"""
    if isinstance(landmark, dict):
        return landmark.get('visibility', 1) > 0.5
    return True

# ----------------------------
# Exercise-specific analysis classes
# ----------------------------
class ExerciseAnalyzer:
    def __init__(self, exercise_type):
        self.exercise_type = exercise_type
        self.rep_count = 0
        self.is_down_position = False
        self.previous_angles = {}
        self.movement_threshold = 5  # degrees
        
    def analyze_frame(self, landmarks):
        """Analyze a single frame of pose data"""
        angles = self.calculate_angles(landmarks)
        feedback = []
        score = 100
        
        # Exercise-specific analysis
        if self.exercise_type == "squat":
            score, feedback = self._analyze_squat(landmarks, angles, feedback, score)
        elif self.exercise_type == "pushup":
            score, feedback = self._analyze_pushup(landmarks, angles, feedback, score)
        elif self.exercise_type == "lunge":
            score, feedback = self._analyze_lunge(landmarks, angles, feedback, score)
        elif self.exercise_type == "plank":
            score, feedback = self._analyze_plank(landmarks, angles, feedback, score)
        
        # Update rep counting
        self._update_rep_count(landmarks, angles)
        
        # Store previous angles for movement detection
        self.previous_angles = angles.copy()
        
        return {
            "exercise": self.exercise_type,
            "accuracy": max(score, 0),
            "feedback": feedback if feedback else ["Good form! 🎉"],
            "angles": angles,
            "repCount": self.rep_count,
            "isCorrectForm": score > 70,
            "confidence": score / 100
        }
    
    def calculate_angles(self, landmarks):
        """Calculate all relevant angles for the exercise"""
        angles = {}
        
        if self.exercise_type == "squat":
            # Knee angles
            angles['left_knee'] = calculate_angle(
                get_landmark_coords(landmarks, 24),  # left hip
                get_landmark_coords(landmarks, 26),  # left knee
                get_landmark_coords(landmarks, 28)   # left ankle
            )
            angles['right_knee'] = calculate_angle(
                get_landmark_coords(landmarks, 23),  # right hip
                get_landmark_coords(landmarks, 25),  # right knee
                get_landmark_coords(landmarks, 27)   # right ankle
            )
            
        elif self.exercise_type == "pushup":
            # Elbow angles
            angles['left_elbow'] = calculate_angle(
                get_landmark_coords(landmarks, 12),  # left shoulder
                get_landmark_coords(landmarks, 14),  # left elbow
                get_landmark_coords(landmarks, 16)   # left wrist
            )
            angles['right_elbow'] = calculate_angle(
                get_landmark_coords(landmarks, 11),  # right shoulder
                get_landmark_coords(landmarks, 13),  # right elbow
                get_landmark_coords(landmarks, 15)   # right wrist
            )
            
        elif self.exercise_type == "lunge":
            # Knee angles for lunging leg
            angles['front_knee'] = calculate_angle(
                get_landmark_coords(landmarks, 24),  # hip
                get_landmark_coords(landmarks, 26),  # knee
                get_landmark_coords(landmarks, 28)   # ankle
            )
            angles['back_knee'] = calculate_angle(
                get_landmark_coords(landmarks, 23),  # hip
                get_landmark_coords(landmarks, 25),  # knee
                get_landmark_coords(landmarks, 27)   # ankle
            )
            
        elif self.exercise_type == "plank":
            # Body alignment angles
            angles['shoulder_hip_ankle'] = calculate_angle(
                get_landmark_coords(landmarks, 12),  # shoulder
                get_landmark_coords(landmarks, 24),  # hip
                get_landmark_coords(landmarks, 28)   # ankle
            )
        
        return angles
    
    def _analyze_squat(self, landmarks, angles, feedback, score):
        """Analyze squat form"""
        left_knee = angles.get('left_knee', 0)
        right_knee = angles.get('right_knee', 0)
        
        # Knee angle analysis
        if not (70 <= left_knee <= 120):
            feedback.append(f"Left knee angle: {left_knee}° (target: 70-120°)")
            score -= 15
        if not (70 <= right_knee <= 120):
            feedback.append(f"Right knee angle: {right_knee}° (target: 70-120°)")
            score -= 15
            
        # Symmetry check
        knee_diff = abs(left_knee - right_knee)
        if knee_diff > 10:
            feedback.append(f"Knee symmetry off by {knee_diff}°")
            score -= 10
            
        # Hip alignment
        left_hip = get_landmark_coords(landmarks, 24)
        right_hip = get_landmark_coords(landmarks, 23)
        hip_diff = abs(left_hip['y'] - right_hip['y'])
        if hip_diff > 0.05:  # 5% of frame height
            feedback.append("Keep hips level")
            score -= 10
            
        return score, feedback
    
    def _analyze_pushup(self, landmarks, angles, feedback, score):
        """Analyze pushup form"""
        left_elbow = angles.get('left_elbow', 0)
        right_elbow = angles.get('right_elbow', 0)
        
        # Elbow angle analysis
        if not (70 <= left_elbow <= 120):
            feedback.append(f"Left elbow angle: {left_elbow}° (target: 70-120°)")
            score -= 15
        if not (70 <= right_elbow <= 120):
            feedback.append(f"Right elbow angle: {right_elbow}° (target: 70-120°)")
            score -= 15
            
        # Body alignment
        shoulder = get_landmark_coords(landmarks, 12)
        hip = get_landmark_coords(landmarks, 24)
        ankle = get_landmark_coords(landmarks, 28)
        
        # Check if body is straight
        shoulder_hip_ankle_angle = calculate_angle(shoulder, hip, ankle)
        if not (170 <= shoulder_hip_ankle_angle <= 190):
            feedback.append("Keep body straight")
            score -= 15
            
        return score, feedback
    
    def _analyze_lunge(self, landmarks, angles, feedback, score):
        """Analyze lunge form"""
        front_knee = angles.get('front_knee', 0)
        back_knee = angles.get('back_knee', 0)
        
        # Front knee should be at 90 degrees
        if not (80 <= front_knee <= 100):
            feedback.append(f"Front knee angle: {front_knee}° (target: 90°)")
            score -= 20
            
        # Back knee should be close to ground
        if back_knee > 120:
            feedback.append("Lower back knee closer to ground")
            score -= 15
            
        return score, feedback
    
    def _analyze_plank(self, landmarks, angles, feedback, score):
        """Analyze plank form"""
        shoulder_hip_ankle = angles.get('shoulder_hip_ankle', 0)
        
        # Body should be straight
        if not (170 <= shoulder_hip_ankle <= 190):
            feedback.append("Keep body straight - engage core")
            score -= 20
            
        return score, feedback
    
    def _update_rep_count(self, landmarks, angles):
        """Update rep count based on movement patterns"""
        if not self.previous_angles:
            return
            
        # Exercise-specific rep counting
        if self.exercise_type == "squat":
            # Count reps based on knee angle changes
            current_knee = (angles.get('left_knee', 0) + angles.get('right_knee', 0)) / 2
            previous_knee = (self.previous_angles.get('left_knee', 0) + self.previous_angles.get('right_knee', 0)) / 2
            
            # Rep completed when going from low to high position
            if not self.is_down_position and current_knee < 90:
                self.is_down_position = True
            elif self.is_down_position and current_knee > 120:
                self.is_down_position = False
                self.rep_count += 1
                
        elif self.exercise_type == "pushup":
            # Count reps based on elbow angle changes
            current_elbow = (angles.get('left_elbow', 0) + angles.get('right_elbow', 0)) / 2
            previous_elbow = (self.previous_angles.get('left_elbow', 0) + self.previous_angles.get('right_elbow', 0)) / 2
            
            # Rep completed when going from low to high position
            if not self.is_down_position and current_elbow < 90:
                self.is_down_position = True
            elif self.is_down_position and current_elbow > 150:
                self.is_down_position = False
                self.rep_count += 1

# ----------------------------
# Main analysis function
# ----------------------------
def analyze_pose(landmarks, exercise="squat"):
    """Enhanced pose analysis with rep counting and detailed feedback"""
    analyzer = ExerciseAnalyzer(exercise)
    return analyzer.analyze_frame(landmarks)