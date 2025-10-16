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
  console.log('GET /products called');
  db.query('SELECT * FROM tb_Production_Management', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Products fetched successfully, count:', results.length);
    res.json(results);
  });
});

app.post('/products', (req, res) => {
  const product = req.body;
  console.log('POST /products called with data:', product);
  
  db.query('INSERT INTO tb_Production_Management SET ?', product, (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Product added successfully with ID:', result.insertId);
    res.json({ id: result.insertId, ...product });
  });
});

app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const product = req.body;
  console.log('PUT /products/:id called with id:', id, 'and data:', product);
  
  db.query('UPDATE tb_Production_Management SET ? WHERE production_id = ?', [product, id], (err, result) => {
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
    res.json({ id, ...product });
  });
});

app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /products/:id called with id:', id);
  
  db.query('DELETE FROM tb_Production_Management WHERE production_id = ?', [id], (err, result) => {
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

// Start server
app.listen(3001, () => {
  console.log('Server running on port 3001');
});