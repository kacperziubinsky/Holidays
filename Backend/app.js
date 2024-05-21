const express = require('express');
const axios = require('axios');
const mysql = require('mysql');
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
        .then(function(response) {
            const filteredData = response.data.map(item => ({
                price: item.price,
                discountPrice: item.discountPrice,
                boardName: item.boardName,
                startDate: item.startDate,
                returnDate: item.returnDate
            }));
            res.json(filteredData);
        })
        .catch(function(error) {
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
            .then(function(response) {
                const filteredData = response.data.map(item => ({
                    price: item.price,
                    discountPrice: item.discountPrice,
                    boardName: item.boardName,
                    startDate: item.startDate,
                    returnDate: item.returnDate
                }));
                resolve(filteredData);
            })
            .catch(function(error) {
                console.log(error);
                reject(error);
            });
    });
}

app.get('/hotel/:code', (req, res) => {
    const code = req.params.code;
    getData(code, res);
});


app.get('/hotels', (req, res) => {
    const querySQL = `SELECT * FROM hotels`;

    connection.query(querySQL, async (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to retrieve hotel data' });
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


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
