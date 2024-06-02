import React, { useState } from 'react';
import HotelInfo from './hotelInfo';

function SingleHotel({ name, code }) { // Use destructuring for props
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="card">
            <h3>{name}</h3>
            <p>{code}</p>
            <button onClick={() => setShowInfo(!showInfo)}>
                {showInfo ? 'Ukryj dane' : 'Pokaż dane'}
            </button>
            {showInfo && <HotelInfo code={code} />}
        </div>
    );
}

export default SingleHotel;
