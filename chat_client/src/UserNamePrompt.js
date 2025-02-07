// Displays a prompt for the user to enter their username

// UserNamePrompt.js
import React, { useState, useEffect } from 'react';

const UserNamePrompt = ({ setUserName }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, [setUserName]);

  const handleSubmit = () => {
    if (name.trim()) {
      localStorage.setItem('userName', name);
      setUserName(name);
    }
  };

  return (
    <div className="username-prompt">
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default UserNamePrompt;
