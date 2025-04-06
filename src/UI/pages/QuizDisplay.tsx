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
  const [roomInput, setRoomInput] = useState<string>('');

  const {
    roomCode,
    players,
    createRoom,
    joinRoom,
    connectionError,
    socket,
    gameStatus,
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

  // Listen for game status changes
  useEffect(() => {
    console.log('Game status changed:', gameStatus);
    if (gameStatus === 'playing' && roomCode) {
      console.log('Navigating to game with roomCode:', roomCode);
      navigate(`/game/${roomCode}`);
    }
  }, [gameStatus, navigate, roomCode]);

  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data: any) => {
      console.log('⚠️⚠️⚠️ GAME STARTED EVENT RECEIVED IN QuizDisplay:', data);
      console.log('⚠️⚠️⚠️ Current location:', window.location.href);
      console.log('⚠️⚠️⚠️ Current roomCode:', roomCode);

      // Force navigation directly
      if (roomCode) {
        navigate(`/game/${roomCode}`);
      }
    };

    socket.on('game_started', handleGameStarted);

    return () => {
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, navigate, roomCode]);

  // Handle form submission to join a room
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim() && nickname.trim()) {
      joinRoom(roomInput.trim(), nickname.trim());
    }
  };

  // Handle form submission to join with URL room code
  const handleJoinUrlRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlRoomCode && nickname.trim()) {
      joinRoom(urlRoomCode, nickname.trim());
    }
  };

  const handleCreateQuiz = () => {
    // Navigate to main category selection
    navigate('/quiz-selection');
  };

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

  if (gameState === 'setup') {
    return (
      <motion.div
        className='setup-screen'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Music Quiz Challenge</h1>
        <div className='quiz-options'>
          <div className='quiz-option-container'>
            <h2>Join a Quiz</h2>
            <form onSubmit={handleJoinRoom}>
              <div className='input-group'>
                <label htmlFor='roomCode'>Room Code</label>
                <input
                  type='text'
                  id='roomCode'
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder='Enter room code'
                  maxLength={6}
                  required
                />
              </div>
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
                disabled={!roomInput.trim() || !nickname.trim()}
              >
                Join Game
              </motion.button>
            </form>
          </div>

          <div className='quiz-option-divider'>
            <span>OR</span>
          </div>

          <div className='quiz-option-container'>
            <h2>Create a Quiz</h2>
            <p>Start a new quiz session for you and your friends</p>
            <motion.button
              className='quiz-button create-button'
              onClick={handleCreateQuiz}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create New Quiz
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

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
        <form onSubmit={handleJoinUrlRoom}>
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
