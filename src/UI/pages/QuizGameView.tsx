import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuixContext';
import { Option } from '../../types/player';

const QuizGameView: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const {
    currentQuestion,
    options,
    timeRemaining,
    playerAnswers,
    submitAnswer,
    gameStatus,
    players,
    socket, // Asegúrate de que useQuiz expone el socket
    setGameStatus, // Asegúrate de que useQuiz proporciona esta función
  } = useQuiz();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Handle game states
  useEffect(() => {
    if (gameStatus === 'ended' && roomCode) {
      navigate(`/results/${roomCode}`);
    }

    // Reset answer state when new question comes
    if (currentQuestion && currentQuestion.id) {
      setSelectedOption(null);
      setHasAnswered(false);
      setShowResult(false);
    }

    // Show correct answer after all players answered or time is up
    if (
      (playerAnswers && Object.keys(playerAnswers).length === players.length) ||
      timeRemaining === 0
    ) {
      if (currentQuestion && currentQuestion.correctOptionId) {
        setCorrectAnswer(currentQuestion.correctOptionId);
        setShowResult(true);

        // Update score if answered correctly
        if (selectedOption === currentQuestion.correctOptionId) {
          setScore((prevScore) => prevScore + timeRemaining * 10);
        }
      }
    }
  }, [
    currentQuestion,
    playerAnswers,
    timeRemaining,
    gameStatus,
    players,
    navigate,
    roomCode,
    selectedOption,
  ]);

  // Escuchar el evento game_started
  useEffect(() => {
    if (!socket) return;

    socket.on('game_started', (data) => {
      console.log('⚠️ Game started event received in QuizGameView:', data);

      if (typeof setGameStatus === 'function') {
        setGameStatus('playing');
      }
    });

    return () => {
      socket.off('game_started');
    };
  }, [socket, setGameStatus]);

  const handleSelectOption = (optionId: string) => {
    if (!hasAnswered && timeRemaining > 0) {
      setSelectedOption(optionId);
      setHasAnswered(true);
      submitAnswer(optionId);
    }
  };

  const getOptionClassName = (optionId: string): string => {
    if (!showResult) {
      return selectedOption === optionId
        ? 'quiz-option selected'
        : 'quiz-option';
    } else {
      if (optionId === correctAnswer) {
        return 'quiz-option correct';
      } else if (selectedOption === optionId) {
        return 'quiz-option incorrect';
      } else {
        return 'quiz-option';
      }
    }
  };

  if (!currentQuestion) {
    return (
      <div className='quiz-loading'>
        <h2>Waiting for the quiz to start...</h2>
        <div className='loading-spinner'></div>
      </div>
    );
  }

  return (
    <div className='quiz-game-container'>
      {/* Animated wave background */}
      <div className='wave-container'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 1440 320'
          className='wave'
        >
          <path
            fill='#8A2BE2'
            fillOpacity='0.7'
            d='M0,192L48,181.3C96,171,192,149,288,165.3C384,181,480,235,576,229.3C672,224,768,160,864,138.7C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'
          ></path>
        </svg>
      </div>

      {/* Quiz header with timer and score */}
      <div className='quiz-header'>
        <div className='score-display'>Score: {score}</div>
        <div className='quiz-timer'>
          <motion.div
            className='timer-progress'
            initial={{ width: '100%' }}
            animate={{ width: `${(timeRemaining / 30) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
          <span className='timer-text'>{timeRemaining}s</span>
        </div>
        <div className='question-counter'>
          Question {currentQuestion.order} of {currentQuestion.totalQuestions}
        </div>
      </div>

      {/* Question section */}
      <motion.div
        className='question-container'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className='question-title'>{currentQuestion.question}</h2>

        {/* Song player if available */}
        {currentQuestion.audioUrl && (
          <div className='audio-player'>
            <audio controls autoPlay>
              <source src={currentQuestion.audioUrl} type='audio/mpeg' />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </motion.div>

      {/* Options grid */}
      <div className='options-container'>
        <AnimatePresence>
          {options.map((option: Option, index: number) => (
            <motion.div
              key={option.id}
              className={getOptionClassName(option.id)}
              onClick={() => handleSelectOption(option.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={!hasAnswered ? { scale: 1.05 } : {}}
              whileTap={!hasAnswered ? { scale: 0.98 } : {}}
            >
              {option.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Results overlay when answer is revealed */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            className='results-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='result-card'>
              <h3>
                {selectedOption === correctAnswer
                  ? '¡Correct!'
                  : 'Not quite right...'}
              </h3>
              <p>The correct answer was:</p>
              <div className='correct-answer'>
                {options.find((opt) => opt.id === correctAnswer)?.text}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player answers visualization */}
      <div className='player-answers'>
        {players.map((player) => (
          <div
            key={player.playerId}
            className={`player-answer ${
              playerAnswers[player.playerId] ? 'answered' : ''
            }`}
          >
            <div className='player-avatar'>
              {player.nickname.charAt(0).toUpperCase()}
            </div>
            <span className='player-name'>{player.nickname}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizGameView;
