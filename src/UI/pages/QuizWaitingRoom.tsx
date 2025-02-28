import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../../context/QuixContext';

const QuizWaitingRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const {
    players,
    isHost,
    startGame,
    selectedCategory,
    socket,
    gameStatus,
    setGameStatus,
  } = useQuiz();

  // Para depuración
  const [debugLog, setDebugLog] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog((prev) => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
    console.log(`⚠️ ${message}`);
  };

  // Escuchar el evento game_started
  useEffect(() => {
    if (!socket) {
      addLog('Socket no disponible en QuizWaitingRoom');
      return;
    }

    addLog(`Configurando listener para game_started en sala ${roomCode}`);

    const handleGameStarted = (data) => {
      addLog(`¡Evento game_started recibido! ${JSON.stringify(data)}`);

      // Actualizar estado del juego
      if (typeof setGameStatus === 'function') {
        setGameStatus('playing');
      }

      // Navegar a la pantalla del juego
      addLog(`Navegando a /game/${roomCode}`);
      navigate(`/game/${roomCode}`);
    };

    socket.on('game_started', handleGameStarted);

    // También navegar si el estado del juego cambia
    if (gameStatus === 'playing') {
      addLog('Estado del juego es "playing", navegando...');
      navigate(`/game/${roomCode}`);
    }

    return () => {
      addLog('Limpiando listener de game_started');
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, roomCode, navigate, gameStatus, setGameStatus]);

  // Handle start game (host only)
  const handleStartGame = () => {
    if (isHost && players.length >= 1) {
      addLog('Host iniciando juego...');
      startGame();
      // La navegación se hará cuando se reciba el evento game_started
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

      {/* Debug logs (mostrar solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className='debug-panel'
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            maxWidth: '80%',
            fontSize: '12px',
          }}
        >
          <h4>Debug Logs:</h4>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizWaitingRoom;
