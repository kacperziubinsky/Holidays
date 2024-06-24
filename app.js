const express = require('express');
const cors = require('cors')
const update = require('./routes/update.js');
const connection = require('./routes/database.js');
const addHotel = require('./routes/addhote.js');
const prices = require('./routes/prices.js');
const app = express();

app.use(express.json(), cors());

const port = process.env.PORT || 3003;



app.get('/hotels', (req, res) => {
    const querySQL = `SELECT * FROM hotels`;
    connection.query(querySQL, async (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to retrieve hotels data' });
        } else {
            if (results.length > 0) {
                let allData = [];
                for (const element of results) {
                    try {
                        allData.push({ code: element.Code, name: element.Nazwa});
                    } catch (error) {
                        console.error(error);
                    }
                }
                res.json(allData);
            } else {
                res.status(404).json({ error: 'No hotels found' });
            }
        }
    });
});

app.get('/prices/:code', prices )

app.get('/hotel/:code/:name', addHotel)

app.get('/update', update)

app.get('/last-update', update)

app.listen(port, () => {
    console.log(`App was started on port:  ${port}`);
});
