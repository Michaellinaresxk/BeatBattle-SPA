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
  const navigationInProgressRef = useRef(false);

  // Get categories based on type parameter
  const actualCategoryType = categoryType || selectedCategoryType || 'music';
  const categories =
    CATEGORIES_BY_TYPE[actualCategoryType] || CATEGORIES_BY_TYPE['music'];

  // Get title based on category type
  const title = CATEGORY_TYPE_TITLES[actualCategoryType] || 'Choose a Category';
  const handleCategorySelect = useCallback(
    (category: Category, index: number) => {
      console.log(`Selecting category: ${category.id} in index ${index}`);
      setSelectedCategory(category);
      setSelectedIndex(index);
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
      console.log('Unable to start the game:', {
        hasCategory: !!selectedCategory,
        hasRoomCode: !!roomCode,
        navigationInProgress: navigationInProgressRef.current,
        isStarting,
      });
      return;
    }
    navigationInProgressRef.current = true;
    setIsStarting(true);

    console.log('🚀 Starting the game with:', {
      roomCode,
      categoryId: selectedCategory.id,
      categoryType: actualCategoryType,
    });

    updateRoomCategory(roomCode, actualCategoryType, selectedCategory.id);

    startGame(roomCode, selectedCategory.id, actualCategoryType);

    setTimeout(() => {
      if (navigationInProgressRef.current) {
        console.log('⚠️ Resetting navigation flags due to security timeout');
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

      let newIndex = selectedIndex;

      if (direction === 'right') {
        newIndex = (selectedIndex + 1) % categories.length;
      } else if (direction === 'left') {
        newIndex = (selectedIndex - 1 + categories.length) % categories.length;
      } else if (direction === 'down') {
        newIndex = Math.min(selectedIndex + 3, categories.length - 1);
      } else if (direction === 'up') {
        newIndex = Math.max(selectedIndex - 3, 0);
      }

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
            ` Start Game with ${
              selectedCategory ? selectedCategory.name : 'selected category'
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
