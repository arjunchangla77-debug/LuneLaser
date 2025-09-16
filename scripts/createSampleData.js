const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const createSampleData = async () => {
  const dbPath = path.join(__dirname, '..', 'database', 'users.db');
  const db = new sqlite3.Database(dbPath);

  console.log('🚀 Creating sample data...');

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.serialize(() => {
      // Insert admin user
      db.run(`
        INSERT OR IGNORE INTO users (username, email, password_hash, full_name)
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin@enamelpure.com', hashedPassword, 'EnamelPure Admin'], (err) => {
        if (err) {
          console.error('Error creating admin user:', err);
        } else {
          console.log('✅ Admin user created (username: admin, password: admin123)');
        }
      });

      // Sample dental offices
      const offices = [
        {
          name: 'Bright Smile Dental',
          npi_id: '1234567890',
          state: 'California',
          town: 'Los Angeles',
          address: '123 Main Street, Los Angeles, CA 90210',
          phone_number: '(555) 123-4567',
          email: 'info@brightsmile.com'
        },
        {
          name: 'Perfect Teeth Clinic',
          npi_id: '0987654321',
          state: 'New York',
          town: 'New York',
          address: '456 Broadway, New York, NY 10001',
          phone_number: '(555) 987-6543',
          email: 'contact@perfectteeth.com'
        },
        {
          name: 'Family Dental Care',
          npi_id: '1122334455',
          state: 'Texas',
          town: 'Houston',
          address: '789 Oak Avenue, Houston, TX 77001',
          phone_number: '(555) 111-2222',
          email: 'hello@familydentalcare.com'
        }
      ];

      let officeCount = 0;
      offices.forEach((office, index) => {
        db.run(`
          INSERT INTO dental_offices (name, npi_id, state, town, address, phone_number, email)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [office.name, office.npi_id, office.state, office.town, office.address, office.phone_number, office.email], 
        function(err) {
          if (err) {
            console.error(`Error creating office ${office.name}:`, err);
          } else {
            console.log(`✅ Created dental office: ${office.name}`);
            const officeId = this.lastID;
            
            // Create lune machines for each office
            const lunesPerOffice = [2, 1, 3]; // Different number of lunes per office
            const luneCount = lunesPerOffice[index];
            
            for (let i = 1; i <= luneCount; i++) {
              const serialNumber = `LN${office.npi_id.slice(-4)}${i.toString().padStart(3, '0')}`;
              const purchaseDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
              
              db.run(`
                INSERT INTO lune_machines (serial_number, dental_office_id, purchase_date)
                VALUES (?, ?, ?)
              `, [serialNumber, officeId, purchaseDate.toISOString().split('T')[0]], 
              function(err) {
                if (err) {
                  console.error(`Error creating lune ${serialNumber}:`, err);
                } else {
                  console.log(`✅ Created lune machine: ${serialNumber}`);
                  const luneId = this.lastID;
                  
                  // Generate sample button usage data for the last 3 months
                  generateButtonUsageData(db, luneId, serialNumber);
                }
              });
            }
          }
          
          officeCount++;
          if (officeCount === offices.length) {
            setTimeout(() => {
              console.log('🎉 Sample data creation completed!');
              console.log('\n📋 Summary:');
              console.log('- 3 dental offices created');
              console.log('- 6 lune machines created');
              console.log('- Sample button usage data generated');
              console.log('- Admin user: admin / admin123');
              console.log('\n🌐 Access the application at: http://localhost:3000');
              db.close();
            }, 2000);
          }
        });
      });
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    db.close();
  }
};

const generateButtonUsageData = (db, luneId, serialNumber) => {
  const now = new Date();
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1), // 2 months ago
    new Date(now.getFullYear(), now.getMonth() - 1, 1), // 1 month ago
    new Date(now.getFullYear(), now.getMonth(), 1)      // Current month
  ];

  months.forEach(monthStart => {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    
    // Generate 5-15 usage records per day
    for (let day = 1; day <= daysInMonth; day++) {
      const recordsPerDay = Math.floor(Math.random() * 11) + 5; // 5-15 records
      
      for (let record = 0; record < recordsPerDay; record++) {
        const buttonNumber = Math.floor(Math.random() * 6) + 1; // Random button 1-6
        const hour = Math.floor(Math.random() * 10) + 8; // 8 AM to 6 PM
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        
        const startTime = new Date(monthStart.getFullYear(), monthStart.getMonth(), day, hour, minute, second);
        const duration = Math.floor(Math.random() * 300) + 30; // 30 seconds to 5 minutes
        const endTime = new Date(startTime.getTime() + duration * 1000);
        const usageDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
        
        db.run(`
          INSERT INTO button_usage (lune_machine_id, button_number, start_time, end_time, duration_seconds, usage_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          luneId,
          buttonNumber,
          startTime.toISOString(),
          endTime.toISOString(),
          duration,
          usageDate.toISOString().split('T')[0]
        ], (err) => {
          if (err && err.code !== 'SQLITE_BUSY') {
            console.error(`Error creating usage data for ${serialNumber}:`, err);
          }
        });
      }
    }
  });
};

// Run the script
createSampleData().catch(console.error);
