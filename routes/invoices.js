const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database-pg');

const router = express.Router();

// Get all invoices
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { officeId, status, year, month } = req.query;
  
  let query = `
    SELECT i.*, do.name as office_name, do.npi_id
    FROM invoices i
    JOIN dental_offices do ON i.dental_office_id = do.id
    WHERE do.is_deleted = 0
  `;
  
  const params = [];
  
  if (officeId) {
    query += ` AND i.dental_office_id = ?`;
    params.push(officeId);
  }
  
  if (status) {
    query += ` AND i.status = ?`;
    params.push(status);
  }
  
  if (year) {
    query += ` AND i.year = ?`;
    params.push(year);
  }
  
  if (month) {
    query += ` AND i.month = ?`;
    params.push(month);
  }
  
  query += ` ORDER BY i.year DESC, i.month DESC, i.generated_at DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching invoices:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const invoices = rows.map(row => ({
      ...row,
      invoice_data: row.invoice_data ? JSON.parse(row.invoice_data) : null
    }));
    
    res.json({ success: true, data: invoices });
  });
  
  db.close();
});

// Get invoice by ID
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  const query = `
    SELECT i.*, do.name as office_name, do.npi_id, do.address, do.phone_number, do.email
    FROM invoices i
    JOIN dental_offices do ON i.dental_office_id = do.id
    WHERE i.id = ? AND do.is_deleted = 0
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching invoice:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    const invoice = {
      ...row,
      invoice_data: row.invoice_data ? JSON.parse(row.invoice_data) : null
    };
    
    res.json({ success: true, data: invoice });
  });
  
  db.close();
});

