
const express = require('express');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./students.db');
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

db.run('CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY, name TEXT, classroom TEXT, timein TEXT, timeout TEXT)');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

app.post('/signin', (req, res) => {
  const { name, room, time } = req.body;
  db.run('INSERT INTO logs (name, classroom, timein) VALUES (?, ?, ?)', [name, room, time]);
  res.sendStatus(200);
});

app.post('/signout', (req, res) => {
  const { name } = req.body;
  db.run('UPDATE logs SET timeout = ? WHERE name = ? AND timeout IS NULL', [new Date().toISOString(), name]);
  res.sendStatus(200);
});

app.post('/alert', (req, res) => {
  const { name, room } = req.body;
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'jrios6@saisd.net',
    subject: `Time Alert: ${name}`,
    text: `${name} has exceeded the allowed time in ${room}.`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return res.status(500).send(error.toString());
    res.send('Alert sent: ' + info.response);
  });
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/logs', (req, res) => {
  db.all('SELECT name, classroom, timein, timeout FROM logs ORDER BY timein DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
