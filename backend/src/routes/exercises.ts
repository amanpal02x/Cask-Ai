import { Router } from 'express';
import { 
  getExercises, 
  getExercise, 
  createExercise, 
  updateExercise, 
  deleteExercise 
} from '../controllers/exerciseController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All exercise routes require authentication
router.use(authMiddleware);

router.get('/', getExercises);
router.get('/:id', getExercise);
router.post('/', createExercise);
router.put('/:id', updateExercise);
router.delete('/:id', deleteExercise);

export default router;
