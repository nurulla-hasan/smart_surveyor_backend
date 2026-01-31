import express from 'express';
import { getBlockedDates, toggleBlockedDate } from '../controllers/blockedDate.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = express.Router();
router.use(protect);
router.get('/', getBlockedDates);
router.post('/toggle', toggleBlockedDate);
export default router;
//# sourceMappingURL=blockedDate.routes.js.map