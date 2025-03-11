'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../../context/QuixContext';
import { motion } from 'framer-motion';

const QuizResults: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { gameResults, players, leaveRoom, socket, requestGameResults } =
    useQuiz();

  const [sortedResults, setSortedResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Request game results when component mounts
  useEffect(() => {
    console.log('QuizResults component mounted');
    console.log('Room code:', roomCode);
    console.log('Initial game results:', gameResults);
    console.log('Players:', players);

    if (socket && roomCode) {
      console.log('Requesting game results for room:', roomCode);
      // Use the requestGameResults function from context if available
      if (typeof requestGameResults === 'function') {
        requestGameResults();
      } else {
        // Fallback: emit the event directly
        socket.emit('request_game_results', { roomCode });
      }
    }

    // Set a timeout to stop showing loading state even if results don't arrive
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [roomCode, socket, requestGameResults]);

  // Process results whenever gameResults or players change
  useEffect(() => {
    if (!gameResults && !players?.length) return;

    setIsLoading(false);

    // Create a combined array of player results
    const resultsArray = [];

    // First add all players from the gameResults
    if (gameResults) {
      Object.entries(gameResults).forEach(([playerId, data]) => {
        resultsArray.push({
          id: playerId,
          nickname: data.nickname || 'Unknown',
          score: data.score || 0,
          correctAnswers: data.correctAnswers || 0,
          totalAnswers: data.totalAnswers || 0,
        });
      });
    }

    // Then add any players that might not be in gameResults but are in players array
    if (players && players.length) {
      players.forEach((player) => {
        const playerId = player.id || player.playerId;

        // Check if this player is already in resultsArray
        const existingIndex = resultsArray.findIndex((p) => p.id === playerId);

        if (existingIndex === -1 && playerId) {
          // Player not found in results, add them
          resultsArray.push({
            id: playerId,
            nickname: player.nickname || 'Unknown',
            score: player.score || 0,
            correctAnswers: player.correctAnswers || 0,
            totalAnswers:
              (player.correctAnswers || 0) + (player.wrongAnswers || 0) || 0,
          });
        } else if (existingIndex !== -1) {
          // Player found, update any missing data
          if (!resultsArray[existingIndex].nickname && player.nickname) {
            resultsArray[existingIndex].nickname = player.nickname;
          }

          // If player has score but results don't, use player's score
          if (resultsArray[existingIndex].score === 0 && player.score) {
            resultsArray[existingIndex].score = player.score;
          }
        }
      });
    }

    // Sort by score (highest first)
    const sorted = [...resultsArray].sort((a, b) => b.score - a.score);
    console.log('Sorted results:', sorted);
    setSortedResults(sorted);
  }, [gameResults, players]);

  const handlePlayAgain = () => {
    navigate('/');
    leaveRoom();
  };

  const handleNewCategory = () => {
    navigate('/categories');
    leaveRoom();
  };

  if (isLoading) {
    return (
      <div className='quiz-loading'>
        <h2>Loading results...</h2>
        <p>Calculating final scores...</p>
        <div className='loading-spinner'></div>
      </div>
    );
  }

  if (sortedResults.length === 0) {
    return (
      <div className='quiz-loading'>
        <h2>No results available</h2>
        <p>There seems to be an issue retrieving the game results.</p>
        <button className='action-button play-again' onClick={handlePlayAgain}>
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className='results-screen'>
      <h1 className='title'>
        <span className='category-name'>Quiz</span>
        <span>Final Results</span>
      </h1>

      <div className='results-container'>
        {sortedResults.length > 0 && (
          <motion.div
            className='winner-spotlight'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='winner-crown'>👑</div>
            <div className='winner-avatar'>
              {sortedResults[0].nickname.charAt(0).toUpperCase()}
            </div>
            <h2 className='winner-name'>{sortedResults[0].nickname}</h2>
            <div className='winner-score'>{sortedResults[0].score} points</div>
            <div className='winner-accuracy'>
              Correct answers: {sortedResults[0].correctAnswers}/
              {sortedResults[0].totalAnswers || sortedResults[0].correctAnswers}
            </div>
          </motion.div>
        )}

        <div className='results-list'>
          <h2 className='subtitle'>Leaderboard</h2>

          {sortedResults.map((player, index) => (
            <motion.div
              key={player.id || index}
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
              <div className='player-result-score'>{player.score}</div>
              <div className='player-result-accuracy'>
                {player.correctAnswers}/
                {player.totalAnswers || player.correctAnswers}
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
