import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';
import { FaThumbtack } from 'react-icons/fa'; // Import pin icon from react-icons
import './ChatWindow.css';

const API_URL = 'http://vm146.rz.uni-osnabrueck.de/u064/project3/aiweb_project03/channel.wsgi/'; // Uni server
//const API_URL = channel.endpoint;

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seenUsers, setSeenUsers] = useState({});
  //const API_URL = channel.endpoint;
  //const API_URL = channel.endpoint.replace(/\/$/, ''); // Remove trailing slash if present

  console.log('API URL:', API_URL);

  useEffect(() => {
    // Fetch messages from the server on component mount
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
  
      const channelAPIURL = `${API_URL}/messages?channel=${channel.name}`;
  
      try {
        const response = await axios.get(channel.endpoint, {
          headers: {
            'Authorization': 'authkey ' + channel.authkey, // Add the Authorization header
          },
        });
        // Set messages received from the server
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
  
    fetchMessages();
  }, [channel]);
  
  useEffect(() => {
    const savedMessages = localStorage.getItem('messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));  // Restore messages from localStorage
    }
  }, []);  // Run this effect only once on component mount
  
   

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
      pinned: false,  // New message default pin state
    };
    console.log('Sending message payload:', messagePayload); //debugging
    try {
      const response = await axios.post(`${API_URL}/messages`, messagePayload, {
        headers: {
          'Authorization': 'authkey ' + channel.authkey, // Add the Authorization header
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
          pinned: false, // New message default pin state
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const togglePinMessage = async (index) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      const message = newMessages[index];
  
      // Only toggle if the message is not already pinned
      if (message.pinned) {
        console.log("Message already pinned, skipping toggle.");
        return prevMessages;
      }
  
      // Toggle the pinned state locally
      message.pinned = !message.pinned;
      const channelAPIURL = `${API_URL}/messages?channel=${channel.name}`;
      // Send a request to the backend to update the message
      fetch(`${channelAPIURL}/update_message/${message.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },     
        body: JSON.stringify({ pinned: message.pinned }),
      })
        .then((response) => response.json())
        .then((updatedMessage) => {
          console.log('Backend updated message:', updatedMessage);
          // Optionally update the UI or state if necessary
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            updatedMessages[index] = updatedMessage;  // Update the message with the backend response
            return updatedMessages;
          });
        })
        .catch((error) => {
          console.error('Error updating message on the backend:', error);
        });
  
      return newMessages;
    });
  };
  
  
  useEffect(() => {
    // Save messages to localStorage when messages state changes
    if (messages.length > 0) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
    console.log('Messages saved to localStorage:', messages);
  }, [messages]);

 

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

            {/* Pin Button */}
            <button className={`pin-button ${msg.pinned ? 'pinned' : ''}`} onClick={() => togglePinMessage(index)} aria-label="Pin message"> <FaThumbtack /> </button>

   
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
