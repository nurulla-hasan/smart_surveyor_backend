import express, { type Router } from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  getUpcomingBookings,
  getCalendarData
} from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router: Router = express.Router();

router.get('/calendar', getCalendarData);

// Publicly allow creating a booking (controller handles guest vs logged-in)
router.post('/', createBooking);

router.use(protect);

router.get('/upcoming', getUpcomingBookings);

router
  .route('/')
  .get(getBookings);

router
  .route('/:id')
  .get(getBooking)
  .put(updateBooking)
  .delete(deleteBooking);

export default router;
