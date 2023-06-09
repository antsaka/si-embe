const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
const ejs = require('ejs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: null,
  database: 'si_embe',
  connectionLimit: 10,
});

// Set up session middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

app.set('views', path.join(__dirname, 'views'));
app.use('/assets', express.static(path.join(__dirname, 'views', 'assets')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('index');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    connection.release();

    if (rows.length === 0) {
      res.status(401).send('Invalid username or password');
      return;
    }

    const user = rows[0];

    // Set user data in the session
    req.session.user = user;

    res.render('dashboard', { username: user.username });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get('/logout', (req, res) => {
  // Clear the session data
  req.session.destroy();

  res.redirect('/login'); // Redirect to the login page
});

app.get('/dashboard', (req, res) => {
  const username = req.session.user.username; // Retrieve the username from the session or any other source

  res.render('dashboard', { username }); // Pass the username to the view
});

app.get('/listbeasiswa', async (req, res) => {
  const username = req.session.user.username; // Retrieve the username from the session or any other source

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM beasiswa');
    connection.release();

    res.render('listbeasiswa', { username, beasiswa: rows });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



app.get('/tambahbeasiswa', async (req, res) => {
  const username = req.session.user.username;

  try {
    const connection = await pool.getConnection();
    const [mahasiswaRows] = await connection.query('SELECT * FROM mahasiswa'); // Query the mahasiswa table

    const [beasiswaRows] = await connection.query('SELECT * FROM beasiswa'); // Query the beasiswa table
    connection.release();

    res.render('tambahbeasiswa', { username, mahasiswa: mahasiswaRows, beasiswa: beasiswaRows });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});




const port = 1000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
