import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuixContext';

const EntryCodeScreen = () => {
  const navigate = useNavigate();
  const {
    players,
    isHost,
    createRoom,
    roomCode,
    socket,
    gameStatus,
    setGameStatus,
    connectionError,
    socketReady,
    isConnecting,
  } = useQuiz();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNewController, setHasNewController] = useState(false);
  const [readyToCreateRoom, setReadyToCreateRoom] = useState(false);

  useEffect(() => {
    if (socketReady && !roomCode && !isConnecting) {
      setReadyToCreateRoom(true);
    } else {
      setReadyToCreateRoom(false);
    }
  }, [socketReady, roomCode, isConnecting]);

  useEffect(() => {
    if (readyToCreateRoom) {
      console.log('Socket listo, creando sala temporal...');
      const tempCategory = { id: 'temp', name: 'Temporary' };
      createRoom(tempCategory, 'Host');
      setIsLoading(true);
      setReadyToCreateRoom(false);
    }
  }, [readyToCreateRoom, createRoom]);

  useEffect(() => {
    if (players && players.length > 1) {
      setHasNewController(true);
    }
  }, [players]);

  useEffect(() => {
    if (gameStatus === 'selection' && roomCode) {
      console.log(
        `✅ Estado del juego cambiado a 'selection', navegando a /selection/${roomCode}`
      );
      navigate(`/selection/${roomCode}`);
    } else if (gameStatus === 'playing' && roomCode) {
      const currentPath = window.location.pathname;

      if (
        !currentPath.includes('/game/') &&
        !currentPath.includes('/selection/') &&
        !currentPath.includes('/categories/')
      ) {
        console.log(
          `⚠️ Estado del juego es 'playing' pero no hemos seleccionado, redirigiendo a selección`
        );
        navigate(`/selection/${roomCode}`);
      }
    }
  }, [gameStatus, roomCode, navigate]);

  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      setIsLoading(false);
    }
  }, [connectionError]);

  useEffect(() => {
    if (roomCode) {
      setIsLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!socket) return;

    const handleControllerJoined = (data) => {
      console.log('📱 Controller joined event in EntryCodeScreen:', data);

      if (isHost) {
        console.log('🔔 Controlador conectado y somos host, destacando botón');
        setHasNewController(true);
      }
    };

    socket.on('controller_joined', handleControllerJoined);

    return () => {
      socket.off('controller_joined', handleControllerJoined);
    };
  }, [socket, isHost]);

  // Función para copiar el código al portapapeles
  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard
        .writeText(roomCode)
        .then(() => {
          console.log('Código copiado al portapapeles');
        })
        .catch((err) => {
          console.error('Error al copiar:', err);
        });
    }
  };

  // Mostrar estado de conexión del socket
  const renderSocketStatus = () => {
    if (isConnecting) {
      return (
        <p className='socket-status connecting'>Conectando al servidor...</p>
      );
    } else if (socketReady) {
      return <p className='socket-status connected'>Conectado al servidor</p>;
    } else {
      return (
        <p className='socket-status disconnected'>Desconectado del servidor</p>
      );
    }
  };

  // Mostrar pantalla de carga mientras se solicita el código
  if (isLoading) {
    return (
      <div className='loading-screen'>
        <div className='loading-spinner'></div>
        {isConnecting ? (
          <p>Conectando al servidor...</p>
        ) : socketReady ? (
          <p>Generando código de sala...</p>
        ) : (
          <p>Esperando conexión...</p>
        )}
      </div>
    );
  }

  // Mostrar mensaje de error si ocurrió algún problema
  if (error) {
    return (
      <div className='error-screen'>
        <h2>Error de conexión</h2>
        <p>{error}</p>
        <button
          className='retry-button'
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Mostrar el código de sala una vez generado
  return (
    <div className='waiting-room'>
      <motion.div
        className='waiting-room-card'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className='title'>Sala Creada Exitosamente</h1>

        {/* Mostrar estado de la conexión */}
        {renderSocketStatus()}

        <div className='room-code'>
          <h2 className='subtitle'>Código de Sala</h2>
          <h2 className='code-display'>{roomCode}</h2>
          <motion.button
            className='copy-button'
            onClick={handleCopyCode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Copiar Código
          </motion.button>
          <p>
            Comparte este código con tus amigos para que se unan a la partida
          </p>
        </div>

        <div className='players-list'>
          <h2 className='subtitle'>Jugadores ({players.length})</h2>
          <div className='players-grid'>
            {players.map((player) => (
              <motion.div
                key={player.id || player.playerId}
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
      </motion.div>
    </div>
  );
};

export default EntryCodeScreen;
