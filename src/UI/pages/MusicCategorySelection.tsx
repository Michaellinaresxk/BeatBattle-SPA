'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
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
    startGame,
    isHost,
    players,
    gameStatus,
    updateRoomCategory,
    selectedCategoryType,
    selectCategory,
  } = useQuiz();

  // Si por alguna razón gameStatus cambia a 'playing' mientras estamos en esta página,
  // verificamos si debemos navegar al juego
  useEffect(() => {
    if (gameStatus === 'playing' && roomCode) {
      console.log('Estado cambiado a playing, navegando al juego...');
      navigate(`/game/${roomCode}`);
    }
  }, [gameStatus, roomCode, navigate]);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [isStarting, setIsStarting] = useState(false);

  // Get categories based on type parameter
  const actualCategoryType = categoryType || selectedCategoryType || 'music';
  const categories =
    CATEGORIES_BY_TYPE[actualCategoryType] || CATEGORIES_BY_TYPE['music'];

  // Get title based on category type
  const title = CATEGORY_TYPE_TITLES[actualCategoryType] || 'Choose a Category';

  // const handleSubcategorySelect = (categoryId) => {
  //   if (!roomCode || !categoryType) return;

  //   console.log(
  //     `Seleccionando categoría: ${categoryId} para tipo: ${categoryType}`
  //   );

  //   // Actualizar la categoría en el servidor
  //   updateRoomCategory(roomCode, categoryType, categoryId);

  //   // Cambiar el estado a 'playing' antes de iniciar el juego
  //   setGameStatus('playing');

  //   // Iniciar el juego con la categoría seleccionada
  //   startGame(roomCode, categoryId, categoryType);

  //   // Navegar al juego (aunque esto también lo hará el evento game_started)
  //   navigate(`/game/${roomCode}`);
  // };

  // Obtener las subcategorías para el tipo seleccionado
  // const currentSubcategories = subcategories[categoryType] || [];

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);

    // Enviar la categoría seleccionada al servidor
    if (roomCode) {
      selectCategory(roomCode, category.id);
    }
  };

  const handleGoBack = () => {
    if (roomCode) {
      navigate(`/selection/${roomCode}`);
    } else {
      navigate('/quiz-selection');
    }
  };

  const handleStartGame = () => {
    if (selectedCategory && roomCode) {
      setIsStarting(true);

      // Actualizar categoría en la sala
      updateRoomCategory(roomCode, actualCategoryType, selectedCategory.id);

      // Iniciar el juego con la categoría seleccionada
      startGame(roomCode, selectedCategory.id, actualCategoryType);
    }
  };

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

      <p className='subtitle'>Selecciona una categoría para comenzar tu quiz</p>

      <div className='categories-grid'>
        {categories.map((category) => (
          <motion.div
            key={category.id}
            className={`category-card ${
              selectedCategory?.id === category.id ? 'selected' : ''
            }`}
            style={{
              background: `linear-gradient(to bottom right, ${category.color}, ${category.color}cc)`,
            }}
            onClick={() => handleCategorySelect(category)}
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
          disabled={!selectedCategory || isStarting}
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
          <p>Esperando a que el anfitrión inicie el juego...</p>
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
