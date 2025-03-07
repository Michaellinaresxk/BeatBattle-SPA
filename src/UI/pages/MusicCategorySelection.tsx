'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuiz } from '../../context/QuixContext';
import { Category } from '../../types/categories';
import {
  CATEGORIES_BY_TYPE,
  CATEGORY_TYPE_TITLES,
} from '../../constants/mainCategory';

const MusicCategorySelection: React.FC = () => {
  const navigate = useNavigate();
  const { categoryType, roomCode } = useParams<{
    categoryType: string;
    roomCode: string;
  }>();
  const {
    socket,
    startGame,
    isHost,
    players,
    gameStatus,
    updateRoomCategory,
    selectedCategoryType,
    selectCategory,
  } = useQuiz();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  // Flag para prevenir múltiples navegaciones
  const navigationInProgressRef = useRef(false);

  // Get categories based on type parameter
  const actualCategoryType = categoryType || selectedCategoryType || 'music';
  const categories =
    CATEGORIES_BY_TYPE[actualCategoryType] || CATEGORIES_BY_TYPE['music'];

  // Get title based on category type
  const title = CATEGORY_TYPE_TITLES[actualCategoryType] || 'Choose a Category';

  // Define the handling functions with useCallback
  const handleCategorySelect = useCallback(
    (category: Category, index: number) => {
      console.log(`Seleccionando categoría: ${category.id} en índice ${index}`);
      setSelectedCategory(category);
      setSelectedIndex(index);

      // Enviar la categoría seleccionada al servidor
      if (roomCode) {
        selectCategory(roomCode, category.id);
      }
    },
    [roomCode, selectCategory]
  );

  const handleGoBack = useCallback(() => {
    if (roomCode) {
      navigate(`/selection/${roomCode}`);
    } else {
      navigate('/quiz-selection');
    }
  }, [roomCode, navigate]);

  const handleStartGame = useCallback(() => {
    if (
      !selectedCategory ||
      !roomCode ||
      navigationInProgressRef.current ||
      isStarting
    ) {
      console.log('No se puede iniciar el juego:', {
        hasCategory: !!selectedCategory,
        hasRoomCode: !!roomCode,
        navigationInProgress: navigationInProgressRef.current,
        isStarting,
      });
      return;
    }

    // Marcar la navegación en progreso
    navigationInProgressRef.current = true;
    setIsStarting(true);

    console.log('🚀 Iniciando juego con:', {
      roomCode,
      categoryId: selectedCategory.id,
      categoryType: actualCategoryType,
    });

    // Actualizar categoría en la sala
    updateRoomCategory(roomCode, actualCategoryType, selectedCategory.id);

    // Iniciar el juego con la categoría seleccionada
    startGame(roomCode, selectedCategory.id, actualCategoryType);

    // Timeout de seguridad: Restablecer las banderas después de 5 segundos si no hay navegación
    setTimeout(() => {
      if (navigationInProgressRef.current) {
        console.log(
          '⚠️ Restableciendo banderas de navegación por timeout de seguridad'
        );
        navigationInProgressRef.current = false;
        setIsStarting(false);
      }
    }, 5000);
  }, [
    selectedCategory,
    roomCode,
    actualCategoryType,
    updateRoomCategory,
    startGame,
    isStarting,
  ]);

  const handleDirection = useCallback(
    (data) => {
      // Extract the event address
      const direction =
        data.direction || (data.action === 'move' ? data.direction : null);

      if (!direction) return;

      // Calculate the new index based on address
      let newIndex = selectedIndex;

      if (direction === 'right') {
        newIndex = (selectedIndex + 1) % categories.length;
      } else if (direction === 'left') {
        newIndex = (selectedIndex - 1 + categories.length) % categories.length;
      } else if (direction === 'down') {
        // Advance 3 positions or go to the end
        newIndex = Math.min(selectedIndex + 3, categories.length - 1);
      } else if (direction === 'up') {
        // Go back 3 positions or go to the beginning
        newIndex = Math.max(selectedIndex - 3, 0);
      }

      // Update the selection if the index changed
      if (newIndex !== selectedIndex && categories[newIndex]) {
        handleCategorySelect(categories[newIndex], newIndex);
      }
    },
    [selectedIndex, categories, handleCategorySelect]
  );

  const handleEnter = useCallback(() => {
    console.log('🔍 ENTER received with status:', {
      isHost,
      hasCategory: !!selectedCategory,
      navigationInProgress: navigationInProgressRef.current,
      isStarting,
    });

    if (
      isHost &&
      selectedCategory &&
      !navigationInProgressRef.current &&
      !isStarting
    ) {
      console.log('Running handleStartGame from controller');
      handleStartGame();
    }
  }, [
    isHost,
    selectedCategory,
    navigationInProgressRef,
    isStarting,
    handleStartGame,
  ]);

  useEffect(() => {
    if (!socket || !roomCode) return;

    socket.on('controller_direction', handleDirection);
    socket.on('controller_enter', handleEnter);
    socket.on('send_controller_command', (data) => {
      console.log('🔍 Generic command received:', data);

      if (data.action === 'move') {
        handleDirection(data);
      } else if (data.action === 'confirm_selection') {
        handleEnter();
      }
    });

    // Notify the controller about the current display
    socket.emit('screen_changed', {
      roomCode,
      screen: 'categories',
      options: categories.map((c) => c.name),
    });

    return () => {
      console.log('🔍 Clearing controller listeners');
      socket.off('controller_direction', handleDirection);
      socket.off('controller_enter', handleEnter);
      socket.off('send_controller_command');
    };
  }, [socket, roomCode, categories, handleDirection, handleEnter]);

  // Initialize the selected category when mounting the component
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
      setSelectedIndex(0);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!socket) return;

    console.log('🔍 Configuring listener for game_started');

    const handleGameStarted = (data) => {
      console.log('🔍 GAME_STARTED received:', data);
      navigationInProgressRef.current = false;
      setIsStarting(false);

      if (roomCode && window.location.pathname.includes('/categories/')) {
        console.log(`🔍 Navigating to /game/${roomCode}`);
        navigate(`/game/${roomCode}`);
      }
    };

    socket.on('game_started', handleGameStarted);

    return () => {
      console.log('🔍 Clearing listener from game_started');
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, roomCode, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleCategoryConfirmed = (data) => {
      console.log('🔍 Category confirmed, starting game:', data);

      if (isHost && roomCode && data.roomCode === roomCode) {
        handleStartGame();
      }
    };

    socket.on('category_selection_confirmed', handleCategoryConfirmed);

    return () => {
      socket.off('category_selection_confirmed', handleCategoryConfirmed);
    };
  }, [socket, isHost, roomCode, handleStartGame]);

  return (
    <motion.div
      className='category-selection'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className='header-with-back'>
        <motion.button
          className='back-button'
          onClick={handleGoBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ← Volver
        </motion.button>
        <h1 className='title'>{title}</h1>
      </div>

      {roomCode && (
        <div className='room-info'>
          <p className='room-code-display'>
            Código de sala: <span>{roomCode}</span>
          </p>
          <p className='players-count'>Jugadores: {players.length}</p>
          {/* Información de depuración */}
          <p className='controller-status'>
            Controlador: {socket ? '✅ Conectado' : '❌ No conectado'}
          </p>
          <p className='host-status'>Host: {isHost ? '✅ Sí' : '❌ No'}</p>
          <p className='game-status'>Game Status: {gameStatus}</p>
        </div>
      )}

      <p className='subtitle'>Select a category to start your quiz</p>

      <div className='categories-grid'>
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            className={`category-card ${
              index === selectedIndex ? 'selected' : ''
            }`}
            style={{
              background: `linear-gradient(to bottom right, ${category.color}, ${category.color}cc)`,
            }}
            onClick={() => handleCategorySelect(category, index)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className='category-icon'>{category.icon}</div>
            <h3 className='category-name'>{category.name}</h3>
          </motion.div>
        ))}
      </div>

      {isHost ? (
        <motion.button
          className='start-game-button'
          onClick={handleStartGame}
          disabled={
            !selectedCategory || isStarting || navigationInProgressRef.current
          }
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: selectedCategory && !isStarting ? 1 : 0.5,
            y: 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {isStarting ? (
            <>
              <span className='loading-spinner'></span>
              Iniciando juego...
            </>
          ) : (
            `Iniciar Juego con ${
              selectedCategory
                ? selectedCategory.name
                : 'categoría seleccionada'
            }`
          )}
        </motion.button>
      ) : (
        <div className='waiting-for-host'>
          <p> Waiting for the host to start the game......</p>
          <div className='loading-dots'>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MusicCategorySelection;
