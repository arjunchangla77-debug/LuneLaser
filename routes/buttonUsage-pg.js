const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database-pg');

const router = express.Router();

// Get all button usage records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bu.*, lm.serial_number as machine_serial, lm.model as machine_model,
             do.name as office_name
      FROM button_usage bu 
      LEFT JOIN lune_machines lm ON bu.machine_id = lm.id 
      LEFT JOIN dental_offices do ON lm.office_id = do.id 
      ORDER BY bu.usage_date DESC, bu.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching button usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch button usage records'
    });
  }
});

// Get button usage by machine
router.get('/machine/:machineId', authenticateToken, async (req, res) => {
  try {
    const { machineId } = req.params;
    const result = await pool.query(`
      SELECT bu.*, lm.serial_number as machine_serial, lm.model as machine_model
      FROM button_usage bu 
      LEFT JOIN lune_machines lm ON bu.machine_id = lm.id 
      WHERE bu.machine_id = $1 
      ORDER BY bu.usage_date DESC
    `, [machineId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching button usage by machine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch button usage records'
    });
  }
});

// Record button usage
router.post('/', [
  authenticateToken,
  body('machine_id').isInt().withMessage('Valid machine ID is required'),
  body('button_count').isInt({ min: 1 }).withMessage('Valid button count is required'),
  body('usage_date').isISO8601().withMessage('Valid usage date is required')
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

    const { machine_id, button_count, usage_date } = req.body;
    
    const result = await pool.query(
      'INSERT INTO button_usage (machine_id, button_count, usage_date) VALUES ($1, $2, $3) RETURNING *',
      [machine_id, button_count, usage_date]
    );

    res.status(201).json({
      success: true,
      message: 'Button usage recorded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording button usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record button usage'
    });
  }
});

// Update button usage record
router.put('/:id', [
  authenticateToken,
  body('machine_id').isInt().withMessage('Valid machine ID is required'),
  body('button_count').isInt({ min: 1 }).withMessage('Valid button count is required'),
  body('usage_date').isISO8601().withMessage('Valid usage date is required')
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
    const { machine_id, button_count, usage_date } = req.body;
    
    const result = await pool.query(
      'UPDATE button_usage SET machine_id = $1, button_count = $2, usage_date = $3 WHERE id = $4 RETURNING *',
      [machine_id, button_count, usage_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Button usage record not found'
      });
    }

    res.json({
      success: true,
      message: 'Button usage updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating button usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update button usage'
    });
  }
});

// Delete button usage record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM button_usage WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Button usage record not found'
      });
    }

    res.json({
      success: true,
      message: 'Button usage record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting button usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete button usage record'
    });
  }
});

// Get usage statistics
router.get('/stats/:machineId', authenticateToken, async (req, res) => {
  try {
    const { machineId } = req.params;
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(button_count) as total_buttons,
        AVG(button_count) as avg_buttons_per_day,
        MIN(usage_date) as first_usage,
        MAX(usage_date) as last_usage
      FROM button_usage 
      WHERE machine_id = $1
    `, [machineId]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage statistics'
    });
  }
});

module.exports = router;
