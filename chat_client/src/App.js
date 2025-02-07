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

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001'; // Flask backend URL

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch messages when the component mounts or searchQuery changes
  useEffect(() => {
    axios.get(`${API_URL}/`)
      .then(response => {
        setMessages(response.data);
      })
      .catch(error => {
        console.error('Error fetching messages:', error);
      });
  }, [searchQuery]);

  const handleSendMessage = () => {
    if (messageContent.trim()) {
      axios.post(`${API_URL}/`, {
        content: messageContent,
        sender: 'User',  // This can be dynamically set
        timestamp: new Date().toISOString()
      })
      .then(() => {
        setMessageContent(''); // Clear the input field
        // Fetch messages again after sending a new message
        axios.get(`${API_URL}/`)
          .then(response => setMessages(response.data))
          .catch(error => console.error(error));
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
    }
  };

  const handlePinMessage = (timestamp) => {
    axios.post(`${API_URL}/pin`, { timestamp })
      .then(() => {
        // After pinning the message, refresh the messages list
        axios.get(`${API_URL}/`)
          .then(response => setMessages(response.data))
          .catch(error => console.error(error));
      })
      .catch(error => console.error('Error pinning message:', error));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      axios.get(`${API_URL}/search?query=${searchQuery}`)
        .then(response => setMessages(response.data))
        .catch(error => console.error('Error searching messages:', error));
    }
  };

  return (
    <div>
      <h1>Chat Room</h1>

      <div>
        <input 
          type="text" 
          value={messageContent} 
          onChange={(e) => setMessageContent(e.target.value)} 
          placeholder="Type a message" 
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>

      <div>
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="Search messages" 
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div>
        <h2>Messages:</h2>
        {messages.length > 0 ? (
          <ul>
            {messages.map((message) => (
              <li key={message.timestamp}>
                <strong>{message.sender}</strong>: {message.content}
                <br />
                <small>{message.timestamp}</small>
                <button onClick={() => handlePinMessage(message.timestamp)}>
                  Pin Message
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No messages yet.</p>
        )}
      </div>
    </div>
  );
};

export default ChatApp;

