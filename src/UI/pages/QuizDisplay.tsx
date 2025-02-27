import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../../context/QuixContext';
import { motion } from 'framer-motion';
import { GameStatus } from '../../types/player';

const QuizDisplay: React.FC = () => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameStatus>('setup');
  const [nickname, setNickname] = useState<string>('');

  const {
    roomCode,
    players,
    createRoom,
    joinRoom,
    connectionError,
    socket, // Asegúrate de que useQuiz expone el socket
  } = useQuiz();

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

  // Escuchar evento game_started
  useEffect(() => {
    if (!socket) return;

    socket.on('game_started', (data) => {
      console.log('⚠️⚠️⚠️ GAME STARTED EVENT RECEIVED IN SPA:', data);
      console.log('⚠️⚠️⚠️ Current location:', window.location.href);

      // Navegar de forma directa
      navigate(`/game/${roomCode}`);
    });

    return () => {
      socket.off('game_started');
    };
  }, [socket, navigate, roomCode]);

  // Handle form submission to join a room
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlRoomCode && nickname.trim()) {
      joinRoom(urlRoomCode, nickname.trim());
    }
  };

  const handleStartExperience = () => {
    // Redirect to category selection instead of directly creating a room
    navigate('/categories');
  };

  // Display connection error
  if (connectionError) {
    return (
      <motion.div
        className='error-screen'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Connection Error</h2>
        <p>{connectionError}</p>
        <motion.button
          className='quiz-button'
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Retry Connection
        </motion.button>
      </motion.div>
    );
  }

  // Display setup screen (redirect to category selection)
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
          onClick={handleStartExperience}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Quiz Experience
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

  // Redirect to waiting room if in 'waiting' state
  if (gameState === 'waiting' && roomCode) {
    navigate(`/room/${roomCode}`);
    return null;
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
