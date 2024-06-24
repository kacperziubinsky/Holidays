const express = require("express");
const cron = require('node-cron');
const axios = require('axios');
const connection = require('./database');  
const update = express.Router();


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


async function compareDate(id, startDate, returnDate, oldPrice, status, oldDate) {
    let data = {
        "hotelCode": id,
        "tripType": "WS",
        "airportCode": "WAW",
        "startDate": startDate,
        "returnDate": returnDate,
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
        const response = await axios.post('https://www.tui.pl/api/services/tui-search/api/hotel-cards/configurators/price-calendar', data);

        let filterData = response.data.filter(item => item.startDate == `${startDate}` && item.returnDate == `${returnDate}` );
        const newPrice = filterData[0].price;
        console.log("ID: ", id, "NOWA CENA: ", newPrice, " STARA CENA: ", oldPrice)

        if (oldPrice != newPrice && status == 1) {
            changeStatus(id, oldPrice, startDate, returnDate, oldDate);
            insertTripData(id, newPrice, startDate, returnDate);
        }
    } catch (error) {
        throw error;
    }
}


update.get('/update', async (req, res) => {
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
                const logQuery = `INSERT INTO update_logs (last_update) VALUES (NOW())`;
                connection.query(logQuery, (logError, logResult) => {
                    if (logError) {
                        console.error(logError);
                        res.status(500).json({ error: 'Failed to log update time' });
                    } else {
                        res.json({ message: 'Update process completed' });
                    }
                });
            } else {
                res.status(404).json({ error: 'No active trips found' });
            }
        }
    });
});


update.get('/last-update', (req, res) => {
    const lastUpdateQuery = `SELECT last_update FROM update_logs ORDER BY id DESC LIMIT 1`;
    connection.query(lastUpdateQuery, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to retrieve last update time' });
        } else if (results.length > 0) {
            res.json(results[0].last_update);
        } else {
            res.status(404).json({ error: 'No update logs found' });
        }
    });
});


cron.schedule('0 */45 * * * *', () => {
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



module.exports = update;