import express from 'express';
import {
  getProfile,
  updateProfile
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/profile')
  .get(getProfile)
  .put(updateProfile);

export default router;
