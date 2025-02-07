// Displays list of channels

// ChannelList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChannelList = ({ setChannel }) => {
  const [channels, setChannels] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    // Fetch the channels and keep updating the unread messages count
    const fetchChannels = async () => {
      try {
        const response = await axios.get('/api/channels'); // Example endpoint
        setChannels(response.data);
      } catch (error) {
        console.error('Error fetching channels:', error);
      }
    };

    fetchChannels();

    // Simulate updating the unread messages count in the background
    const interval = setInterval(() => {
      setUnreadMessages((prev) => {
        const newUnread = { ...prev };
        channels.forEach((channel) => {
          newUnread[channel.id] = (newUnread[channel.id] || 0) + Math.floor(Math.random() * 3);
        });
        return newUnread;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [channels]);

  return (
    <div className="channel-list">
      {channels.map((channel) => (
        <div key={channel.id} className="channel-item" onClick={() => setChannel(channel)}>
          <span>{channel.name}</span>
          {unreadMessages[channel.id] && (
            <span className="unread-count">{unreadMessages[channel.id]} unread</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChannelList;
