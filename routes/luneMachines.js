const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database', 'users.db');

// Get database connection
const getDb = () => {
  return new sqlite3.Database(dbPath);
};

// Get all lune machines
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { search, officeId, includeDeleted } = req.query;
  
  let query = `
    SELECT lm.*, do.name as office_name, do.npi_id
    FROM lune_machines lm
    JOIN dental_offices do ON lm.dental_office_id = do.id
    WHERE lm.is_deleted = ? AND do.is_deleted = 0
  `;
  
  const params = [includeDeleted === 'true' ? 1 : 0];
  
  if (search) {
    query += ` AND lm.serial_number LIKE ?`;
    params.push(`%${search}%`);
  }
  
  if (officeId) {
    query += ` AND lm.dental_office_id = ?`;
    params.push(officeId);
  }
  
  query += ` ORDER BY lm.created_at DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching lune machines:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    res.json({ success: true, data: rows });
  });
  
  db.close();
});

// Get lune machine by ID
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  const query = `
    SELECT lm.*, do.name as office_name, do.npi_id, do.state, do.town
    FROM lune_machines lm
    JOIN dental_offices do ON lm.dental_office_id = do.id
    WHERE lm.id = ? AND lm.is_deleted = 0 AND do.is_deleted = 0
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching lune machine:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'Lune machine not found' });
    }
    
    res.json({ success: true, data: row });
  });
  
  db.close();
});

// Search lune machine by serial number
router.get('/search/serial/:serial', authenticateToken, (req, res) => {
  const db = getDb();
  const { serial } = req.params;
  
  const query = `
    SELECT lm.*, do.name as office_name, do.npi_id, do.state, do.town
    FROM lune_machines lm
    JOIN dental_offices do ON lm.dental_office_id = do.id
    WHERE lm.serial_number = ? AND lm.is_deleted = 0 AND do.is_deleted = 0
  `;
  
  db.get(query, [serial], (err, row) => {
    if (err) {
      console.error('Error searching lune machine by serial:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'Lune machine not found' });
    }
    
    res.json({ success: true, data: row });
  });
  
  db.close();
});

// Add lune machine to existing dental office
router.post('/',
  authenticateToken,
  [
    body('serial_number').trim().isLength({ min: 1 }).withMessage('Serial number is required'),
    body('dental_office_id').isInt({ min: 1 }).withMessage('Valid dental office ID is required'),
    body('purchase_date').isISO8601().withMessage('Valid purchase date is required')
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
    const { serial_number, dental_office_id, purchase_date } = req.body;
    
    // First check if dental office exists and is not deleted
    const checkOfficeQuery = `
      SELECT id FROM dental_offices 
      WHERE id = ? AND is_deleted = 0
    `;
    
    db.get(checkOfficeQuery, [dental_office_id], (err, office) => {
      if (err) {
        console.error('Error checking dental office:', err);
        db.close();
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (!office) {
        db.close();
        return res.status(404).json({ success: false, message: 'Dental office not found' });
      }
      
      // Insert lune machine
      const insertQuery = `
        INSERT INTO lune_machines (serial_number, dental_office_id, purchase_date)
        VALUES (?, ?, ?)
      `;
      
      db.run(insertQuery, [serial_number, dental_office_id, purchase_date], function(err) {
        if (err) {
          console.error('Error creating lune machine:', err);
          db.close();
          
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ 
              success: false, 
              message: 'Serial number already exists' 
            });
          }
          
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.status(201).json({ 
          success: true, 
          message: 'Lune machine added successfully',
          data: { id: this.lastID }
        });
        
        db.close();
      });
    });
  }
);

// Soft delete lune machine
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  const query = `
    UPDATE lune_machines 
    SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_deleted = 0
  `;
  
  db.run(query, [id], function(err) {
    if (err) {
      console.error('Error deleting lune machine:', err);
      db.close();
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (this.changes === 0) {
      db.close();
      return res.status(404).json({ success: false, message: 'Lune machine not found' });
    }
    
    res.json({ success: true, message: 'Lune machine deleted successfully' });
    db.close();
  });
});

// Get monthly stats for a lune machine
router.get('/:id/stats/:year/:month', authenticateToken, (req, res) => {
  const db = getDb();
  const { id, year, month } = req.params;
  
  // First check if lune machine exists
  const checkLuneQuery = `
    SELECT lm.*, do.name as office_name
    FROM lune_machines lm
    JOIN dental_offices do ON lm.dental_office_id = do.id
    WHERE lm.id = ? AND lm.is_deleted = 0 AND do.is_deleted = 0
  `;
  
  db.get(checkLuneQuery, [id], (err, lune) => {
    if (err) {
      console.error('Error checking lune machine:', err);
      db.close();
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!lune) {
      db.close();
      return res.status(404).json({ success: false, message: 'Lune machine not found' });
    }
    
    // Get usage stats for the specified month
    const statsQuery = `
      SELECT 
        button_number,
        COUNT(*) as press_count,
        SUM(duration_seconds) as total_duration_seconds,
        AVG(duration_seconds) as avg_duration_seconds,
        MIN(duration_seconds) as min_duration_seconds,
        MAX(duration_seconds) as max_duration_seconds
      FROM button_usage
      WHERE lune_machine_id = ? 
        AND strftime('%Y', usage_date) = ? 
        AND strftime('%m', usage_date) = ?
      GROUP BY button_number
      ORDER BY button_number
    `;
    
    db.all(statsQuery, [id, year, month.padStart(2, '0')], (err, stats) => {
      if (err) {
        console.error('Error fetching usage stats:', err);
        db.close();
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      // Get detailed button presses for the month
      const detailQuery = `
        SELECT *
        FROM button_usage
        WHERE lune_machine_id = ? 
          AND strftime('%Y', usage_date) = ? 
          AND strftime('%m', usage_date) = ?
        ORDER BY start_time ASC
      `;
      
      db.all(detailQuery, [id, year, month.padStart(2, '0')], (err, details) => {
        if (err) {
          console.error('Error fetching usage details:', err);
          db.close();
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.json({ 
          success: true, 
          data: {
            lune: lune,
            month: parseInt(month),
            year: parseInt(year),
            summary: stats,
            details: details
          }
        });
        
        db.close();
      });
    });
  });
});

// Get available months for a lune machine
router.get('/:id/months', authenticateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  const query = `
    SELECT DISTINCT 
      strftime('%Y', usage_date) as year,
      strftime('%m', usage_date) as month,
      COUNT(*) as usage_count
    FROM button_usage
    WHERE lune_machine_id = ?
    GROUP BY strftime('%Y', usage_date), strftime('%m', usage_date)
    ORDER BY year DESC, month DESC
  `;
  
  db.all(query, [id], (err, months) => {
    if (err) {
      console.error('Error fetching available months:', err);
      db.close();
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const formattedMonths = months.map(m => ({
      year: parseInt(m.year),
      month: parseInt(m.month),
      usage_count: m.usage_count
    }));
    
    res.json({ success: true, data: formattedMonths });
    db.close();
  });
});

module.exports = router;
