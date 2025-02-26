import { Footer } from '../components/Footer';
import Navbar from '../components/Navbar';

export const AboutUs = () => {
  return (
    <>
      <section id='about' className='about-section'>
        <Navbar />
        <div className='about-container'>
          <div className='about-content'>
            <h2>
              About <span className='gradient-text'>Us</span>
            </h2>
            <p>
              We are a passionate team of game developers and music lovers.
              music lovers. Our mission is to create the most immersive and fun
              immersive and fun music gaming experience for players of all ages.
              ages.
            </p>
            <p>
              Music Quiz Challenge was born out of the idea of combining the the
              universal passion for music, creating a unique challenge that
              tests your music, creating a unique challenge that tests your
              musical knowledge musical knowledge while competing with friends.
            </p>
          </div>
          <div className='about-image'>
            <div className='image-glow'></div>
            <img src='/team-image.jpg' alt='Our Team' />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};
