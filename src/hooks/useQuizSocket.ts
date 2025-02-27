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

// Cambiamos el puerto a 3000 que es el puerto por defecto de nuestro servidor
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

  useEffect(() => {
    let socketInstance: Socket;

    const connectSocket = () => {
      setIsConnecting(true);
      socketInstance = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socketInstance.on('connect', () => {
        console.log('✅ Conectado al servidor:', socketInstance.id);
        setConnectionError(null);
        setSocket(socketInstance);
        setIsConnecting(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error);
        setConnectionError(`Error de conexión: ${error.message}`);
        setIsConnecting(false);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('🔌 Desconectado:', reason);
        setIsConnecting(true);
        if (reason === 'io server disconnect') {
          // reconectar manualmente
          socketInstance.connect();
        }
      });

      setupSocketListeners(socketInstance);
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const setupSocketListeners = (socket: Socket) => {
    socket.on('room_created', (data) => {
      console.log('Room created:', data);
      setRoomCode(data.roomCode);
      setIsHost(true);
      setPlayers([{ id: socket.id, nickname: 'Host', isHost: true }]);
      setGameStatus('waiting');
    });

    socket.on('room_joined', (data) => {
      console.log('Room joined:', data);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setGameStatus('waiting');
    });

    socket.on('player_joined', (player) => {
      console.log('Player joined:', player);
      setPlayers((prev) => [...prev, player]);
    });

    socket.on('game_started', (data) => {
      console.log('Game started:', data);
      setGameStatus('playing');
    });

    socket.on('new_question', (data) => {
      console.log('New question:', data);
      setCurrentQuestion(data.question);
      setOptions(data.options);
      setTimeRemaining(data.timeLimit);
    });

    socket.on('player_answered', (data) => {
      console.log('Player answered:', data);
      setPlayerAnswers((prev) => ({
        ...prev,
        [data.playerId]: { nickname: data.nickname, answer: data.answer },
      }));
    });

    socket.on('game_ended', (data) => {
      console.log('Game ended:', data);
      setGameStatus('ended');
      setGameResults(data.results);
    });

    socket.on('error', (error) => {
      console.error('Server error:', error);
      setConnectionError(`Server error: ${error.message}`);
    });
  };

  const createRoom = useCallback(() => {
    if (socket) {
      socket.emit('create_room');
    }
  }, [socket]);

  const joinRoom = useCallback(
    (roomCode: string, nickname: string) => {
      if (socket) {
        socket.emit('join_room', { roomCode, nickname });
      }
    },
    [socket]
  );

  const startGame = useCallback(() => {
    if (socket && isHost) {
      socket.emit('start_game', { roomCode });
    }
  }, [socket, roomCode, isHost]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (socket) {
        socket.emit('submit_answer', { roomCode, answer });
      }
    },
    [socket, roomCode]
  );

  const leaveRoom = useCallback(() => {
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
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    leaveRoom,
  };
}

export default useQuizSocket;
