import { Router } from 'express';
import {
  generateQuiz,
  getChatbotResponse,
  analyzeVideoContent,
  generateSpeech,
} from '../controllers/ai.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All AI routes should be protected to prevent unauthorized API usage
router.use(protect as any);

router.post('/quiz', generateQuiz);
router.post('/chat', getChatbotResponse);
router.post('/analyze-video', analyzeVideoContent);
router.post('/tts', generateSpeech);

export default router;