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
      navigate(`/selection/${roomCode}`);
    } else if (gameStatus === 'playing' && roomCode) {
      const currentPath = window.location.pathname;

      if (
        !currentPath.includes('/game/') &&
        !currentPath.includes('/selection/') &&
        !currentPath.includes('/categories/')
      ) {
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
        console.log(
          '🔔 Controller connected and we are host, highlighting button'
        );
        setHasNewController(true);
      }
    };

    socket.on('controller_joined', handleControllerJoined);

    return () => {
      socket.off('controller_joined', handleControllerJoined);
    };
  }, [socket, isHost]);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard
        .writeText(roomCode)
        .then(() => {
          console.log('Code copied to clipboard');
        })
        .catch((err) => {
          console.error('Error while copying:', err);
        });
    }
  };

  const renderSocketStatus = () => {
    if (isConnecting) {
      return (
        <p className='socket-status connecting'>Connecting to the server...</p>
      );
    } else if (socketReady) {
      return (
        <p className='socket-status connected'>Connecting to the server...</p>
      );
    } else {
      return (
        <p className='socket-status disconnected'>
          Connecting to the server...
        </p>
      );
    }
  };

  if (isLoading) {
    return (
      <div className='loading-screen'>
        <div className='loading-spinner'></div>
        {isConnecting ? (
          <p>Connecting to the server...</p>
        ) : socketReady ? (
          <p>Generating room code...</p>
        ) : (
          <p>Waiting for connection...</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className='error-screen'>
        <h2>Connection error</h2>
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

  return (
    <div className='waiting-room'>
      <motion.div
        className='waiting-room-card'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className='title'>Successfully Created Room</h1>

        {renderSocketStatus()}

        <div className='room-code'>
          <h2 className='subtitle'>Room Code</h2>
          <h2 className='code-display'>{roomCode}</h2>
          <motion.button
            className='copy-button'
            onClick={handleCopyCode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Copy Code
          </motion.button>
          <p>Share this code with your friends to join the game</p>
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
