import React, { useState } from 'react';
import { createRoom } from '../api/room_manage';
import { useNavigate } from 'react-router-dom';
import './CreateRoom.css';

const CreateRoom = () => {
    const [roomName, setRoomName] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleCreateRoom = async () => {
        try {
            if (!roomName.trim()) {
                setError('Room name cannot be empty.');
                return;
            }

            console.log("Clicked create room");
            const createdRoom = await createRoom(roomName);
            console.log(`Going to room ${roomName}`);
            navigate(`/room/${roomName}`);
            
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create room.');
        }
    };

    return (
        <div className="create-room-container">
          <div className="create-room-box">
            <h1>Create Room</h1>
    
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setError(null);
              }}
            />
    
            <button onClick={handleCreateRoom}>Create</button>
    
            {error && <p className="error-message">{error}</p>}
    
            <p>
              Want to join an existing room?{" "}
              <a href="/join-room">Join Room</a>
            </p>
          </div>
        </div>
    );
};

export default CreateRoom;
