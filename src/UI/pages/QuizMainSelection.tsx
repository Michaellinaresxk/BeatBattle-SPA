'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
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

  const handleContinue = () => {
    const selectedCategory = mainCategories[selectedCategoryIndex];
    if (selectedCategory && roomCode) {
      selectQuizType(roomCode as string, selectedCategory.id);
    }
  };

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

  // Este es el único useEffect necesario para los controles
  useEffect(() => {
    if (!socket) return;

    // Log para depuración
    console.log('QuizMainSelection está listo para recibir comandos');
    console.log('Socket conectado:', !!socket);
    console.log('Room code:', roomCode);

    // Escuchar específicamente los eventos de dirección del controlador
    const handleDirection = (data) => {
      console.log('🖥️ Dirección recibida:', data.direction);

      switch (data.direction) {
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

    // Escuchar específicamente los eventos de "enter" del controlador
    const handleEnter = (data) => {
      console.log('🖥️ ENTER recibido');
      handleContinue();
    };

    // Registrar los listeners utilizando los nombres de eventos exactos del servidor
    socket.on('controller_direction', handleDirection);
    socket.on('controller_enter', handleEnter);

    // Informar al controlador que esta pantalla está activa
    if (roomCode) {
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
    };
  }, [
    socket,
    roomCode,
    selectedCategoryIndex,
    mainCategories.length,
    handleContinue,
  ]);

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
