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

const MusicCategorySelection: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, roomCode } = useQuiz();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Musical categories
  const categories: Category[] = [
    { id: 'rock-70', name: 'Rock - 70s', icon: '🎸', color: '#e74c3c' },
    { id: 'rock-80', name: 'Rock - 80s', icon: '🤘', color: '#3498db' },
    { id: 'rock-90', name: 'Rock - 90s', icon: '🎵', color: '#9b59b6' },
    { id: 'funk', name: 'Funk', icon: '🕺', color: '#f39c12' },
    { id: 'rap', name: 'Rap', icon: '🎤', color: '#2c3e50' },
    { id: 'ballads', name: 'Ballads', icon: '🎹', color: '#1abc9c' },
    { id: 'latin', name: 'Latin Music', icon: '💃', color: '#e67e22' },
    { id: 'pop', name: 'Pop Hits', icon: '🎧', color: '#c0392b' },
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
      // We'll need to update your backend to accept category as an optional parameter
      // For now, we'll just pass the category ID
      createRoom();

      // Navigate will happen via the useEffect above once roomCode is set
    }
  };

  return (
    <motion.div
      className='category-selection'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className='title'>Choose a Music Category</h1>
      <p className='subtitle'>Select the music style for your quiz</p>

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

export default MusicCategorySelection;
