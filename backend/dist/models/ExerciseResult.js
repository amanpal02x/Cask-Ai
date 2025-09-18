"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExerciseResults = exports.createExerciseResult = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ExerciseResultSchema = new mongoose_1.default.Schema({
    patientId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User", // assuming you already have User model
        required: true,
    },
    exercise: { type: String, required: true }, // squat, pushup, lunge
    accuracy: { type: Number, required: true },
    feedback: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
});
const ExerciseResult = mongoose_1.default.model("ExerciseResult", ExerciseResultSchema);
const createExerciseResult = async (req, res) => {
    try {
        const newResult = new ExerciseResult(req.body);
        await newResult.save();
        res.status(201).json(newResult);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save exercise result' });
    }
};
exports.createExerciseResult = createExerciseResult;
const getExerciseResults = async (req, res) => {
    try {
        const results = await ExerciseResult.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch results' });
    }
};
exports.getExerciseResults = getExerciseResults;
exports.default = ExerciseResult;
//# sourceMappingURL=ExerciseResult.js.map