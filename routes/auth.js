const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  AuthController, 
  registerValidation, 
  loginValidation, 
  forgotPasswordValidation, 
  resetPasswordValidation, 
  changePasswordValidation 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (increased for development)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)
router.post('/register', authLimiter, registerValidation, AuthController.register);
router.post('/login', authLimiter, loginValidation, AuthController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, AuthController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, AuthController.resetPassword);

// Protected routes (authentication required)
router.get('/profile', generalLimiter, authenticateToken, AuthController.getProfile);
router.post('/change-password', generalLimiter, authenticateToken, changePasswordValidation, AuthController.changePassword);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
