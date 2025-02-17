// App.js
/*
import React, { useState } from 'react';
import ChannelList from './ChannelList';
import ChatWindow from './ChatWindow';
import UserNamePrompt from './UserNamePrompt';

const App = () => {
  const [userName, setUserName] = useState('');
  const [channel, setChannel] = useState(null);

  if (!userName) {
    return <UserNamePrompt setUserName={setUserName} />;
  }

  return (
    <div className="app">
      <h1>Welcome, {userName}</h1>
      <ChannelList setChannel={setChannel} />
      {channel && <ChatWindow channel={channel} userName={userName} />}
    </div>
  );
};

export default App;
*/

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChannelList from './ChannelList';
import ChatWindow from './ChatWindow';
import UserNamePrompt from './UserNamePrompt';



const API_URL = 'http://localhost:5555'; // Hub app URL
const CHANNEL_URL = 'http://localhost:5001';

const App = () => {
  const [userName, setUserName] = useState('');
  const [channels, setChannels] = useState([]);  // State to store channels
  const [channel, setChannel] = useState(null);
  
  // Fetch channels from the hub app when the app loads
  useEffect(() => {
    const authKey = '1234567890'; // Replace with your actual auth key or token
    
    axios.get(`${API_URL}/channels`, {
      headers: {
        'Authorization': `Bearer ${authKey}`  // If it's a Bearer token, or adjust as needed
      }
    })
    .then(response => {
      setChannels(response.data.channels); // Set channels state
    })
    .catch(error => {
      console.error('Error fetching channels:', error);
    });
  }, []);
  

  if (!userName) {
    return <UserNamePrompt setUserName={setUserName} />;
  }

  return (
    <div className="app">
      <h1>Welcome, {userName}</h1>
      <ChannelList channels={channels} setChannel={setChannel} />
      {channel && <ChatWindow channel={channel} userName={userName} />}
    </div>
  );
};

export default App;
