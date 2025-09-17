const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database-pg');

const router = express.Router();

// Get all dental offices (temporarily public for frontend testing)
router.get('/', async (req, res) => {
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

// Get single dental office (temporarily public for frontend testing)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM dental_offices WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dental office not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dental office:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dental office'
    });
  }
});

// Create new dental office (temporarily public for frontend testing)
router.post('/', [
  body('name').notEmpty().withMessage('Office name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
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

// Update dental office
router.put('/:id', [
  authenticateToken,
  body('name').notEmpty().withMessage('Office name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
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

    const { id } = req.params;
    const { name, address, phone, email, contact_person } = req.body;
    
    const result = await pool.query(
      'UPDATE dental_offices SET name = $1, address = $2, phone = $3, email = $4, contact_person = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, address, phone, email, contact_person, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dental office not found'
      });
    }

    res.json({
      success: true,
      message: 'Dental office updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating dental office:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dental office'
    });
  }
});

// Delete dental office
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM dental_offices WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dental office not found'
      });
    }

    res.json({
      success: true,
      message: 'Dental office deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dental office:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dental office'
    });
  }
});

module.exports = router;
