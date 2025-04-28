import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from './WebsocketContext';
import './Room.css';

const predefinedGames = [
    { 
        name: "Tic Tac Toe", 
        options: { 
            gridSize: 3, 
            winLength: 3,
            player1: "X",
            player2: "O"
        }
    },
    { 
        name: "Connect 4", 
        options: { 
            rows: 7, 
            columns: 8,
            winLength: 4,
        }
    },
    { 
        name: "Snake And Ladder", 
        options: { 
            gridSize: 10, 
            snakes: {16: 6, 47: 26, 59: 40, 62: 19, 87: 24, 98: 78}, 
            ladders: {4: 14, 21: 42, 28: 84, 38: 57, 51: 67, 71: 91},
        }
    },
    {
        name: "Memory",
        options: {
            numPairs: 8,
            images: []
        }
    }
];

const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

const MemoryImageUploader = ({ numPairs = 8, images, setImages }) => {
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        const remainingSlots = numPairs - images.length;
        const selectedFiles = files.slice(0, remainingSlots);

        const fileReaders = selectedFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(fileReaders).then(newImages => {
            setImages([...images, ...newImages]);
        });
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial" }}>
            <label>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={images.length >= numPairs}
                    style={{ display: "none" }}
                    id="memory-image-upload"
                />
                <button
                    htmlFor="memory-image-upload"
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#007BFF",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                    disabled={images.length >= numPairs}
                    onClick={() => document.getElementById("memory-image-upload").click()}
                >
                    {images.length >= numPairs ? "Upload Limit Reached" : "Upload Images"}
                </button>
            </label>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {images.map((img, index) => (
                    <img
                        key={index}
                        src={img}
                        alt={`Uploaded ${index}`}
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "5px" }}
                    />
                ))}
            </div>
        </div>
    );
};

