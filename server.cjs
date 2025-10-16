const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Database configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'communitys',
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Members API

// Members API (ใหม่)
app.get('/members', (req, res) => {
  db.query('SELECT * FROM tb_member_management', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


app.post('/members', (req, res) => {
  const { name, phone, address, funds_amount, Share_value, occupation } = req.body;
  const sql = `INSERT INTO tb_member_management (name, phone, address, funds_amount, Share_value, occupation) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [name, phone, address, funds_amount, Share_value, occupation], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, name, phone, address, funds_amount, Share_value, occupation });
  });
});


app.put('/members/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, address, funds_amount, Share_value, occupation } = req.body;
  const sql = `UPDATE tb_member_management SET name=?, phone=?, address=?, funds_amount=?, Share_value=?, occupation=? WHERE member_id=?`;
  db.query(sql, [name, phone, address, funds_amount, Share_value, occupation, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, name, phone, address, funds_amount, Share_value, occupation });
  });
});


app.delete('/members/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tb_member_management WHERE member_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Check table structure
app.get('/check-structure', (req, res) => {
  db.query('DESCRIBE tb_Member_Management', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Products API
app.get('/products', (req, res) => {
  console.log('GET /products called');
  db.query('SELECT * FROM tb_production_management', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Products fetched successfully, count:', results.length);
    res.json(results);
  });
});

app.post('/products', (req, res) => {
  const { product_name, category, member_name, staff_name, quantity, unit, price } = req.body;
  console.log('POST /products called with data:', req.body);
  
  const sql = 'INSERT INTO tb_production_management (product_name, category, member_name, staff_name, quantity, unit, price) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [product_name, category, member_name, staff_name, quantity, unit, price], (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Product added successfully with ID:', result.insertId);
    res.json({ production_id: result.insertId, product_name, category, member_name, staff_name, quantity, unit, price });
  });
});

app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { product_name, category, member_name, staff_name, quantity, unit, price } = req.body;
  console.log('PUT /products/:id called with id:', id, 'and data:', req.body);
  
  const sql = 'UPDATE tb_production_management SET product_name=?, category=?, member_name=?, staff_name=?, quantity=?, unit=?, price=? WHERE production_id=?';
  db.query(sql, [product_name, category, member_name, staff_name, quantity, unit, price, id], (err, result) => {
    if (err) {
      console.error('Error updating product:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were updated - product not found');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Product updated successfully');
    res.json({ production_id: id, member_name, staff_name, quantity, unit, price });
  });
});

app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /products/:id called with id:', id);
  
  db.query('DELETE FROM tb_production_management WHERE production_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Delete result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were deleted - product not found');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Product deleted successfully');
    res.json({ success: true, affectedRows: result.affectedRows });
  });
});

// Accounting API - ดึงข้อมูลบัญชีรายบุคคล
app.get('/accounting', async (req, res) => {
  console.log('GET /accounting called');
  
  try {
    // คำนวณกำไรรวมก่อน
    const profitSql = `
      SELECT 
        (SELECT COALESCE(SUM(total_price), 0) FROM tb_purchase_history) - 
        (SELECT COALESCE(SUM(CAST(price AS DECIMAL) * CAST(quantity AS DECIMAL)), 0) FROM tb_production_management) as total_profit
    `;
    
    const profitResult = await new Promise((resolve, reject) => {
      db.query(profitSql, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total_profit || 0);
      });
    });
    
    // คำนวณจำนวนหุ้นรวม
    const totalSharesSql = `
      SELECT COALESCE(SUM(CAST(Share_value AS DECIMAL) / 1000), 0) as total_shares
      FROM tb_member_management 
      WHERE CAST(Share_value AS DECIMAL) > 0
    `;
    
    const totalShares = await new Promise((resolve, reject) => {
      db.query(totalSharesSql, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total_shares || 0);
      });
    });
    
    // คำนวณปันผลต่อหุ้น (30% ของกำไร)
    const dividendPerShare = totalShares > 0 ? (profitResult * 0.3) / totalShares : 0;
    
    console.log(`Total profit: ${profitResult}, Total shares: ${totalShares}, Dividend per share: ${dividendPerShare}`);
    
    // 1. ดึงข้อมูลรายรับจากสมาชิก (หุ้น)
    const membersSql = `
      SELECT 
        CAST(mm.name AS CHAR CHARACTER SET utf8mb4) as person_name,
        CAST(mm.Share_value AS DECIMAL) as amount,
        'รายรับ' as type,
        'หุ้น' as category,
        'ลงทุนหุ้น' as description,
        CURDATE() as transaction_date,
        CAST(mm.Share_value AS DECIMAL) / 1000 as share_count
      FROM tb_member_management mm
      WHERE CAST(mm.Share_value AS DECIMAL) > 0
    `;
    
    // 2. ดึงข้อมูลรายรับจากลูกค้า (การขาย)
    const salesSql = `
      SELECT 
        CAST(CONCAT('ลูกค้า ID: ', ph.customer_id) AS CHAR CHARACTER SET utf8mb4) as person_name,
        ph.total_price as amount,
        'รายรับ' as type,
        'การขาย' as category,
        CAST(CONCAT('ซื้อ ', ph.product_name, ' (', ph.quantity, ' ', ph.unit, ')') AS CHAR CHARACTER SET utf8mb4) as description,
        ph.purchase_date as transaction_date,
        0 as share_count
      FROM tb_purchase_history ph
    `;
    
    // 3. ดึงข้อมูลรายจ่าย (ผลผลิต)
    const productionSql = `
      SELECT 
        CAST(member_name AS CHAR CHARACTER SET utf8mb4) as person_name,
        CAST(price AS DECIMAL) * CAST(quantity AS DECIMAL) as amount,
        'รายจ่าย' as type,
        'ผลผลิต' as category,
        CAST(CONCAT('รับซื้อ ', product_name, ' (', quantity, ' ', unit, ')') AS CHAR CHARACTER SET utf8mb4) as description,
        CURDATE() as transaction_date,
        0 as share_count
      FROM tb_production_management
      WHERE CAST(price AS DECIMAL) > 0 AND CAST(quantity AS DECIMAL) > 0
    `;
    
    // 4. ดึงข้อมูลปันผลหุ้น (คำนวณจากกำไร) - แสดงแม้กำไรเป็นลบ
    const dividendSql = `
      SELECT 
        CAST(mm.name AS CHAR CHARACTER SET utf8mb4) as person_name,
        (CAST(mm.Share_value AS DECIMAL) / 1000) * ${Math.abs(dividendPerShare)} as amount,
        '${profitResult >= 0 ? 'รายรับ' : 'รายจ่าย'}' as type,
        'ปันผล' as category,
        CAST(CONCAT('${profitResult >= 0 ? 'ปันผลจาก' : 'ขาดทุนจาก'} ', (CAST(mm.Share_value AS DECIMAL) / 1000), ' หุ้น @ ', ROUND(${Math.abs(dividendPerShare)}, 2), ' บาท/หุ้น') AS CHAR CHARACTER SET utf8mb4) as description,
        CURDATE() as transaction_date,
        CAST(mm.Share_value AS DECIMAL) / 1000 as share_count
      FROM tb_member_management mm
      WHERE CAST(mm.Share_value AS DECIMAL) > 0
    `;
    
    // รวมข้อมูลทั้งหมด - ไม่ต้องแสดงปันผลแยก เพราะ Frontend จะคำนวณเอง
    const unionSql = `
      (${membersSql})
      UNION ALL
      (${salesSql})
      UNION ALL
      (${productionSql})
      ORDER BY transaction_date DESC, person_name ASC
    `;
    
    db.query(unionSql, (err, results) => {
      if (err) {
        console.error('Error fetching accounting data:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // เพิ่ม finance_id และจัดรูปแบบข้อมูล
      const formattedResults = results.map((row, index) => ({
        finance_id: index + 1,
        type: row.type,
        income: row.type === 'รายรับ' ? parseFloat(row.amount) : 0,
        expense: row.type === 'รายจ่าย' ? parseFloat(row.amount) : 0,
        amount: parseFloat(row.amount),
        description: `${row.person_name} - ${row.description}`,
        transaction_date: row.transaction_date,
        profit: 0,
        dividend: row.category === 'ปันผล' ? parseFloat(row.amount) : 0,
        share: row.share_count || 0,
        person_name: row.person_name,
        category: row.category,
        is_loss: profitResult < 0 && row.category === 'ปันผล' // เพิ่มข้อมูลว่าเป็นขาดทุนหรือไม่
      }));
      
      console.log('Accounting data fetched successfully, count:', formattedResults.length);
      res.json({
        data: formattedResults,
        dividend_per_share: Math.abs(dividendPerShare),
        is_profit: profitResult >= 0,
        total_profit: profitResult
      });
    });
    
  } catch (error) {
    console.error('Error in accounting API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/accounting', (req, res) => {
  const { type, income, expense, amount, description, transaction_date, profit, dividend, share } = req.body;
  console.log('POST /accounting called with data:', req.body);
  
  const sql = 'INSERT INTO tb_accounting_management (type, income, expense, amount, description, transaction_date, profit, dividend, share) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [type, income, expense, amount, description, transaction_date, profit, dividend, share], (err, result) => {
    if (err) {
      console.error('Error adding accounting data:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Accounting data added successfully with ID:', result.insertId);
    res.json({ finance_id: result.insertId, type, income, expense, amount, description, transaction_date, profit, dividend, share });
  });
});

app.put('/accounting/:id', (req, res) => {
  const { id } = req.params;
  const { type, income, expense, amount, description, transaction_date, profit, dividend, share } = req.body;
  console.log('PUT /accounting/:id called with id:', id, 'and data:', req.body);
  
  const sql = 'UPDATE tb_accounting_management SET type=?, income=?, expense=?, amount=?, description=?, transaction_date=?, profit=?, dividend=?, share=? WHERE finance_id=?';
  db.query(sql, [type, income, expense, amount, description, transaction_date, profit, dividend, share, id], (err, result) => {
    if (err) {
      console.error('Error updating accounting data:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were updated - accounting record not found');
      return res.status(404).json({ error: 'Accounting record not found' });
    }
    
    console.log('Accounting data updated successfully');
    res.json({ finance_id: id, type, income, expense, amount, description, transaction_date, profit, dividend, share });
  });
});

app.delete('/accounting/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /accounting/:id called with id:', id);
  
  db.query('DELETE FROM tb_accounting_management WHERE finance_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting accounting data:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Delete result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were deleted - accounting record not found');
      return res.status(404).json({ error: 'Accounting record not found' });
    }
    
    console.log('Accounting data deleted successfully');
    res.json({ success: true, affectedRows: result.affectedRows });
  });
});

// Reports API
app.get('/reports', (req, res) => {
  console.log('GET /reports called');
  db.query('SELECT * FROM tb_report_management ORDER BY created_date DESC', (err, results) => {
    if (err) {
      console.error('Error fetching reports:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Reports fetched successfully, count:', results.length);
    res.json(results);
  });
});

app.post('/reports', (req, res) => {
  const { title, content } = req.body;
  console.log('POST /reports called with data:', req.body);
  
  const sql = 'INSERT INTO tb_report_management (title, content, created_date) VALUES (?, ?, NOW())';
  db.query(sql, [title, content], (err, result) => {
    if (err) {
      console.error('Error adding report:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Report added successfully with ID:', result.insertId);
    res.json({ report_id: result.insertId, title, content, created_date: new Date() });
  });
});

app.put('/reports/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  console.log('PUT /reports/:id called with id:', id, 'and data:', req.body);
  
  const sql = 'UPDATE tb_report_management SET title=?, content=? WHERE report_id=?';
  db.query(sql, [title, content, id], (err, result) => {
    if (err) {
      console.error('Error updating report:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were updated - report not found');
      return res.status(404).json({ error: 'Report not found' });
    }
    
    console.log('Report updated successfully');
    res.json({ report_id: id, title, content });
  });
});

app.delete('/reports/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /reports/:id called with id:', id);
  
  db.query('DELETE FROM tb_report_management WHERE report_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting report:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Delete result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were deleted - report not found');
      return res.status(404).json({ error: 'Report not found' });
    }
    
    console.log('Report deleted successfully');
    res.json({ success: true, affectedRows: result.affectedRows });
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ 
    message: 'Server is running', 
    timestamp: new Date(),
    database: 'Connected to MySQL'
  });
});

// Check if reports table exists
app.get('/check-reports-table', (req, res) => {
  console.log('Checking reports table...');
  db.query('DESCRIBE tb_report_management', (err, results) => {
    if (err) {
      console.error('Table check error:', err);
      return res.status(500).json({ 
        error: 'Table not found or error checking table',
        details: err.message 
      });
    }
    console.log('Reports table structure:', results);
    res.json({ 
      message: 'Reports table exists',
      structure: results 
    });
  });
});

// Users/Directors API
app.get('/users', (req, res) => {
  console.log('GET /users called');
  db.query('SELECT * FROM tb_user_management ORDER BY created_date DESC', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Users fetched successfully, count:', results.length);
    res.json(results);
  });
});

app.post('/users', (req, res) => {
  const { full_name, email, phone, position, address, household_members, income, role, status } = req.body;
  console.log('POST /users called with data:', req.body);
  
  const sql = `INSERT INTO tb_user_management 
    (full_name, email, phone, position, address, household_members, income, role, status, created_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    
  db.query(sql, [full_name, email, phone, position, address, household_members, income, role, status], (err, result) => {
    if (err) {
      console.error('Error adding user:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('User added successfully with ID:', result.insertId);
    res.json({ 
      user_id: result.insertId, 
      full_name, email, phone, position, address, household_members, income, role, status,
      created_date: new Date()
    });
  });
});

app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, position, address, household_members, income, role, status } = req.body;
  console.log('PUT /users/:id called with id:', id, 'and data:', req.body);
  
  const sql = `UPDATE tb_user_management SET 
    full_name=?, email=?, phone=?, position=?, address=?, household_members=?, income=?, role=?, status=? 
    WHERE user_id=?`;
    
  db.query(sql, [full_name, email, phone, position, address, household_members, income, role, status, id], (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were updated - user not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User updated successfully');
    res.json({ user_id: id, full_name, email, phone, position, address, household_members, income, role, status });
  });
});

app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /users/:id called with id:', id);
  
  db.query('DELETE FROM tb_user_management WHERE user_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Delete result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were deleted - user not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User deleted successfully');
    res.json({ success: true, affectedRows: result.affectedRows });
  });
});

