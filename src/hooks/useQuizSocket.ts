'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  GameResults,
  Player,
  PlayerAnswer,
  Question,
  Option,
} from '../types/player';

// Configure server URL based on environment
// const getServerUrl = () => {
//   // Check if we're in development or production
//   const isDev = process.env.NODE_ENV === 'development';

//   if (isDev) {
//     return 'http://localhost:3000';
//   }

//   // For production
//   return 'https://your-production-domain.com';
// };

// Use environment variable if available, otherwise use the function
// IMPORTANT: Change this to your server's actual URL
const SERVER_URL = 'http://192.168.1.10:3000';

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
  const [options, setOptions] = useState<Option[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const MAX_RETRY_ATTEMPTS = 3;

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
      `Attempting to connect to server: ${SERVER_URL} (Attempt ${
        connectionAttempts + 1
      }/${MAX_RETRY_ATTEMPTS})`
    );

    // Create new socket with robust options
    const socketInstance = io(SERVER_URL, {
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // 10 second connection timeout
      withCredentials: false, // Change to true if you're using cookies for auth
    });

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

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      setIsConnecting(true);

      if (reason === 'io server disconnect') {
        // The server intentionally disconnected, try to reconnect manually
        console.log('Server disconnected us, attempting to reconnect...');
        socketInstance?.connect();
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // Connection was lost, try to reconnect
        console.log('Connection lost, attempting to reconnect...');
        socketInstance?.connect();
      }
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
        setPlayers([{ playerId: socket.id, nickname: 'Host', isHost: true }]);
        setGameStatus('waiting');
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
          setPlayers([]); // Set empty array as fallback
        }
        setGameStatus('waiting');
      });

      socket.on('player_joined', (player) => {
        console.log('Player joined:', player);
        if (player) {
          setPlayers((prev) => [...prev, player]);
        }
      });

      // Game state events
      socket.on('game_started', (data) => {
        console.log('Game started event received:', data);
        setGameStatus('playing');
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
          setPlayerAnswers((prev) => ({
            ...prev,
            [data.playerId]: {
              nickname: data.nickname,
              answer: data.answer,
              isCorrect: data.isCorrect,
            },
          }));
        }
      });

      socket.on('timer_update', (time) => {
        if (typeof time === 'number') {
          setTimeRemaining(time);
        }
      });

      socket.on('question_ended', (data) => {
        console.log('Question ended:', data);
        // Make sure we store the correct answer
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

      socket.on('game_ended', (data) => {
        console.log('Game ended:', data);
        setGameStatus('ended');
        if (data && data.results) {
          setGameResults(data.results);
        }
      });

      socket.on('error', (error) => {
        console.error('Server error:', error);
        setConnectionError(`Server error: ${error.message || 'Unknown error'}`);
      });

      // Controller events
      socket.on('controller_joined', (data) => {
        console.log('Controller joined:', data);
        if (data && Array.isArray(data.players)) {
          setPlayers(data.players);
        }
      });

      socket.on('player_ready', (data) => {
        console.log('Player ready state updated:', data);
        if (data && data.playerId) {
          setPlayers((prev) =>
            prev.map((p) =>
              p.playerId === data.playerId ? { ...p, isReady: data.isReady } : p
            )
          );
        }
      });

      socket.on('countdown_started', (data) => {
        console.log('Countdown started:', data);
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

  // Functions to interact with the socket
  const createRoom = useCallback(
    (category = null) => {
      if (!socket) {
        console.error('Cannot create room: Socket not connected');
        return;
      }

      if (category) {
        setSelectedCategory(category.id);
        socket.emit(
          'create_room',
          { category: category.id },
          (response: any) => {
            if (response && !response.success) {
              console.error('Failed to create room:', response.error);
              setConnectionError(`Failed to create room: ${response.error}`);
            }
          }
        );
      } else {
        socket.emit('create_room', {}, (response: any) => {
          if (response && !response.success) {
            console.error('Failed to create room:', response.error);
            setConnectionError(`Failed to create room: ${response.error}`);
          }
        });
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

      socket.emit('join_room', { roomCode, nickname }, (response: any) => {
        if (response && !response.success) {
          console.error('Failed to join room:', response.error);
          setConnectionError(`Failed to join room: ${response.error}`);
        }
      });
    },
    [socket]
  );

  const startGame = useCallback(() => {
    if (!socket || !isHost) {
      console.error('Cannot start game: Socket not connected or not host');
      return;
    }

    if (!roomCode) {
      console.error('Cannot start game: No room code');
      return;
    }

    console.log('Attempting to start game with roomCode:', roomCode);
    socket.emit(
      'start_game',
      { roomCode, category: selectedCategory },
      (response: any) => {
        if (response && !response.success) {
          console.error('Failed to start game:', response.error);
          setConnectionError(`Failed to start game: ${response.error}`);
        }
      }
    );
  }, [socket, roomCode, isHost, selectedCategory]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!socket) {
        console.error('Cannot submit answer: Socket not connected');
        return;
      }

      if (!roomCode) {
        console.error('Cannot submit answer: No room code');
        return;
      }

      console.log('Submitting answer:', answer, 'for room:', roomCode);
      socket.emit('submit_answer', { roomCode, answer }, (response: any) => {
        if (response && !response.success) {
          console.error('Failed to submit answer:', response.error);
        }
      });
    },
    [socket, roomCode]
  );

  const requestNextQuestion = useCallback(() => {
    if (!socket) {
      console.error('Cannot request next question: Socket not connected');
      return;
    }

    if (!roomCode) {
      console.error('Cannot request next question: No room code');
      return;
    }

    socket.emit('request_next_question', { roomCode }, (response: any) => {
      if (response && !response.success) {
        console.error('Failed to request next question:', response.error);
      }
    });
  }, [socket, roomCode]);

  const toggleReady = useCallback(
    (isReady: boolean) => {
      if (!socket) {
        console.error('Cannot toggle ready: Socket not connected');
        return;
      }

      if (!roomCode) {
        console.error('Cannot toggle ready: No room code');
        return;
      }

      socket.emit('toggle_ready', { roomCode, isReady }, (response: any) => {
        if (response && !response.success) {
          console.error('Failed to toggle ready state:', response.error);
        }
      });
    },
    [socket, roomCode]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) {
      console.error('Cannot leave room: Socket not connected');
      return;
    }

    if (!roomCode) {
      console.error('Cannot leave room: No room code');
      return;
    }

    socket.emit('leave_room', { roomCode }, (response: any) => {
      if (response && !response.success) {
        console.error('Failed to leave room:', response.error);
      } else {
        // Reset state on successful leave
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
      }
    });
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
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    requestNextQuestion,
    toggleReady,
    leaveRoom,
    setGameStatus, // Expose this for components that need to update game status
  };
}

export default useQuizSocket;
