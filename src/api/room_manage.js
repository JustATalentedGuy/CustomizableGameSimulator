import axios from 'axios';

const BASE_URL = import.meta.env.VITE_DJANGO_API;
const wsBaseUrl = import.meta.env.VITE_WS_URL;
const sockets = {};

// Retrieves the access token from localStorage.
const getAccessToken = () => {
    const accessToken = localStorage.getItem('access');
    if (!accessToken) throw new Error('Access token not found. Please log in.');
    return accessToken;
};

// Creates a new room using the REST API, then automatically joins it.
export const createRoom = async (name, onMessageReceived) => {
    try {
        console.log("Creating room...");
        const accessToken = getAccessToken();
        const response = await axios.post(
            `${BASE_URL}/api/rooms/`, 
            { name }, 
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const createdRoom = response.data;
        console.log("API Response for room creation:", createdRoom);
        console.log("Created room:", createdRoom.name);
        // Use the unique identifier returned by the API (e.g. room name or room code)
        return joinRoom(createdRoom.name, onMessageReceived, true);
    } catch (error) {
        console.error('Error while creating room:', error.response?.data || error.message);
        throw error;
    }
};

// Joins an existing room via WebSocket connection.
// The access token is appended as a query parameter so that the backend middleware can authenticate the user.
export const joinRoom = (roomName, onMessageReceived, isNewRoom = false) => {
    console.log("JOIN ROOM IS CALLED...");
    if (!roomName || typeof roomName !== 'string' || roomName.trim() === '') {
        console.error('joinRoom called with invalid roomName:', roomName);
        throw new Error('Invalid room name provided.');
    }

    console.log(`Joining room: ${roomName}`);
    // Append the token as a query parameter using encodeURIComponent
    const token = getAccessToken();
    const socketUrl = `${wsBaseUrl}/ws/chat/${roomName}/?token=${encodeURIComponent(token)}`;
    console.log("WebSocket URL:", socketUrl);
    
    // If there's already an open socket for this room, update its message handler.
    if (sockets[roomName] && sockets[roomName].readyState === WebSocket.OPEN) {
        console.log("WebSocket is already open for room:", roomName);
        if (!isNewRoom && onMessageReceived) {
            const existingHandler = sockets[roomName].onmessage;
            sockets[roomName].onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (existingHandler) existingHandler(event);
                onMessageReceived(data);
            };
        }
        return sockets[roomName];
    }

    try {
        console.log("Creating WebSocket for room:", roomName);
        const socket = new WebSocket(socketUrl);

        socket.onopen = () => {
            console.log(`WebSocket connected to room: ${roomName}`);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received message:", data);
            if (onMessageReceived) onMessageReceived(data);
        };

        socket.onerror = (error) => {
            console.error(`WebSocket error for room: ${roomName}`, error);
            alert('WebSocket connection failed. Please try again later.');
        };

        socket.onclose = () => {
            console.log(`WebSocket disconnected from room: ${roomName}`);
            delete sockets[roomName];
        };

        sockets[roomName] = socket;
        return socket;
    } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        throw new Error('WebSocket connection failed.');
    }
};

export const disconnectRoom = (socket) => {
    if (socket) {
        console.log("Disconnecting WebSocket...");
        socket.close();
    }
};

// Sends a message through the given WebSocket.
export const sendMessage = (socket, message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Sending message in the Send Message function:", message);
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Cannot send message.');
    }
};