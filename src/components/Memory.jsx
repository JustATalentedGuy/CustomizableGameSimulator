import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from "react-router-dom";
import { useWebSocket } from "./WebsocketContext";
import { motion } from "framer-motion";
import "./Memory.css";

const MemoryGame = () => {
  const { roomName } = useParams();
  const location = useLocation();
  const cards = location.state?.cards;
  
  const playerNum = location.state?.symbol;
  const numPairs = location.state?.config.numPairs;
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const { messages, send } = useWebSocket();
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    console.log("Flipped indices:", flippedIndices);
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      if (cards[first].pairId === cards[second].pairId) {
        console.log("Matched");
        setMatchedIndices(prev => [...prev, first, second]);
        setScores(prev => ({
          ...prev,
          [currentPlayer]: prev[currentPlayer] + 1,
        }));
        setTimeout(() => setFlippedIndices([]), 1000);
      } else {
        setTimeout(() => {
          setCurrentPlayer(prev => (prev === 1 ? 2 : 1));
          setFlippedIndices([]);
        }, 1000);
      }
    }
  }, [flippedIndices, cards, currentPlayer]);  

  useEffect(() => {
    if (!messages.length) return;
    const latestMessage = messages[messages.length - 1];

    if (latestMessage === lastMessage) return;
    setLastMessage(latestMessage);

    if (typeof latestMessage === "object") {
        if (latestMessage.type === "move") {
            const { index, symbol } = latestMessage.message;
            if (symbol === playerNum) return;
            setFlippedIndices(prev => [...prev, index]);
        }
    }
  }, [messages]);


  const handleCardClick = (index) => {
    if (
      flippedIndices.includes(index) ||
      matchedIndices.includes(index) ||
      currentPlayer !== playerNum ||
      flippedIndices.length === 2
    ) {
      return;
    }
    if (flippedIndices.length < 2) {
      send({ type: "move", message: { index, symbol: playerNum } });
      setFlippedIndices(flippedIndices => [...flippedIndices, index]);
    }
  };

  const getGridSize = (count) => {
    const sqrt = Math.floor(Math.sqrt(count));
    for (let i = sqrt; i >= 1; i--) {
      if (count % i === 0) return [i, count / i];
    }
    return [1, count];
  };

  const [rows, cols] = getGridSize(cards.length);

  // Constants
  const padding = 32; // adjust for margins
  const maxWidth = window.innerWidth - padding;
  const maxHeight = window.innerHeight - padding;

  const cardWidth = Math.floor(maxWidth / cols);
  const cardHeight = Math.floor(maxHeight / rows);
  const cardSize = Math.min(cardWidth, cardHeight);

  return (
    <div className="memory-container">
      <h1 className="memory-title">Memory Match Game</h1>
      <p>{playerNum === currentPlayer ? "Your Turn" : "Opponent's Turn"}</p>
      <div className="scoreboard">
        <p>Your Score: {scores[playerNum]}</p>
        <p>Opponent Score: {scores[playerNum === 1 ? 2 : 1]}</p>
      </div>
      <div
        className="memory-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cardSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cardSize}px)`,
          gap: '10px'
        }}
      >
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx) || matchedIndices.includes(idx);
          return (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className="memory-card"
              whileTap={{ scale: 0.95 }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ width: `${cardSize}px`, height: `${cardSize}px` }}
            >
              <div className={`memory-card-inner ${isFlipped ? 'memory-card-back' : 'memory-card-front'}`}>
                {isFlipped ? (
                  <img src={card.img} alt="Card" />
                ) : (
                  <div>?</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      {matchedIndices.length === cards.length && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Your Score: {scores[playerNum]}</p>
          <p>Opponent Score: {scores[playerNum === 1 ? 2 : 1]}</p>
          <p>{
              scores[playerNum] > scores[playerNum === 1 ? 2 : 1]
                ? 'You Win'
                : scores[playerNum] < scores[playerNum === 1 ? 2 : 1]
                ? 'You Lose'
                : 'Draw!'
            }
          </p>
        </div>
      )}
    </div>
  );  
};

export default MemoryGame;