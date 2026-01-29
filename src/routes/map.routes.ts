import express from 'express';
import {
  getMaps,
  saveMap,
  deleteMap
} from '../controllers/map.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getMaps)
  .post(saveMap);

router
  .route('/:id')
  .delete(deleteMap);

export default router;
