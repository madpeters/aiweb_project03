import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';
import { FaThumbtack } from 'react-icons/fa';
import './ChatWindow.css';

const ChatWindow = ({ channel, userName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = channel.endpoint.replace(/\/$/, '');

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(API_URL + '/messages', {
          headers: { 'Authorization': 'authkey ' + channel.authkey },
          params: { channel: channel.name },
        });
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 5000); // Regelmäßig aktualisieren

    return () => clearInterval(intervalId); // Intervall beim Unmounten löschen
  }, [channel, API_URL]);

  const formatMessage = (message) => {
    return message
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/\[nop\](.*?)\[\/nop\]/g, '<b>$1</b>')
      .replace(/\_\_([^_]+)\_\_/g, '<u>$1</u>');
  };

  const handleSendMessage = async (message, channelName) => {
    const messagePayload = {
      name: channelName,
      sender: userName,
      content: message,
      timestamp: new Date().toISOString(),
      pinned: false,
    };
    try {
      await axios.post(API_URL + '/messages', messagePayload, {
        headers: { 'Authorization': 'authkey ' + channel.authkey },
      });
      // Nachrichten nach dem Senden neu abrufen
      const response = await axios.get(API_URL + '/messages', {
        headers: { 'Authorization': 'authkey ' + channel.authkey },
        params: { channel: channel.name },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const togglePinMessage = async (messageId, pinned) => {
    try {
      await axios.patch(
        API_URL + `/update_message/${messageId}`,
        { pinned: !pinned },
        { headers: { 'Content-Type': 'application/json' } }
      );
      // Nachrichten nach dem Pinnen neu abrufen
      const response = await axios.get(API_URL + '/messages', {
        headers: { 'Authorization': 'authkey ' + channel.authkey },
        params: { channel: channel.name },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error updating message:', error);
      setError('Failed to update message');
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
        {messages.map((msg) => (
          <div key={msg.id} className={`message-container ${msg.sender === userName ? 'user-message' : ''}`}>
            {msg.sender && (
              <div className={`message-sender ${msg.sender === 'plantbot' ? 'bot-sender' : ''}`}>
                {msg.sender}
              </div>
            )}
            <div className={`message ${msg.sender === userName ? 'user' : 'other'}`}>
              <div className="message-content" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
            </div>
            <button className={`pin-button ${msg.pinned ? 'pinned' : ''}`} onClick={() => togglePinMessage(msg.id, msg.pinned)} aria-label="Pin message"> <FaThumbtack /> </button>
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