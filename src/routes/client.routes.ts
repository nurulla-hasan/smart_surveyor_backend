import express, { type Router } from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router: Router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getClients)
  .post(createClient);

router
  .route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

export default router;
