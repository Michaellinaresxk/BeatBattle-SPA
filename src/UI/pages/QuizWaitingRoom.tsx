import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizSocket } from '../../hooks/useQuizSocket';

const QuizWaitingRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { players, isHost, startGame, selectedCategory } = useQuizSocket();

  // Handle start game (host only)
  const handleStartGame = () => {
    if (isHost && players.length >= 1) {
      startGame();
      navigate(`/game/${roomCode}`);
    }
  };

  // Get category name from id
  const getCategoryName = (categoryId) => {
    const categories = {
      'rock-70': 'Rock - 70s',
      'rock-80': 'Rock - 80s',
      'rock-90': 'Rock - 90s',
      funk: 'Funk',
      rap: 'Rap',
      ballads: 'Ballads',
      latin: 'Latin Music',
      pop: 'Pop Hits',
    };

    return categories[categoryId] || 'Music Quiz';
  };

  return (
    <div className='waiting-room'>
      <h1 className='title'>
        {getCategoryName(selectedCategory)}
        <span className='subtitle'>Waiting Room</span>
      </h1>

      <div className='room-code'>
        <h2 className='subtitle'>Room Code</h2>
        <div className='code-display'>{roomCode}</div>
        <p>Share this code with your friends</p>
      </div>

      <div className='players-list'>
        <h2 className='subtitle'>Players ({players.length})</h2>
        <div className='players-grid'>
          {players.map((player) => (
            <motion.div
              key={player.playerId}
              className='player-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='player-avatar'>
                {player.nickname.charAt(0).toUpperCase()}
              </div>
              <p className='player-name'>
                {player.nickname} {player.isHost ? '(Host)' : ''}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Start game button (visible only to host) */}
      {isHost && (
        <motion.div
          className='start-game-container'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.button
            className='start-game-button'
            onClick={handleStartGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={players.length < 1}
          >
            {players.length < 1 ? 'Wait for players to join' : 'Start Game'}
          </motion.button>
          {players.length < 1 && (
            <p className='waiting-message'>At least 1 player needed to start</p>
          )}
        </motion.div>
      )}

      {/* Message for non-host players */}
      {!isHost && (
        <div className='waiting-for-host'>
          <p>Waiting for the host to start the game...</p>
          <div className='loading-dots'>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizWaitingRoom;
