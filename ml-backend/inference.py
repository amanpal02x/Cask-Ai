import math

def calculate_angle(a, b, c):
    ab = (a['x'] - b['x'], a['y'] - b['y'])
    cb = (c['x'] - b['x'], c['y'] - b['y'])
    dot = ab[0]*cb[0] + ab[1]*cb[1]
    mag_ab = math.sqrt(ab[0]**2 + ab[1]**2)
    mag_cb = math.sqrt(cb[0]**2 + cb[1]**2)
    return math.degrees(math.acos(dot / (mag_ab * mag_cb)))

def analyze_pose(landmarks):
    left_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])
    right_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])

    feedback = "Good posture"
    if left_knee_angle < 80 or right_knee_angle < 80:
        feedback = "Bend your knees more"

    return {
        "accuracy": 85,
        "feedback": feedback,
        "angles": {
            "left_knee": left_knee_angle,
            "right_knee": right_knee_angle
        }
    }
