// Displays list of channels

// ChannelList.js
import React, { useState, useEffect } from 'react';
 
import './ChannelList.css';  




const ChannelList = ({ channels, setChannel }) => {
  return (
    <div className="channel-list">
      <h2 className="channel-list-title">Available Channels</h2>
      {channels.length > 0 ? (
        <ul className="channel-list-items">
          {channels.map((channel) => (
            <li
              key={channel.id}
              className="channel-item"
              onClick={() => {
                console.log('Channel selected:', channel);
                setChannel(channel);
              }}
            >
              
              <span className="channel-name">{channel.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-channels-text">No channels available.</p>
      )}
    </div>
  );
};

export default ChannelList;


