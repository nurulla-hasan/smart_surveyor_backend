import express, { type Router } from 'express';
import {
  getStats,
  getMonthlyStats
} from '../controllers/dashboard.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router: Router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/monthly-stats', getMonthlyStats);

export default router;
