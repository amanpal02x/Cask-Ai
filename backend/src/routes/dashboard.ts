import { Router } from 'express';
import { getDashboardStats, getProgressData } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

router.get('/stats', getDashboardStats);
router.get('/progress', getProgressData);

export default router;
