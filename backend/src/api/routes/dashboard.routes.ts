import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect as any, getDashboard);

// A more complete implementation would have a POST route for marking complete:
// router.post('/topics/:topicId/complete', protect, markTopicComplete);

export default router;