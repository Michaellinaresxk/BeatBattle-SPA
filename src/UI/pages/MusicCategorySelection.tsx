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
    },
    [selectedIndex, categories, handleCategorySelect]
  );

  const handleEnter = useCallback(() => {
    console.log('🔍 ENTER recibido con estado:', {
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
      console.log('Ejecutando handleStartGame desde controlador');
      handleStartGame();
    }
  }, [
    isHost,
    selectedCategory,
    navigationInProgressRef,
    isStarting,
    handleStartGame,
  ]);

  // Un único useEffect para manejar eventos del controlador
  useEffect(() => {
    if (!socket || !roomCode) return;

    console.log(
      '🔍 Configurando UN SOLO listener para eventos del controlador'
    );

    // Registrar listeners
    socket.on('controller_direction', handleDirection);
    socket.on('controller_enter', handleEnter);
    socket.on('send_controller_command', (data) => {
      console.log('🔍 Comando genérico recibido:', data);

      if (data.action === 'move') {
        handleDirection(data);
      } else if (data.action === 'confirm_selection') {
        handleEnter();
      }
    });

    // Notificar al controlador sobre la pantalla actual
    socket.emit('screen_changed', {
      roomCode,
      screen: 'categories',
      options: categories.map((c) => c.name),
    });

    return () => {
      console.log('🔍 Limpiando listeners de controlador');
      socket.off('controller_direction', handleDirection);
      socket.off('controller_enter', handleEnter);
      socket.off('send_controller_command');
    };
  }, [socket, roomCode, categories, handleDirection, handleEnter]);

  // Inicializar la categoría seleccionada cuando se monta el componente
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
      setSelectedIndex(0);
    }
  }, [categories, selectedCategory]);

  // Un useEffect separado SOLO para el evento game_started
  useEffect(() => {
    if (!socket) return;

    console.log('🔍 Configurando listener para game_started');

    const handleGameStarted = (data) => {
      console.log('🔍 GAME_STARTED recibido:', data);

      // Restablecer banderas de navegación
      navigationInProgressRef.current = false;
      setIsStarting(false);

      // Navegar si estamos en la página de categorías
      if (roomCode && window.location.pathname.includes('/categories/')) {
        console.log(`🔍 Navegando a /game/${roomCode}`);
        navigate(`/game/${roomCode}`);
      }
    };

    socket.on('game_started', handleGameStarted);

    return () => {
      console.log('🔍 Limpiando listener de game_started');
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, roomCode, navigate]);

  // Un useEffect para manejar el evento category_selection_confirmed
  useEffect(() => {
    if (!socket) return;

    console.log('🔍 Configurando listener para category_selection_confirmed');

    const handleCategoryConfirmed = (data) => {
      console.log('🔍 Categoría confirmada, iniciando juego:', data);

      if (isHost && roomCode && data.roomCode === roomCode) {
        // El host inicia el juego cuando recibe la confirmación
        console.log('Host iniciando juego después de confirmación');
        handleStartGame();
      }
    };

    socket.on('category_selection_confirmed', handleCategoryConfirmed);

    return () => {
      console.log('🔍 Limpiando listener de category_selection_confirmed');
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
