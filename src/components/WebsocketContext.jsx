import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { joinRoom, disconnectRoom, sendMessage } from '../api/room_manage';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);

    const connectToRoom = useCallback((roomName) => {
        if (!roomName) return;
        console.log("Connecting to WebSocket room:", roomName);
        
        const newSocket = joinRoom(roomName, (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        setSocket(newSocket);
    }, []);

    const disconnect = useCallback(() => {
        if (socket) {
            disconnectRoom(socket);
            setSocket(null);
        }
    }, [socket]);

    const send = useCallback((message) => {
        if (socket) sendMessage(socket, message);
    }, [socket]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return (
        <WebSocketContext.Provider value={{ socket, messages, connectToRoom, send, disconnect }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};