'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { MainCategory } from '../../types/categories';
import { mainCategories } from '../../constants/mainCategory';
import { useQuiz } from '../../context/QuixContext';

const QuizMainSelection: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const location = useLocation();
  const { selectQuizType, updateCategory, setGameStatus, gameStatus, socket } =
    useQuiz();

  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(
    null
  );

  // Log para debugging
  useEffect(() => {
    console.log('🚀 QuizMainSelection montado con:', {
      roomCode,
      gameStatus,
      locationState: location.state,
      pathname: location.pathname,
      currentPath: window.location.pathname,
    });

    // Guardar el roomCode en localStorage para recuperarlo si es necesario
    if (roomCode) {
      localStorage.setItem('currentRoomCode', roomCode);
    }

    // Verificar si nos llega un estado de juego 'playing' mientras estamos en esta pantalla
    if (gameStatus === 'playing' && roomCode) {
      console.log(
        '⚠️ Estado playing detectado en QuizMainSelection, pero NO navegamos automáticamente'
      );
      // NO navegamos automáticamente, permitimos que el usuario elija su categoría
    }
  }, [roomCode, gameStatus, location]);

  // IMPORTANTE: Escuchar específicamente los eventos de socket en este componente
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data) => {
      console.log(
        '🎮 Evento game_started recibido en QuizMainSelection:',
        data
      );

      // No navegamos automáticamente al juego desde aquí
      // El usuario debe seleccionar una categoría primero
      setGameStatus('selection');

      console.log(
        'Estado actualizado, pero mantenemos al usuario en la selección de categoría'
      );
    };

    // Escuchar el evento específico para ir a la selección de categoría
    const handleGotoQuizSelection = (data) => {
      console.log('🎯 Evento goto_quiz_selection recibido:', data);

      // Actualizar el estado del juego a 'selection'
      setGameStatus('selection');

      // Ya estamos en la página correcta, no necesitamos navegar
    };

    socket.on('game_started', handleGameStarted);
    socket.on('goto_quiz_selection', handleGotoQuizSelection);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('goto_quiz_selection', handleGotoQuizSelection);
    };
  }, [socket, setGameStatus]);

  // Manejar la selección de categoría
  const handleCategorySelect = (category: MainCategory) => {
    if (!roomCode) return;

    console.log(`Seleccionando tipo de quiz: ${category.id}`);
    setSelectedCategory(category);

    // Actualizar el estado del contexto
    updateCategory(roomCode, category.id);

    // Cambiar explícitamente el estado a 'category'
    setGameStatus('category');

    // Navegar a la pantalla de selección de subcategoría
    navigate(`/categories/${category.id}/${roomCode}`);
  };

  // Función para continuar después de seleccionar
  const handleContinue = () => {
    console.log('🚀 Intentando continuar con:', {
      selectedCategory,
      roomCode,
    });

    if (selectedCategory && roomCode) {
      // Enviar el tipo de quiz seleccionado al servidor
      selectQuizType(roomCode, selectedCategory.id);

      console.log(
        `🔼 Navegando a: /categories/${selectedCategory.id}/${roomCode}`
      );
      navigate(`/categories/${selectedCategory.id}/${roomCode}`);
    } else {
      console.error('❌ No se puede continuar: falta categoría o roomCode');
    }
  };

  return (
    <div className='quiz-selection-container'>
      <motion.div
        className='quiz-selection'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className='main-title'>Choose Your Quiz Adventure</h1>
        <p className='main-subtitle'>
          Select a category to begin your challenge
        </p>

        <div className='main-categories-container'>
          {mainCategories.map((category) => (
            <motion.div
              key={category.id}
              className={`main-category-card ${
                selectedCategory?.id === category.id ? 'selected' : ''
              }`}
              onClick={() => handleCategorySelect(category)}
              whileHover={{
                scale: 1.03,
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div
                className='category-card-content'
                style={{
                  background: `linear-gradient(135deg, ${category.color}, ${category.color}99)`,
                }}
              >
                <div className='category-icon-container'>
                  <span className='category-icon'>{category.icon}</span>
                </div>
                <div className='category-info'>
                  <h2 className='category-title'>{category.name}</h2>
                  <p className='category-description'>{category.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          className='continue-button'
          onClick={handleContinue}
          disabled={!selectedCategory}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: selectedCategory ? 1 : 0.5,
            y: 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {selectedCategory
            ? `Continue with ${selectedCategory.name}`
            : 'Select a category to continue'}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default QuizMainSelection;
