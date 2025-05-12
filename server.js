require('dotenv').config({ path: 'secret.env' });
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const app = express();
const port = 3000;

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'testdb'
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token saknas' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Ogiltig token' });
    req.user = user;
    next();
  });
}

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Användarnamn och lösenord krävs' });
  }
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length > 0) {
      return res.status(400).json({ error: 'Användarnamn finns redan' });
    }
        // Hasha lösenordet
        const hashedPassword = await bcrypt.hash(password, 10);

        // Spara användaren i databasen
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
          if (err) return res.status(500).json({ error: 'Database error' });
    
          res.status(201).json({ username });
        });
      });
    });

    app.post('/login', (req, res) => {
      const { username, password } = req.body;
    
      if (!username || !password) {
        return res.status(400).json({ error: 'Användarnamn och lösenord krävs' });
      }
    
      db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) {
          return res.status(404).json({ error: 'Användare inte hittad' });
        }
    
        const user = results[0];
    
        // Kontrollera lösenord
        bcrypt.compare(password, user.password, (err, match) => {
          if (err) return res.status(500).json({ error: 'Error while checking password' });
          if (!match) return res.status(401).json({ error: 'Fel lösenord' });
    
          // Skapa JWT-token
          const token = jwt.sign({ username: user.username, id: user.id }, SECRET, { expiresIn: '1h' });
    
          res.json({ token });
        });
      });
    });

app.get('/', (req, res) => {
  res.send(`
     <h1>API Dokumentation</h1>
    <ul>
      <li>GET /items - (skyddad) Hämta alla items</li>
      <li>GET /items/:id - (skyddad) Hämta ett item via ID</li>
      <li>POST /items - (skyddad) Skapa nytt item</li>
      <li>PUT /items/:id - (skyddad) Uppdatera ett item via ID</li>
      <li>POST /login - Logga in och få JWT-token</li>
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

app.put('/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name field' });

  db.query('UPDATE items SET name = ? WHERE id = ?', [name, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ id, name });
  });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


// curl -X POST http://localhost:3000/items -H "Content-Type: application/json" -d "{\"name\":\"Test2\"}"
// curl -X GET http://localhost:3000/items
// curl -X GET http://localhost:3000/items/1

// 1. POST /login - Logga in och få JWT-token
// För att logga in och få en JWT-token:
// cURL:
// curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d "{\"username\":\"your_username\",\"password\":\"your_password\"}"

// Postman:
// Välj POST som HTTP-metod.
// URL: http://localhost:3000/login
// Body: raw JSON format med användarnamn och lösenord:
// {
//   "username": "your_username",
//   "password": "your_password"
// }
// Du får tillbaka en JWT-token om inloggningen lyckas.


// 2. GET /items - Hämta alla items (skyddad)
// För att hämta alla items med en skyddad route:
// cURL:
// curl -X GET http://localhost:3000/items -H "Authorization: Bearer YOUR_JWT_TOKEN"

// Postman:
// Välj GET som HTTP-metod.
// URL: http://localhost:3000/items
// Lägg till header:
// Authorization: Bearer YOUR_JWT_TOKEN
// Tryck på "Send" för att göra anropet.


// 3. GET /items/:id - Hämta ett item via ID (skyddad)
// För att hämta ett specifikt item via ID:
// cURL:
// curl -X GET http://localhost:3000/items/1 -H "Authorization: Bearer YOUR_JWT_TOKEN"

// Postman:
// Välj GET som HTTP-metod.
// URL: http://localhost:3000/items/1 (byt ut 1 med det ID du vill hämta)
// Lägg till header:
// Authorization: Bearer YOUR_JWT_TOKEN
// Tryck på "Send" för att hämta objektet.


// 4. POST /items - Skapa ett nytt item (skyddad)
// För att skapa ett nytt item:
// cURL:
// curl -X POST http://localhost:3000/items -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"New Item\"}"

// Postman:
// Välj POST som HTTP-metod.
// URL: http://localhost:3000/items
// Body: raw JSON format:
// {
//   "name": "New Item"
// }
// Lägg till header:
// Authorization: Bearer YOUR_JWT_TOKEN
// Tryck på "Send" för att skapa ett nytt item.


// 5. PUT /items/:id - Uppdatera ett item via ID (skyddad)
// För att uppdatera ett item baserat på ID:
// cURL:
// curl -X PUT http://localhost:3000/items/1 -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"Updated Item\"}"

// Postman:
// Välj PUT som HTTP-metod.
// URL: http://localhost:3000/items/1 (byt ut 1 med det ID du vill uppdatera)
// Body: raw JSON format:
// {
//   "name": "Updated Item"
// }
// Lägg till header:
// Authorization: Bearer YOUR_JWT_TOKEN
// Tryck på "Send" för att uppdatera objektet.