import express from "express";
import ExerciseResult from "../models/ExerciseResult";
import axios from "axios";

const router = express.Router();

// POST: analyze pose and save result
router.post("/analyze", async (req, res) => {
  try {
    const { patientId, exercise, landmarks } = req.body;

    // Call Python ML backend
    const mlResponse = await axios.post("http://localhost:8000/predict", {
      exercise,
      landmarks,
    });

    const { accuracy, feedback } = mlResponse.data;

    // Save result in MongoDB
    const newResult = new ExerciseResult({
      patientId,
      exercise,
      accuracy,
      feedback,
    });

    await newResult.save();

    res.json({
      message: "Exercise result saved",
      result: newResult,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error saving result:", err.message);
    } else {
      console.error("Error saving result:", err);
    }
    res.status(500).json({ error: "Server error" });
  }
});

// GET: fetch results for a patient
router.get("/:patientId", async (req, res) => {
  try {
    const results = await ExerciseResult.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;
