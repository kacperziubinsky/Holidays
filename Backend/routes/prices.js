const express = require('express')
const connection = require('./database');  
const prices = express.Router();


prices.get('/prices/:code', (req, res) => {
    const code = req.params.code;
    const querySQL = `SELECT * FROM tripdata WHERE Status = 1 AND Code = '${code}'`;
    connection.query(querySQL, (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to retrieve prices data' });
        } else {
            if (results.length > 0) {
                res.json(results);
            } else {
                res.status(404).json({ error: 'No active trips found' });
            }
        }
    });
});

module.exports = prices;