// Customers API
app.get('/customers', (req, res) => {
  console.log('GET /customers called');
  db.query('SELECT * FROM tb_customer_management ORDER BY created_date DESC', (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Customers fetched successfully, count:', results.length);
    res.json(results);
  });
});

app.post('/customers', (req, res) => {
  const { customer_name, phone, address } = req.body;
  console.log('POST /customers called with data:', req.body);
  
  const sql = `INSERT INTO tb_customer_management (customer_name, phone, address) VALUES (?, ?, ?)`;
  db.query(sql, [customer_name, phone, address], (err, result) => {
    if (err) {
      console.error('Error adding customer:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Customer added successfully with ID:', result.insertId);
    res.json({ 
      customer_id: result.insertId, 
      customer_name, 
      phone, 
      address,
      created_date: new Date()
    });
  });
});

app.put('/customers/:id', (req, res) => {
  const { id } = req.params;
  const { customer_name, phone, address } = req.body;
  console.log('PUT /customers/:id called with id:', id, 'and data:', req.body);
  
  const sql = `UPDATE tb_customer_management SET customer_name=?, phone=?, address=? WHERE customer_id=?`;
  db.query(sql, [customer_name, phone, address, id], (err, result) => {
    if (err) {
      console.error('Error updating customer:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were updated - customer not found');
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    console.log('Customer updated successfully');
    res.json({ customer_id: id, customer_name, phone, address });
  });
});

app.delete('/customers/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /customers/:id called with id:', id);
  
  db.query('DELETE FROM tb_customer_management WHERE customer_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Delete result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      console.log('No rows were deleted - customer not found');
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    console.log('Customer deleted successfully');
    res.json({ success: true, affectedRows: result.affectedRows });
  });
});

