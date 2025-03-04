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

  // Efecto para detectar cuando tenemos un socket conectado y listo para crear una sala
  useEffect(() => {
    if (socketReady && !roomCode && !isConnecting) {
      setReadyToCreateRoom(true);
    } else {
      setReadyToCreateRoom(false);
    }
  }, [socketReady, roomCode, isConnecting]);

  // Crear sala cuando el socket esté listo
  useEffect(() => {
    if (readyToCreateRoom) {
      console.log('Socket listo, creando sala temporal...');
      // Crear una sala temporal con categoría por defecto
      const tempCategory = { id: 'temp', name: 'Temporary' };
      createRoom(tempCategory, 'Host'); // Nickname por defecto para el host
      setIsLoading(true);
      setReadyToCreateRoom(false); // Para evitar múltiples creaciones
    }
  }, [readyToCreateRoom, createRoom]);

  // Efecto para detectar cuando se une un controlador
  useEffect(() => {
    if (players.length > 1) {
      setHasNewController(true);
    }
  }, [players]);

  // Efecto para manejar cambios en el estado del juego
  useEffect(() => {
    if (gameStatus === 'selection' && roomCode) {
      console.log(
        `✅ Estado del juego cambiado a 'selection', navegando a /selection/${roomCode}`
      );
      navigate(`/selection/${roomCode}`);
    }
  }, [gameStatus, roomCode, navigate]);

  // Manejar error de conexión
  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      setIsLoading(false);
    }
  }, [connectionError]);

  // Efecto para actualizar el estado de carga cuando tenemos un código de sala
  useEffect(() => {
    if (roomCode) {
      setIsLoading(false);
    }
  }, [roomCode]);

  // Escuchar eventos del socket específicos para este componente
  useEffect(() => {
    if (!socket) return;

    // Manejar evento de controlador unido
    const handleControllerJoined = (data) => {
      console.log('📱 Controller joined event in EntryCodeScreen:', data);

      // Si somos host y se unió un controlador
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
