import express, { type Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification
} from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router: Router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
