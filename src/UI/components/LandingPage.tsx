import Navbar from '../components/Navbar';
import HeroScreen from '../pages/HeroScreen';

const LandingPage = () => {
  return (
    <div className='landing-page'>
      <Navbar />
      <HeroScreen />
      {/* Sección About
      <section id='about' className='about-section'>
        <div className='about-container'>
          <div className='about-content'>
            <h2>
              Sobre <span className='gradient-text'>Nosotros</span>
            </h2>
            <p>
              Somos un equipo apasionado de desarrolladores de juegos y amantes
              de la música. Nuestra misión es crear la experiencia de juego
              musical más inmersiva y divertida para jugadores de todas las
              edades.
            </p>
            <p>
              Music Quiz Challenge nació de la idea de combinar el
              entretenimiento de los juegos con la pasión universal por la
              música, creando un desafío único que pone a prueba tus
              conocimientos musicales mientras compites con amigos.
            </p>
          </div>
          <div className='about-image'>
            <div className='image-glow'></div>
            <img src='/team-image.jpg' alt='Nuestro equipo' />
          </div>
        </div>
      </section> */}
      {/* Sección Play/Download */}
      <section id='play' className='play-section'>
        <div className='play-container'>
          <h2>
            ¿ Ready to <span className='gradient-text'>Play</span>?
          </h2>
          <p>
            Download Music Quiz Challenge now and start proving your musical
            knowledge. musical knowledge. Available on multiple platforms.
          </p>

          <div className='download-options'>
            <a href='#' className='download-button'>
              <svg viewBox='0 0 384 512' width='30' className='download-icon'>
                <path
                  fill='currentColor'
                  d='M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z'
                ></path>
              </svg>
              <div>
                <span>Download in</span>
                <strong>App Store</strong>
              </div>
            </a>

            <a href='#' className='download-button'>
              <svg viewBox='0 0 512 512' width='30' className='download-icon'>
                <path
                  fill='currentColor'
                  d='M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z'
                ></path>
              </svg>
              <div>
                <span>Download in</span>
                <strong>Google Play</strong>
              </div>
            </a>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className='footer'>
        <div className='footer-container'>
          <div className='footer-logo'>
            <span className='logo-text'>
              Music<span className='logo-accent'>Quiz</span>
            </span>
            <p>© 2025 Music Quiz Challenge</p>
          </div>

          <div className='footer-links'>
            <div className='footer-column'>
              <h3>Links</h3>
              <ul>
                <li>
                  <a href='#'>Home</a>
                </li>
                <li>
                  <a href='#features'>Features</a>
                </li>
                <li>
                  <a href='#play'>Play</a>
                </li>
                <li>
                  <a href='#about'>About</a>
                </li>
              </ul>
            </div>

            <div className='footer-column'>
              <h3>Follow us</h3>
              <div className='social-links'>
                <a href='#' className='social-icon'>
                  <svg viewBox='0 0 24 24' width='24'>
                    <path
                      fill='currentColor'
                      d='M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z'
                    ></path>
                  </svg>
                </a>
                <a href='#' className='social-icon'>
                  <svg viewBox='0 0 24 24' width='24'>
                    <path
                      fill='currentColor'
                      d='M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z'
                    ></path>
                  </svg>
                </a>
                <a href='#' className='social-icon'>
                  <svg viewBox='0 0 24 24' width='24'>
                    <path
                      fill='currentColor'
                      d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
                    ></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
