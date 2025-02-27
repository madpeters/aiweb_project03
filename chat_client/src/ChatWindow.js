import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';

const API_URL = 'http://localhost:5001';  // Ensure this is correct

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        // Using channel.name instead of channel.id
        const response = await axios.get(`${API_URL}/messages?channel=${channel.name}`);
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
    console.log('Sending message payload:', messagePayload);
  
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
  
  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{channel.name}</h3>
      </div>
      <div className="chat-messages">
  {loading && <p>Loading messages...</p>}
  {error && <p style={{ color: 'red' }}>{error}</p>}
  {messages.map((msg, index) => (
    <div key={index} className="chat-message">
      <div>
        <span>{msg.sender}: </span>
        <span
          dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} // Display the user's message
        />
      </div>
      {msg.response && (
        <div className="chat-response">
          <span>Bot: </span>
          <span
            dangerouslySetInnerHTML={{ __html: formatMessage(msg.response) }} // Display the response message
          />
        </div>
      )}
    </div>
  ))}
</div>
      {/* Pass channel.name to MessageInput instead of channel.id */}
      <MessageInput onSendMessage={handleSendMessage} channelName={channel.name} />
    </div>
  );
};

export default ChatWindow;
