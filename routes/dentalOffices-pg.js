const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database-pg');

const router = express.Router();

// Get all dental offices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dental_offices ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching dental offices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dental offices'
    });
  }
});

// Create new dental office
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('Office name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, address, phone, email, contact_person } = req.body;
    
    const result = await pool.query(
      'INSERT INTO dental_offices (name, address, phone, email, contact_person) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, address, phone, email, contact_person]
    );

    res.status(201).json({
      success: true,
      message: 'Dental office created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating dental office:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dental office'
    });
  }
});

module.exports = router;
