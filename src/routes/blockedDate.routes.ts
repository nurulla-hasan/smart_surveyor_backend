import express, { type Router } from 'express';
import {
  getBlockedDates,
  toggleBlockedDate
} from '../controllers/blockedDate.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router: Router = express.Router();

router.use(protect);

router.get('/', getBlockedDates);
router.post('/toggle', toggleBlockedDate);

export default router;
