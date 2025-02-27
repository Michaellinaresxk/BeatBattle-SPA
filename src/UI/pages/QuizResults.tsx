import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../../context/QuixContext';

const QuizResults: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { gameResults, players, leaveRoom } = useQuiz();

  if (!gameResults) {
    return (
      <div className='quiz-loading'>
        <h2>Loading results...</h2>
        <div className='loading-spinner'></div>
      </div>
    );
  }

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = gameResults[a.playerId]?.score || 0;
    const scoreB = gameResults[b.playerId]?.score || 0;
    return scoreB - scoreA;
  });

  const handlePlayAgain = () => {
    navigate('/');
    leaveRoom();
  };

  const handleNewCategory = () => {
    navigate('/categories');
    leaveRoom();
  };

  return (
    <div className='results-screen'>
      <h1 className='title'>
        <span className='category-name'>Music Quiz</span>
        <span>Final Results</span>
      </h1>

      <div className='results-container'>
        {sortedPlayers.length > 0 && (
          <motion.div
            className='winner-spotlight'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='winner-crown'>👑</div>
            <div className='winner-avatar'>
              {sortedPlayers[0].nickname.charAt(0).toUpperCase()}
            </div>
            <h2 className='winner-name'>{sortedPlayers[0].nickname}</h2>
            <div className='winner-score'>
              {gameResults[sortedPlayers[0].playerId]?.score || 0} points
            </div>
          </motion.div>
        )}

        <div className='results-list'>
          <h2 className='subtitle'>Leaderboard</h2>

          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.playerId}
              className='result-row'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className='position'>{index + 1}</div>
              <div className='player-result-avatar'>
                {player.nickname.charAt(0).toUpperCase()}
              </div>
              <div className='player-result-name'>{player.nickname}</div>
              <div className='player-result-score'>
                {gameResults[player.playerId]?.score || 0}
              </div>
              {index < 3 && (
                <div className='medal'>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className='results-actions'>
        <motion.button
          className='action-button play-again'
          onClick={handlePlayAgain}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Play Again
        </motion.button>

        <motion.button
          className='action-button new-category'
          onClick={handleNewCategory}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          New Category
        </motion.button>
      </div>
    </div>
  );
};

export default QuizResults;
