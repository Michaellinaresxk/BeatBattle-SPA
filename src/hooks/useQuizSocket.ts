import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
interface Player {
  playerId: string;
  nickname: string;
  isHost?: boolean;
}

interface PlayerAnswer {
  nickname: string;
  answer: string;
  correct: boolean;
  points: number;
}

interface Question {
  id: string;
  question: string;
  order: number;
  totalQuestions: number;
  audioUrl?: string;
  correctOptionId?: string;
}

interface Option {
  id: string;
  text: string;
}

interface GameResults {
  [playerId: string]: {
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
  };
}

// Server URL - replace with your actual server URL from environment variable
const SERVER_URL = 'http://192.168.1.10:5000';

export function useQuizSocket() {
  // Socket ref
  const socketRef = useRef<Socket | null>(null);

  // Room state
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerAnswers, setPlayerAnswers] = useState<
    Record<string, PlayerAnswer>
  >({});
  const [gameStatus, setGameStatus] = useState<
    'setup' | 'waiting' | 'playing' | 'ended'
  >('setup');

  // Game state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: false,
      extraHeaders: {
        'Access-Control-Allow-Origin': '*',
      },
    });

    socketRef.current = newSocket;

    // Debug connection events
    newSocket.on('connect', () => {
      console.log(
        '⭐ Successfully connected to the server via WebSockets:',
        newSocket.id
      );
      console.log('Connection protocol:', newSocket.io.engine.transport.name);
      newSocket.emit('ping_test', { client: 'SPA', timestamp: Date.now() });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error connecting to the server:', error.message);
    });

    newSocket.on('pong_test', (data) => {
      console.log('✅ Response received from the server:', data);
      console.log('Total time (ms):', Date.now() - data.originalTimestamp);
    });

    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) return;

    // Support for existing events
    socket.on('room_created', (data) => {
      console.log('Room created:', data);
      setRoomCode(data.roomCode);
      setIsHost(true);
      // Add yourself as a player when creating a room
      setPlayers([
        { playerId: socket.id, nickname: 'You (Host)', isHost: true },
      ]);
      setGameStatus('waiting');
    });

    socket.on('player_joined', (data) => {
      console.log('Player joined:', data);
      setPlayers((prev) => {
        const playerExists = prev.some((p) => p.playerId === data.playerId);
        if (playerExists) return prev;
        return [...prev, data];
      });
    });

    socket.on('player_answered', (data) => {
      console.log('Player answered:', data);
      const { playerId, nickname, answer, correct, points } = data;

      // Update player answers
      setPlayerAnswers((prev) => ({
        ...prev,
        [playerId]: { nickname, answer, correct, points },
      }));
    });

    // New events to support the full game flow
    socket.on('player_left', (data) => {
      console.log('Player left:', data);
      setPlayers((prev) =>
        prev.filter((player) => player.playerId !== data.playerId)
      );
    });

    socket.on('game_started', () => {
      console.log('Game started');
      setGameStatus('playing');
      setPlayerAnswers({});
    });

    socket.on('question_new', (data) => {
      console.log('New question:', data);
      setCurrentQuestion(data.question);
      setOptions(data.options);
      setTimeRemaining(data.timeLimit || 30);
      setPlayerAnswers({});
    });

    socket.on('timer_update', (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on('question_ended', (data) => {
      console.log('Question ended:', data);
      // Reveal correct answer
      if (data.correctOptionId) {
        setCurrentQuestion((prev) =>
          prev
            ? {
                ...prev,
                correctOptionId: data.correctOptionId,
              }
            : null
        );
      }
    });

    socket.on('game_ended', (data) => {
      console.log('Game ended:', data);
      setGameStatus('ended');
      setGameResults(data.results);
    });

    socket.on('room_joined', (data) => {
      console.log('Room joined:', data);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setGameStatus('waiting');

      // Check if current user is host
      const isCurrentUserHost = data.players.some(
        (player: Player) => player.playerId === socket.id && player.isHost
      );
      setIsHost(isCurrentUserHost);
    });

    return () => {
      // Remove all listeners
      socket.off('room_created');
      socket.off('player_joined');
      socket.off('player_answered');
      socket.off('player_left');
      socket.off('game_started');
      socket.off('question_new');
      socket.off('timer_update');
      socket.off('question_ended');
      socket.off('game_ended');
      socket.off('room_joined');
    };
  }, []);

  // Function to create a new room
  const createRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      // Support the existing event name 'create_room'
      socket.emit('create_room');
    }
  }, []);

  // Function to join an existing room
  const joinRoom = useCallback((roomCode: string, nickname: string) => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('join_room', { roomCode, nickname });
    }
  }, []);

  // Function to start the game (host only)
  const startGame = useCallback(() => {
    const socket = socketRef.current;
    if (socket && isHost) {
      socket.emit('start_game', { roomCode });
    }
  }, [roomCode, isHost]);

  // Function to submit an answer
  const submitAnswer = useCallback(
    (optionId: string) => {
      const socket = socketRef.current;
      if (socket) {
        socket.emit('submit_answer', {
          roomCode,
          optionId,
        });
      }
    },
    [roomCode]
  );

  // Function to reset the game (host only)
  const resetGame = useCallback(() => {
    const socket = socketRef.current;
    if (socket && isHost) {
      socket.emit('reset_game', { roomCode });
      setGameStatus('waiting');
      setPlayerAnswers({});
      setCurrentQuestion(null);
      setOptions([]);
      setTimeRemaining(0);
      setGameResults(null);
    } else if (socket) {
      // For non-hosts, just reset local state
      setGameStatus('waiting');
      setPlayerAnswers({});
      setCurrentQuestion(null);
      setOptions([]);
      setTimeRemaining(0);
      setGameResults(null);
    }
  }, [roomCode, isHost]);

  // Function to leave the room
  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('leave_room', { roomCode });
      setRoomCode('');
      setPlayers([]);
      setIsHost(false);
      setGameStatus('setup');
      setPlayerAnswers({});
      setCurrentQuestion(null);
      setOptions([]);
      setTimeRemaining(0);
      setGameResults(null);
    }
  }, [roomCode]);

  return {
    socket: socketRef.current,
    roomCode,
    players,
    isHost,
    gameStatus,
    currentQuestion,
    options,
    timeRemaining,
    playerAnswers,
    gameResults,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    resetGame,
    leaveRoom,
  };
}

export default useQuizSocket;
