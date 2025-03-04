import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { navigate } from 'expo-router/build/global-state/routing';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLinkClick = () => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className='navbar-container'>
        {/* Logo */}
        <div className='logo'>
          <Link className='link' to='/' onClick={handleLinkClick}>
            <span className='logo-text'>
              Music<span className='logo-accent'>Quiz</span>
            </span>
          </Link>
        </div>

        {/* Navigation links - Desktop version */}
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <motion.li whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
            <Link to='#features' onClick={handleLinkClick}>
              Features
            </Link>
          </motion.li>
          <motion.li whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
            <Link to='#' onClick={handleLinkClick}>
              Play
            </Link>
          </motion.li>
          <motion.li whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
            <Link to='/about'>About</Link>
          </motion.li>
          <li className='nav-button-container'>
            <motion.button
              className='nav-button'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to='#play' onClick={handleLinkClick}>
                Download
              </Link>
            </motion.button>
          </li>
        </ul>
        <div
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className='bar'></span>
          <span className='bar'></span>
          <span className='bar'></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
