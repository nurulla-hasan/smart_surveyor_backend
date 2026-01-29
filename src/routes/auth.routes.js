import express from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

export default router;
