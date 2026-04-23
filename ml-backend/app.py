from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

from rehabai_engine import RehabAIEngine

import logging

engine = RehabAIEngine()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RehabAI Backend",
    version="1.0"
)


# Exercise options
class ExerciseType(str, Enum):

    squat = "squat"
    pushup = "pushup"
    lunge = "lunge"
    plank = "plank"
    knee_extension = "knee_extension"
    shoulder_abduction = "shoulder_abduction"


class PoseLandmark(BaseModel):

    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0


# In-memory session storage for production (consider Redis for scale)
session_states = {}

class PoseData(BaseModel):
    landmarks: List[PoseLandmark]
    exercise: ExerciseType
    sessionId: Optional[str] = "default"


@app.post("/predict")
async def predict(data: PoseData):
    try:
        # logger.info(f"Exercise: {data.exercise}, Session: {data.sessionId}")

        landmarks_list = []
        for lm in data.landmarks:
            landmarks_list.append({
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility
            })

        # Get or initialize session state
        state = session_states.get(data.sessionId)

        result = engine.process_frame(
            landmarks_list,
            data.exercise,
            state,
            data.sessionId # Pass session_id to engine
        )

        # Update session state with the new state returned by the engine
        if data.sessionId:
            session_states[data.sessionId] = result.get("session_state")

        return result

    except Exception as e:
        logger.error(f"Error in predict: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/supported-exercises")
async def supported_exercises():

    return {
        "exercises": [
            "squat",
            "pushup",
            "lunge",
            "plank",
            "knee_extension",
            "shoulder_abduction"
        ]
    }