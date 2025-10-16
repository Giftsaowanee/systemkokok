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
  db.query('SELECT * FROM tb_production_management', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/products', (req, res) => {
  const { member_name, staff_name, quantity, unit, price } = req.body;
  const sql = 'INSERT INTO tb_production_management (member_name, staff_name, quantity, unit, price) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [member_name, staff_name, quantity, unit, price], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ production_id: result.insertId, member_name, staff_name, quantity, unit, price });
  });
});

app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { member_name, staff_name, quantity, unit, price } = req.body;
  const sql = 'UPDATE tb_production_management SET member_name=?, staff_name=?, quantity=?, unit=?, price=? WHERE production_id=?';
  db.query(sql, [member_name, staff_name, quantity, unit, price, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ production_id: id, member_name, staff_name, quantity, unit, price });
  });
});

// Start server
app.listen(3001, () => {
  console.log('Server running on port 3001');
});