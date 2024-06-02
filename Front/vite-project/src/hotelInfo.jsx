import React, { useState, useEffect } from 'react';

function HotelInfo({ code }) { // Use destructuring for props
    const [prices, setPrices] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:3003/prices/${code}`)
            .then(response => response.json())
            .then(data => setPrices(data))
            .catch(error => console.error('Error fetching the prices:', error));
    }, [code]);

    return (
        <ul>
            {prices.map((position, index) => (
                <li key={index}><strong>{position.startDate} - {position.returnDate}:</strong> {position.price}zł</li>
            ))}
        </ul>
    );
}

export default HotelInfo;
