const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL DB connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',           // Your MySQL username
  password: 'gehu@123',           // Your MySQL password
  database: 'smartspend'  // Your DB name
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// ===== SIGN-UP API =====
app.post('/signup', (req, res) => {
 console.log('Received signup data:', req.body);

  const { full_name, email, password } = req.body;
  // Check for existing user
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length > 0) return res.status(400).json({ error: 'Email already registered' });

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ error: 'Hashing failed' });

      // Insert user
      db.query(
        'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
        [full_name, email, hashedPassword],
        (err) => {
          if (err) return res.status(500).json({ error: 'User creation failed' });
          res.status(201).json({ message: 'User registered successfully' });
        }
      );
    });
  });
});

// ===== LOGIN API =====
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Comparison failed' });
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

      res.status(200).json({ message: 'Login successful', userId: user.id });
    });
  });
});

// ===== Start the server =====
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});