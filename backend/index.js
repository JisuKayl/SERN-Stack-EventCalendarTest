const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const moment = require("moment");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mysql",
  database: "calendar_db",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL connected");
});

app.get("/api/events", (req, res) => {
  const sql = "SELECT * FROM events";
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post("/api/events", (req, res) => {
  const { title, start, end } = req.body;

  const startFormatted = moment("2025-02-18T16:00:00.000Z").format(
    "YYYY-MM-DD HH:mm:ss"
  );
  const endFormatted = moment("2025-02-19T16:00:00.000Z").format(
    "YYYY-MM-DD HH:mm:ss"
  );

  const sql = "INSERT INTO events (title, start, end) VALUES (?, ?, ?)";
  db.query(sql, [title, startFormatted, endFormatted], (err, result) => {
    if (err) throw err;
    res.json({
      id: result.insertId,
      title,
      start: startFormatted,
      end: endFormatted,
    });
  });
});

app.delete("/api/events/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM events WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ success: true });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
