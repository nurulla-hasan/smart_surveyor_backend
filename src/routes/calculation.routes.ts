import express, { type Router } from 'express';
import {
  getCalculations,
  saveCalculation,
  deleteCalculation
} from '../controllers/calculation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router: Router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getCalculations)
  .post(saveCalculation);

router
  .route('/:id')
  .delete(deleteCalculation);

export default router;
