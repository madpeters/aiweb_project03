// Display messages for a specific channel

// ChatWindow.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/api/messages?channel=${channel.id}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [channel]);

  const formatMessage = (message) => {
    // Replace [nop]*word*[/nop] with <i>word</i>
    return message.replace(/\*([^*]+)\*/g, '<i>$1</i>')
                  .replace(/\[nop\](.*?)\[\/nop\]/g, '<b>$1</b>');
  };

  const handleSendMessage = (message) => {
    // Send the message to the backend
    axios.post('/api/messages', { channelId: channel.id, userName, message });
    setMessages([...messages, { userName, message }]);
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
