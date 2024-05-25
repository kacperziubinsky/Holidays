const express = require('express');
const axios = require('axios');
const mysql = require('mysql');
const cron = require('node-cron');
const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'holidays'
});

connection.connect();

function todayDate() {
    const today = new Date();
    let dd = today.getDate();
    if (dd < 10) {
        dd = '0' + dd;
    }
    let mm = today.getMonth() + 1;
    if (mm < 10) {
        mm = "0" + mm;
    }
    const yy = today.getFullYear();
    return `${yy}-${mm}-${dd}`;
}

function insertTripData(id, newPrice, startDate, returnDate) {
    const query = `
        INSERT INTO \`tripdata\` (\`Code\`, \`price\`, \`startDate\`, \`returnDate\`, \`Date\`, \`Status\`) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [id, newPrice, startDate, returnDate, todayDate(), 1];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting data:', error);
            return;
        }
        console.log('Data inserted successfully:', results);
    });
}

function changeStatus(id, price, startDate, returnDate, date) {
    const query = `UPDATE \`tripdata\` SET \`Status\` = 0 WHERE \`Code\` = ? AND \`price\` = ? AND \`startDate\` = ? AND \`returnDate\` = ? AND \`Date\` = ? AND \`Status\` = 1`;
    const values = [id, price, startDate, returnDate, date];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error with update Status:', error);
            return;
        }
        console.log('Status was updated:', results);
    });
}

function getData(id, res) {
    let data = {
        "hotelCode": id,
        "tripType": "WS",
        "airportCode": "WAW",
        "startDate": "2024-09-01",
        "endDate": "2024-09-20",
        "hours": "05:55",
        "durationFrom": "7",
        "durationTo": "7",
        "boardCode": "A",
        "adultsCount": "3",
        "childrenBirthdays": [],
        "occupancies": [{
            "id": 0,
            "adultsCount": 2,
            "participantsCount": 2
        }, {
            "id": 1,
            "adultsCount": 1,
            "participantsCount": 1
        }]
    };

    axios.post('https://www.tui.pl/api/services/tui-search/api/hotel-cards/configurators/price-calendar', data)
        .then(function (response) {
            const filteredData = response.data.map(item => ({
                price: item.price,
                discountPrice: item.discountPrice,
                boardName: item.boardName,
                startDate: item.startDate,
                returnDate: item.returnDate
            }));
            res.json(filteredData);
        })
        .catch(function (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to retrieve hotel data' });
        });
}

function singleData(id) {
    return new Promise((resolve, reject) => {
        let data = {
            "hotelCode": id,
            "tripType": "WS",
            "airportCode": "WAW",
            "startDate": "2024-09-01",
            "endDate": "2024-09-20",
            "hours": "05:55",
            "durationFrom": "7",
            "durationTo": "7",
            "boardCode": "A",
            "adultsCount": "3",
            "childrenBirthdays": [],
            "occupancies": [{
                "id": 0,
                "adultsCount": 2,
                "participantsCount": 2
            }, {
                "id": 1,
                "adultsCount": 1,
                "participantsCount": 1
            }]
        };

        axios.post('https://www.tui.pl/api/services/tui-search/api/hotel-cards/configurators/price-calendar', data)
            .then(function (response) {
                const filteredData = response.data.map(item => ({
                    price: item.price,
                    discountPrice: item.discountPrice,
                    boardName: item.boardName,
                    startDate: item.startDate,
                    returnDate: item.returnDate
                }));
                resolve(filteredData);
            })
            .catch(function (error) {
                console.log(error);
                reject(error);
            });
    });
}

async function compareDate(id, startDate, returnDate, oldPrice, status, oldDate) {
    let data = {
        "hotelCode": id,
        "tripType": "WS",
        "airportCode": "WAW",
        "startDate": startDate,
        "hours": "05:55",
        "durationFrom": "7",
        "durationTo": "7",
        "boardCode": "A",
        "adultsCount": "3",
        "childrenBirthdays": [],
        "occupancies": [{
            "id": 0,
            "adultsCount": 2,
            "participantsCount": 2
        }, {
            "id": 1,
            "adultsCount": 1,
            "participantsCount": 1
        }]
    };

    try {
        const response = await axios.post('https://www.tui.pl/api/services/tui-search/api/hotel-cards/configurators/all-offers', data);
        const newPrice = response.data.offers[0].price;
        console.log("Hotel:", id, "data:", startDate, "old price:", oldPrice, "new price:", newPrice);
        if (oldPrice != newPrice && status == 1) {
            changeStatus(id, oldPrice, startDate, returnDate, oldDate);
            insertTripData(id, newPrice, startDate, returnDate);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

app.get('/hotel/:code', async (req, res) => {
    const code = req.params.code;

    const querySQL = `SELECT * FROM hotels WHERE Code = ?`;
    connection.query(querySQL, [code], async (error, results) => {
        if (error) {
            res.status(500).json({ error: 'Failed to retrieve hotel data' });
        } else {
            if (results.length === 0) {
                try {
                    const data = await singleData(code);
                    for (const element of data) {
                        insertTripData(code, element.price, element.startDate, element.returnDate);
                    }
                } catch (error) {
                    res.status(500).json({ error: 'Failed to retrieve hotel data' });
                }
            } else {
                getData(code, res);
            }
        }
    });
});

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
                        const data = await singleData(element.Code);
                        allData.push({ code: element.Code, data: data });
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

app.get('/prices', (req, res) => {
    const querySQL = `SELECT * FROM tripdata WHERE Status = 1`;
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

app.get('/update', (req, res) => {
    const hotelQuery = `SELECT * FROM tripdata WHERE Status = 1`;
    connection.query(hotelQuery, async (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to retrieve trip data' });
        } else {
            if (results.length > 0) {
                for (const element of results) {
                    try {
                        await compareDate(element.Code, element.startDate, element.returnDate, element.price, element.Status, element.Date);
                    } catch (error) {
                        console.error(error);
                    }
                }
                res.json({ message: 'Update process completed' });
            } else {
                res.status(404).json({ error: 'No active trips found' });
            }
        }
    });
});

// CRON job to run every 2 hours
cron.schedule('0 */2 * * *', () => {
    console.log('Running cron job to update prices...');
    const hotelQuery = `SELECT * FROM tripdata WHERE Status = 1`;
    connection.query(hotelQuery, async (error, results) => {
        if (error) {
            console.log('Error with cron job:', error);
        } else {
            if (results.length > 0) {
                for (const element of results) {
                    try {
                        await compareDate(element.Code, element.startDate, element.returnDate, element.price, element.Status, element.Date);
                    } catch (error) {
                        console.error(error);
                    }
                }
                console.log('Cron job update process completed');
            } else {
                console.log('No active trips found for cron job');
            }
        }
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
