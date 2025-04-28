// src/components/ChatPanel.js
import React, { useState, useEffect } from 'react';
import { useWebSocket } from './WebsocketContext';
import './ChatPanel.css';

const ChatPanel = () => {
  const { messages, send } = useWebSocket();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || typeof lastMessage !== 'object') return;
    if (lastMessage.type === 'chat_message') {
      setChat(prev => [...prev, lastMessage]);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    send({ type: 'chat_message', message, id: Date.now() });
    setMessage('');
  };

  return (
    <div className="chat-panel">
      <h2>Chat</h2>
      <ul className="chat-messages">
        {chat.map((msg, index) => (
          <li key={index}>
            <strong>{msg.user || 'Anonymous'}:</strong> {msg.message}
          </li>
        ))}
      </ul>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatPanel;