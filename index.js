const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve static files from 'uploads'

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Name the file with timestamp
  },
});
const upload = multer({ storage });

// MySQL connection configuration
const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12735123', // Replace with your MySQL username
  password: 'I4RNNyueHD', // Replace with your MySQL password
  database: 'sql12735123', // Replace with your MySQL database name
});

// Connect to MySQL and create database and table if not exists
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database.');

  // Create 'tasks' table if it doesn't exist
  const createTasksTable = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_name VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('Not completed', 'In progress', 'Completed') DEFAULT 'Not completed',
      priority ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
      deadline DATE
    );
  `;

  db.query(createTasksTable, (error) => {
    if (error) {
      console.error('Error creating tasks table:', error);
      throw error;
    }
    console.log('Tasks table ensured to exist.');
  });
});

// GET method to retrieve all tasks
app.get('/tasks', (req, res) => {
  const sql = 'SELECT * FROM tasks'; // Retrieve all tasks

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error retrieving data:', error);
      return res.status(500).send('Server Error');
    }
    res.status(200).json(results); // Send back the results as JSON
  });
});

// POST route to add a new task
app.post('/tasks', upload.single('file'), (req, res) => {
  const { task_name, description, status, priority, deadline } = req.body;
  const file = req.file ? `/uploads/${req.file.filename}` : null; // Handle file upload (if needed)

  const sql = 'INSERT INTO tasks (task_name, description, status, priority, deadline) VALUES (?, ?, ?, ?, ?)';
  const values = [task_name, description, status, priority, deadline];

  db.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error inserting data:', error);
      return res.status(500).send('Server Error');
    }
    res.status(201).send({ id: results.insertId, task_name, description, status, priority, deadline });
  });
});

// PUT route to update an existing task
app.put('/tasks/:id', upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { task_name, description, status, priority, deadline } = req.body;
  const file = req.file ? `/uploads/${req.file.filename}` : null; // Handle file upload (if needed)

  const sql = 'UPDATE tasks SET task_name = ?, description = ?, status = ?, priority = ?, deadline = ? WHERE id = ?';
  const values = [task_name, description, status, priority, deadline, id];

  db.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error updating data:', error);
      return res.status(500).send('Server Error');
    }
    res.status(200).send({ id, task_name, description, status, priority, deadline });
  });
});

// DELETE route to remove a task
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tasks WHERE id = ?';

  db.query(sql, [id], (error, results) => {
    if (error) {
      console.error('Error deleting task:', error);
      return res.status(500).send('Server Error');
    }
    res.status(204).send(); // Send back a 204 No Content response
  });
});

// DELETE route to remove all tasks and reset AUTO_INCREMENT
app.delete('/tasks', (req, res) => {
  const deleteTasksSql = 'DELETE FROM tasks';
  const resetAutoIncrementSql = 'ALTER TABLE tasks AUTO_INCREMENT = 1';

  // Delete all tasks
  db.query(deleteTasksSql, (error) => {
    if (error) {
      console.error('Error deleting all tasks:', error);
      return res.status(500).send('Server Error');
    }
    console.log('All tasks deleted successfully.');

    // Reset AUTO_INCREMENT
    db.query(resetAutoIncrementSql, (resetError) => {
      if (resetError) {
        console.error('Error resetting AUTO_INCREMENT:', resetError);
        return res.status(500).send('Server Error');
      }
      console.log('AUTO_INCREMENT reset successfully.');
      res.status(204).send(); // Send back a 204 No Content response
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});