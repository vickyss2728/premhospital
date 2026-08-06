import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/authController';

const router = Router();

// Public routes for user operations
router.post('/login', loginUser);
router.post('/register', registerUser);

export default router;
