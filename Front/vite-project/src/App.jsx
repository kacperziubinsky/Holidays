import SingleHotel from './singleHotel';
import UpdateData from './updateData';
import AddSingle from './addSingle';
import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3003/hotels')
      .then(response => response.json())
      .then(data => setHotels(data))
      .catch(error => console.error('Error fetching the hotels:', error));
  }, []);

  const refreshData = () => {
    fetch('http://localhost:3003/hotels')
      .then(response => response.json())
      .then(data => setHotels(data))
      .catch(error => console.error('Error refreshing the hotels:', error));
  };

  return (
    <>
      <h1>Holidays</h1>
      <UpdateData />
      <div className="items">
        <button onClick={refreshData}>Odśwież</button>
        {hotels.map((hotel, index) => (
          <SingleHotel key={index} name={hotel.name} code={hotel.code} />
        ))}
        <AddSingle />
      </div>
      <p className="read-the-docs">Ziubiński</p>
    </>
  );
}

export default App;
