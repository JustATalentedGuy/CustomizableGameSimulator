import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinRoom.css';


const BASE_URL = "http://127.0.0.1:8000";

const JoinRoom = () => {
    const [roomName, setRoomName] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleJoinRoom = async () => {
        if (!roomName.trim()) {
            setError('Room name cannot be empty.');
            return;
        }
        navigate(`/room/${roomName}`);
    };

    return (
        <div className="join-room-container">
          <div className="join-room-box">
            <h1>Join Room</h1>
    
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setError(null);
              }}
            />
    
            <button onClick={handleJoinRoom}>Join</button>
    
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
    );
};

export default JoinRoom;
