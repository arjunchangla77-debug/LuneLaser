const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database-pg');

const router = express.Router();

// Get all invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, do.name as office_name, lm.serial_number as machine_serial 
      FROM invoices i 
      LEFT JOIN dental_offices do ON i.office_id = do.id 
      LEFT JOIN lune_machines lm ON i.machine_id = lm.id 
      ORDER BY i.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
});

// Get single invoice
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT i.*, do.name as office_name, do.address as office_address, 
             lm.serial_number as machine_serial, lm.model as machine_model
      FROM invoices i 
      LEFT JOIN dental_offices do ON i.office_id = do.id 
      LEFT JOIN lune_machines lm ON i.machine_id = lm.id 
      WHERE i.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice'
    });
  }
});

// Create new invoice
router.post('/', [
  authenticateToken,
  body('invoice_number').notEmpty().withMessage('Invoice number is required'),
  body('office_id').isInt().withMessage('Valid office ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('issue_date').isISO8601().withMessage('Valid issue date is required')
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
      invoice_number, 
      office_id, 
      machine_id, 
      amount, 
      tax_amount = 0, 
      status = 'pending',
      issue_date,
      due_date,
      description 
    } = req.body;

    const total_amount = parseFloat(amount) + parseFloat(tax_amount);
    
    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, office_id, machine_id, amount, tax_amount, total_amount, status, issue_date, due_date, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [invoice_number, office_id, machine_id, amount, tax_amount, total_amount, status, issue_date, due_date, description]
    );

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        message: 'Invoice number already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create invoice'
      });
    }
  }
});

// Update invoice
router.put('/:id', [
  authenticateToken,
  body('invoice_number').notEmpty().withMessage('Invoice number is required'),
  body('office_id').isInt().withMessage('Valid office ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required')
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
      invoice_number, 
      office_id, 
      machine_id, 
      amount, 
      tax_amount = 0, 
      status,
      issue_date,
      due_date,
      payment_date,
      description 
    } = req.body;

    const total_amount = parseFloat(amount) + parseFloat(tax_amount);
    
    const result = await pool.query(
      `UPDATE invoices SET 
       invoice_number = $1, office_id = $2, machine_id = $3, amount = $4, 
       tax_amount = $5, total_amount = $6, status = $7, issue_date = $8, 
       due_date = $9, payment_date = $10, description = $11, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $12 RETURNING *`,
      [invoice_number, office_id, machine_id, amount, tax_amount, total_amount, status, issue_date, due_date, payment_date, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice'
    });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice'
    });
  }
});

// Update invoice status
router.patch('/:id/status', [
  authenticateToken,
  body('status').isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status')
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
    const { status } = req.body;
    
    // If marking as paid, set payment_date
    const payment_date = status === 'paid' ? 'CURRENT_DATE' : 'NULL';
    
    const result = await pool.query(
      `UPDATE invoices SET status = $1, payment_date = ${payment_date}, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status'
    });
  }
});

module.exports = router;
