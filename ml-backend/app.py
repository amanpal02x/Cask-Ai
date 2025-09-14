from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from analyze_pose import analyze_pose
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CaskAI ML Backend",
    description="AI-powered pose analysis for exercise tracking",
    version="2.0.0"
)

class PoseLandmark(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0

class PoseData(BaseModel):
    landmarks: List[PoseLandmark]
    exercise: str = "squat"
    sessionId: Optional[str] = None
    timestamp: Optional[float] = None

class AnalysisResult(BaseModel):
    exercise: str
    accuracy: int
    feedback: List[str]
    angles: Dict[str, float]
    repCount: int
    isCorrectForm: bool
    confidence: float

@app.post("/predict", response_model=AnalysisResult)
async def predict(data: PoseData):
    """
    Analyze pose landmarks and return exercise form analysis
    """
    try:
        logger.info(f"Analyzing {data.exercise} with {len(data.landmarks)} landmarks")
        
        # Convert landmarks to the format expected by analyze_pose
        landmarks_list = []
        for landmark in data.landmarks:
            landmarks_list.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            })
        
        # Perform pose analysis
        result = analyze_pose(landmarks_list, exercise=data.exercise)
        
        # Log the analysis result
        logger.info(f"Analysis result: {result['accuracy']}% accuracy, {result['repCount']} reps")
        
        return AnalysisResult(
            exercise=result['exercise'],
            accuracy=result['accuracy'],
            feedback=result['feedback'],
            angles=result['angles'],
            repCount=result['repCount'],
            isCorrectForm=result['isCorrectForm'],
            confidence=result['confidence']
        )
        
    except Exception as e:
        logger.error(f"Error in pose analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/batch-predict")
async def batch_predict(data: List[PoseData]):
    """
    Analyze multiple pose frames in batch
    """
    try:
        results = []
        for frame_data in data:
            result = await predict(frame_data)
            results.append(result)
        
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CaskAI ML Backend",
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "CaskAI ML Backend API",
        "version": "2.0.0",
        "endpoints": {
            "/predict": "Single pose analysis",
            "/batch-predict": "Batch pose analysis",
            "/health": "Health check",
            "/docs": "API documentation"
        }
    }

@app.get("/supported-exercises")
async def get_supported_exercises():
    """Get list of supported exercises"""
    return {
        "exercises": ["squat", "pushup", "lunge", "plank"],
        "descriptions": {
            "squat": "Basic squat exercise for leg strength",
            "pushup": "Upper body strength exercise",
            "lunge": "Single leg strength and balance exercise",
            "plank": "Core strength and stability exercise"
        }
    }