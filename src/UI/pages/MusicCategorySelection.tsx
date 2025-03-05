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

  // Inicializar la categoría seleccionada cuando se monta el componente
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
      setSelectedIndex(0);
    }
  }, [categories, selectedCategory]);

  // Escuchar eventos del servidor y navegar al juego cuando sea necesario
  useEffect(() => {
    if (!socket) return;

    // Cuando el juego se inicia, navegar al juego
    const handleGameStarted = (data) => {
      console.log('Juego iniciado (MusicCategorySelection):', data);

      // Solo navegar si estamos en la página de categorías y si tenemos roomCode
      if (roomCode && window.location.pathname.includes('/categories/')) {
        console.log(
          `Navegando a juego desde MusicCategorySelection: /game/${roomCode}`
        );
        navigate(`/game/${roomCode}`);
        navigationInProgressRef.current = false;
      }
    };

    socket.on('game_started', handleGameStarted);

    return () => {
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, roomCode, navigate]);

  // Definir las funciones de manejo con useCallback
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
    // Evitar inicios múltiples
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

    // Marcar que hay una navegación en progreso
    navigationInProgressRef.current = true;
    setIsStarting(true);

    console.log('Iniciando juego con:', {
      roomCode,
      categoryId: selectedCategory.id,
      categoryType: actualCategoryType,
    });

    // Actualizar categoría en la sala
    updateRoomCategory(roomCode, actualCategoryType, selectedCategory.id);

    // Iniciar el juego con la categoría seleccionada
    startGame(roomCode, selectedCategory.id, actualCategoryType);

    // No navegamos automáticamente aquí - esperamos el evento game_started
  }, [
    selectedCategory,
    roomCode,
    actualCategoryType,
    updateRoomCategory,
    startGame,
    isStarting,
  ]);

  // Handle controller events
  useEffect(() => {
    if (!socket || !roomCode) return;

    console.log(
      'Configurando eventos del controlador en MusicCategorySelection'
    );

    // Handle direction events from controller
    const handleDirection = (data) => {
      // Extraer la dirección del evento
      const direction =
        data.direction || (data.action === 'move' ? data.direction : null);

      if (!direction) return;

      // Calcular el nuevo índice basado en la dirección
      let newIndex = selectedIndex;

      if (direction === 'right') {
        newIndex = (selectedIndex + 1) % categories.length;
      } else if (direction === 'left') {
        newIndex = (selectedIndex - 1 + categories.length) % categories.length;
      } else if (direction === 'down') {
        // Avanzar 3 posiciones o ir al final
        newIndex = Math.min(selectedIndex + 3, categories.length - 1);
      } else if (direction === 'up') {
        // Retroceder 3 posiciones o ir al inicio
        newIndex = Math.max(selectedIndex - 3, 0);
      }

      // Actualizar la selección si el índice cambió
      if (newIndex !== selectedIndex && categories[newIndex]) {
        handleCategorySelect(categories[newIndex], newIndex);
      }
    };

    // Listen for "enter" events from controller
    const handleEnter = () => {
      console.log('🖥️ ENTER/OK recibido en MusicCategorySelection', {
        isHost,
        hasSelectedCategory: !!selectedCategory,
      });

      if (
        isHost &&
        selectedCategory &&
        !navigationInProgressRef.current &&
        !isStarting
      ) {
        console.log('Ejecutando handleStartGame desde controlador');
        handleStartGame();
      }
    };

    // Escuchar todos los formatos de eventos del controlador
    socket.on('controller_direction', handleDirection);
    socket.on('controller_enter', handleEnter);
    socket.on('send_controller_command', (data) => {
      console.log('Comando genérico del controlador recibido:', data);

      if (data.action === 'move') {
        handleDirection(data);
      } else if (data.action === 'confirm_selection') {
        handleEnter();
      }
    });

    // Informar al controlador que esta pantalla está activa
    console.log(
      'Notificando a controladores sobre pantalla activa: categories'
    );
    socket.emit('screen_changed', {
      roomCode,
      screen: 'categories',
      options: categories.map((c) => c.name),
    });

    // Limpiar listeners al desmontar
    return () => {
      socket.off('controller_direction', handleDirection);
      socket.off('controller_enter', handleEnter);
      socket.off('send_controller_command');
    };
  }, [
    socket,
    roomCode,
    categories,
    selectedCategory,
    selectedIndex,
    isHost,
    isStarting,
    handleCategorySelect,
    handleStartGame,
  ]);

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

      <p className='subtitle'>Selecciona una categoría para comenzar tu quiz</p>

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
          <p>Esperando a que el anfitrión inicie el juego...</p>
          <div className='loading-dots'>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {/* Panel de depuración */}
      <div
        className='debug-info'
        style={{
          marginTop: '20px',
          padding: '10px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '5px',
          fontSize: '12px',
        }}
      >
        <p>Categoría seleccionada: {selectedCategory?.name || 'Ninguna'}</p>
        <p>
          Índice: {selectedIndex} de {categories.length - 1}
        </p>
        <p>
          Navegación en progreso:{' '}
          {navigationInProgressRef.current ? 'Sí' : 'No'}
        </p>
        <p>Iniciando: {isStarting ? 'Sí' : 'No'}</p>
        <p>Flujo correcto: QuizMainSelection → MusicCategorySelection → Quiz</p>
      </div>
    </motion.div>
  );
};

export default MusicCategorySelection;
