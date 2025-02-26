import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Cambiar estilo de navbar al hacer scroll
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

  // Cerrar menú móvil al hacer clic en un enlace
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
          <span className='logo-text'>
            Music<span className='logo-accent'>Quiz</span>
          </span>
        </div>

        {/* Enlaces de navegación - Versión desktop */}
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <motion.li whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
            <a href='#features' onClick={handleLinkClick}>
              Características
            </a>
          </motion.li>
          <motion.li whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
            <a href='#play' onClick={handleLinkClick}>
              Jugar
            </a>
          </motion.li>
          <motion.li whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
            <a href='#about' onClick={handleLinkClick}>
              About
            </a>
          </motion.li>
          <li className='nav-button-container'>
            <motion.button
              className='nav-button'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Descargar
            </motion.button>
          </li>
        </ul>

        {/* Botón menú hamburguesa - Versión móvil */}
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
