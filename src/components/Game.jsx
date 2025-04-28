import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "./SocketContext";

// Square Component
function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick} disabled={value !== null}>
      {value}
    </button>
  );
}

// Board Component
function Board({ xIsNext, squares, onPlay, gridSize, winningLines, isMyTurn }) {
  const handleClick = (i) => {
    if (!isMyTurn || calculateWinner(squares, winningLines) || squares[i]) {
      return;
    }
    onPlay(i);
  };

  const winner = calculateWinner(squares, winningLines);
  let status = winner ? `Winner: ${winner}` : `Next player: ${xIsNext ? "X" : "O"}`;

  return (
    <>
      <div className="status">{status}</div>
      {Array(gridSize)
        .fill(null)
        .map((_, row) => (
          <div key={row} className="board-row">
            {Array(gridSize)
              .fill(null)
              .map((_, col) => {
                const index = row * gridSize + col;
                return <Square key={index} value={squares[index]} onSquareClick={() => handleClick(index)} />;
              })}
          </div>
        ))}
    </>
  );
}

// Game Component (Multiplayer)
export default function Game() {
  const { roomId } = useParams();
  const socket = useSocket();

  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [gridSize, setGridSize] = useState(3);
  const [winningLineLength, setWinningLineLength] = useState(3);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const winningLines = generateWinningLines(gridSize, winningLineLength);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "assignSymbol") {
        setPlayerSymbol(data.symbol);
        setIsMyTurn(data.symbol === "X");
      }

      if (data.type === "opponentMove") {
        setHistory((prev) => [...prev.slice(0, data.nextMove + 1), data.nextSquares]);
        setCurrentMove(data.nextMove);
        setIsMyTurn(true);
        if (calculateWinner(data.nextSquares, winningLines)) {
          setGameOver(true);
        }
      }
    };

    socket.send(JSON.stringify({ type: "join", roomId }));

    return () => {
      socket.onmessage = null;
    };
  }, [socket, roomId]);

  const handlePlay = (moveIndex) => {
    if (!isMyTurn || currentSquares[moveIndex] || gameOver) return;

    const nextSquares = currentSquares.slice();
    nextSquares[moveIndex] = xIsNext ? "X" : "O";
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];

    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setIsMyTurn(false);

    if (calculateWinner(nextSquares, winningLines)) {
      setGameOver(true);
    }

    socket.send(JSON.stringify({ type: "move", roomId, squares: nextSquares, nextMove: nextHistory.length - 1 }));
  };

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} gridSize={gridSize} winningLines={winningLines} isMyTurn={isMyTurn} />
      </div>
      <div className="game-info">
        <p>You are playing as: {playerSymbol || "Waiting..."}</p>
      </div>
    </div>
  );
}

// Calculate Winner
function calculateWinner(squares, winningLines) {
  for (let line of winningLines) {
    const first = squares[line[0]];
    if (first && line.every((index) => squares[index] === first)) {
      return first;
    }
  }
  return null;
}

// Function to Generate Winning Lines
function generateWinningLines(gridSize, winningLineLength) {
  const lines = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col <= gridSize - winningLineLength; col++) {
      lines.push([...Array(winningLineLength)].map((_, i) => row * gridSize + col + i));
    }
  }
  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row <= gridSize - winningLineLength; row++) {
      lines.push([...Array(winningLineLength)].map((_, i) => (row + i) * gridSize + col));
    }
  }
  for (let row = 0; row <= gridSize - winningLineLength; row++) {
    for (let col = 0; col <= gridSize - winningLineLength; col++) {
      lines.push([...Array(winningLineLength)].map((_, i) => (row + i) * gridSize + (col + i)));
      lines.push([...Array(winningLineLength)].map((_, i) => (row + i) * gridSize + (col + winningLineLength - 1 - i)));
    }
  }
  return lines;
}