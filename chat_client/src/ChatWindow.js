import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';

const API_URL = 'http://localhost:5001';  // Ensure this is correct

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);  // For loading state
  const [error, setError] = useState(null);  // For error state

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/messages?channel=${channel.id}`);
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

  const formatMessage = (message) => {
    return message
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')  // Formatting for *italic*
      .replace(/\[nop\](.*?)\[\/nop\]/g, '<b>$1</b>')  // Formatting for [nop]bold[/nop]
      .replace(/\_\_([^_]+)\_\_/g, '<u>$1</u>');  // Formatting for __underline__
  };

  const handleSendMessage = async (message) => {
    const messagePayload = {
      channelId: channel.id,
      userName: userName,
      message: message,
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post(`${API_URL}/messages`, messagePayload);
      // Using functional update form to prevent issues with stale state
      setMessages((prevMessages) => [
        ...prevMessages,
        { userName, message, timestamp: new Date().toISOString() },
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


