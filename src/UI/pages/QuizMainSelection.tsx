'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { mainCategories } from '../../constants/mainCategory';
import { useQuiz } from '../../context/QuixContext';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/QuizMainSelection.css';

const QuizMainSelection: React.FC = () => {
  const navigate = useNavigate(); // Initialize navigate from react-router-dom
  const { roomCode } = useParams(); // Get roomCode from URL params
  const { selectQuizType, socket, gameStatus, setGameStatus } = useQuiz();

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleControllerCommand = (data: {
      action: string;
      direction?: string;
    }) => {
      console.log('Controller command received:', data);

      if (data.action === 'move' && data.direction) {
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
      } else if (data.action === 'confirm_selection') {
        handleContinue();
      }
    };

    socket.on('controller_command', handleControllerCommand);

    return () => {
      socket.off('controller_command', handleControllerCommand);
    };
  }, [socket, selectedCategoryIndex]); // Added selectedCategoryIndex as dependency

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
              }}
              onClick={() => setSelectedCategoryIndex(index)} // Added click handler for better interactivity
            >
              <div className='category-content'>
                <h2>{category.name}</h2>
                <p>{category.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add a continue button for non-controller users */}
        {/* <button
          className='continue-button'
          onClick={handleContinue}
          disabled={selectedCategoryIndex === undefined}
        >
          Continue
        </button> */}
      </motion.div>
    </div>
  );
};

export default QuizMainSelection;
