const wsBaseUrl = import.meta.env.VITE_WS_URL;



export class GameSocket {
    constructor(roomName, userName, onMoveReceived, onChatReceived, onConnectionError) {
        this.roomName = roomName;
        this.userName = userName;
        this.socket = null;
        this.onMoveReceived = onMoveReceived; // Function to handle moves
        this.onChatReceived = onChatReceived; // Function to handle chat messages
        this.onConnectionError = onConnectionError; // Function to handle errors
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3; // Prevent infinite reconnect loop
        this.connect();
    }

    connect() {
        const token = localStorage.getItem('access');
        if (!token) {
            console.error("Access token not found. Please log in.");
            if (this.onConnectionError) this.onConnectionError("Access token missing.");
            return;
        }

        const socketUrl = `${wsBaseUrl}/ws/game/${this.roomName}/?token=${encodeURIComponent(token)}`;
        this.socket = new WebSocket(socketUrl);

        this.socket.onopen = () => {
            console.log(`Connected to room: ${this.roomName}`);
            this.reconnectAttempts = 0; // Reset reconnect attempts
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (!data.type || !data.user) {
                    console.warn("Invalid message format received:", data);
                    return;
                }

                if (data.type === "chat/message") {
                    this.onChatReceived(data);
                } else if (data.type === "chat/move") {
                    this.onMoveReceived(data);
                } else {
                    console.warn("Unknown message type received:", data);
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            if (this.onConnectionError) this.onConnectionError("WebSocket error occurred.");
        };

        this.socket.onclose = (event) => {
            console.log("WebSocket closed:", event.reason);
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), 2000 * this.reconnectAttempts); // Exponential backoff
            } else {
                console.error("Max reconnect attempts reached. Unable to reconnect.");
            }
        };
    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const payload = {
                type: "chat/message",
                message: message,
                user: this.userName,
            };
            this.socket.send(JSON.stringify(payload));
        } else {
            console.error("WebSocket is not open. Cannot send message.");
        }
    }

    sendMove(move) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const payload = {
                type: "chat/move",
                message: move,
                user: this.userName,
            };
            this.socket.send(JSON.stringify(payload));
        } else {
            console.error("WebSocket is not open. Cannot send move.");
        }
    }

    disconnect() {
        if (this.socket) {
            console.log("Disconnecting WebSocket...");
            this.socket.close();
        }
    }
}