import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'clinical_billing_secret_token_123';

const generateToken = (id: string, username: string, role: string) => {
  return jwt.sign({ id, username, role }, JWT_SECRET, {
    expiresIn: '8h'
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username.trim().toLowerCase() });
    
    if (user && (await (user as any).comparePassword(password))) {
      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        },
        token: generateToken(user._id.toString(), user.username, user.role)
      });
    } else {
      res.status(401);
      throw new Error('Invalid username or password credentials.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user (Clerk/Owner)
// @route   POST /api/auth/register
// @access  Private/Owner (or Public for initial setup)
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password, role, fullName } = req.body;

  try {
    const userExists = await User.findOne({ username: username.trim().toLowerCase() });

    if (userExists) {
      res.status(400);
      throw new Error('User account username already registered.');
    }

    const user = await User.create({
      username,
      password,
      role,
      fullName
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        },
        token: generateToken(user._id.toString(), user.username, user.role)
      });
    } else {
      res.status(400);
      throw new Error('Invalid user creation input parameters.');
    }
  } catch (error) {
    next(error);
  }
};
