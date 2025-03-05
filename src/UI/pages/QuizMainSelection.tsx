'use client';
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { mainCategories } from '../../constants/mainCategory';
import { useQuiz } from '../../context/QuixContext';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/QuizMainSelection.css';

const QuizMainSelection: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const { selectQuizType, socket, gameStatus, setGameStatus, currentScreen } =
    useQuiz();

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Mejorado para ser una función de callback que no cambia en rerender
  const handleContinue = useCallback(() => {
    if (!roomCode) return;

    const selectedCategory = mainCategories[selectedCategoryIndex];
    if (selectedCategory) {
      console.log(`Seleccionando tipo de quiz: ${selectedCategory.id}`);
      selectQuizType(roomCode, selectedCategory.id);
    }
  }, [roomCode, selectedCategoryIndex, selectQuizType]);

  // Manejar la respuesta del servidor cuando se selecciona un tipo de quiz
  useEffect(() => {
    if (!socket) return;

    const handleQuizTypeSelected = (data: { quizType: string }) => {
      console.log('Quiz type selected:', data);
      if (data.quizType && roomCode) {
        navigate(`/categories/${data.quizType}/${roomCode}`);
      }
    };

    socket.on('quiz_type_selected', handleQuizTypeSelected);

    return () => {
      socket.off('quiz_type_selected', handleQuizTypeSelected);
    };
  }, [socket, roomCode, navigate]);

  // Manejar eventos del controlador
  useEffect(() => {
    if (!socket) return;

    // Escuchar eventos de dirección del controlador
    const handleDirection = (data) => {
      console.log('🖥️ Dirección recibida en selección principal:', data);

      // Asegurarse de que data tenga la estructura esperada
      const direction =
        data.direction || (data.action === 'move' ? data.direction : null);

      if (!direction) return;

      switch (direction) {
        case 'up':
          setSelectedCategoryIndex((prev) => Math.max(0, prev - 2));
          break;
        case 'down':
          setSelectedCategoryIndex((prev) =>
            Math.min(mainCategories.length - 1, prev + 2)
          );
          break;
        case 'left':
          setSelectedCategoryIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'right':
          setSelectedCategoryIndex((prev) =>
            Math.min(mainCategories.length - 1, prev + 1)
          );
          break;
      }
    };

    // Escuchar eventos de "enter" del controlador
    const handleEnter = () => {
      console.log('🖥️ ENTER/OK recibido en selección principal');
      handleContinue();
    };

    // Escuchar eventos directos y comandos enviados
    socket.on('controller_direction', handleDirection);
    socket.on('controller_enter', handleEnter);

    // También escuchar el formato alternativo que envía el controlador
    socket.on('send_controller_command', (data) => {
      console.log('Comando de controlador recibido:', data);
      if (data.action === 'move') {
        handleDirection(data);
      } else if (data.action === 'confirm_selection') {
        handleEnter();
      }
    });

    // Informar al controlador que esta pantalla está activa
    if (roomCode) {
      console.log(
        'Notificando controlador sobre pantalla activa:',
        'selection'
      );
      socket.emit('screen_changed', {
        roomCode,
        screen: 'selection',
        options: mainCategories.map((c) => c.name),
      });
    }

    // Limpiar los listeners al desmontar
    return () => {
      socket.off('controller_direction', handleDirection);
      socket.off('controller_enter', handleEnter);
      socket.off('send_controller_command');
    };
  }, [socket, roomCode, handleContinue]);

  return (
    <div className='quiz-selection-container'>
      <motion.div className='quiz-selection'>
        <h1 className='main-title'>Choose Your Quiz Adventure</h1>
        <p className='main-subtitle'>Use the controller to select a category</p>

        <div className='main-categories-container'>
          {mainCategories.map((category, index) => (
            <motion.div
              key={category.id}
              className={`main-category-card ${
                index === selectedCategoryIndex ? 'selected' : ''
              }`}
              animate={{
                scale: index === selectedCategoryIndex ? 1.05 : 1,
                boxShadow:
                  index === selectedCategoryIndex
                    ? '0 10px 25px rgba(0, 0, 0, 0.2)'
                    : 'none',
                border:
                  index === selectedCategoryIndex
                    ? '3px solid #5F25FF'
                    : '2px solid transparent',
              }}
              onClick={() => setSelectedCategoryIndex(index)}
            >
              <div className='category-content'>
                <h2>{category.name}</h2>
                <p>{category.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Control manual para pruebas */}
        <div className='manual-controls' style={{ marginTop: '20px' }}>
          <motion.button
            className='continue-button'
            onClick={handleContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue with {mainCategories[selectedCategoryIndex]?.name}
          </motion.button>
        </div>

        {/* Indicador visual para el controlador */}
        <div className='controller-mode-indicator'>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span>🎮 Controller connected</span>
            <p>Use the D-pad to navigate and OK to select</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizMainSelection;