const Room = () => {
    const [chatVisible, setChatVisible] = useState(true);
    const { roomName } = useParams();
    const navigate = useNavigate();
    const { connectToRoom, send, messages } = useWebSocket();
    const [message, setMessage] = useState('');
    const [selectedGame, setSelectedGame] = useState(predefinedGames[0]);
    const [config, setConfig] = useState(() => {
        const defaultGame = predefinedGames[0];
        return { ...defaultGame.options };
    });    
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
        connectToRoom(roomName);
    }, [roomName, connectToRoom]);

    useEffect(() => {
        if (!messages || messages.length === 0) return;
        
        const lastMessage = messages[messages.length - 1];

        if (!lastMessage || typeof lastMessage !== 'object') return;

        console.log("Received:", lastMessage);

        if (lastMessage.type === "start_game" && !gameStarted) {
            setGameStarted(true);
            console.log("Starting game with symbol:", lastMessage.message.symbol);
            if (lastMessage.message.game.name === "Tic Tac Toe") {
                navigate(
                    `/game/tic-tac-toe/${roomName}`, 
                    { 
                        state: { game: lastMessage.message.game, config: lastMessage.message.config, symbol: lastMessage.message.symbol } 
                    }
                );
            }
            else if (lastMessage.message.game.name === "Snake And Ladder") {
                navigate(
                    `/game/snake-and-ladder/${roomName}`,
                    {
                        state: { game: lastMessage.message.game, config: lastMessage.message.config, symbol: lastMessage.message.symbol }
                    }
                );
            }
            else if (lastMessage.message.game.name === "Connect 4") {
                navigate(
                    `/game/connect-4/${roomName}`,
                    {
                        state: { game: lastMessage.message.game, config: lastMessage.message.config, symbol: lastMessage.message.symbol }
                    }
                );
            }
            else if (lastMessage.message.game.name === "Memory") {
                navigate(
                    `/game/memory/${roomName}`,
                    {
                        state: { game: lastMessage.message.game, config: lastMessage.message.config, symbol: lastMessage.message.symbol, cards: lastMessage.message.cards }
                    }
                );
            }
        }
    }, [messages, gameStarted, navigate, roomName]);

    const handleGameChange = (event) => {
        const game = predefinedGames.find(g => g.name === event.target.value);
        setSelectedGame(game);
        if (game.name === "Memory") {
            setConfig({
                ...game.options,
                images: []
            });
        } else {
            setConfig({ ...game.options });
        }
    };

    const validateTicTacToe = (name, value) => {
        const newConfig = { ...config, [name]: value };
        
        if (name === "gridSize" && value < 3) {
            alert("Grid size cannot be less than 3");
            return false;
        }
        
        if (name === "winLength" && value > config.gridSize) {
            alert("Winning line cannot be longer than the grid size");
            return false;
        }
        
        return true;
    };

    const validateConnect4 = (name, value) => {
        const newConfig = { ...config, [name]: value };
        
        if ((name === "rows" && value < 5) || (name === "columns" && value < 5)) {
            alert("Rows and columns cannot be less than 5");
            return false;
        }
        
        if (name === "winLength" && value > Math.min(newConfig.rows, newConfig.columns)) {
            alert("Winning line cannot be longer than the smallest dimension");
            return false;
        }
        
        return true;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numValue = Number(value);
        
        if (selectedGame.name === "Tic Tac Toe") {
            if (validateTicTacToe(name, numValue)) {
                setConfig({ ...config, [name]: numValue });
            }
        } else if (selectedGame.name === "Connect 4") {
            if (validateConnect4(name, numValue)) {
                setConfig({ ...config, [name]: numValue });
            }
        } else {
            if (name === "gridSize" && numValue < 3) {
                alert("Grid size cannot be less than 3 for Snake And Ladder");
                return;
            }
            setConfig({ ...config, [name]: numValue });
        }
    };

    const validateSnakeLadderEntry = (type, start, end) => {
        const gridSize = config.gridSize;
        const totalSquares = gridSize * gridSize;
        
        if (start < 1 || start > totalSquares) {
            alert(`Start position must be between 1 and ${totalSquares}`);
            return false;
        }
        
        if (end < 1 || end > totalSquares) {
            alert(`End position must be between 1 and ${totalSquares}`);
            return false;
        }
        
        if (type === "snakes" && end >= start) {
            alert("Snake's end must be lower than its start");
            return false;
        }
        
        if (type === "ladders" && end <= start) {
            alert("Ladder's end must be higher than its start");
            return false;
        }
        
        const snakes = config.snakes || {};
        const ladders = config.ladders || {};
        
        if (Object.keys(snakes).includes(start.toString()) || 
            Object.keys(ladders).includes(start.toString())) {
            alert(`Position ${start} is already occupied by another snake or ladder`);
            return false;
        }
        
        return true;
    };

    const handleAddEntry = (type) => {
        const start = parseInt(prompt(`Enter start position of ${type}:`), 10);
        const end = parseInt(prompt(`Enter end position of ${type}:`), 10);
        
        if (!start || !end) return;
        
        if (validateSnakeLadderEntry(type, start, end)) {
            setConfig({
                ...config,
                [type]: { ...config[type], [start]: end }
            });
        }
    };

    const handleRemoveEntry = (type, key) => {
        const updatedEntries = { ...config[type] };
        delete updatedEntries[key];
        setConfig({ ...config, [type]: updatedEntries });
    };

    const handlePlayer1ImageUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setConfig(prev => ({
                ...prev,
                player1: e.target.result
            }));
        };
        reader.readAsDataURL(file);
    };
    
    const handlePlayer2ImageUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setConfig(prev => ({
                ...prev,
                player2: e.target.result
            }));
        };
        reader.readAsDataURL(file);
    };    

    const startGame = () => {
        let isValid = true;
        
        if (selectedGame.name === "Tic Tac Toe") {
            if (config.gridSize < 3) {
                alert("Grid size cannot be less than 3");
                isValid = false;
            } else if (config.winLength > config.gridSize) {
                alert("Winning line cannot be longer than the grid size");
                isValid = false;
            }
        } else if (selectedGame.name === "Connect 4") {
            if (config.rows < 5 || config.columns < 5) {
                alert("Rows and columns cannot be less than 5");
                isValid = false;
            } else if (config.winLength > Math.min(config.rows, config.columns)) {
                alert("Winning line cannot be longer than the smallest dimension");
                isValid = false;
            }
            else if (config.winLength < 3) {
                alert("Winning line cannot be lesser than 3 for this game");
                isValid = false;
            }
        } else if (selectedGame.name === "Snake And Ladder") {
            if (config.gridSize < 3) {
                alert("Grid size cannot be less than 3 for Snake And Ladder");
                isValid = false;
            }
        }
        console.log("isValid:", isValid);
        if (!isValid || gameStarted) return;
        
        console.log("Selected game:", selectedGame);
        if (selectedGame.name === "Tic Tac Toe") {
            const assignedSymbol = Math.random() < 0.5 ? 'X' : 'O';
            setGameStarted(true);
            send({ type: "start_game", message: {game: selectedGame, config: config, symbol: assignedSymbol === 'X' ? 'O' : 'X' }});
            console.log("Starting game with symbol:", assignedSymbol);
            navigate(
                `/game/tic-tac-toe/${roomName}`, 
                { 
                    state: { game: selectedGame.name, config: config, symbol: assignedSymbol } 
                }
            );
        }
        else if (selectedGame.name === "Connect 4") {
            setGameStarted(true);
            const assignedSymbol = Math.random() < 0.5 ? 'red' : 'blue';
            send({ type: "start_game", message: {game: selectedGame, config: config, symbol: assignedSymbol === 'red' ? 'blue' : 'red' }});
            console.log("Starting game with symbol:", assignedSymbol);
            navigate(
                `/game/connect-4/${roomName}`, 
                {
                    state: { game: selectedGame.name, config: config, symbol: assignedSymbol }
                }
            );
        }
        else if (selectedGame.name === "Snake And Ladder") {
            setGameStarted(true);
            const assignedSymbol = Math.random() < 0.5 ? 'red' : 'blue';
            send({ type: "start_game", message: {game: selectedGame, config: config, symbol: assignedSymbol === 'red' ? 'blue' : 'red' }});
            console.log("Starting game with symbol:", assignedSymbol);
            navigate(
                `/game/snake-and-ladder/${roomName}`, 
                {
                    state: { game: selectedGame.name, config: config, symbol: assignedSymbol }
                }
            );
        }
        else if (selectedGame.name === "Memory") {
            setGameStarted(true);
            const playerNum = Math.random() < 0.5 ? 1 : 2;
            const processedImages = config.images.map((img) => {
                if (!img.startsWith("data:image")) {
                  return `data:image/png;base64,${img}`;
                }
                return img;
            });
            const duplicated = processedImages.slice(0, config.numPairs).flatMap((img, idx) => [
                { id: idx * 2, img: img, pairId: idx },
                { id: idx * 2 + 1, img: img, pairId: idx },
              ]);
            const shuffled = shuffleArray(duplicated);
            console.log("Shuffled cards:", shuffled.length);
            send({ type: "start_game", message: {game: selectedGame, config: {numPairs: config.numPairs}, symbol: playerNum === 1 ? 2 : 1, cards: shuffled }});
            console.log("Starting game with player number:", playerNum);
            navigate(
                `/game/memory/${roomName}`,
                {
                    state: { game: selectedGame.name, config: config, symbol: playerNum, cards: shuffled }
                }
            );
        }
    };

    return (
        <div className="container">
            {/* Room Header */}
            <div className="header">Room: {roomName}</div>
    
            <div className="main-content">
                {/* Game Settings Section */}
                <div className={`game-settings ${chatVisible ? "" : "settings-expanded"}`}>
                    <h1>Select a Game</h1>
                    <select value={selectedGame.name} onChange={handleGameChange}>
                        {predefinedGames.map((game, index) => (
                            <option key={index} value={game.name}>{game.name}</option>
                        ))}
                    </select>
    
                    <h2>Game Configuration</h2>
                    {config.gridSize !== undefined && (
                        <>
                            <label>Grid Size:</label>
                            <input 
                                type="number" 
                                name="gridSize" 
                                value={config.gridSize} 
                                onChange={handleInputChange} 
                                min={selectedGame.name === "Snake And Ladder" ? 5 : 3}
                            /><br />
                        </>
                    )}

                    {config.rows !== undefined && (
                        <>
                            <label>Rows:</label>
                            <input 
                                type="number" 
                                name="rows" 
                                value={config.rows} 
                                onChange={handleInputChange} 
                                min={5}
                            /><br />
                        </>
                    )}

                    {config.columns !== undefined && (
                        <>
                            <label>Columns:</label>
                            <input 
                                type="number"
                                name="columns" 
                                value={config.columns} 
                                onChange={handleInputChange} 
                                min={5}
                            /><br />
                        </>
                    )}
    
                    {config.winLength !== undefined && (
                        <>
                            <label>Win Length:</label>
                            <input 
                                type="number" 
                                name="winLength" 
                                value={config.winLength} 
                                onChange={handleInputChange} 
                                min={3}
                                max={selectedGame.name === "Tic Tac Toe" ? config.gridSize : Math.min(config.rows || 99, config.columns || 99)}
                            /><br />
                        </>
                    )}
    
                    {config.snakes && (
                        <>
                            <h3>Snakes</h3>
                            <ul className="snake-ladder-container">
                                {Object.entries(config.snakes).map(([start, end]) => (
                                    <li key={start}>
                                        {start} → {end} <button onClick={() => handleRemoveEntry("snakes", start)}>Remove</button>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => handleAddEntry("snakes")}>Add Snake</button>
                        </>
                    )}
    
                    {config.ladders && (
                        <>
                            <h3>Ladders</h3>
                            <ul className="snake-ladder-container">
                                {Object.entries(config.ladders).map(([start, end]) => (
                                    <li key={start}>
                                        {start} → {end} <button onClick={() => handleRemoveEntry("ladders", start)}>Remove</button>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => handleAddEntry("ladders")}>Add Ladder</button>
                        </>
                    )}
                    
                    {/* Player Image Uploads */}
                    {config.player1 !== undefined && (
                        <>
                            <label>Upload Image for Player 1:</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handlePlayer1ImageUpload(e.target.files[0])} 
                            /><br />
                        </>
                    )}

                    {config.player2 !== undefined && (
                        <>
                            <label>Upload Image for Player 2:</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handlePlayer2ImageUpload(e.target.files[0])} 
                            /><br />
                        </>
                    )}

                    {selectedGame.name === "Memory" && (
                        <MemoryImageUploader 
                            numPairs={config.numPairs || 8} 
                            images={config.images || []}
                            setImages={(updatedImages) => {
                                setConfig(prev => ({ ...prev, images: updatedImages }));
                            }}
                        />
                    )}
                </div>
            </div>
    
            {/* Start Game Button */}
            <button onClick={startGame} disabled={gameStarted} className="start-game-btn">
                Start Game
            </button>
        </div>
    );
};

export default Room;