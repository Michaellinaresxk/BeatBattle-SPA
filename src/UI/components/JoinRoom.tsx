import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuiz } from '../../context/QuixContext';

const JoinRoom = () => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  const { joinRoom, roomCode, connectionError, gameStatus } = useQuiz();

  const [nickname, setNickname] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState(urlRoomCode || '');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roomCode) {
      navigate(`/selection/${roomCode}`);
    }
  }, [roomCode, navigate]);

  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      setIsJoining(false);
    }
  }, [connectionError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }

    if (!inputRoomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setError(null);
    setIsJoining(true);

    joinRoom(inputRoomCode.trim(), nickname.trim());
  };

  return (
    <div className='join-room-container'>
      <motion.div
        className='join-card'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Join to the Room</h1>
        <p>Enter the room code and your nickname to join the game</p>

        {error && (
          <motion.div
            className='error-message'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className='input-group'>
            <label htmlFor='roomCode'>Código de Sala</label>
            <input
              type='text'
              id='roomCode'
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value)}
              placeholder='Enter the room code'
              maxLength={6}
              required
              disabled={Boolean(urlRoomCode)}
            />
          </div>

          <div className='input-group'>
            <label htmlFor='nickname'>Your Nickname</label>
            <input
              type='text'
              id='nickname'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder='Place your nickname'
              maxLength={20}
              required
            />
          </div>

          <motion.button
            type='submit'
            className='join-button'
            disabled={isJoining || !nickname.trim() || !inputRoomCode.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isJoining ? (
              <>
                <span className='loading-spinner'></span>
                Joining the game...
              </>
            ) : (
              'Joining the game'
            )}
          </motion.button>
        </form>

        <div className='or-divider'>
          <span>O</span>
        </div>

        <motion.button
          className='create-room-button'
          onClick={() => navigate('/room')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create a new game
        </motion.button>

        <motion.button
          className='back-to-home'
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default JoinRoom;
