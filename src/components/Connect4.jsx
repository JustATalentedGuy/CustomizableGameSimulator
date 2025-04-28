import './Connect4.css';
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from "react-router-dom";
import { useWebSocket } from "./WebsocketContext";

function generateWinningLines(rows, cols, winningLineLength) {
  const lines = [];

  // Horizontal lines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= cols - winningLineLength; col++) {
      const line = [];
      for (let i = 0; i < winningLineLength; i++) {
        line.push(row * cols + (col + i));
      }
      lines.push(line);
    }
  }

  // Vertical lines
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row <= rows - winningLineLength; row++) {
      const line = [];
      for (let i = 0; i < winningLineLength; i++) {
        line.push((row + i) * cols + col);
      }
      lines.push(line);
    }
  }

  // Diagonal (top-left to bottom-right)
  for (let row = 0; row <= rows - winningLineLength; row++) {
    for (let col = 0; col <= cols - winningLineLength; col++) {
      const line = [];
      for (let i = 0; i < winningLineLength; i++) {
        line.push((row + i) * cols + (col + i));
      }
      lines.push(line);
    }
  }

  // Diagonal (top-right to bottom-left)
  for (let row = 0; row <= rows - winningLineLength; row++) {
    for (let col = winningLineLength - 1; col < cols; col++) {
      const line = [];
      for (let i = 0; i < winningLineLength; i++) {
        line.push((row + i) * cols + (col - i));
      }
      lines.push(line);
    }
  }

  return lines;
}

const Connect4 = () => {
  const { roomName } = useParams();
  const location = useLocation();
  const playerSymbol = location.state?.symbol;
  const rows = location.state?.config?.rows || 6;
  const cols = location.state?.config?.columns || 7;
  const winLength = location.state?.config?.winLength || 4;
  const [board, setBoard] = useState(Array(rows).fill().map(() => Array(cols).fill(null)));
  const winningLines = generateWinningLines(rows, cols, winLength);
  const [winner, setWinner] = useState(null);
  const { messages, send } = useWebSocket();
  const [isRedNext, setIsRedNext] = useState(true);
  const [lastMessage, setLastMessage] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [isDraw, setIsDraw] = useState(false);

  useEffect(() => {
    if (!messages.length) return;
    const latestMessage = messages[messages.length - 1];

    if (latestMessage === lastMessage) return;

    setLastMessage(latestMessage);

    if (typeof latestMessage === "object") {
      if (latestMessage.type === "move") {
        const { col, symbol } = latestMessage.message;
        if (playerSymbol !== symbol) {
          handleMove(col, symbol);
        }
      } else if (latestMessage.type === "restart") {
        resetGame();
      }
    }
  }, [messages]);

  useEffect(() => {
    if (gameOver) {
      setShowWinnerPopup(true);
    }
  }, [gameOver]);

  function calculateWinner(board, winningLines, cols) {
    for (let line of winningLines) {
      const [row0, col0] = [Math.floor(line[0] / cols), line[0] % cols];
      const firstSymbol = board[row0][col0];

      if (firstSymbol && line.every(index => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        return board[row][col] === firstSymbol;
      })) {
        return firstSymbol;
      }
    }
    return null;
  }

  function checkDraw(board) {
    return board.every(row => row.every(cell => cell !== null));
  }

  const handleClick = (col) => {
    if (gameOver) return; // Prevent further moves if the game is over
    if ((isRedNext && playerSymbol !== "red") || (!isRedNext && playerSymbol !== "blue")) return;
    handleMove(col, playerSymbol);
    send({ type: "move", message: { col: col, symbol: playerSymbol } });
  };

  const handleMove = (col, symbol) => {
    const newBoard = board.map(row => [...row]);
    let moveMade = false;

    for (let row = rows - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = symbol;
        moveMade = true;

        // Update the board first
        setBoard(newBoard);

        // Calculate winner with the updated board
        const winnerFound = calculateWinner(newBoard, winningLines, cols);
        if (winnerFound) {
          setWinner(winnerFound);
          setGameOver(true);
        } else if (checkDraw(newBoard)) {
          setGameOver(true);
          setIsDraw(true);
        }
        break;
      }
    }
    if (moveMade && !gameOver) {
      setIsRedNext(prev => !prev);
    }
  };

  const resetGame = () => {
    setBoard(Array(rows).fill().map(() => Array(cols).fill(null)));
    setWinner(null);
    setGameOver(false);
    setIsRedNext(true);
    setShowWinnerPopup(false);
    setIsDraw(false);
  };

  const handleReplay = () => {
    resetGame();
    send({ type: "restart" });
  };

  const closePopup = () => {
    setShowWinnerPopup(false);
  };

  return (
    <div className="connect4">
      <div className='title'><h1>Connect 4</h1></div>
      <h2>Turn: {isRedNext ? "Red" : "Blue"}</h2>
      <h2 className='you'>You are '{playerSymbol}'</h2>
      <h2> Winning Length: {winLength}</h2>

      <div 
        className="board"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`, 
          gridTemplateRows: `repeat(${rows}, 1fr)`, 
          width: `${cols * 60}px`,
          height: `${rows * 60}px`,
          backgroundColor: "yellow",
          border: "2px solid black",
          gap: "15px",
          padding: "10px",
        }}
      >
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="cell"
              onClick={() => handleClick(colIndex)}
              style={{
                backgroundColor: cell || '#ddd',
                borderRadius: '50%',
                width: '100%',
                height: '100%',
              }}
            />
          ))
        ))}
      </div>

      {gameOver && (
        <button 
          onClick={handleReplay}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Play Again
        </button>
      )}

      {showWinnerPopup && (
        <div 
          className="popup-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div 
            className="popup-content"
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              minWidth: '300px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h2>{isDraw ? "It's a Draw!" : `${winner.toUpperCase()} Wins!`}</h2>
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleReplay}
                style={{
                  marginRight: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Play Again
              </button>
              <button
                onClick={closePopup}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connect4;