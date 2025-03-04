import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import image from '../../assets/img/index';

const HeroScreen = () => {
  const heroImage = image.heroImage;
  const navigate = useNavigate();
  // Create particles dynamically for the background
  useEffect(() => {
    const particlesContainer = document.querySelector('.particles-container');

    // Clean existing particles
    if (particlesContainer) {
      particlesContainer.innerHTML = '';

      // Create new particles
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;

        // Random size
        const size = Math.random() * 8 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random animation
        particle.style.animationDuration = `${Math.random() * 10 + 5}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;

        particlesContainer.appendChild(particle);
      }
    }
  }, []);

  const handlePlayNow = () => {
    navigate('/room');
  };

  return (
    <div className='hero-screen'>
      {/* Background with particles */}
      <div className='particles-container'></div>

      {/* Main content */}
      <div className='hero-content'>
        {/* Text column */}
        <motion.div
          className='hero-text'
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className='gradient-text'>Music Quiz</span>
            <span>Challenge</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Test your musical knowledge in this challenging game. Compete with
            friends and prove who is the true master of music! master of music!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button className='cta-button' onClick={handlePlayNow}>
              Play Now
            </button>
          </motion.div>
        </motion.div>

        {/* Game image */}
        <motion.div
          className='hero-image-container'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className='image-glow'></div>
          <img src={heroImage} alt='Music Quiz Game' className='hero-image' />
          <motion.div
            className='play-button-container'
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <button className='play-button'>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='white'>
                <path d='M8 5v14l11-7z' />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Feature cards */}
      <div className='features-section'>
        <motion.h2
          className='features-title'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Características Principales
        </motion.h2>

        <div className='features-cards'>
          {[
            {
              icon: '🎵',
              title: 'Unlimited Music',
              desc: 'Thousands of songs from all genres and eras.',
            },
            {
              icon: '👥',
              title: 'Multiplayer',
              desc: 'Compete with friends and prove your knowledge.',
            },
            {
              icon: '🏆',
              title: 'Tournaments',
              desc: 'Participate in weekly events and win prizes.',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className='feature-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              <div className='feature-icon'>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroScreen;
