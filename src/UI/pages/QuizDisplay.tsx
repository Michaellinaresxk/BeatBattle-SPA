// En components/QuizDisplay.jsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';

const SERVER_URL = 'http://192.168.1.10:5000'; // Actualiza con la IP de tu servidor

function QuizDisplay() {
  const { roomCode: urlRoomCode } = useParams();
  const [playerAnswers, setPlayerAnswers] = useState({});
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [gameState, setGameState] = useState('setup'); // setup, waiting, playing, finished
  const [players, setPlayers] = useState([]);

  // Conectar al servidor
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(
        '⭐ Conectado con éxito al servidor via WebSockets:',
        newSocket.id
      );
      console.log('Protocolo de conexión:', newSocket.io.engine.transport.name);

      // Enviar un ping al servidor para verificar comunicación bidireccional
      newSocket.emit('ping_test', { client: 'SPA', timestamp: Date.now() });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión al servidor:', error.message);
    });

    newSocket.on('pong_test', (data) => {
      console.log('✅ Respuesta recibida del servidor:', data);
      console.log('Tiempo total (ms):', Date.now() - data.originalTimestamp);
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Conectado al servidor con ID:', newSocket.id);
    });

    newSocket.on('player_answered', (data) => {
      console.log('Jugador respondió:', data);
      const { playerId, nickname, answer, correct, points } = data;

      // Actualizar UI para mostrar la respuesta del jugador
      setPlayerAnswers((prev) => ({
        ...prev,
        [playerId]: { nickname, answer, correct, points },
      }));
    });

    // Escuchar evento de creación de sala
    newSocket.on('room_created', (data) => {
      console.log('Sala creada:', data);
      setRoomCode(data.roomCode);
      setGameState('waiting');
      navigate(`/room/${data.roomCode}`, { replace: true });
    });

    // Escuchar cuando un jugador se une
    newSocket.on('player_joined', (data) => {
      console.log('Jugador unido:', data);
      setPlayers((prev) => {
        // Verificar si el jugador ya existe
        const playerExists = prev.some((p) => p.playerId === data.playerId);
        if (playerExists) return prev;
        return [...prev, data];
      });
    });

    // Limpiar al desmontar
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [navigate]);

  // Función para crear sala
  const createRoom = () => {
    if (socket) {
      socket.emit('create_room');
    }
  };

  if (gameState === 'setup') {
    return (
      <div className='setup-screen'>
        <h1>Quiz Game</h1>
        <p>Crea una nueva sala para jugar con amigos</p>
        <button onClick={createRoom}>Crear Sala</button>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className='waiting-room'>
        <h1>Sala de Espera</h1>
        <div className='room-code'>
          <h2>Código de Sala</h2>
          <div className='code-display'>{roomCode}</div>
          <p>Comparte este código con tus amigos</p>
        </div>

        <div className='players-list'>
          <h2>Jugadores ({players.length})</h2>
          <div className='players-grid'>
            {players.map((player) => (
              <div key={player.playerId} className='player-card'>
                <div className='player-avatar'>
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <p className='player-name'>
                  {player.nickname} {player.isHost ? '(Host)' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Añade más renderizaciones para los otros estados (playing, finished)

  return <div>Estado no manejado: {gameState}</div>;
}

export default QuizDisplay;
