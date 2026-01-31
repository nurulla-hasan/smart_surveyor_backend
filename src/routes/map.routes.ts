import express, { type Router } from 'express';
import {
  getMaps,
  saveMap,
  deleteMap,
  getClientSharedMaps
} from '../controllers/map.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router: Router = express.Router();

router.use(protect);

router.get('/shared', getClientSharedMaps);

router
  .route('/')
  .get(getMaps)
  .post(saveMap);

router
  .route('/:id')
  .delete(deleteMap);

export default router;
