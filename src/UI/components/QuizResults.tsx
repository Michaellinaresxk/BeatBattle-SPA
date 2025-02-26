import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizSocket } from '../../hooks/useQuizSocket';
import { Player } from '../../types/player';

interface PlayerStats {
  correct: number;
  wrong: number;
  score: number;
}

const QuizResults: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { players, gameResults, resetGame } = useQuizSocket();

  // Sort players by score
  const sortedPlayers = [...players].sort((a: Player, b: Player) => {
    const scoreA = gameResults?.[a.playerId]?.score || 0;
    const scoreB = gameResults?.[b.playerId]?.score || 0;
    return scoreB - scoreA;
  });

  // Play again handler
  const handlePlayAgain = () => {
    resetGame();
    if (roomCode) {
      navigate(`/room/${roomCode}`);
    }
  };

  // Go home handler
  const handleGoHome = () => {
    resetGame();
    navigate('/');
  };

  // Calculate stats per player
  const getPlayerStats = (playerId: string): PlayerStats => {
    if (!gameResults || !gameResults[playerId]) {
      return { correct: 0, wrong: 0, score: 0 };
    }

    const playerResult = gameResults[playerId];
    return {
      correct: playerResult.correctAnswers || 0,
      wrong: playerResult.wrongAnswers || 0,
      score: playerResult.score || 0,
    };
  };

  return (
    <div className='results-screen'>
      <div className='results-wave-container'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 1440 320'
          className='results-wave'
        >
          <path
            fill='#8A2BE2'
            fillOpacity='0.7'
            d='M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,128C960,107,1056,117,1152,133.3C1248,149,1344,171,1392,181.3L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'
          ></path>
        </svg>
      </div>

      <motion.div
        className='results-content'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className='results-title'
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Quiz Results
        </motion.h1>

        <div className='leaderboard'>
          {sortedPlayers.map((player: Player, index: number) => {
            const stats = getPlayerStats(player.playerId);
            const isWinner = index === 0;

            return (
              <motion.div
                key={player.playerId}
                className={`player-result-card ${isWinner ? 'winner' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <div className='player-rank'>#{index + 1}</div>

                <div className='player-result-avatar'>
                  {player.nickname.charAt(0).toUpperCase()}
                  {isWinner && <div className='crown'>👑</div>}
                </div>

                <div className='player-result-info'>
                  <h3>{player.nickname}</h3>
                  <div className='player-stats'>
                    <div className='stat'>
                      <span className='stat-value'>{stats.score}</span>
                      <span className='stat-label'>points</span>
                    </div>
                    <div className='stat'>
                      <span className='stat-value'>{stats.correct}</span>
                      <span className='stat-label'>correct</span>
                    </div>
                    <div className='stat'>
                      <span className='stat-value'>{stats.wrong}</span>
                      <span className='stat-label'>wrong</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className='action-buttons'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button className='results-button primary' onClick={handlePlayAgain}>
            Play Again
          </button>
          <button className='results-button secondary' onClick={handleGoHome}>
            Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default QuizResults;
