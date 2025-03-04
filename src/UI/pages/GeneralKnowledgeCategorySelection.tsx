import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuiz } from '../../context/QuixContext';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const GeneralKnowledgeCategorySelection: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, roomCode } = useQuiz();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // General Knowledge categories
  const categories: Category[] = [
    { id: 'history', name: 'History', icon: '📜', color: '#8e44ad' },
    { id: 'science', name: 'Science', icon: '🔬', color: '#2980b9' },
    { id: 'geography', name: 'Geography', icon: '🌎', color: '#27ae60' },
    { id: 'literature', name: 'Literature', icon: '📚', color: '#d35400' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: '#c0392b' },
    { id: 'movies', name: 'Movies & TV', icon: '🎬', color: '#16a085' },
    { id: 'art', name: 'Art & Culture', icon: '🎨', color: '#f39c12' },
    { id: 'food', name: 'Food & Cuisine', icon: '🍽️', color: '#7f8c8d' },
  ];

  // Redirect to waiting room after room creation
  useEffect(() => {
    if (roomCode) {
      navigate(`/room/${roomCode}`);
    }
  }, [roomCode, navigate]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleContinue = () => {
    if (selectedCategory) {
      createRoom(selectedCategory);
      // Navigation will happen via the useEffect once roomCode is set
    }
  };

  return (
    <motion.div
      className='category-selection'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className='title'>Choose a Knowledge Category</h1>
      <p className='subtitle'>Select the topic for your quiz challenge</p>

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
        Continue with{' '}
        {selectedCategory ? selectedCategory.name : 'selected category'}
      </motion.button>
    </motion.div>
  );
};

export default GeneralKnowledgeCategorySelection;
