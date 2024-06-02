const express = require('express')
const axios = require('axios');
const connection = require('./database');  
const addHotel = express.Router();

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

function insertHotel(code, name) {
    const query = `INSERT INTO hotels (Nazwa, Code) VALUES (?, ?)`;

    connection.query(query, [name, code], (error, results) => {
        if (error) {
            console.log('Error inserting data:', error);
            return;
        }
        console.log('Data added successfully:', results);
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



addHotel.get('/hotel/:code/:name', (req, res) => {
    const code = req.params.code;
    const name = req.params.name;


    singleData(code)
        .then(data => {
            data.forEach(item => {
                insertTripData(code, item.price, item.startDate, item.returnDate);
            });
            res.status(200).json({ message: 'Data added successfully' });
            insertHotel(code, name);
        })
        .catch(error => {
            console.error('Error adding data:', error);
            res.status(500).json({ error: 'Failed to add data to tripdata' });
        });
});


module.exports = addHotel;