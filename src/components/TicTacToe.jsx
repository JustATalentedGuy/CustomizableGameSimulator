import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useWebSocket } from "./WebsocketContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./TicTacToe.css";
import { base } from "framer-motion/client";

function generateWinningLines(gridSize, winningLineLength) {
    const lines = [];
    
    // Horizontal lines
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col <= gridSize - winningLineLength; col++) {
            const line = [];
            for (let i = 0; i < winningLineLength; i++) {
                line.push(row * gridSize + (col + i));
            }
            lines.push(line);
        }
    }
    
    // Vertical lines
    for (let col = 0; col < gridSize; col++) {
        for (let row = 0; row <= gridSize - winningLineLength; row++) {
            const line = [];
            for (let i = 0; i < winningLineLength; i++) {
                line.push((row + i) * gridSize + col);
            }
            lines.push(line);
        }
    }
    
    // Diagonal lines
    for (let row = 0; row <= gridSize - winningLineLength; row++) {
        for (let col = 0; col <= gridSize - winningLineLength; col++) {
            const line1 = [];
            const line2 = [];
            for (let i = 0; i < winningLineLength; i++) {
                line1.push((row + i) * gridSize + (col + i));
                line2.push((row + i) * gridSize + (col + winningLineLength - 1 - i));
            }
            lines.push(line1);
            lines.push(line2);
        }
    }
    
    return lines;
}

function calculateWinner(squares, winningLines) {
    for (let line of winningLines) {
        const firstSymbol = squares[line[0]];
        if (firstSymbol && line.every(index => squares[index] === firstSymbol)) {
            return firstSymbol;
        }
    }
    return null;
}

function checkDraw(squares) {
    return squares.every(square => square !== null);
}

const TicTacToe = () => {
    const { roomName } = useParams();
    const location = useLocation();
    const playerSymbol = location.state?.symbol;
    const gridSize = location.state?.config?.gridSize || 3;
    const winLength = location.state?.config?.winLength || 3;
    const mapping = {
        "X": location.state?.config?.player1,
        "O": location.state?.config?.player2
    }
    const player1 = mapping["X"];
    const player2 = mapping["O"];
    const { messages, send } = useWebSocket();
    
    const [board, setBoard] = useState(Array(gridSize * gridSize).fill(null));
    const [turn, setTurn] = useState("X");
    const [winner, setWinner] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [showWinnerPopup, setShowWinnerPopup] = useState(false);
    const [isDraw, setIsDraw] = useState(false);
    const [hint, setHint] = useState("");
    const [isFetchingHint, setIsFetchingHint] = useState(false);
    const winningLines = generateWinningLines(gridSize, winLength);
    
    useEffect(() => {
        if (!messages.length) return;
        const latestMessage = messages[messages.length - 1];

        if (latestMessage === lastMessage) return;
        setLastMessage(latestMessage);

        if (typeof latestMessage === "object") {
            if (latestMessage.type === "move") {
                const { index, symbol } = latestMessage.message;
                if (playerSymbol !== symbol) {
                    handleMove(index, symbol);
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
    
    const handleMove = (index, symbol) => {
        if (gameOver || board[index]) return;
        
        const newBoard = [...board];
        newBoard[index] = symbol;
        
        setBoard(newBoard);
        
        const newWinner = calculateWinner(newBoard, winningLines);
        if (newWinner) {
            setWinner(newWinner);
            setGameOver(true);
        } else if (checkDraw(newBoard)) {
            setGameOver(true);
            setIsDraw(true);
        } else {
            setTurn(turn === "X" ? "O" : "X");
        }
    };
    
    const handleClick = (index) => {
        console.log("Clicked index:", index);
        console.log("Current player:", playerSymbol);
        console.log("Turn:", turn);
        if (board[index] || gameOver || playerSymbol !== turn) return;
        handleMove(index, playerSymbol);
        send({ type: "move", message: { index: index, symbol: playerSymbol } });
    };
    
    const resetGame = () => {
        setBoard(Array(gridSize * gridSize).fill(null));
        setTurn("X");
        setWinner(null);
        setGameOver(false);
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

    const requestHint = async () => {
        setHint("");
        setIsFetchingHint(true);
        const baseURL = import.meta.env.VITE_FLASK_API;

        const response = await fetch(`${baseURL}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                grid: board,
                symbol: playerSymbol,
                win_length: winLength,
                grid_length: gridSize
            }),
        });

        if (!response.ok) {
            setHint("Failed to fetch hint.");
            setIsFetchingHint(false);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let accumulatedHint = "";

        const readStream = async () => {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                
                chunk.split("\n").forEach((line) => {
                    if (line.startsWith("data:")) {
                        try {
                            const jsonData = JSON.parse(line.replace("data:", "").trim());
                            accumulatedHint += jsonData.text + " ";
                            setHint(accumulatedHint);
                        } catch (e) {
                            console.error("Error parsing hint:", e);
                        }
                    }
                });
            }
            setIsFetchingHint(false);
        };

        readStream();
    };

    return (
        <div className="tictactoe-container">
            <div className="game-section">
                <h1 className="game-title">Tic Tac Toe - Room: {roomName}</h1>

                <div
                className="board"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 100px)` }}
                >
                {board.map((cell, index) => {
                    let symbolToRender = mapping[cell]?.startsWith("data:image")
                    ? <img src={mapping[cell]} alt="P1" className="symbol-img" />
                    : mapping[cell];

                    return (
                    <button
                        key={index}
                        onClick={() => handleClick(index)}
                        className="cell-button"
                    >
                        {symbolToRender}
                    </button>
                    );
                })}
                </div>

                <h2>
                You are: {
                    mapping[playerSymbol]?.startsWith("data:image")
                    ? <img src={mapping[playerSymbol]} alt="You" className="inline-symbol" />
                    : playerSymbol
                }
                </h2>

                <h3 className="turn-info">
                {winner ? (
                    <>
                    Winner:{" "}
                    {mapping[winner]?.startsWith("data:image")
                        ? <img src={mapping[winner]} alt="Winner" className="inline-symbol" />
                        : mapping[winner]
                    }
                    </>
                ) : (
                    <>
                    {turn === "X" ? (
                        <>
                        {mapping["X"]?.startsWith("data:image")
                            ? <img src={mapping["X"]} alt="X" className="inline-symbol" />
                            : "X"
                        }
                        's turn
                        </>
                    ) : (
                        <>
                        {mapping["O"]?.startsWith("data:image")
                            ? <img src={mapping["O"]} alt="O" className="inline-symbol" />
                            : "O"
                        }
                        's turn
                        </>
                    )}
                    </>
                )}
                </h3>

                {gameOver && (
                <button onClick={handleReplay} className="replay-button">
                    Play Again
                </button>
                )}

                {showWinnerPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                    <h2>{isDraw ? "It's a Draw!" : `Player ${winner} Wins!`}</h2>
                    <div className="popup-buttons">
                        <button onClick={handleReplay} className="play-again">
                        Play Again
                        </button>
                        <button onClick={closePopup} className="close">
                        Close
                        </button>
                    </div>
                    </div>
                </div>
                )}
            </div>

            <div className="hint-section">
                <button
                onClick={requestHint}
                disabled={isFetchingHint}
                className="hint-button"
                >
                {isFetchingHint ? "Fetching Hint..." : "Get Hint"}
                </button>
                <div className="hint-text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {hint || "No hints available yet."}
                </ReactMarkdown>
                </div>
            </div>
            </div>

    );
};

export default TicTacToe;