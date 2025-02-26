import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Player, PlayerAnswer } from '../types/player';

const SERVER_URL = 'http://192.168.1.10:5000';

export function useQuizSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerAnswers, setPlayerAnswers] = useState<
    Record<string, PlayerAnswer>
  >({});

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

    newSocket.on('room_created', (data) => {
      console.log('Room created:', data);
      setRoomCode(data.roomCode);
    });

    newSocket.on('player_joined', (data) => {
      console.log('United player:', data);
      setPlayers((prev) => {
        const playerExists = prev.some((p) => p.playerId === data.playerId);
        if (playerExists) return prev;
        return [...prev, data];
      });
    });

    newSocket.on('player_answered', (data) => {
      console.log('Player responded:', data);
      const { playerId, nickname, answer, correct, points } = data;
      setPlayerAnswers((prev) => ({
        ...prev,
        [playerId]: { nickname, answer, correct, points },
      }));
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const createRoom = useCallback(() => {
    if (socket) {
      socket.emit('create_room');
    }
  }, [socket]);

  return {
    socket,
    roomCode,
    players,
    playerAnswers,
    createRoom,
  };
}
