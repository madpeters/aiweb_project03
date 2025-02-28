import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const API_URL = 'http://localhost:5001';  

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seenUsers, setSeenUsers] = useState({});

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {

        const response = await axios.get(`${API_URL}/messages?channel=${channel.name}`);
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

    fetchMessages();
  }, [channel]);

  const formatMessage = (message) => {
    return message
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')  
      .replace(/\[nop\](.*?)\[\/nop\]/g, '<b>$1</b>') 
      .replace(/\_\_([^_]+)\_\_/g, '<u>$1</u>');  
  };
  
  const authKey = '0987654321';

  const handleSendMessage = async (message, channelName) => {
    const messagePayload = {
      channelName: channelName,  // Pass the channel name here
      sender: userName,        // Send the sender's name
      content: message,        // Send the actual message content
      timestamp: new Date().toISOString(),  // Timestamp of the message
    };
    console.log('Sending message payload:', messagePayload); //bug test
  
    try {
      const response = await axios.post(`${API_URL}/messages`, messagePayload, {
        headers: {
          'Authorization': `authkey ${authKey}`,  // Send the Authorization header
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

  const getUserDisplayName = (sender) => {
    if (sender === userName) {
      return ''; // Do not display the username if it's the user's message
    }
    // If it's the first time we see the user, display full name, else display initials
    if (!seenUsers[sender]) {
      // Mark this sender as seen and display their full name
      setSeenUsers((prevState) => ({ ...prevState, [sender]: true }));
      return sender; // Display full name the first time
    } else {
      // Display only the first initial of the sender if we've seen them before
      return sender.charAt(0).toUpperCase(); // Initial of the sender
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
                {getUserDisplayName(msg.sender)}
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
