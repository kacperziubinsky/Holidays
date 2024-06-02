import React, { useState, useEffect } from 'react';

function updateData() {
  const [date, setDate] = useState();

  useEffect(() => {
    fetch(`http://localhost:3003/last-update`)
      .then(response => response.json())
      .then(data => {
        const formattedDate = new Date(data).toLocaleString(); // Format the date
        setDate(formattedDate);
      })
      .catch(error => console.error('Error fetching the last update date:', error));
  }, []);

  return (<span>Last update: {date}</span>
  );
}

export default updateData;
