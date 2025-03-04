'use client';

import type React from 'react';
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import io, { type Socket } from 'socket.io-client';
import { QuizContextType } from '../types/quizContextType';
import { GameStatus, Player, Question } from '../types/player';

// Configuración del socket - cambia la URL según tu entorno
const SERVER_URL = 'http://192.168.1.10:3000'; // Ajusta esta IP a la de tu servidor

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Define the provider component
export const QuizProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketReady, setSocketReady] = useState<boolean>(false); // Nuevo estado para rastrear cuando el socket está listo
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState<
    string | null
  >(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<any[] | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [playerAnswers, setPlayerAnswers] = useState<Record<string, string>>(
    {}
  );
  const [gameResults, setGameResults] = useState<any | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const navigate = useNavigate();

  // Inicializar la conexión socket
  useEffect(() => {
    console.log('Intentando conectar al servidor:', SERVER_URL);
    setIsConnecting(true);

    try {
      // Crear una nueva instancia de socket
      const newSocket = io(SERVER_URL, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        path: '/socket.io',
      });

      // Registrar eventos de conexión
      newSocket.on('connect', () => {
        console.log('✅ Conectado al servidor Socket.IO:', {
          id: newSocket.id,
          connected: newSocket.connected,
          transport: newSocket.io.engine.transport.name,
        });
        setConnectionError(null);
        setSocket(newSocket);
        setSocketReady(true); // Marcar el socket como listo
        setIsConnecting(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Error de conexión socket:', error);
        setConnectionError(
          `Error de conexión: ${error.message || 'Error desconocido'}`
        );
        setSocketReady(false);
        setIsConnecting(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn('🔌 Socket desconectado:', reason);
        setSocketReady(false);

        if (reason === 'io server disconnect') {
          // Intento de reconexión manual si el servidor nos desconectó
          setTimeout(() => {
            console.log('Intentando reconectar...');
            newSocket.connect();
          }, 1000);
        }
      });

      // Registrar manejadores de eventos (estos permanecen aunque el socket se reconecte)
      setupEventListeners(newSocket);

      // Función de limpieza
      return () => {
        console.log('Limpiando socket en desmontaje de provider');
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error('Error al inicializar socket:', error);
      setConnectionError(
        `Error de inicialización: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
      setIsConnecting(false);
    }
  }, []);

  // Configurar todos los event listeners del socket
  const setupEventListeners = useCallback(
    (socket: Socket) => {
      // Depuración de todos los eventos
      socket.onAny((event, ...args) => {
        console.log(`[EVENTO SOCKET] ${event}:`, args);
      });

      // Eventos de sala
      socket.on('room_created', (data) => {
        console.log('Sala creada:', data);
        setRoomCode(data.roomCode);
        setIsHost(true);

        if (data.category) {
          setSelectedCategory(data.category);
        }

        if (data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }

        if (data.players && data.players.length > 0) {
          setPlayers(data.players);
        } else {
          setPlayers([{ playerId: socket.id, nickname: 'Host', isHost: true }]);
        }

        setGameStatus('waiting');
        localStorage.setItem('currentRoomCode', data.roomCode);
      });

      socket.on('room_joined', (data) => {
        console.log('Unido a sala:', data);
        setRoomCode(data.roomCode);
        setPlayers(data.players || []);
        setGameStatus('waiting');

        if (data.category) {
          setSelectedCategory(data.category);
        }

        if (data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }

        setIsHost(data.isHost || false);

        if (data.roomCode) {
          localStorage.setItem('currentRoomCode', data.roomCode);
        }
      });

      // Eventos de controlador/jugador
      socket.on('controller_joined', (data) => {
        console.log('🎮 Controlador unido:', data);

        if (data && data.players) {
          setPlayers(data.players);
        } else if (data && data.mobileControllers) {
          setPlayers(data.mobileControllers);
        } else if (data && data.id && data.nickname) {
          setPlayers((prev) => [
            ...prev,
            {
              id: data.id,
              playerId: data.id,
              nickname: data.nickname,
            },
          ]);
        }

        if (isHost) {
          setGameStatus('selection');
        }
      });

      socket.on('player_joined', (player) => {
        console.log('Jugador unido:', player);
        setPlayers((prevPlayers) => [...prevPlayers, player]);
      });

      socket.on('player_left', (data) => {
        console.log('Jugador abandonó:', data);
        setPlayers((prevPlayers) =>
          prevPlayers.filter(
            (player) =>
              player.id !== data.playerId && player.playerId !== data.playerId
          )
        );
      });

      // Eventos de categoría y navegación
      socket.on('category_updated', (data) => {
        console.log('Categoría actualizada:', data);
        setSelectedCategoryType(data.categoryType);
        setSelectedCategory(data.categoryId);
      });

      socket.on('goto_quiz_selection', (data) => {
        console.log('Ir a selección de quiz:', data);
        setGameStatus('selection');

        if (roomCode && navigate) {
          navigate(`/selection/${roomCode}`);
        }
      });

      socket.on('goto_category_selection', (data) => {
        console.log('Ir a selección de categoría:', data);
        setGameStatus('category');
        setSelectedCategoryType(data.categoryType);

        if (roomCode && data.categoryType && navigate) {
          navigate(`/categories/${data.categoryType}/${roomCode}`);
        }
      });

      // Eventos de estado del juego
      socket.on('game_started', (data) => {
        console.log('🚀 Juego iniciado:', data);

        if (data.category) {
          setSelectedCategory(data.category);
        }

        if (data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }

        setGameStatus('playing');

        const recoveryRoomCode =
          data.roomCode || roomCode || localStorage.getItem('currentRoomCode');
        const isSelectionFlow =
          gameStatus === 'selection' ||
          gameStatus === 'category' ||
          window.location.pathname.includes('/selection/') ||
          window.location.pathname.includes('/categories/');

        if (!isSelectionFlow && recoveryRoomCode && navigate) {
          navigate(`/game/${recoveryRoomCode}`);
        }
      });

      socket.on('new_question', (data) => {
        console.log('Nueva pregunta:', data);

        if (data.question) {
          setCurrentQuestion(data.question);
        }

        if (data.options) {
          if (Array.isArray(data.options)) {
            setOptions(data.options);
          } else if (typeof data.options === 'object') {
            const optionsArray = Object.entries(data.options).map(
              ([id, text]) => ({
                id,
                text,
              })
            );
            setOptions(optionsArray);
          }
        }

        setTimeRemaining(data.timeLimit || 30);
        setPlayerAnswers({});
      });

      socket.on('timer_update', (remainingTime) => {
        setTimeRemaining(remainingTime);
      });

      socket.on('player_answered', (data) => {
        console.log('Jugador respondió:', data);

        if (data.playerId && data.answer) {
          setPlayerAnswers((prev) => ({
            ...prev,
            [data.playerId]: data.answer,
          }));
        }
      });

      socket.on('game_ended', (data) => {
        console.log('Juego terminado:', data);
        setGameStatus('ended');
        setGameResults(data.results);

        if (roomCode && navigate) {
          navigate(`/results/${roomCode}`);
        }
      });

      // Manejo de errores
      socket.on('error', (error) => {
        console.error('Error de socket recibido:', error);

        if (error && typeof error === 'object' && error.message) {
          setConnectionError(error.message);
        } else if (typeof error === 'string') {
          setConnectionError(error);
        } else {
          setConnectionError('Error desconocido del servidor');
        }
      });
    },
    [roomCode, isHost, gameStatus, navigate]
  );

  // Crear una nueva sala
  const createRoom = useCallback(
    (category: any, nickname?: string) => {
      if (!socket || !socketReady) {
        console.error('Cannot create room: Socket not connected');
        setConnectionError('No se puede crear sala: Socket no conectado');
        return;
      }

      console.log(
        'Creando sala con categoría:',
        category,
        'y nickname:',
        nickname || 'Host'
      );

      socket.emit('create_room', {
        category: category?.id,
        nickname: nickname || 'Host',
      });
    },
    [socket, socketReady]
  );

  // Unirse a una sala existente
  const joinRoom = useCallback(
    (roomCode: string, nickname: string) => {
      if (!socket || !socketReady) {
        console.error('Cannot join room: Socket not connected');
        setConnectionError('No se puede unir a sala: Socket no conectado');
        return;
      }

      if (!roomCode || !nickname) {
        console.error('Room code and nickname are required');
        setConnectionError('El código de sala y nickname son obligatorios');
        return;
      }

      console.log(`Uniéndose a sala ${roomCode} como ${nickname}`);

      // Guardar código antes de unirse
      localStorage.setItem('currentRoomCode', roomCode);

      socket.emit('join_room', { roomCode, nickname });
    },
    [socket, socketReady]
  );

  // Abandonar la sala actual
  const leaveRoom = useCallback(() => {
    if (!socket || !socketReady || !roomCode) {
      console.error('Cannot leave room: Socket not connected or no room code');
      return;
    }

    console.log('Abandonando sala:', roomCode);
    socket.emit('leave_room', { roomCode });

    // Resetear estado
    setRoomCode(null);
    setPlayers([]);
    setIsHost(false);
    setGameStatus('setup');
    setSelectedCategory(null);
    setSelectedCategoryType(null);
    setCurrentQuestion(null);
    setOptions(null);
    setTimeRemaining(30);
    setPlayerAnswers({});
    setGameResults(null);

    // Limpiar localStorage
    localStorage.removeItem('currentRoomCode');

    // Navegar a inicio
    if (navigate) {
      navigate('/');
    }
  }, [socket, socketReady, roomCode, navigate]);

  // Actualizar tipo de categoría
  const updateCategory = useCallback(
    (roomCode: string, categoryType: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot update category: Socket not connected or no room code'
        );
        return;
      }

      console.log('Actualizando tipo de categoría:', categoryType);
      setSelectedCategoryType(categoryType);

      socket.emit('update_category_type', {
        roomCode,
        categoryType,
      });
    },
    [socket, socketReady]
  );

  // Actualizar categoría y tipo
  const updateRoomCategory = useCallback(
    (roomCode: string, categoryType: string, categoryId: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot update room category: Socket not connected or no room code'
        );
        return;
      }

      console.log('Actualizando categoría de sala:', categoryType, categoryId);

      socket.emit('update_room_category', {
        roomCode,
        categoryType,
        categoryId,
      });
    },
    [socket, socketReady]
  );

  // Seleccionar tipo de quiz
  const selectQuizType = useCallback(
    (roomCode: string, quizType: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot select quiz type: Socket not connected or no room code'
        );
        return;
      }

      console.log('Seleccionando tipo de quiz:', quizType);

      socket.emit('select_quiz_type', {
        roomCode,
        quizType,
      });
    },
    [socket, socketReady]
  );

  // Seleccionar categoría específica
  const selectCategory = useCallback(
    (roomCode: string, categoryId: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot select category: Socket not connected or no room code'
        );
        return;
      }

      console.log('Seleccionando categoría:', categoryId);

      socket.emit('select_category', {
        roomCode,
        categoryId,
      });
    },
    [socket, socketReady]
  );

  // Iniciar el juego (solo host)
  const startGame = useCallback(
    (roomCode: string, categoryId?: string, categoryType?: string) => {
      if (!socket || !socketReady) {
        console.error('Cannot start game: Socket not connected');
        return;
      }

      if (!isHost) {
        console.error('Only the host can start the game');
        return;
      }

      console.log('Iniciando juego:', { roomCode, categoryId, categoryType });

      socket.emit('start_game', {
        roomCode,
        categoryId: categoryId || selectedCategory,
        categoryType: categoryType || selectedCategoryType,
      });
    },
    [socket, socketReady, isHost, selectedCategory, selectedCategoryType]
  );

  // Enviar respuesta a pregunta
  const submitAnswer = useCallback(
    (answer: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot submit answer: Socket not connected or no room code'
        );
        return;
      }

      console.log('Enviando respuesta:', answer);

      socket.emit('submit_answer', { roomCode, answer });
    },
    [socket, socketReady, roomCode]
  );

  // Proporcionar valores y funciones a los consumidores del contexto
  const value = {
    socket,
    roomCode,
    players,
    isHost,
    connectionError,
    gameStatus,
    selectedCategory,
    selectedCategoryType,
    currentQuestion,
    options,
    timeRemaining,
    playerAnswers,
    gameResults,
    socketReady,
    isConnecting,

    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
    setGameStatus,
    updateCategory,
    updateRoomCategory,
    selectQuizType,
    selectCategory,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

// Custom hook para usar el QuizContext
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export default QuizContext;
