const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const moment = require("moment-timezone");

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
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }
    res.json(results);
  });
});

app.post("/api/events", (req, res) => {
  const { title, description, start, end } = req.body;

  if (!title || !start || !end) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (new Date(end) < new Date(start)) {
    return res
      .status(400)
      .json({ error: "End time cannot be earlier than start time" });
  }

  const startDate = moment(start).startOf("day").format("YYYY-MM-DD");
  const endDate = moment(end).startOf("day").format("YYYY-MM-DD");

  const checkDuplicateSql =
    "SELECT * FROM events WHERE title = ? AND DATE(start) = ?";
  db.query(checkDuplicateSql, [title, startDate], (dupErr, dupResults) => {
    if (dupErr) {
      console.error("Database error:", dupErr);
      return res
        .status(500)
        .json({ error: "Database error", details: dupErr.message });
    }

    if (dupResults.length > 0) {
      return res.status(400).json({
        error: "An event with this title already exists on the same day",
      });
    }

    const startFormatted = moment(start).format("YYYY-MM-DD HH:mm:ss");
    const endFormatted = moment(end).format("YYYY-MM-DD HH:mm:ss");

    const sql =
      "INSERT INTO events (title, description, start, end) VALUES (?, ?, ?, ?)";
    db.query(
      sql,
      [title, description, startFormatted, endFormatted],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        res.status(201).json({
          id: result.insertId,
          title,
          description,
          start: startFormatted,
          end: endFormatted,
        });
      }
    );
  });
});

app.put("/api/events/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, start, end } = req.body;

  if (!title || !start || !end) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (new Date(end) < new Date(start)) {
    return res
      .status(400)
      .json({ error: "End time cannot be earlier than start time" });
  }

  const startDate = moment(start).startOf("day").format("YYYY-MM-DD");

  const checkDuplicateSql =
    "SELECT * FROM events WHERE title = ? AND DATE(start) = ? AND id != ?";
  db.query(checkDuplicateSql, [title, startDate, id], (dupErr, dupResults) => {
    if (dupErr) {
      console.error("Database error:", dupErr);
      return res
        .status(500)
        .json({ error: "Database error", details: dupErr.message });
    }

    if (dupResults.length > 0) {
      return res.status(400).json({
        error: "An event with this title already exists on the same day",
      });
    }

    const startFormatted = moment(start).format("YYYY-MM-DD HH:mm:ss");
    const endFormatted = moment(end).format("YYYY-MM-DD HH:mm:ss");

    const checkSql = "SELECT * FROM events WHERE id = ?";
    db.query(checkSql, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Database error:", checkErr);
        return res
          .status(500)
          .json({ error: "Database error", details: checkErr.message });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }

      const updateSql =
        "UPDATE events SET title = ?, description = ?, start = ?, end = ? WHERE id = ?";
      db.query(
        updateSql,
        [title, description, startFormatted, endFormatted, id],
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Database error:", updateErr);
            return res
              .status(500)
              .json({ error: "Database error", details: updateErr.message });
          }

          if (updateResult.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "Event not found or no changes made" });
          }

          res.json({
            id: parseInt(id),
            title,
            description,
            start: startFormatted,
            end: endFormatted,
          });
        }
      );
    });
  });
});

app.delete("/api/events/:id", (req, res) => {
  const { id } = req.params;

  const checkSql = "SELECT * FROM events WHERE id = ?";
  db.query(checkSql, [id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Database error:", checkErr);
      return res
        .status(500)
        .json({ error: "Database error", details: checkErr.message });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const deleteSql = "DELETE FROM events WHERE id = ?";
    db.query(deleteSql, [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error("Database error:", deleteErr);
        return res
          .status(500)
          .json({ error: "Database error", details: deleteErr.message });
      }

      res.json({ success: true, id: parseInt(id) });
    });
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error", details: err.message });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
