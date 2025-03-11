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

const SERVER_URL = 'http://192.168.1.10:3000';

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketReady, setSocketReady] = useState<boolean>(false);
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

  const [currentScreen, setCurrentScreen] = useState<string>('waiting');
  const navigate = useNavigate();

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

  const setupEventListeners = useCallback(
    (socket: Socket) => {
      socket.onAny((event, ...args) => {
        console.log(`[SOCKET EVENT] ${event}:`, args);
      });

      socket.on('room_created', (data) => {
        console.log('Created room:', data);
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
        console.log('Joined to the room:', data);
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

      socket.on('send_controller_command', (data) => {
        console.log('🖥️ Comando de controlador recibido en context:', data);
        socket.emit('controller_command_internal', data);

        if (data.action === 'navigate' && data.screen) {
          if (data.screen === 'selection' && roomCode) {
            navigate(`/selection/${roomCode}`);
          } else if (
            data.screen === 'categories' &&
            roomCode &&
            data.categoryType
          ) {
            navigate(`/categories/${data.categoryType}/${roomCode}`);
          }
        }
      });

      const handleRouteChange = () => {
        const path = window.location.pathname;
        let screen = 'unknown';

        if (path.includes('/selection/')) {
          screen = 'selection';
        } else if (path.includes('/categories/')) {
          screen = 'categories';
        } else if (path.includes('/game/')) {
          screen = 'game';
        } else if (path.includes('/results/')) {
          screen = 'results';
        } else if (path === '/') {
          screen = 'home';
        }

        setCurrentScreen(screen);
        if (socket && roomCode && screen !== 'unknown') {
          console.log('🖥️ Notifying screen change to controllers:', screen);
          socket.emit('screen_changed', {
            roomCode,
            screen,
          });
        }
      };

      window.addEventListener('popstate', handleRouteChange);

      handleRouteChange();

      socket.on('controller_joined', (data) => {
        console.log('🎮 Controlador unido:', data);

        // Update the list of players
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

        if (isHost && gameStatus === 'waiting') {
          console.log(
            'Host detects new controller, preparing navigation to selection'
          );
          setGameStatus('selection');
        }
      });

      socket.on('player_joined', (player) => {
        console.log('Player joined:', player);
        setPlayers((prevPlayers) => [...prevPlayers, player]);
      });

      socket.on('player_left', (data) => {
        console.log('Player left:', data);
        setPlayers((prevPlayers) =>
          prevPlayers.filter(
            (player) =>
              player.id !== data.playerId && player.playerId !== data.playerId
          )
        );
      });

      socket.on('category_updated', (data) => {
        console.log('Category updated:', data);
        setSelectedCategoryType(data.categoryType);
        setSelectedCategory(data.categoryId);
      });

      socket.on('goto_quiz_selection', (data) => {
        console.log('Go to quiz selection:', data);
        setGameStatus('selection');

        if (roomCode && navigate) {
          navigate(`/selection/${roomCode}`);
        }
      });

      socket.on('goto_category_selection', (data) => {
        console.log('Go to category selection:', data);
        setGameStatus('category');
        setSelectedCategoryType(data.categoryType);

        if (roomCode && data.categoryType && navigate) {
          navigate(`/categories/${data.categoryType}/${roomCode}`);
        }
      });

      socket.on('game_started', (data) => {
        console.log('🚀 Juego iniciado:', data);
        setGameStatus('playing');

        if (roomCode && navigate) {
          console.log(`Navigating to game screen: /game/${roomCode}`);
          navigate(`/game/${roomCode}`);
        }

        if (data.category) {
          setSelectedCategory(data.category);
        }

        if (data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }

        const recoveryRoomCode =
          data.roomCode || roomCode || localStorage.getItem('currentRoomCode');

        const currentPath = window.location.pathname;
        const isInGameFlow = currentPath.includes('/game/');

        if (
          (isInGameFlow || data.skipSelection) &&
          recoveryRoomCode &&
          navigate
        ) {
          console.log(`Navigating to game screen: /game/${recoveryRoomCode}`);
          navigate(`/game/${recoveryRoomCode}`);
        } else if (
          !currentPath.includes('/selection/') &&
          !currentPath.includes('/categories/') &&
          recoveryRoomCode
        ) {
          console.log(
            `Navigating to selection screen: /selection/${recoveryRoomCode}`
          );
          navigate(`/selection/${recoveryRoomCode}`);
        }
      });

      socket.on('new_question', (data) => {
        console.log('New question:', data);

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
        console.log('Player answered:', data);

        if (data.playerId && data.answer) {
          // Actualizar las respuestas del jugador
          setPlayerAnswers((prev) => ({
            ...prev,
            [data.playerId]: data.answer,
          }));

          // Si hay información de puntuación, actualizar también los puntajes
          if (data.score !== undefined) {
            // Actualizar puntuaciones para UI
            setPlayers((prevPlayers) => {
              return prevPlayers.map((player) => {
                const playerId = player.id || player.playerId;
                if (playerId && playerId === data.playerId) {
                  console.log(
                    `Updating player ${player.nickname} score to ${data.score}`
                  );
                  return {
                    ...player,
                    score: data.score,
                  };
                }
                return player;
              });
            });
          }
        }
      });

      socket.on('game_ended', (data) => {
        console.log('Game ended event received:', data);
        setGameStatus('ended');

        // Asegurarse de que los datos de resultados se almacenen correctamente
        if (data && data.results) {
          console.log('Game results received:', data.results);
          setGameResults(data.results);

          // Navegar a la pantalla de resultados
          if (roomCode) {
            navigate(`/results/${roomCode}`);
          }
        } else {
          console.error('Game ended but no results data received');
        }
      });

      socket.on('game_results', (data) => {
        console.log('Game results received:', data);

        if (data && data.results) {
          setGameResults(data.results);
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error received:', error);

        if (error && typeof error === 'object' && error.message) {
          setConnectionError(error.message);
        } else if (typeof error === 'string') {
          setConnectionError(error);
        } else {
          setConnectionError('Unknown server error');
        }
      });
    },
    [roomCode, isHost, gameStatus, navigate]
  );

  const getControllerCommands = useCallback(
    (targetScreen: string, callback: (data: any) => void) => {
      if (!socket) return () => {};

      const handleCommand = (data: any) => {
        if (data.targetScreen && data.targetScreen !== targetScreen) return;
        callback(data);
      };

      socket.on('controller_command_internal', handleCommand);

      return () => {
        socket.off('controller_command_internal', handleCommand);
      };
    },
    [socket]
  );

  const createRoom = useCallback(
    (category: any, nickname?: string) => {
      if (!socket || !socketReady) {
        console.error('Cannot create room: Socket not connected');
        setConnectionError('Cannot create room: Socket not connected');
        return;
      }

      console.log(
        'Creating room with category:',
        category,
        'and nickname:',
        nickname || 'Host'
      );

      socket.emit('create_room', {
        category: category?.id,
        nickname: nickname || 'Host',
      });
    },
    [socket, socketReady]
  );

  const joinRoom = useCallback(
    (roomCode: string, nickname: string) => {
      if (!socket || !socketReady) {
        console.error('Cannot join room: Socket not connected');
        setConnectionError('Cannot join room: Socket not connected');
        return;
      }

      if (!roomCode || !nickname) {
        console.error('Room code and nickname are required');
        setConnectionError('Room code and nickname are required');
        return;
      }

      console.log(`Joining to room ${roomCode} like ${nickname}`);

      localStorage.setItem('currentRoomCode', roomCode);

      socket.emit('join_room', { roomCode, nickname });
    },
    [socket, socketReady]
  );

  const leaveRoom = useCallback(() => {
    if (!socket || !socketReady || !roomCode) {
      console.error('Cannot leave room: Socket not connected or no room code');
      return;
    }

    console.log('Leaving room:', roomCode);
    socket.emit('leave_room', { roomCode });

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

    localStorage.removeItem('currentRoomCode');
    if (navigate) {
      navigate('/');
    }
  }, [socket, socketReady, roomCode, navigate]);

  const updateCategory = useCallback(
    (roomCode: string, categoryType: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot update category: Socket not connected or no room code'
        );
        return;
      }

      console.log('Update category type:', categoryType);
      setSelectedCategoryType(categoryType);

      socket.emit('update_category_type', {
        roomCode,
        categoryType,
      });
    },
    [socket, socketReady]
  );

  const updateRoomCategory = useCallback(
    (roomCode: string, categoryType: string, categoryId: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot update room category: Socket not connected or no room code'
        );
        return;
      }

      console.log('Update category type:', categoryType, categoryId);

      socket.emit('update_room_category', {
        roomCode,
        categoryType,
        categoryId,
      });
    },
    [socket, socketReady]
  );
  const selectQuizType = useCallback(
    (roomCode: string, quizType: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot select quiz type: Socket not connected or no room code'
        );
        return;
      }

      console.log('Selected quiz type:', quizType);

      socket.emit('select_quiz_type', {
        roomCode,
        quizType,
      });
    },
    [socket, socketReady]
  );

  const selectCategory = useCallback(
    (roomCode: string, categoryId: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot select category: Socket not connected or no room code'
        );
        return;
      }

      console.log('Selected category:', categoryId);

      socket.emit('select_category', {
        roomCode,
        categoryId,
      });
    },
    [socket, socketReady]
  );

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

      console.log('Start game:', { roomCode, categoryId, categoryType });

      socket.emit('start_game', {
        roomCode,
        categoryId: categoryId || selectedCategory,
        categoryType: categoryType || selectedCategoryType,
      });
    },
    [socket, socketReady, isHost, selectedCategory, selectedCategoryType]
  );

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!socket || !socketReady || !roomCode) {
        console.error(
          'Cannot submit answer: Socket not connected or no room code'
        );
        return;
      }

      console.log('Sending answer:', answer);

      socket.emit('submit_answer', { roomCode, answer });
    },
    [socket, socketReady, roomCode]
  );

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
    currentScreen,
    getControllerCommands,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export default QuizContext;
