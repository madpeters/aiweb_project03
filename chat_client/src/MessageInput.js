import React, { useState } from 'react';

const MessageInput = ({ onSendMessage, channelName }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      // Pass the channelName along with the message content to onSendMessage
      onSendMessage(message, channelName); // Changed from channelId to channelName
      setMessage('');
    }
  };

  return (
    <div className="message-input">
      <input
        type="text"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default MessageInput;


