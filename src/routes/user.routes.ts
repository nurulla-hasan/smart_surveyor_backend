import express from 'express';
import {
  getProfile,
  updateProfile,
  getSurveyors,
  getSurveyorProfile
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/surveyors', getSurveyors);
router.get('/surveyors/:id', getSurveyorProfile);

router
  .route('/profile')
  .get(getProfile)
  .put(upload.single('profileImage'), updateProfile);

export default router;
