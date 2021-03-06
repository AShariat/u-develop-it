const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const inputCheck = require('../../utils/inputCheck');

// Get all candidates.
router.get('/candidates', (req, res) => {
  const sql = `SELECT candidates.*, parties.name AS party_name FROM candidates LEFT JOIN parties ON candidates.party_id = parties.id`;

  db.query(sql, (err, rows) => {
    if (err) {
      // The 500 status code indicates a server error—different than a 404, which indicates a user request error.
      res.status(500).json({ error: err.message });
      // The return statement will exit the database call once an error is encountered.
      return;
    }
    // If there was no error, then err is null and the response is sent back using the following statement:
    // Instead of logging the result, rows, from the database, we'll send this response as a JSON object to the browser, using res in the Express.js route callback.
    res.json({
      message: 'success',
      data: rows
    });
  });
});

// Get a single candidate.
router.get('/candidate/:id', (req, res) => {
  // We're using a prepared SQL statement with a placeholder ?.
  const sql = `SELECT candidates.*, parties.name AS party_name FROM candidates LEFT JOIN parties ON candidates.party_id = parties.id WHERE candidates.id = ?`;
  const params = [req.params.id];

  db.query(sql, params, (err, row) => {
    if (err) {
      // The error status code was changed to 400 to notify the client that their request wasn't accepted and to try a different request.
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: row
    });
  });
});

// Create a candidate.
// We're using object destructuring to pull the body property out of the request object.
router.post('/candidate', ({ body }, res) => {
  const errors = inputCheck(body, 'first_name', 'last_name', 'industry_connected');
  // We assign errors to receive the return from the inputCheck function. If the inputCheck() function returns an error, an error message is returned to the client as a 400 status code, to prompt for a different user request with a JSON object that contains the reasons for the errors.
  if (errors) {
    res.status(400).json({ error: errors });
    return;
  }
  
  const sql = `INSERT INTO candidates (first_name, last_name, industry_connected) VALUES (?,?,?)`;
  const params = [body.first_name, body.last_name, body.industry_connected];

  db.query(sql, params, (err, result) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: body
    });
  });
});

// Update a candidate's party.
router.put('/candidate/:id', (req, res) => {
  // If the front end will be making this request, then we should be extra sure that a party_id was provided before we attempt to update the database.
  const errors = inputCheck(req.body, 'party_id');
  if (errors) {
    res.status(400).json({ error: errors });
    return;
  }

  const sql = `UPDATE candidates SET party_id = ? WHERE id = ?`;
  const params = [req.body.party_id, req.params.id];

  db.query(sql, params, (err, result) => {
    if (err) {
      res.status(400).json({ error: err.message });
      // check if a record was found.
    } else if (!result.affectedRows) {
      res.json({
        message: 'Candidate not found'
      });
    } else {
      res.json({
        message: 'success',
        data: req.body,
        changes: result.affectedRows
      });
    }
  });
});

// Delete a candidate.
router.delete('/candidate/:id', (req, res) => {
  const sql = `DELETE FROM candidates WHERE id = ?`;
  const params = [req.params.id];

  db.query(sql, params, (err, result) => {
    if (err) {
      res.statusMessage(400).json({ error: res.message });
      // If there are no affectedRows as a result of the delete query, that means that there was no candidate by that id. Therefore, we should return an appropriate message to the client, such as "Candidate not found".
    } else if (!result.affectedRows) {
      res.json({
        message: 'Candidate not found'
      });
    } else {
      res.json({
        message: 'deleted',
        changes: result.affectedRows,
        id: req.params.id
      });
    }
  });
});

module.exports = router;