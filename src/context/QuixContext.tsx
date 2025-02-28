import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuizSocket } from '../hooks/useQuizSocket';

// Create the context with default values
const QuizContext = createContext(null);

// Context provider component
export const QuizContextProvider = ({ children }) => {
  const quizSocketData = useQuizSocket();
  const [gameStatus, setGameStatus] = useState('waiting'); // 'waiting', 'playing', 'ended'

  // Escuchar eventos globales que afectan al estado del juego
  useEffect(() => {
    const { socket } = quizSocketData;

    if (!socket) return;

    // Manejar el evento game_started
    const handleGameStarted = (data) => {
      console.log('⚠️ Game started event received in QuizContext:', data);
      setGameStatus('playing');

      // También podríamos actualizar otros estados basados en este evento
      // Por ejemplo, configurar el número total de rondas
    };

    // Manejar el evento game_ended
    const handleGameEnded = (data) => {
      console.log('⚠️ Game ended event received in QuizContext:', data);
      setGameStatus('ended');
    };

    // Registrar manejadores de eventos
    socket.on('game_started', handleGameStarted);
    socket.on('game_ended', handleGameEnded);

    // Limpieza al desmontar
    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('game_ended', handleGameEnded);
    };
  }, [quizSocketData.socket]);

  // Añadir gameStatus y setGameStatus al valor del contexto
  const contextValue = {
    ...quizSocketData,
    gameStatus,
    setGameStatus,
  };

  return (
    <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
  );
};

// Custom hook to use the Quiz context
export const useQuiz = () => {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error('useQuiz must be used within a QuizContextProvider');
  }

  return context;
};
