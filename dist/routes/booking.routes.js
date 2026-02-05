"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const booking_controller_js_1 = require("../controllers/booking.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = express_1.default.Router();
router.get('/calendar', booking_controller_js_1.getCalendarData);
// Publicly allow creating a booking (controller handles guest vs logged-in)
router.post('/', booking_controller_js_1.createBooking);
router.use(auth_middleware_js_1.protect);
router.get('/upcoming', booking_controller_js_1.getUpcomingBookings);
router
    .route('/')
    .get(booking_controller_js_1.getBookings);
router
    .route('/:id')
    .get(booking_controller_js_1.getBooking)
    .put(booking_controller_js_1.updateBooking)
    .delete(booking_controller_js_1.deleteBooking);
exports.default = router;
//# sourceMappingURL=booking.routes.js.map