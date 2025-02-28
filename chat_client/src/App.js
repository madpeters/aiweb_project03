// App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChannelList from './ChannelList';
import ChatWindow from './ChatWindow';
import UserNamePrompt from './UserNamePrompt';
// HUB_URL = 'http://vm146.rz.uni-osnabrueck.de/hub'
//HUB_AUTHKEY = 'Crr-K24d-2N'
// const API_URL = 'http://localhost:5555'; // Hub app URL
const API_URL = 'http://vm146.rz.uni-osnabrueck.de/hub';  //unni server hub

const App = () => {
  const [userName, setUserName] = useState('');
  const [channels, setChannels] = useState([]);  // State to store channels
  const [channel, setChannel] = useState(null);  // State to store selected channel
  
  // Fetch channels from the hub app when the app loads
  useEffect(() => {
    // const authKey = '1234567890';
    const authKey = 'Crr-K24d-2N'; // uni server auth key
    axios.get(`${API_URL}/channels`, {
      headers: {
        'Authorization': `Bearer ${authKey}`  // Adjust as needed
      }
    })
    .then(response => {
      console.log('Fetched channels:', response.data.channels); 
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
