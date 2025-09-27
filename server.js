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
// ===== Chatbot Endpoint =====
// ===== Chatbot Endpoint =====
app.post('/chat', (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();

  const replies = {
    hello: "Hi there! 👋 How can I assist you today with your finances?",
    help: "You can ask me about tracking expenses, creating a budget, or viewing reports.",
    track: "To track expenses, go to the Dashboard and click on 'Add Expense'.",
    budget: "Set a monthly budget under 'Budget Settings' to manage your spending.",
    income: "You can add income entries under the 'Income' section on your Dashboard.",
    report: "To see a visual report of your expenses, check the 'Reports' tab in the Dashboard.",
    savings: "To increase savings, try reducing discretionary spending and set savings goals!",
    categories: "SmartSpend supports various categories like food, travel, bills, shopping, etc.",
    error: "If you're facing issues, make sure you're logged in and connected to the internet.",
    goodbye: "Goodbye! 👋 Stay financially smart with SmartSpend!",
    default: "Sorry, I didn't understand that. Try keywords like 'budget', 'track', 'report', or 'help'."
  };

  // Match keyword and send appropriate response
  const reply =
    lowerMsg.includes('hello') ? replies.hello :
    lowerMsg.includes('help') ? replies.help :
    lowerMsg.includes('track') ? replies.track :
    lowerMsg.includes('budget') ? replies.budget :
    lowerMsg.includes('income') ? replies.income :
    lowerMsg.includes('report') ? replies.report :
    lowerMsg.includes('savings') ? replies.savings :
    lowerMsg.includes('category') || lowerMsg.includes('categories') ? replies.categories :
    lowerMsg.includes('error') ? replies.error :
    lowerMsg.includes('bye') || lowerMsg.includes('goodbye') ? replies.goodbye :
    replies.default;

  res.json({ reply });
});

// ===== Start the server =====
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});