// Generate invoice for a dental office for a specific month
router.post('/generate',
  authenticateToken,
  [
    body('dental_office_id').isInt({ min: 1 }).withMessage('Valid dental office ID is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
    body('year').isInt({ min: 2020 }).withMessage('Valid year is required')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    
    const db = getDb();
    const { dental_office_id, month, year } = req.body;
    
    // Check if invoice already exists for this month/year
    const checkQuery = `
      SELECT id FROM invoices 
      WHERE dental_office_id = ? AND month = ? AND year = ?
    `;
    
    db.get(checkQuery, [dental_office_id, month, year], (err, existingInvoice) => {
      if (err) {
        console.error('Error checking existing invoice:', err);
        db.close();
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (existingInvoice) {
        db.close();
        return res.status(400).json({ 
          success: false, 
          message: 'Invoice already exists for this month and year' 
        });
      }
      
      // Get dental office info
      const officeQuery = `
        SELECT * FROM dental_offices 
        WHERE id = ? AND is_deleted = 0
      `;
      
      db.get(officeQuery, [dental_office_id], (err, office) => {
        if (err) {
          console.error('Error fetching dental office:', err);
          db.close();
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (!office) {
          db.close();
          return res.status(404).json({ success: false, message: 'Dental office not found' });
        }
        
        // Get lune machines for this office
        const lunesQuery = `
          SELECT * FROM lune_machines 
          WHERE dental_office_id = ? AND is_deleted = 0
        `;
        
        db.all(lunesQuery, [dental_office_id], (err, lunes) => {
          if (err) {
            console.error('Error fetching lune machines:', err);
            db.close();
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          
          if (lunes.length === 0) {
            db.close();
            return res.status(400).json({ 
              success: false, 
              message: 'No lune machines found for this dental office' 
            });
          }
          
          // Get usage data for each lune machine for the specified month
          const luneIds = lunes.map(l => l.id);
          const usageQuery = `
            SELECT 
              lune_machine_id,
              button_number,
              COUNT(*) as press_count,
              SUM(duration_seconds) as total_duration_seconds
            FROM button_usage
            WHERE lune_machine_id IN (${luneIds.map(() => '?').join(',')})
              AND strftime('%Y', usage_date) = ?
              AND strftime('%m', usage_date) = ?
            GROUP BY lune_machine_id, button_number
            ORDER BY lune_machine_id, button_number
          `;
          
          const usageParams = [...luneIds, year.toString(), month.toString().padStart(2, '0')];
          
          db.all(usageQuery, usageParams, (err, usageData) => {
            if (err) {
              console.error('Error fetching usage data:', err);
              db.close();
              return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            // Calculate invoice data
            const invoiceData = {
              office: office,
              month: month,
              year: year,
              lunes: []
            };
            
            let totalAmount = 0;
            const costPerPress = 0.10; // $0.10 per button press
            const costPerMinute = 0.05; // $0.05 per minute
            
            lunes.forEach(lune => {
              const luneUsage = usageData.filter(u => u.lune_machine_id === lune.id);
              const luneData = {
                serial_number: lune.serial_number,
                purchase_date: lune.purchase_date,
                buttons: []
              };
              
              let luneTotal = 0;
              
              // Ensure we have data for all 6 buttons (assuming 6 buttons per lune)
              for (let buttonNum = 1; buttonNum <= 6; buttonNum++) {
                const buttonUsage = luneUsage.find(u => u.button_number === buttonNum) || {
                  press_count: 0,
                  total_duration_seconds: 0
                };
                
                const pressCost = buttonUsage.press_count * costPerPress;
                const durationCost = (buttonUsage.total_duration_seconds / 60) * costPerMinute;
                const buttonTotal = pressCost + durationCost;
                
                luneData.buttons.push({
                  button_number: buttonNum,
                  press_count: buttonUsage.press_count,
                  total_duration_seconds: buttonUsage.total_duration_seconds,
                  total_duration_minutes: Math.round(buttonUsage.total_duration_seconds / 60 * 100) / 100,
                  press_cost: Math.round(pressCost * 100) / 100,
                  duration_cost: Math.round(durationCost * 100) / 100,
                  total_cost: Math.round(buttonTotal * 100) / 100
                });
                
                luneTotal += buttonTotal;
              }
              
              luneData.total_cost = Math.round(luneTotal * 100) / 100;
              invoiceData.lunes.push(luneData);
              totalAmount += luneTotal;
            });
            
            invoiceData.total_amount = Math.round(totalAmount * 100) / 100;
            
            // Generate invoice number
            const invoiceNumber = `INV-${year}${month.toString().padStart(2, '0')}-${office.npi_id}`;
            
            // Insert invoice
            const insertQuery = `
              INSERT INTO invoices (dental_office_id, invoice_number, month, year, total_amount, invoice_data)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            db.run(insertQuery, [
              dental_office_id, 
              invoiceNumber, 
              month, 
              year, 
              invoiceData.total_amount,
              JSON.stringify(invoiceData)
            ], function(err) {
              if (err) {
                console.error('Error creating invoice:', err);
                db.close();
                return res.status(500).json({ success: false, message: 'Database error' });
              }
              
              res.status(201).json({ 
                success: true, 
                message: 'Invoice generated successfully',
                data: { 
                  id: this.lastID,
                  invoice_number: invoiceNumber,
                  total_amount: invoiceData.total_amount
                }
              });
              
              db.close();
            });
          });
        });
      });
    });
  }
);

// Update invoice status
router.patch('/:id/status',
  authenticateToken,
  [
    body('status').isIn(['paid', 'unpaid']).withMessage('Status must be either paid or unpaid')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;
    
    const paidAt = status === 'paid' ? new Date().toISOString() : null;
    
    const query = `
      UPDATE invoices 
      SET status = ?, paid_at = ?
      WHERE id = ?
    `;
    
    db.run(query, [status, paidAt, id], function(err) {
      if (err) {
        console.error('Error updating invoice status:', err);
        db.close();
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (this.changes === 0) {
        db.close();
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      
      res.json({ success: true, message: 'Invoice status updated successfully' });
      db.close();
    });
  }
);

module.exports = router;
