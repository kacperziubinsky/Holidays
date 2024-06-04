import React, { useState, useEffect } from 'react';

function UpdateData() {
  const [date, setDate] = useState();

  useEffect(() => {
    fetch(`http://localhost:3003/last-update`)
      .then(response => response.json())
      .then(data => {
        const formattedDate = new Date(data).toLocaleString(); // Convert to local date format
        setDate(formattedDate);
      })
      .catch(error => console.error('Error fetching the last update date:', error));
  }, []);

  return <span>Ostatnia aktualizacja: {date}</span>;
}

export default UpdateData;