// Sales API
app.get('/sales', (req, res) => {
  console.log('GET /sales - fetching all sales');
  
  // สร้างตาราง tb_sales_management ถ้ายังไม่มี
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tb_sales_management (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE,
      customer_id INT,
      customer_name VARCHAR(255),
      products TEXT,
      total_amount DECIMAL(10,2),
      order_date DATE,
      payment_method VARCHAR(50),
      payment_status VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating sales table:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // ดึงข้อมูลการขาย
    db.query('SELECT * FROM tb_sales_management ORDER BY sales_id DESC', (err, results) => {
      if (err) {
        console.error('Error fetching sales:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Found ${results.length} sales records`);
      res.json(results);
    });
  });
});

app.post('/sales', (req, res) => {
  console.log('POST /sales - creating new sale');
  const { 
    orderNumber, 
    customerId, 
    customerName, 
    products, 
    totalAmount, 
    orderDate, 
    paymentMethod, 
    paymentStatus 
  } = req.body;

  // บันทึกการขายและอัปเดตสต็อกพร้อมกัน
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Products array is required' });
  }

  // สร้างรายการสินค้าและอัปเดตสต็อกแต่ละรายการ
  const processPromises = products.map(product => {
    return new Promise((resolve, reject) => {
      // บันทึกข้อมูลการขาย
      const insertSaleSql = `
        INSERT INTO tb_purchase_history 
        (customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const totalPrice = product.quantity * product.price;
      
      db.query(insertSaleSql, [
        customerId || 1, // ใช้ default customer ID ถ้าไม่มี
        orderNumber || `ORD-${Date.now()}`,
        product.name, 
        product.category || 'ไม่ระบุ', 
        product.quantity,
        product.unit || 'ชิ้น',
        product.price,
        totalPrice,
        orderDate || new Date().toISOString().slice(0, 10),
        'ระบบ POS'
      ], (err, result) => {
        if (err) {
          console.error('Error recording sale:', err);
          reject(err);
          return;
        }
        
        console.log('Sale recorded with ID:', result.insertId);
        
        // หาและอัปเดตสต็อกสินค้าที่ตรงกับชื่อสินค้า
        const findProductSql = 'SELECT * FROM tb_production_management WHERE product_name = ? ORDER BY production_id LIMIT 1';
        db.query(findProductSql, [product.name], (err, productResults) => {
          if (err) {
            console.error('Error finding product for stock update:', err);
            resolve({ 
              saleId: result.insertId, 
              productName: product.name,
              stockUpdateError: 'Could not find product to update stock' 
            });
            return;
          }
          
          if (productResults.length > 0) {
            const productData = productResults[0];
            const currentStock = parseInt(productData.quantity) || 0;
            const soldQuantity = parseInt(product.quantity) || 0;
            const newStock = Math.max(0, currentStock - soldQuantity);
            
            console.log(`Auto-updating stock for ${product.name}: ${currentStock} - ${soldQuantity} = ${newStock}`);
            
            // อัปเดตสต็อก
            const updateStockSql = 'UPDATE tb_production_management SET quantity = ? WHERE production_id = ?';
            db.query(updateStockSql, [newStock.toString(), productData.production_id], (err) => {
              if (err) {
                console.error('Error updating stock during sale:', err);
                resolve({ 
                  saleId: result.insertId, 
                  productName: product.name,
                  stockUpdateError: 'Failed to update stock' 
                });
              } else {
                console.log(`Stock updated automatically for product ID ${productData.production_id}: ${currentStock} -> ${newStock}`);
                resolve({ 
                  saleId: result.insertId, 
                  productName: product.name,
                  oldStock: currentStock,
                  newStock: newStock,
                  isOutOfStock: newStock === 0
                });
              }
            });
          } else {
            console.log(`Product not found for stock update: ${product.name}`);
            resolve({ 
              saleId: result.insertId, 
              productName: product.name,
              stockUpdateError: 'Product not found in inventory' 
            });
          }
        });
      });
    });
  });

  Promise.all(processPromises)
    .then(results => {
      console.log('Sales processed successfully, count:', results.length);
      
      // ตรวจสอบสินค้าที่หมดสต็อก
      const outOfStockProducts = results.filter(r => r.isOutOfStock);
      
      res.json({ 
        success: true,
        orderNumber: orderNumber || `ORD-${Date.now()}`, 
        customerId, 
        customerName,
        productsCount: results.length,
        outOfStockProducts: outOfStockProducts.map(p => p.productName),
        stockUpdates: results,
        message: `บันทึกข้อมูลการขายเรียบร้อยแล้ว${outOfStockProducts.length > 0 ? ` (มีสินค้าหมด: ${outOfStockProducts.map(p => p.productName).join(', ')})` : ''}`
      });
    })
    .catch(err => {
      console.error('Error creating sales:', err);
      res.status(500).json({ error: err.message });
    });
});

app.patch('/sales/:id', (req, res) => {
  console.log('PATCH /sales/:id - updating sale status');
  const { id } = req.params;
  const { status } = req.body;
  
  const sql = 'UPDATE tb_sales_management SET status = ? WHERE id = ?';
  
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating sale:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Sale status updated successfully');
    res.json({ success: true });
  });
});

// Update Product Stock API - อัปเดตสต็อกสินค้าหลังการขาย
app.patch('/products/:id/stock', (req, res) => {
  const { id } = req.params;
  const { soldQuantity } = req.body;
  console.log('PATCH /products/:id/stock called with product ID:', id, 'sold quantity:', soldQuantity);
  
  // ดึงข้อมูลสินค้าปัจจุบันก่อน
  const getProductSql = 'SELECT * FROM tb_production_management WHERE production_id = ?';
  db.query(getProductSql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      console.log('Product not found with ID:', id);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = results[0];
    const currentStock = parseInt(product.quantity) || 0;
    const newStock = Math.max(0, currentStock - soldQuantity); // ไม่ให้ติดลบ
    
    console.log(`Updating stock: ${currentStock} - ${soldQuantity} = ${newStock}`);
    
    // อัปเดตสต็อกใหม่
    const updateStockSql = 'UPDATE tb_production_management SET quantity = ? WHERE production_id = ?';
    db.query(updateStockSql, [newStock.toString(), id], (err, result) => {
      if (err) {
        console.error('Error updating stock:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('Stock updated successfully. Affected rows:', result.affectedRows);
      res.json({ 
        success: true, 
        productId: id,
        oldStock: currentStock,
        soldQuantity: soldQuantity,
        newStock: newStock,
        isOutOfStock: newStock === 0
      });
    });
  });
});

// Purchase History API - ประวัติการซื้อ
app.get('/purchase-history/:customerId', (req, res) => {
  const { customerId } = req.params;
  console.log('GET /purchase-history/:customerId called with customer ID:', customerId);
  
  const sql = `
    SELECT 
      ph.*,
      cm.customer_name,
      cm.phone 
    FROM tb_purchase_history ph
    JOIN tb_customer_management cm ON ph.customer_id = cm.customer_id
    WHERE ph.customer_id = ? 
    ORDER BY ph.purchase_date DESC, ph.created_date DESC
  `;
  
  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error('Error fetching purchase history:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Found ${results.length} purchase history records for customer ${customerId}`);
    res.json(results);
  });
});

app.post('/purchase-history', (req, res) => {
  const { customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name } = req.body;
  console.log('POST /purchase-history called with data:', req.body);
  
  // บันทึกประวัติการซื้อและอัปเดตสต็อกสินค้าพร้อมกัน
  const purchaseHistorySql = 'INSERT INTO tb_purchase_history (customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(purchaseHistorySql, [customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name], (err, result) => {
    if (err) {
      console.error('Error adding purchase history:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Purchase history added successfully with ID:', result.insertId);
    
    // หาและอัปเดตสต็อกสินค้าที่ตรงกับชื่อสินค้า
    const findProductSql = 'SELECT * FROM tb_production_management WHERE product_name = ? LIMIT 1';
    db.query(findProductSql, [product_name], (err, productResults) => {
      if (err) {
        console.error('Error finding product for stock update:', err);
        // ยังคงส่ง response สำเร็จแม้อัปเดตสต็อกไม่ได้
        return res.json({ 
          history_id: result.insertId, 
          customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name,
          stockUpdateError: 'Could not find product to update stock'
        });
      }
      
      if (productResults.length > 0) {
        const product = productResults[0];
        const currentStock = parseInt(product.quantity) || 0;
        const soldQuantity = parseInt(quantity) || 0;
        const newStock = Math.max(0, currentStock - soldQuantity);
        
        console.log(`Auto-updating stock for ${product_name}: ${currentStock} - ${soldQuantity} = ${newStock}`);
        
        // อัปเดตสต็อก
        const updateStockSql = 'UPDATE tb_production_management SET quantity = ? WHERE production_id = ?';
        db.query(updateStockSql, [newStock.toString(), product.production_id], (err) => {
          if (err) {
            console.error('Error updating stock during purchase:', err);
          } else {
            console.log(`Stock updated automatically for product ID ${product.production_id}`);
          }
        });
      }
      
      res.json({ 
        history_id: result.insertId, 
        customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name
      });
    });
  });
});

