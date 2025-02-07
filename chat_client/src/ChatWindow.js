import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';

const API_URL = 'http://localhost:5001';  // Update with your correct API endpoint

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/messages?channel=${channel.id}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [channel]);

  const formatMessage = (message) => {
    // Replace [nop]*word*[/nop] with <i>word</i> and other formatting
    return message.replace(/\*([^*]+)\*/g, '<i>$1</i>')
                  .replace(/\[nop\](.*?)\[\/nop\]/g, '<b>$1</b>');
  };

  const handleSendMessage = (message) => {
    // Send the message to the backend
    const messagePayload = {
      channelId: channel.id,
      userName: userName,
      message: message,
      timestamp: new Date().toISOString(),
    };

    axios.post(`${API_URL}/messages`, messagePayload)
      .then(() => {
        // Update the local state after sending the message
        setMessages([...messages, { userName, message, timestamp: new Date().toISOString() }]);
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{channel.name}</h3>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <span>{msg.userName}: </span>
            <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }} />
          </div>
        ))}
      </div>
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;

