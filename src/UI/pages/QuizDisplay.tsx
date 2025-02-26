import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizSocket } from '../../hooks/useQuizSocket';
import { Player, PlayerAnswer, GameStatus } from '../../types/player';
import { motion } from 'framer-motion';

const QuizDisplay: React.FC = () => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameStatus>('setup');
  const [nickname, setNickname] = useState<string>('');
  const {
    roomCode,
    players,
    playerAnswers,
    createRoom,
    joinRoom,
    startGame,
    isHost,
  } = useQuizSocket();

  // Redirect to game when room code is available
  useEffect(() => {
    if (roomCode) {
      setGameState('waiting');
      if (urlRoomCode !== roomCode) {
        navigate(`/room/${roomCode}`, { replace: true });
      }
    }
  }, [roomCode, navigate, urlRoomCode]);

  // Handle joining with existing room code in URL
  useEffect(() => {
    if (urlRoomCode && urlRoomCode !== roomCode && gameState === 'setup') {
      setGameState('joining');
    }
  }, [urlRoomCode, roomCode, gameState]);

  // Handle form submission to join a room
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlRoomCode && nickname.trim()) {
      joinRoom(urlRoomCode, nickname.trim());
    }
  };

  // Handle start game (host only)
  const handleStartGame = () => {
    if (isHost && players.length >= 1) {
      startGame();
      // navigate(`/game/${roomCode}`);
      navigate('/game/test123');
    }
  };
  // Display setup screen (create a room)
  if (gameState === 'setup') {
    return (
      <motion.div
        className='setup-screen'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Music Quiz Challenge</h1>
        <p>Create a new room to play with friends</p>
        <motion.button
          className='quiz-button'
          onClick={createRoom}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create Room
        </motion.button>
      </motion.div>
    );
  }

  // Display join screen (enter nickname)
  if (gameState === 'joining') {
    return (
      <motion.div
        className='join-screen'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Join Music Quiz</h1>
        <div className='room-code-display'>
          Room Code: <span>{urlRoomCode}</span>
        </div>
        <form onSubmit={handleJoinRoom}>
          <div className='input-group'>
            <label htmlFor='nickname'>Your Nickname</label>
            <input
              type='text'
              id='nickname'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder='Enter your nickname'
              maxLength={20}
              required
            />
          </div>
          <motion.button
            type='submit'
            className='quiz-button'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!nickname.trim()}
          >
            Join Game
          </motion.button>
        </form>
      </motion.div>
    );
  }

  // Display waiting room
  if (gameState === 'waiting') {
    return (
      <div className='waiting-room'>
        <h1 className='title'>Waiting Room</h1>
        <div className='room-code'>
          <h2 className='subtitle'>Room Code</h2>
          <div className='code-display'>{roomCode}</div>
          <p>Share this code with your friends</p>
        </div>

        <div className='players-list'>
          <h2 className='subtitle'>Players ({players.length})</h2>
          <div className='players-grid'>
            {players.map((player: Player) => (
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
              <p className='waiting-message'>
                At least 1 player needed to start
              </p>
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
  }

  // Fallback for unexpected state
  return (
    <div className='error-screen'>
      <h2>Something went wrong</h2>
      <p>Unhandled game state: {gameState}</p>
      <button
        onClick={() => {
          setGameState('setup');
          navigate('/quiz');
        }}
        className='quiz-button'
      >
        Back to Home
      </button>
    </div>
  );
};

export default QuizDisplay;
