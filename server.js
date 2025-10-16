import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'communitys'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Members API
app.get('/members', (req, res) => {
  db.query('SELECT * FROM tb_Member_Management', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/members', (req, res) => {
  const member = req.body;
  db.query('INSERT INTO tb_Member_Management SET ?', member, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...member });
  });
});

app.put('/members/:id', (req, res) => {
  const { id } = req.params;
  const member = req.body;
  db.query('UPDATE tb_Member_Management SET ? WHERE member_id = ?', [member, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...member });
  });
});

app.delete('/members/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tb_Member_Management WHERE member_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Products API
app.get('/products', (req, res) => {
  db.query('SELECT * FROM tb_Production_Management', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/products', (req, res) => {
  const product = req.body;
  db.query('INSERT INTO tb_Production_Management SET ?', product, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...product });
  });
});

// Start server
app.listen(3001, () => {
  console.log('Server running on port 3001');
});