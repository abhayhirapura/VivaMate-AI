import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  generateSession,
  evaluateAnswer,
  generateReport,
  saveSession,
  listSessions,
  getSession,
} from '../controllers/vivaController.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many AI requests — please wait a minute.' } },
});

router.post('/generate',  aiLimiter, generateSession);
router.post('/evaluate',  aiLimiter, evaluateAnswer);
router.post('/report',    aiLimiter, generateReport);
router.post('/sessions',  saveSession);
router.get('/sessions',   listSessions);
router.get('/sessions/:id', getSession);

export default router;
