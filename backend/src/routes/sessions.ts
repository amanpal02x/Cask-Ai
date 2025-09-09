import { Router } from 'express';
import { 
  startSession, 
  endSession, 
  getSessionHistory, 
  getSession,
  uploadSessionVideo,
  analyzeFrame
} from '../controllers/sessionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All session routes require authentication
router.use(authMiddleware);

router.post('/start', startSession);
router.post('/:sessionId/end', endSession);
router.get('/history', getSessionHistory);
router.get('/:sessionId', getSession);
router.post('/:sessionId/video', uploadSessionVideo);
router.post('/:sessionId/analyze', analyzeFrame);

export default router;
