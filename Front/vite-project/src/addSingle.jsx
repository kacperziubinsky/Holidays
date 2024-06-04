import React, { useState } from 'react';

function AddSingle() { 
    const [name, setName] = useState();
    const [code, setCode] = useState();

    return (
        <div className="card">
            <h3>Nazwa hotelu</h3>
            <input 
                type="text" 
                placeholder='Nazwa hotelu' 
                value={name}
                onChange={(e) => setName(e.target.value)}
                /> 
            <br />
            <p>Kod hotelu</p>
            <input 
                type="text" 
                placeholder='Kod hotelu' 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                /> 
                <br />
                <button onClick={() => {
                    fetch("https://jsonplaceholder.typicode.com/todos", {
                        method: "POST",
                        body: JSON.stringify({
                            name: name,
                            code: code
                        }),
                        headers: {
                        "Content-type": "application/json; charset=UTF-8"
                        }
                    });
                }
            }> DODAJ
            </button>
        </div>
    );
}

export default AddSingle;
