'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getServerUrl, getSocketOptions } from '../utils /socketConfig';
import { Player, PlayerAnswer, Question } from '../types/player';

export function useQuizSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerAnswers, setPlayerAnswers] = useState<
    Record<string, PlayerAnswer>
  >({});
  const [gameStatus, setGameStatus] = useState<
    'setup' | 'waiting' | 'playing' | 'ended'
  >('setup');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [gameResults, setGameResults] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState<
    string | null
  >(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const MAX_RETRY_ATTEMPTS = 3;
  const [currentScreen, setCurrentScreen] = useState<string>('waiting');

  // Function to establish socket connection
  const connectSocket = useCallback(() => {
    if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
      setConnectionError(
        `Failed to connect after ${MAX_RETRY_ATTEMPTS} attempts. Please check your network connection or try again later.`
      );
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    console.log(
      `Attempting to connect to server: ${getServerUrl()} (Attempt ${
        connectionAttempts + 1
      }/${MAX_RETRY_ATTEMPTS})`
    );

    // Create new socket with robust options
    const socketInstance = io(getServerUrl(), getSocketOptions());

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server:', socketInstance?.id);
      setConnectionError(null);
      setSocket(socketInstance);
      setIsConnecting(false);
      setConnectionAttempts(0); // Reset connection attempts on success
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnectionError(`Connection error: ${error.message}`);
      setIsConnecting(false);

      // Increment attempts and retry
      setConnectionAttempts((prev) => prev + 1);

      // Clean up existing socket
      socketInstance?.close();

      // Try again with exponential backoff
      const backoffTime = Math.min(
        1000 * Math.pow(2, connectionAttempts),
        10000
      ); // Max 10 seconds
      console.log(`Retrying in ${backoffTime / 1000} seconds...`);

      setTimeout(() => {
        connectSocket();
      }, backoffTime);
    });

    setupSocketListeners(socketInstance);
  }, [connectionAttempts]);

  // Set up all socket listeners
  const setupSocketListeners = useCallback(
    (socket: Socket) => {
      // Debug all events
      socket.onAny((event, ...args) => {
        console.log(`[SOCKET] ${event}:`, args);
      });

      // Room management events
      socket.on('room_created', (data) => {
        console.log('Room created:', data);
        setRoomCode(data.roomCode);
        setIsHost(true);

        if (Array.isArray(data.players)) {
          setPlayers(data.players);
        } else {
          setPlayers([{ playerId: socket.id, nickname: 'Host', isHost: true }]);
        }

        setGameStatus('waiting');

        // Store room code in localStorage for persistence
        localStorage.setItem('currentRoomCode', data.roomCode);
      });

      socket.on('room_joined', (data) => {
        console.log('Room joined:', data);
        setRoomCode(data.roomCode);

        if (Array.isArray(data.players)) {
          setPlayers(data.players);
        } else {
          console.warn(
            'Expected players array in room_joined event but got:',
            data.players
          );
          setPlayers([]);
        }

        setGameStatus('waiting');

        // Store room code in localStorage
        localStorage.setItem('currentRoomCode', data.roomCode);
      });

      socket.on('player_joined', (player) => {
        console.log('Player joined:', player);
        if (player) {
          setPlayers((prev) => [...prev, player]);
        }
      });

      socket.on('controller_joined', (data) => {
        console.log('Controller joined event:', data);
        if (data.players) {
          setPlayers(data.players);
        }
      });

      // Game state events
      socket.on('game_started', (data) => {
        console.log('Game started event received:', data);
        setGameStatus('playing');

        if (data.category) {
          setSelectedCategory(data.category);
        }

        if (data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }
      });

      socket.on('new_question', (data) => {
        console.log('New question received:', data);
        if (!data) {
          console.error('Received empty data in new_question event');
          return;
        }

        if (data.question) {
          setCurrentQuestion(data.question);
        }

        // Handle options in different formats
        if (data.options) {
          if (Array.isArray(data.options)) {
            setOptions(data.options);
          } else if (typeof data.options === 'object') {
            // Convert object format to array format for web
            const optionsArray = Object.entries(data.options).map(
              ([id, text]) => ({
                id,
                text,
              })
            );
            setOptions(optionsArray);
          } else {
            console.warn('Unexpected options format:', data.options);
            setOptions([]);
          }
        } else {
          console.warn('No options in new_question event');
          setOptions([]);
        }

        setTimeRemaining(data.timeLimit || 30);
        // Reset player answers for the new question
        setPlayerAnswers({});
      });

      socket.on('player_answered', (data) => {
        console.log('Player answered:', data);

        if (data && data.playerId) {
          // Actualizar las respuestas del jugador
          setPlayerAnswers((prev) => ({
            ...prev,
            [data.playerId]: {
              playerId: data.playerId,
              answer: data.answer,
              isCorrect: data.isCorrect,
              nickname: data.nickname,
            },
          }));

          // Actualizar también las puntuaciones en tiempo real
          if (data.score !== undefined) {
            console.log(
              `Updating player ${data.nickname} score to ${data.score}`
            );

            setPlayers((prevPlayers) => {
              return prevPlayers.map((player) => {
                const playerId = player.id || player.playerId;
                if (playerId === data.playerId) {
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

      socket.on('timer_update', (time) => {
        if (typeof time === 'number') {
          setTimeRemaining(time);
        }
      });

      socket.on('question_ended', (data) => {
        console.log('Question ended:', data);
        // Make sure we store the correct answer if provided
        if (data && data.correctAnswer && currentQuestion) {
          setCurrentQuestion((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              correctOptionId: data.correctAnswer,
            };
          });
        }
      });

      socket.on('error', (error) => {
        console.error('Server error:', error);
        setConnectionError(`Server error: ${error.message || 'Unknown error'}`);
      });

      socket.on('game_ended', (data) => {
        console.log('Game ended event received:', data);
        setGameStatus('ended');

        if (data && data.results) {
          console.log('Game results details:', {
            resultsKeys: Object.keys(data.results),
            playersCount: players.length,
          });

          // Actualizar gameResults con los datos recibidos
          setGameResults(data.results);

          // También actualizar los puntajes de los jugadores
          setPlayers((prevPlayers) => {
            return prevPlayers.map((player) => {
              const playerId = player.id || player.playerId;
              if (playerId && data.results[playerId]) {
                return {
                  ...player,
                  score: data.results[playerId].score || 0,
                };
              }
              return player;
            });
          });
        } else {
          console.warn('Game ended without results data');
        }
      });
      socket.on('game_results', (data) => {
        console.log('Game results received:', data);

        if (data && data.results) {
          setGameResults(data.results);

          // Actualizar también los players con la información de puntuación
          setPlayers((prevPlayers) => {
            return prevPlayers.map((player) => {
              const playerId = player.id || player.playerId;
              if (playerId && data.results[playerId]) {
                return {
                  ...player,
                  score: data.results[playerId].score || 0,
                };
              }
              return player;
            });
          });
        }
      });

      // Ensure any reconnection doesn't change the setup events
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);

        if (reason === 'io server disconnect' || reason === 'transport close') {
          // Try to reconnect manually
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            socket.connect();
          }, 1000);
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
      });
    },
    [currentQuestion]
  );

  // Connect socket on component mount
  useEffect(() => {
    connectSocket();

    // Cleanup function to disconnect socket
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [connectSocket]);

  // Try to restore the room code from localStorage on component mount
  useEffect(() => {
    const storedRoomCode = localStorage.getItem('currentRoomCode');
    if (storedRoomCode && !roomCode) {
      console.log('Restoring room code from localStorage:', storedRoomCode);
      setRoomCode(storedRoomCode);
    }
  }, [roomCode]);

  // Functions to interact with the socket
  const createRoom = useCallback(
    (category = null) => {
      if (!socket) {
        console.error('Cannot create room: Socket not connected');
        return;
      }

      console.log('Creating room with category:', category);

      if (category) {
        setSelectedCategory(category.id);
        socket.emit('create_room', { category: category.id, nickname: 'Host' });
      } else {
        socket.emit('create_room', { nickname: 'Host' });
      }
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomCode: string, nickname: string) => {
      if (!socket) {
        console.error('Cannot join room: Socket not connected');
        return;
      }

      if (!roomCode || !nickname) {
        console.error('Room code and nickname are required');
        return;
      }

      console.log(`Joining room ${roomCode} as ${nickname}`);

      // Store the room code in localStorage before attempting to join
      localStorage.setItem('currentRoomCode', roomCode);

      socket.emit('join_room', { roomCode, nickname });
    },
    [socket]
  );

  const updateRoomCategory = useCallback(
    (roomCode: string, categoryType: string, categoryId: string) => {
      if (!socket || !roomCode) {
        console.error('Cannot update room category: Invalid parameters');
        return;
      }

      console.log(`Updating room ${roomCode} category:`, {
        categoryType,
        categoryId,
      });

      socket.emit('update_room_category', {
        roomCode,
        categoryType,
        categoryId,
      });
    },
    [socket]
  );

  const startGame = useCallback(
    (roomCodeParam?: string, categoryId?: string, categoryType?: string) => {
      if (!socket) {
        console.error('Cannot start game: Socket not connected');
        return;
      }

      const codeToUse = roomCodeParam || roomCode;

      if (!codeToUse) {
        console.error('Cannot start game: No room code provided');
        return;
      }

      console.log('Starting game:', {
        roomCode: codeToUse,
        category: categoryId || selectedCategory,
        categoryType: categoryType || selectedCategoryType,
      });

      socket.emit('start_game', {
        roomCode: codeToUse,
        categoryId: categoryId || selectedCategory,
        categoryType: categoryType || selectedCategoryType,
      });
    },
    [socket, roomCode, selectedCategory, selectedCategoryType]
  );

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!socket || !roomCode) {
        console.error('Cannot submit answer: No socket or room code');
        return;
      }

      console.log(`Submitting answer "${answer}" for room ${roomCode}`);
      socket.emit('submit_answer', { roomCode, answer });
    },
    [socket, roomCode]
  );

  const requestNextQuestion = useCallback(() => {
    if (!socket || !roomCode) {
      console.error('Cannot request next question: No socket or room code');
      return;
    }

    console.log(`Requesting next question for room ${roomCode}`);
    socket.emit('request_next_question', { roomCode });
  }, [socket, roomCode]);

  const toggleReady = useCallback(
    (isReady: boolean) => {
      if (!socket || !roomCode) {
        console.error('Cannot toggle ready: No socket or room code');
        return;
      }

      console.log(`Setting ready state to ${isReady} for room ${roomCode}`);
      socket.emit('toggle_ready', { roomCode, isReady });
    },
    [socket, roomCode]
  );

  const leaveRoom = useCallback(() => {
    if (!socket || !roomCode) {
      console.error('Cannot leave room: No socket or room code');
      return;
    }

    console.log(`Leaving room ${roomCode}`);
    socket.emit('leave_room', { roomCode });

    // Reset state on leave
    setRoomCode('');
    setPlayers([]);
    setIsHost(false);
    setGameStatus('setup');
    setPlayerAnswers({});
    setCurrentQuestion(null);
    setOptions([]);
    setTimeRemaining(0);
    setGameResults(null);
    setSelectedCategory(null);
    setSelectedCategoryType(null);

    // Clear localStorage
    localStorage.removeItem('currentRoomCode');
  }, [socket, roomCode]);

  const selectQuizType = useCallback(
    (roomCode: string, quizType: string) => {
      if (!socket || !roomCode) {
        console.error('Cannot select quiz type: No socket or room code');
        return;
      }

      console.log(`Selecting quiz type ${quizType} for room ${roomCode}`);
      socket.emit('select_quiz_type', { roomCode, quizType });
    },
    [socket]
  );

  const selectCategory = useCallback(
    (roomCode: string, categoryId: string) => {
      if (!socket || !roomCode) {
        console.error('Cannot select category: No socket or room code');
        return;
      }

      console.log(`Selecting category ${categoryId} for room ${roomCode}`);
      socket.emit('select_category', { roomCode, categoryId });
    },
    [socket]
  );

  const requestGameResults = useCallback(() => {
    if (!socket || !roomCode) {
      console.error('Cannot request game results: No socket or room code');
      return;
    }

    console.log(`Requesting game results for room ${roomCode}`);
    socket.emit('request_game_results', { roomCode });
  }, [socket, roomCode]);

  return {
    socket,
    connectionError,
    isConnecting,
    roomCode,
    players,
    isHost,
    gameStatus,
    currentQuestion,
    options,
    timeRemaining,
    playerAnswers,
    gameResults,
    selectedCategory,
    selectedCategoryType,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    requestNextQuestion,
    toggleReady,
    leaveRoom,
    updateRoomCategory,
    selectQuizType,
    selectCategory,
    setGameStatus,
    requestGameResults,
  };
}

export default useQuizSocket;
