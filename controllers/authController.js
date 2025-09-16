const { body, validationResult } = require('express-validator');
const User = require('../models/User-pg');
const { generateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, email, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create new user
      const userId = await User.create({
        username,
        email,
        password,
        fullName
      });

      // Generate JWT token
      const token = generateToken(userId);

      // Send welcome email (don't wait for it)
      emailService.sendWelcomeEmail(email, fullName || username)
        .catch(err => console.error('Failed to send welcome email:', err));

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: userId,
            username,
            email,
            fullName
          }
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { login, password } = req.body;

      // Find user by username or email
      const user = await User.findByLogin(login);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name
          }
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  // Forgot password
  static async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      try {
        const { resetToken, user } = await User.generateResetToken(email);
        
        // Send password reset email
        await emailService.sendPasswordResetEmail(
          email, 
          resetToken, 
          user.full_name || user.username
        );

        res.json({
          success: true,
          message: 'Password reset email sent successfully'
        });

      } catch (error) {
        if (error.message === 'User not found') {
          // Don't reveal if email exists or not for security
          res.json({
            success: true,
            message: 'If the email exists, a password reset link has been sent'
          });
        } else {
          throw error;
        }
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { token, newPassword } = req.body;

      try {
        await User.resetPassword(token, newPassword);

        res.json({
          success: true,
          message: 'Password reset successfully'
        });

      } catch (error) {
        if (error.message === 'Invalid or expired reset token') {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
          });
        }
        throw error;
      }

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            createdAt: user.created_at,
            lastLogin: user.last_login
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }

  // Change password (for logged in users)
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      try {
        await User.changePassword(req.user.id, currentPassword, newPassword);

        res.json({
          success: true,
          message: 'Password changed successfully'
        });

      } catch (error) {
        if (error.message === 'Current password is incorrect') {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }
        throw error;
      }

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
}

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.@-]+$/)
    .withMessage('Username can contain letters, numbers, underscores, dots, @ and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters')
];

const loginValidation = [
  body('login')
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

module.exports = {
  AuthController,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
};
