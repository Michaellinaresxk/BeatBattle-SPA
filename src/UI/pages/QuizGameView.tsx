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
    socket,
    setGameStatus,
  } = useQuiz();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [shouldShowCorrectAnswer, setShouldShowCorrectAnswer] =
    useState<boolean>(false);
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (gameStatus === 'ended' && roomCode) {
      navigate(`/results/${roomCode}`);
    }

    if (currentQuestion && currentQuestion.id) {
      setSelectedOption(null);
      setHasAnswered(false);
      setShouldShowCorrectAnswer(false);
      setCorrectAnswer(currentQuestion.correctOptionId || null);
      setAnsweredPlayers(new Set());
    }
  }, [currentQuestion, gameStatus, navigate, roomCode]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerAnswered = (data) => {
      setAnsweredPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.playerId);
        return newSet;
      });

      if (data.playerId && data.score !== undefined) {
        setPlayerScores((prev) => ({
          ...prev,
          [data.playerId]: data.score,
        }));
      }
    };

    const handleAnswerResult = (data) => {
      if (data.correct) {
        setScore((prevScore) => prevScore + 1);
      }
    };

    const handleQuestionEnded = (data) => {
      if (data && data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
        setShouldShowCorrectAnswer(true);
      }
    };

    const handleGameStarted = (data) => {
      if (typeof setGameStatus === 'function') {
        setGameStatus('playing');
      }

      setScore(0);
      setPlayerScores({});

      if (roomCode) {
        navigate(`/game/${roomCode}`);
      }
    };

    socket.on('player_answered', handlePlayerAnswered);
    socket.on('answer_result', handleAnswerResult);
    socket.on('question_ended', handleQuestionEnded);
    socket.on('game_started', handleGameStarted);

    return () => {
      socket.off('player_answered', handlePlayerAnswered);
      socket.off('answer_result', handleAnswerResult);
      socket.off('question_ended', handleQuestionEnded);
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, roomCode, navigate, setGameStatus]);

  const handleSelectOption = (optionId: string) => {
    if (!hasAnswered && timeRemaining > 0) {
      setSelectedOption(optionId);
      setHasAnswered(true);
      submitAnswer(optionId);
    }
  };

  const getOptionClassName = (optionId: string): string => {
    const isSelected = selectedOption === optionId;
    const isCorrect = optionId === correctAnswer;

    if (!shouldShowCorrectAnswer) {
      return isSelected ? 'quiz-option selected' : 'quiz-option';
    }

    if (isCorrect) {
      return 'quiz-option correct';
    }

    if (isSelected && !isCorrect) {
      return 'quiz-option incorrect';
    }

    return 'quiz-option';
  };

  const renderOptions = () => {
    // For options in array format
    if (Array.isArray(options)) {
      return options.map((option: Option, index: number) => (
        <motion.div
          key={option.id || `option-${index}`}
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
      ));
    }
    // For options in object format
    else if (options && typeof options === 'object') {
      return Object.entries(options).map(([key, value], index) => (
        <motion.div
          key={key || `option-${index}`}
          className={getOptionClassName(key)}
          onClick={() => handleSelectOption(key)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={!hasAnswered ? { scale: 1.05 } : {}}
          whileTap={!hasAnswered ? { scale: 0.98 } : {}}
        >
          {String(value)}
        </motion.div>
      ));
    }

    return <div className='error-message'>Waiting for options...</div>;
  };

  // Loading screen if no question
  if (!currentQuestion) {
    return (
      <div className='quiz-loading'>
        <h2>Waiting for the quiz to start...</h2>
        <div className='loading-spinner'></div>
      </div>
    );
  }

  const getCorrectAnswerText = () => {
    if (Array.isArray(options)) {
      const correctOption = options.find((opt) => opt.id === correctAnswer);
      return correctOption ? correctOption.text : 'Unknown';
    } else if (options && typeof options === 'object' && correctAnswer) {
      return options[correctAnswer] || 'Unknown';
    }
    return 'Unknown';
  };

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

        {/* Audio player if available */}
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
        <AnimatePresence>{renderOptions()}</AnimatePresence>
      </div>

      {/* Results overlay when answer is revealed */}
      <AnimatePresence>
        {shouldShowCorrectAnswer && (
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
              <div className='correct-answer'>{getCorrectAnswerText()}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player answers visualization */}
      <div className='player-answers'>
        {players &&
          players.map((player) => {
            const playerId = player.playerId || player.id;
            const hasPlayerAnswered = answeredPlayers.has(playerId);

            return (
              <div
                key={playerId}
                className={`player-answer ${
                  hasPlayerAnswered ? 'answered' : ''
                }`}
              >
                <div className='player-avatar'>
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <span className='player-name'>{player.nickname}</span>
                {playerScores[playerId] !== undefined && (
                  <span className='player-score'>
                    Score: {playerScores[playerId]}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default QuizGameView;
