import express from 'express';
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport
} from '../controllers/report.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getReports)
  .post(createReport);

router
  .route('/:id')
  .get(getReport)
  .put(updateReport)
  .delete(deleteReport);

export default router;
