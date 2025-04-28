// RoomLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import { useWebSocket } from './WebsocketContext';
import './RoomLayout.css';

const RoomLayout = () => {
  const { roomName } = useParams();
  const { messages } = useWebSocket();
  const [chatVisible, setChatVisible] = useState(true);
  const [players, setPlayers] = useState([]);
  const [showPlayerPopup, setShowPlayerPopup] = useState(false);

  const toggleChat = () => setChatVisible((prev) => !prev);
  const togglePlayerPopup = () => setShowPlayerPopup((prev) => !prev);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.type === 'user_list' && Array.isArray(lastMessage.users)) {
      setPlayers(lastMessage.users);
    }
  }, [messages]);

  return (
    <div className="room-layout">
      {/* Fixed Header */}
      <header className="room-header">
        <div className="room-info">
          <h2>Room: {roomName}</h2>
          <span>Players: {players.length}</span>
        </div>
        <button className="player-button" onClick={togglePlayerPopup}>
          Show Players
        </button>
      </header>

      {/* Popup Modal */}
      {showPlayerPopup && (
        <div className="player-popup">
          <div className="player-popup-content">
            <h3>Players in Room</h3>
            <ul>
              {players.map((player, index) => (
                <li key={index}>{player}</li>
              ))}
            </ul>
            <button onClick={togglePlayerPopup}>Close</button>
          </div>
        </div>
      )}

      {/* Layout below header */}
      <div className="chat-content-wrapper">
        {chatVisible && (
          <div className="chat-container visible">
            <ChatPanel />
          </div>
        )}

        <div
          className={`content-container ${chatVisible ? "with-chat" : "full-width"}`}
        >
          <button onClick={toggleChat} className="chat-toggle">
            {chatVisible ? "Hide Chat" : "Show Chat"}
          </button>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default RoomLayout;
