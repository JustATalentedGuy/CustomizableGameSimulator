import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useWebSocket } from './WebsocketContext';
import './SnakeAndLadder.css';

const SnakeAndLadder = () => {
    const { roomName } = useParams();
    const location = useLocation();
    const { messages, send } = useWebSocket();
    const gridSize = location.state?.config?.gridSize || 10;
    const snakes = location.state?.config?.snakes || {};
    const ladders = location.state?.config?.ladders || {};
    const playerSymbol = location.state?.symbol; 
    const opponentSymbol = playerSymbol === "red" ? "blue" : "red";

    const [playerPosition, setPlayerPosition] = useState(1);
    const [opponentPlayerPosition, setOpponentPlayerPosition] = useState(1);
    const [isRedNext, setIsRedNext] = useState(true);
    const [roll, setRoll] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [showWinnerPopup, setShowWinnerPopup] = useState(false);
    const [boardSize, setBoardSize] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            const padding = 40;
            const availableSize = Math.min(window.innerWidth, window.innerHeight) - padding;
            setBoardSize(availableSize);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    useEffect(() => {
        if (!messages.length) return;
        const latestMessage = messages[messages.length - 1];

        if (typeof latestMessage === "object") {
            if (latestMessage.type === "move") {
                const { newPosition, symbol, diceValue } = latestMessage.message;
                
                if (symbol !== playerSymbol) {
                    setOpponentPlayerPosition(newPosition);
                    setRoll(diceValue);
                    // Update turn after opponent's move
                    setIsRedNext(symbol === "blue");
                    
                    // Check if opponent won
                    if (newPosition === gridSize * gridSize) {
                        setGameOver(true);
                        setWinner(symbol);
                        setShowWinnerPopup(true);
                    }
                }
            } else if (latestMessage.type === "restart") {
                resetGame();
            } else if (latestMessage.type === "gameOver") {
                const { winner } = latestMessage.message;
                setGameOver(true);
                setWinner(winner);
                setShowWinnerPopup(true);
            }
        }
    }, [messages, playerSymbol, gridSize]);

    const rollDice = () => {
        // Check if it's this player's turn
        const isPlayerTurn = (playerSymbol === "red" && isRedNext) || (playerSymbol === "blue" && !isRedNext);
        if (gameOver || !isPlayerTurn) {
            return;
        }

        const diceValue = Math.floor(Math.random() * 6) + 1;
        setRoll(diceValue);
        movePlayer(diceValue);
    };

    const movePlayer = (diceValue) => {
        setPlayerPosition((prevPos) => {
            let newPosition = prevPos + diceValue;

            if (newPosition > gridSize * gridSize) {
                newPosition = prevPos;
            } else {
                newPosition = snakes[newPosition] || ladders[newPosition] || newPosition;
            }

            if (newPosition === gridSize * gridSize) {
                setGameOver(true);
                setWinner(playerSymbol);
                setShowWinnerPopup(true);
                // Notify opponent about win
                send({ type: "gameOver", message: { winner: playerSymbol } });
            }

            // Send the move to the server
            send({ type: "move", message: { newPosition, symbol: playerSymbol, diceValue } });

            // Update turn after player's move
            setIsRedNext(playerSymbol === "blue");
            return newPosition;
        });
    };

    // Modified to reverse the board orientation
    // const getCoordinates = (position) => {
    //     // Calculate the row and column for reversed board
    //     // In reversed board, 1 is at bottom-right and gridSize*gridSize is at top-left
        
    //     const totalCells = gridSize * gridSize;
    //     const reversedPosition = totalCells - position + 1;
        
    //     const col = (reversedPosition - 1) % gridSize;
    //     const row = Math.floor((reversedPosition - 1) / gridSize);
    
    //     const cellSize = 55;
    //     return {
    //         x: col * cellSize + cellSize / 2,
    //         y: row * cellSize + cellSize / 2,
    //     };
    // };  

    const cellSize = boardSize / gridSize;

    const getCoordinates = (position) => {
        const index = boardCells.indexOf(position);
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
    
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
    
        return { x, y };
    };    
    
    const color = {
        'red': "🔴",
        'blue': "🔵"
    }

    // Determine if it's the current player's turn
    const isPlayerTurn = (playerSymbol === "red" && isRedNext) || (playerSymbol === "blue" && !isRedNext);
    
    const resetGame = () => {
        setPlayerPosition(1);
        setOpponentPlayerPosition(1);
        setIsRedNext(true);
        setGameOver(false);
        setRoll(null);
        setWinner(null);
        setShowWinnerPopup(false);
    };
    
    const handleReplay = () => {
        resetGame();
        send({ type: "restart" });
    };
    
    const closePopup = () => {
        setShowWinnerPopup(false);
    };

    const popupStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: showWinnerPopup ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    };

    const popupContentStyle = {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '80%',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    };

    const buttonStyle = {
        margin: '10px',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    };

    const closeButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#f44336',
        color: 'white'
    };

    const replayButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#4CAF50',
        color: 'white'
    };

    // Create an array of cells in reverse order
    const createReversedBoard = () => {
        const totalCells = gridSize * gridSize;
        const cells = [];
    
        for (let row = 0; row < gridSize; row++) {
            const rowCells = [];
            for (let col = 0; col < gridSize; col++) {
                const basePosition = totalCells - (row * gridSize + col);
                rowCells.push(basePosition);
            }
    
            // Flip each row's direction for zig-zag
            if (row % 2 === 1) {
                rowCells.reverse();
            }
    
            cells.push(...rowCells);
        }
    
        return cells;
    };    

    const boardCells = createReversedBoard();

    return (
        <div className="game-container">
            <h1 className="game-title">Snake and Ladder - Room: {roomName}</h1>
            <h2 className={`turn-indicator ${isRedNext ? "red-turn" : "blue-turn"}`}>
                {isRedNext ? "Red's turn 🔴" : "Blue's turn 🔵"}
            </h2>
            <div className="player-info">
                <p>You are: {color[playerSymbol]} {playerSymbol.toUpperCase()}</p>
            </div>
            <button className="roll-dice" onClick={rollDice} 
                disabled={gameOver || !isPlayerTurn}>
                🎲 Roll Dice {isPlayerTurn ? "(Your Turn)" : "(Wait)"}
            </button>

            <div className="board-container" style={{ width: boardSize, height: boardSize }}>
                <svg className="board-svg" width={boardSize} height={boardSize}>
                    {Object.entries(snakes).map(([start, end]) => {
                        const startCoords = getCoordinates(Number(start));
                        const endCoords = getCoordinates(Number(end));
                        return (
                            <line key={`snake-${start}`} x1={startCoords.x} y1={startCoords.y} 
                                  x2={endCoords.x} y2={endCoords.y} className="snake-line" />
                        );
                    })}
                    {Object.entries(ladders).map(([start, end]) => {
                        const startCoords = getCoordinates(Number(start));
                        const endCoords = getCoordinates(Number(end));
                        return (
                            <line key={`ladder-${start}`} x1={startCoords.x} y1={startCoords.y} 
                                  x2={endCoords.x} y2={endCoords.y} className="ladder-line" />
                        );
                    })}
                </svg>

                <div className="board" 
                    style={{
                    width: boardSize,
                    height: boardSize,
                    gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
                }}>
                    {boardCells.map((position) => (
                        <div key={position}
                        className="cell"
                        style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            fontSize: `${Math.max(cellSize * 0.3, 12)}px`,
                        }}>
                            {position in snakes && <span className="snake">🐍</span>}
                            {position in ladders && <span className="ladder">🪜</span>}
                            {playerPosition === position ? color[playerSymbol] : 
                             opponentPlayerPosition === position ? color[opponentSymbol] : 
                             position}
                        </div>
                    ))}
                </div>
            </div>

            {roll !== null && <h3 className="dice-result">Dice Roll: {roll}</h3>}
            
            {gameOver && (
                <div className="game-over-actions">
                    <button className="replay-button" onClick={handleReplay}>
                        Play Again
                    </button>
                </div>
            )}
            
            {/* Winner Popup using inline styles */}
            <div style={popupStyle}>
                <div style={popupContentStyle}>
                    <h2>{winner === playerSymbol ? "You Win!" : `${winner?.toUpperCase()} Wins!`}</h2>
                    <p>Game Over! {winner && color[winner]} reached the end first.</p>
                    <button style={closeButtonStyle} onClick={closePopup}>Close</button>
                    <button style={replayButtonStyle} onClick={handleReplay}>Play Again</button>
                </div>
            </div>
        </div>
    );
};

export default SnakeAndLadder;