import { FiPlay } from 'react-icons/fi';
import './GameControls.css';

export default function GameControls({ isHost, gameState, onStartGame, userCount }) {
    if (gameState) {
        return (
            <div className="game-controls">
                <div className="game-status">
                    <span className="game-status-dot"></span>
                    <span>Round {gameState.round || 1} / {gameState.maxRounds || 3}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="game-controls">
            <div className="game-lobby-info">
                <h4>🎮 Game Lobby</h4>
                <p>{userCount} player{userCount !== 1 ? 's' : ''} in room</p>
            </div>
            {isHost ? (
                <button
                    className="btn btn-primary start-game-btn"
                    onClick={onStartGame}
                    disabled={userCount < 2}
                >
                    <FiPlay /> Start Game
                </button>
            ) : (
                <p className="waiting-text">Waiting for host to start...</p>
            )}
            {isHost && userCount < 2 && (
                <p className="min-players-text">Need at least 2 players</p>
            )}
        </div>
    );
}
