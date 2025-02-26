import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizSocket } from '../../hooks/useQuizSocket';

function QuizDisplay() {
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('setup');
  const { roomCode, players, playerAnswers, createRoom } = useQuizSocket();

  React.useEffect(() => {
    if (roomCode) {
      setGameState('waiting');
      navigate(`/room/${roomCode}`, { replace: true });
    }
  }, [roomCode, navigate]);

  if (gameState === 'setup') {
    return (
      <div className='setup-screen'>
        <h1>Quiz Game</h1>
        <p>Create a new room to play with friends</p>
        <button className='quizButton' onClick={createRoom}>
          Create Room
        </button>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className='waiting-room'>
        <h1 className='title'>Waiting Room</h1>
        <div className='room-code'>
          <h2 className='subtitle'>Room Code</h2>
          <div className='code-display'>{roomCode}</div>
          <p>Share this code with your friends</p>
        </div>

        <div className='players-list'>
          <h2 className='title'>Players ({players.length})</h2>
          <div className='players-grid'>
            {players.map((player) => (
              <div key={player.playerId} className='player-card'>
                <div className='player-avatar'>
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <p className='player-name'>
                  {player.nickname} {player.isHost ? '(Host)' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div>Unmanaged condition: {gameState}</div>;
}

export default QuizDisplay;