// Auto Accounting API - คำนวณและสร้างรายการบัญชีอัตโนมัติ
app.post('/accounting/auto-calculate', (req, res) => {
  console.log('POST /accounting/auto-calculate called');
  
  // ดึงข้อมูลยอดขายรวมทั้งหมด (ไม่เฉพาะวันปัจจุบัน)
  const salesSql = `
    SELECT 
      SUM(ph.total_price) as total_revenue,
      COUNT(DISTINCT ph.order_number) as order_count
    FROM tb_purchase_history ph
  `;
  
  // ดึงข้อมูลรายจ่าย (ต้นทุนจากการรับซื้อผลผลิตทั้งหมด)
  const costSql = `
    SELECT 
      SUM(CAST(price AS DECIMAL) * CAST(quantity AS DECIMAL)) as total_cost
    FROM tb_production_management
  `;
  
  // ดึงข้อมูลจำนวนหุ้นทั้งหมดจากสมาชิก
  const sharesSql = `
    SELECT 
      COUNT(*) as total_members, 
      SUM(CAST(funds_amount AS DECIMAL)) as total_shares, 
      SUM(CAST(Share_value AS DECIMAL)) as total_share_value
    FROM tb_member_management
  `;
  
  db.query(salesSql, (err, salesResults) => {
    if (err) {
      console.error('Error fetching sales data:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Sales results:', salesResults);
    
    db.query(costSql, (err, costResults) => {
      if (err) {
        console.error('Error fetching cost data:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('Cost results:', costResults);
      
      db.query(sharesSql, (err, sharesResults) => {
        if (err) {
          console.error('Error fetching shares data:', err);
          return res.status(500).json({ error: err.message });
        }
        
        console.log('Shares results:', sharesResults);
        
        if (salesResults.length === 0 || !salesResults[0].total_revenue) {
          console.log('No sales data found');
          return res.json({ message: 'ไม่มีข้อมูลการขาย', hasData: false });
        }
        
        const revenue = salesResults[0].total_revenue || 0;
        const cost = costResults.length > 0 ? costResults[0].total_cost || 0 : 0;
        const profit = revenue - cost;
        const totalShares = sharesResults[0].total_shares || 1;
        const dividendPerShare = profit > 0 ? profit * 0.3 / totalShares : 0; // 30% ของกำไรแบ่งเป็นปันผล
        const totalDividend = dividendPerShare * totalShares;
        
        console.log('Calculated values:', { revenue, cost, profit, totalShares, totalDividend });
        
        // ลบข้อมูลเก่าของวันปัจจุบัน (ถ้ามี) และสร้างใหม่
        const deleteSql = `
          DELETE FROM tb_financial_management 
          WHERE DATE(transaction_date) = CURDATE() AND type = 'รายรับ'
        `;
        
        console.log('Deleting old records...');
        db.query(deleteSql, (err) => {
          if (err) {
            console.error('Error deleting old records:', err);
          } else {
            console.log('Old records deleted successfully');
          }
          
          // สร้างรายการใหม่
          const insertSql = `
            INSERT INTO tb_financial_management 
            (type, income, expense, amount, description, transaction_date, profit, dividend, share)
            VALUES ('รายรับ', ?, ?, ?, ?, CURDATE(), ?, ?, ?)
          `;
          
          const description = `สรุปรายรับ-รายจ่าย (${salesResults[0].order_count || 0} ออเดอร์)`;
          
          console.log('Inserting new record with values:', [revenue, cost, revenue, description, profit, totalDividend, totalShares]);
          
          db.query(insertSql, [revenue, cost, revenue, description, profit, totalDividend, totalShares], (err, result) => {
            if (err) {
              console.error('Error creating accounting record:', err);
              return res.status(500).json({ error: err.message });
            }
            
            console.log('New accounting record created with ID:', result.insertId);
            res.json({
              message: 'คำนวณและสร้างรายการบัญชีเรียบร้อยแล้ว',
              hasData: true,
              data: {
                revenue,
                cost,
                profit,
                totalDividend,
                totalShares,
                dividendPerShare,
                recordId: result.insertId
              }
            });
          });
        });
      });
    });
  });
});

// Start server
app.listen(3001, () => {
  console.log('Server running on port 3001');
  console.log('Available endpoints:');
  console.log('- GET /test');
  console.log('- GET /check-reports-table');
  console.log('- GET /reports');
  console.log('- POST /reports');
  console.log('- GET /sales');
  console.log('- POST /sales');
  console.log('- PATCH /sales/:id');
  console.log('- GET /purchase-history/:customerId');
  console.log('- POST /purchase-history');
  console.log('- POST /accounting/auto-calculate');
});

// Start server
app.get('/purchase-history/:customerId', (req, res) => {
  const { customerId } = req.params;
  console.log('GET /purchase-history/:customerId called with customer ID:', customerId);
  
  db.query('SELECT * FROM tb_purchase_history WHERE customer_id = ? ORDER BY purchase_date DESC, created_date DESC', [customerId], (err, results) => {
    if (err) {
      console.error('Error fetching purchase history:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Found ${results.length} purchase history records for customer ${customerId}`);
    res.json(results);
  });
});

app.post('/purchase-history', (req, res) => {
  const { customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name } = req.body;
  console.log('POST /purchase-history called with data:', req.body);
  
  const sql = 'INSERT INTO tb_purchase_history (customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name], (err, result) => {
    if (err) {
      console.error('Error adding purchase history:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Purchase history added successfully with ID:', result.insertId);
    res.json({ history_id: result.insertId, customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name });
  });
});