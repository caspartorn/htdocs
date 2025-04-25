const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'testdb'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.get('/', (req, res) => {
  res.send(`
    <h1>API Documentation</h1>
    <ul>
      <li>GET /items - Get all items</li>
      <li>GET /items/:id - Get item by ID</li>
      <li>POST /items - Create new item</li>
    </ul>
  `);
});

app.get('/items', (req, res) => {
  db.query('SELECT * FROM items', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/items/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM items WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'Item not found' });
    } else {
      res.json(results[0]);
    }
  });
});

app.post('/items', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing name field' });
  }
  db.query('INSERT INTO items (name) VALUES (?)', [name], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.status(201).json({ id: result.insertId, name });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


// curl -X POST http://localhost:3000/items -H "Content-Type: application/json" -d "{\"name\":\"Test2\"}"
// curl -X GET http://localhost:3000/items
// curl -X GET http://localhost:3000/items/1