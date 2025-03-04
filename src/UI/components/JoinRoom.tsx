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

  // Si ya hay un roomCode en el contexto, navegar a la selección de categoría
  useEffect(() => {
    if (roomCode) {
      // En lugar de ir directamente al juego, ir a la selección de tipo de juego
      navigate(`/selection/${roomCode}`);
    }
  }, [roomCode, navigate]);

  // Mostrar error de conexión si existe
  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      setIsJoining(false);
    }
  }, [connectionError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!nickname.trim()) {
      setError('Por favor ingresa tu nickname');
      return;
    }

    if (!inputRoomCode.trim()) {
      setError('Por favor ingresa un código de sala');
      return;
    }

    setError(null);
    setIsJoining(true);

    // Intentar unirse a la sala
    joinRoom(inputRoomCode.trim(), nickname.trim());

    // La redirección se maneja en el useEffect que monitorea roomCode
  };

  return (
    <div className='join-room-container'>
      <motion.div
        className='join-card'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Unirse a una Sala</h1>
        <p>Ingresa el código de sala y tu nickname para unirte al juego</p>

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
              placeholder='Ingresa el código de sala'
              maxLength={6}
              required
              disabled={Boolean(urlRoomCode)}
            />
          </div>

          <div className='input-group'>
            <label htmlFor='nickname'>Tu Nickname</label>
            <input
              type='text'
              id='nickname'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder='Ingresa tu nickname'
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
                Uniéndose al juego...
              </>
            ) : (
              'Unirse al Juego'
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
          Crear un Nuevo Juego
        </motion.button>

        <motion.button
          className='back-to-home'
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Volver al Inicio
        </motion.button>
      </motion.div>
    </div>
  );
};

export default JoinRoom;
