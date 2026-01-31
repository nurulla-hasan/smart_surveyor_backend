import express from 'express';
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport
} from '../controllers/report.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getReports)
  .post(upload.single('reportFile'), createReport);

router
  .route('/:id')
  .get(getReport)
  .put(upload.single('reportFile'), updateReport)
  .delete(deleteReport);

export default router;
