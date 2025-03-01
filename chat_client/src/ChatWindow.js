import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';
import './ChatWindow.css';

//const API_URL = 'http://vm146.rz.uni-osnabrueck.de/u064/project3/aiweb_project03/channel.wsgi/'; // Uni server
//const API_URL = channel.endpoint;

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seenUsers, setSeenUsers] = useState({});
  //const API_URL = channel.endpoint;
  const API_URL = channel.endpoint.replace(/\/$/, ''); // Remove trailing slash if present
 
  console.log('API URL:', API_URL);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      // Dynamically construct the API URL based on the selected channel
      const channelAPIURL = `${API_URL}/messages?channel=${channel.name}`;

      try {
        
        //const response = await axios.get(channelAPIURL);
        const response = await axios.get(channel.endpoint, {
          headers: {
            'Authorization': 'authkey ' + channel.authkey, // Add the Authorization header
          },
        });
        console.log('Channel name received:', channel.name);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
      console.log('Selected channel:', channel);
    };

    if (channel) {
      fetchMessages(); // Fetch messages for the selected channel
    }
  }, [channel]); // Depend on the channel to re-fetch messages when the selected channel changes

  const formatMessage = (message) => {
    return message
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')  
      .replace(/\[nop\](.*?)\[\/nop\]/g, '<b>$1</b>') 
      .replace(/\_\_([^_]+)\_\_/g, '<u>$1</u>');  
  };

  //const authKey = '0987654321';
  const authKey = channel.authKey;


  const handleSendMessage = async (message, channelName) => {
    const messagePayload = {
      name: channelName,  // Pass the channel name here mp:: changed key to name from channel_name to match the server
      sender: userName,        // Send the sender's name
      content: message,        // Send the actual message content
      timestamp: new Date().toISOString(),  // Timestamp of the message
    };
    console.log('Sending message payload:', messagePayload); //debugging
    try {
      const response = await axios.post(`${API_URL}/messages`, messagePayload, {
        headers: {
          //'Authorization': `authkey ${authKey}`,  // Send the Authorization header
          'Authorization': 'authkey ' + channel.authkey, // Add the Authorization header mp: replaced the above to avoid authkey error
        },
      });
      console.log('Message sent successfully:', response.data);
  
      // If the message was sent successfully, update the messages state
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: userName,
          content: message,
          timestamp: new Date().toISOString(),
          response: response.data.response, // Include the response from the server
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{channel.name}</h3>
      </div>
      <div className="chat-messages">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        {messages.map((msg, index) => (
          <div key={index} className={`message-container ${msg.sender === userName ? 'user-message' : ''}`}>
            {/* Display sender's name */}
            {msg.sender && (
              <div className={`message-sender ${msg.sender === 'plantbot' ? 'bot-sender' : ''}`}>
                {msg.sender}
              </div>
            )}
            {/* Message Content */}
            <div className={`message ${msg.sender === userName ? 'user' : 'other'}`}>
              <div className="message-content" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
            </div>
            {/* Display bot's response (if any) */}
            {msg.response && (
              <div className="response">
                <span className="bot-label">Plantbot: </span>
                <span className="response-content" dangerouslySetInnerHTML={{ __html: formatMessage(msg.response) }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <MessageInput onSendMessage={handleSendMessage} channelName={channel.name} />
    </div>
  );
};

export default ChatWindow;
