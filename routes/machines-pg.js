const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database-pg');

const router = express.Router();

// Get all machines (temporarily public for frontend testing)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lm.*, do.name as office_name 
      FROM lune_machines lm 
      LEFT JOIN dental_offices do ON lm.office_id = do.id 
      ORDER BY lm.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch machines'
    });
  }
});

// Get single machine (temporarily public for frontend testing)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT lm.*, do.name as office_name, do.address as office_address
      FROM lune_machines lm 
      LEFT JOIN dental_offices do ON lm.office_id = do.id 
      WHERE lm.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching machine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch machine'
    });
  }
});

// Create new machine (temporarily public for frontend testing)
router.post('/', [
  body('serial_number').notEmpty().withMessage('Serial number is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('office_id').isInt().withMessage('Valid office ID is required')
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

    const { 
      serial_number, 
      model, 
      office_id, 
      installation_date, 
      warranty_expiry, 
      status = 'active' 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO lune_machines (serial_number, model, office_id, installation_date, warranty_expiry, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [serial_number, model, office_id, installation_date, warranty_expiry, status]
    );

    res.status(201).json({
      success: true,
      message: 'Machine created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating machine:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        message: 'Serial number already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create machine'
      });
    }
  }
});

// Update machine
router.put('/:id', [
  authenticateToken,
  body('serial_number').notEmpty().withMessage('Serial number is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('office_id').isInt().withMessage('Valid office ID is required')
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
    const { 
      serial_number, 
      model, 
      office_id, 
      installation_date, 
      warranty_expiry, 
      status 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE lune_machines SET 
       serial_number = $1, model = $2, office_id = $3, installation_date = $4, 
       warranty_expiry = $5, status = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 RETURNING *`,
      [serial_number, model, office_id, installation_date, warranty_expiry, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating machine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update machine'
    });
  }
});

// Delete machine
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM lune_machines WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting machine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete machine'
    });
  }
});

// Get machines by office (temporarily public for frontend testing)
router.get('/office/:officeId', async (req, res) => {
  try {
    const { officeId } = req.params;
    const result = await pool.query(
      'SELECT * FROM lune_machines WHERE office_id = $1 ORDER BY created_at DESC',
      [officeId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching machines by office:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch machines'
    });
  }
});

module.exports = router;
