"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseSeedService = void 0;
const Exercise_1 = __importDefault(require("../models/Exercise"));
const mongoose_1 = require("mongoose");
class ExerciseSeedService {
    static async seedExercises() {
        try {
            // Check if exercises already exist
            const existingExercises = await Exercise_1.default.countDocuments();
            if (existingExercises > 0) {
                console.log('Exercises already seeded, skipping...');
                return;
            }
            const sampleExercises = [
                {
                    name: 'Squat',
                    description: 'A fundamental lower body exercise that targets the quadriceps, hamstrings, and glutes.',
                    instructions: [
                        'Stand with feet shoulder-width apart',
                        'Lower your body by bending at the hips and knees',
                        'Keep your chest up and back straight',
                        'Lower until thighs are parallel to the ground',
                        'Push through heels to return to starting position'
                    ],
                    difficulty: 'beginner',
                    duration: 300, // 5 minutes
                    targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes'],
                    category: 'strength',
                    equipment: [],
                    caloriesPerMinute: 8,
                    poseLandmarks: {
                        keyPoints: ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
                        angles: [
                            {
                                name: 'knee_angle',
                                points: ['left_hip', 'left_knee', 'left_ankle'],
                                targetRange: [80, 100]
                            }
                        ],
                        repDetection: {
                            trigger: 'left_hip',
                            direction: 'down',
                            threshold: 0.1
                        }
                    },
                    formGuidance: {
                        correctForm: {
                            description: 'Maintain proper alignment throughout the movement with knees tracking over toes and chest up.',
                            keyPoints: [
                                'Keep knees aligned with toes',
                                'Maintain neutral spine',
                                'Engage core throughout movement',
                                'Distribute weight evenly on both feet',
                                'Keep chest up and shoulders back'
                            ],
                            commonMistakes: [
                                'Knees caving inward',
                                'Leaning too far forward',
                                'Not going low enough',
                                'Heels lifting off ground',
                                'Rounding the back'
                            ],
                            tips: [
                                'Focus on pushing hips back first',
                                'Keep weight in heels',
                                'Breathe in on the way down, out on the way up',
                                'Start with bodyweight before adding resistance',
                                'Practice in front of a mirror for form check'
                            ]
                        },
                        visualGuide: {
                            referenceImage: '/images/squat-correct-form.jpg',
                            referenceVideo: '/videos/squat-demo.mp4',
                            landmarks: [
                                { name: 'Hip Joint', position: 'Center of hip crease', importance: 'critical' },
                                { name: 'Knee Joint', position: 'Center of knee cap', importance: 'critical' },
                                { name: 'Ankle Joint', position: 'Center of ankle', importance: 'important' },
                                { name: 'Shoulder', position: 'Top of shoulder', importance: 'important' }
                            ]
                        },
                        datasetInfo: {
                            source: 'CaskAI Exercise Dataset v2.1',
                            sampleCount: 15420,
                            accuracy: 94.2,
                            lastUpdated: new Date('2024-01-15'),
                            version: '2.1.0'
                        }
                    },
                    createdBy: new mongoose_1.Types.ObjectId(), // This would be set to an actual doctor ID
                    isActive: true
                },
                {
                    name: 'Push-up',
                    description: 'A classic upper body exercise that strengthens the chest, shoulders, and triceps.',
                    instructions: [
                        'Start in plank position with hands slightly wider than shoulders',
                        'Lower your body until chest nearly touches the ground',
                        'Keep body in straight line from head to heels',
                        'Push back up to starting position',
                        'Maintain core engagement throughout'
                    ],
                    difficulty: 'intermediate',
                    duration: 240, // 4 minutes
                    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
                    category: 'strength',
                    equipment: [],
                    caloriesPerMinute: 10,
                    poseLandmarks: {
                        keyPoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
                        angles: [
                            {
                                name: 'elbow_angle',
                                points: ['left_shoulder', 'left_elbow', 'left_wrist'],
                                targetRange: [90, 120]
                            }
                        ],
                        repDetection: {
                            trigger: 'left_shoulder',
                            direction: 'down',
                            threshold: 0.15
                        }
                    },
                    formGuidance: {
                        correctForm: {
                            description: 'Maintain a straight line from head to heels while moving up and down.',
                            keyPoints: [
                                'Keep body in straight line',
                                'Hands positioned slightly wider than shoulders',
                                'Lower chest to ground level',
                                'Engage core throughout movement',
                                'Full range of motion'
                            ],
                            commonMistakes: [
                                'Sagging hips or raised butt',
                                'Hands too wide or too narrow',
                                'Not going low enough',
                                'Head dropping down',
                                'Elbows flaring out too much'
                            ],
                            tips: [
                                'Start with modified push-ups if needed',
                                'Focus on core engagement',
                                'Keep neck neutral',
                                'Breathe out on the push up',
                                'Progress gradually to full push-ups'
                            ]
                        },
                        visualGuide: {
                            referenceImage: '/images/pushup-correct-form.jpg',
                            referenceVideo: '/videos/pushup-demo.mp4',
                            landmarks: [
                                { name: 'Shoulder', position: 'Top of shoulder joint', importance: 'critical' },
                                { name: 'Elbow', position: 'Center of elbow joint', importance: 'critical' },
                                { name: 'Wrist', position: 'Center of wrist joint', importance: 'important' },
                                { name: 'Hip', position: 'Center of hip joint', importance: 'important' }
                            ]
                        },
                        datasetInfo: {
                            source: 'CaskAI Exercise Dataset v2.1',
                            sampleCount: 12850,
                            accuracy: 91.8,
                            lastUpdated: new Date('2024-01-15'),
                            version: '2.1.0'
                        }
                    },
                    createdBy: new mongoose_1.Types.ObjectId(),
                    isActive: true
                },
                {
                    name: 'Plank',
                    description: 'An isometric core exercise that strengthens the entire core and improves stability.',
                    instructions: [
                        'Start in push-up position',
                        'Lower down to forearms',
                        'Keep body in straight line from head to heels',
                        'Engage core and hold position',
                        'Breathe normally throughout'
                    ],
                    difficulty: 'beginner',
                    duration: 180, // 3 minutes
                    targetMuscles: ['Core', 'Shoulders', 'Back'],
                    category: 'strength',
                    equipment: [],
                    caloriesPerMinute: 6,
                    poseLandmarks: {
                        keyPoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
                        angles: [
                            {
                                name: 'body_alignment',
                                points: ['left_shoulder', 'left_hip', 'left_knee'],
                                targetRange: [170, 190]
                            }
                        ],
                        repDetection: {
                            trigger: 'left_shoulder',
                            direction: 'static',
                            threshold: 0.05
                        }
                    },
                    formGuidance: {
                        correctForm: {
                            description: 'Maintain a straight line from head to heels with engaged core.',
                            keyPoints: [
                                'Straight line from head to heels',
                                'Engage core muscles',
                                'Shoulders over elbows',
                                'Neutral spine position',
                                'Breathe normally'
                            ],
                            commonMistakes: [
                                'Sagging hips',
                                'Raised buttocks',
                                'Looking up or down',
                                'Holding breath',
                                'Shoulders too far forward'
                            ],
                            tips: [
                                'Start with shorter holds',
                                'Focus on core engagement',
                                'Keep neck neutral',
                                'Breathe steadily',
                                'Progress gradually'
                            ]
                        },
                        visualGuide: {
                            referenceImage: '/images/plank-correct-form.jpg',
                            referenceVideo: '/videos/plank-demo.mp4',
                            landmarks: [
                                { name: 'Shoulder', position: 'Top of shoulder joint', importance: 'critical' },
                                { name: 'Hip', position: 'Center of hip joint', importance: 'critical' },
                                { name: 'Knee', position: 'Center of knee joint', importance: 'important' },
                                { name: 'Ankle', position: 'Center of ankle joint', importance: 'important' }
                            ]
                        },
                        datasetInfo: {
                            source: 'CaskAI Exercise Dataset v2.1',
                            sampleCount: 9850,
                            accuracy: 96.5,
                            lastUpdated: new Date('2024-01-15'),
                            version: '2.1.0'
                        }
                    },
                    createdBy: new mongoose_1.Types.ObjectId(),
                    isActive: true
                }
            ];
            await Exercise_1.default.insertMany(sampleExercises);
            console.log(`Seeded ${sampleExercises.length} exercises successfully`);
        }
        catch (error) {
            console.error('Error seeding exercises:', error);
            throw error;
        }
    }
}
exports.ExerciseSeedService = ExerciseSeedService;
//# sourceMappingURL=exerciseSeedService.js.map