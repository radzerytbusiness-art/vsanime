import React, { useState, useEffect } from 'react';
import '../styles/pages/GameBoard.css';
import CharacterSlot from '../components/CharacterSlot';
import RoleLabel from '../components/RoleLabel';
import '../styles/pages/GameBoardExtras.css';

const ROLES = ['CAPITAN', 'VICE_CAPITAN', 'TANQUE', 'HEALER', 'SOPORTE', 'SOPORTE_2'];
const ROLE_ICONS = {
  CAPITAN: 'stars',
  VICE_CAPITAN: 'security',
  TANQUE: 'shield',
  HEALER: 'favorite',
  SOPORTE: 'bolt',
  SOPORTE_2: 'auto_fix_high'
};

export default function GameBoard({ roomId, playerRole, socket, onReset }) {
  const [gameState, setGameState] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Escuchar cuando la sala está llena
    socket.on('ROOM_FULL', (data) => {
      console.log('Sala llena, esperando inicio del juego...');
      setWaitingForOpponent(true);
    });

    // Escuchar cuando el juego inicia
    socket.on('GAME_STARTED', (data) => {
      console.log('¡Juego iniciado!');
      setGameState(data.gameState);
      setGameStarted(true);
      setWaitingForOpponent(false);
      setLoading(false);
    });

    socket.on('GAME_STATE', (data) => {
      setGameState(data.gameState);
      setLoading(false);
    });

    socket.on('CHARACTER_DRAWN', (data) => {
      setGameState(data.gameState);
      setCurrentCharacter(data.character);
    });

    socket.on('CHARACTER_ASSIGNED', (data) => {
      setGameState(data.gameState);
      setCurrentCharacter(null);
    });

    socket.on('CHARACTER_SKIPPED', (data) => {
      setGameState(data.gameState);
      if (data.newCharacter) {
        setCurrentCharacter(data.newCharacter);
      } else {
        setCurrentCharacter(null);
      }
    });

    socket.on('REORGANIZED', (data) => {
      setGameState(data.gameState);
    });

    socket.on('TURN_ENDED', (data) => {
      setGameState(data.gameState);
      setCurrentCharacter(null);
    });

    socket.on('GAME_FINISHED', (data) => {
      setGameState(data.gameState);
      setError('¡Juego terminado!');
    });

    socket.on('PLAYER_DISCONNECTED', (data) => {
      setError(data.message);
      setTimeout(() => {
        onReset();
      }, 3000);
    });

    socket.on('ERROR', (errorData) => {
      setError(errorData.message || 'Error desconocido');
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off('ROOM_FULL');
      socket.off('GAME_STARTED');
      socket.off('GAME_STATE');
      socket.off('CHARACTER_DRAWN');
      socket.off('CHARACTER_ASSIGNED');
      socket.off('CHARACTER_SKIPPED');
      socket.off('REORGANIZED');
      socket.off('TURN_ENDED');
      socket.off('GAME_FINISHED');
      socket.off('PLAYER_DISCONNECTED');
      socket.off('ERROR');
    };
  }, [roomId, socket, onReset]);

  const handleDrawCharacter = () => {
    socket.emit('DRAW_CHARACTER', { roomId });
  };

  const handleAssignCharacter = (role) => {
    if (!currentCharacter) return;
    socket.emit('ASSIGN_CHARACTER', { roomId, role });
  };

  const handleSkip = () => {
    if (!currentCharacter) return;
    socket.emit('SKIP_CHARACTER', { roomId });
  };

  const handleReorganize = (roleA, roleB) => {
    socket.emit('REORGANIZE', { roomId, roleA, roleB });
  };

  const handleEndTurn = () => {
    socket.emit('END_TURN', { roomId });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>{waitingForOpponent ? 'Esperando al otro jugador...' : 'Cargando juego...'}</p>
      </div>
    );
  }

  if (!gameState || !gameStarted) {
    return (
      <div className="loading-screen">
        <p>Esperando inicio del juego...</p>
      </div>
    );
  }

  const isPlayer1 = playerRole === 'PLAYER_1';
  const playerData = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponentData = isPlayer1 ? gameState.player2 : gameState.player1;
  const isCurrentTurn = gameState.currentPlayer === (isPlayer1 ? 1 : 2);

  return (
    <div className="gameboard-container">
      <div className="gameboard-background">
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      <header className="gameboard-header">
        <div className="turn-indicator">
          <span className="material-icons">info</span>
          <span className="turn-text">
            {isCurrentTurn ? '¡Tu turno!' : `Turno de ${isPlayer1 ? 'Jugador 2' : 'Jugador 1'}`}
          </span>
          <div className="timer">15s</div>
        </div>
      </header>

      <div className="player-stats">
        <div className="player-info my-player">
          <div className="player-avatar">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDFAemZeqVkz_L_HhTv1eNHJG7Lk1gfevv1B8yHz8-mwT494KhaLFKLoEKtCRHjiyPvo8-jgSRaDXnYtDnI2qpFQ0P5H8tNaGS3OKpE08GfOO3CDG079jQBd0vZnpXQDoyRX6OJblNN3jZX-xPd8EGG9LqzHxBErmt_H6XSrhMzIzr7Q-eKkFgz3gwIhvR3NkcwkEUVycn2x93WTq90wZwwmI4EGOfAFydqZAQYSdIfC8otyVYjiy-vjQac_AaxOL1wf542QtJ0MDI"
              alt="Player"
            />
            {isCurrentTurn && <div className="status-online"></div>}
          </div>
          <div className="player-details">
            <p className="player-status">{isCurrentTurn ? 'Tu turno' : 'Esperando...'}</p>
            <div className="player-progress">
              <div className="progress-bar" style={{ width: `${(Object.values(playerData.board).filter(x => x).length / 6) * 100}%` }}></div>
            </div>
            <p className="player-level">
              {Object.values(playerData.board).filter(x => x).length}/6 personajes
            </p>
          </div>
        </div>

        <div className="player-info opponent-player">
          <div className="player-avatar">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmkejpwvDq4lxvVD5x4VqsDJb0-vcFw9GuUrnccemxYWgvY_bqBcXqV8Py4NuRKfIKxEmum71oVvCV6tECD_-kekIWuJY9H1PUUuw2WBbBNQiwHK_7iQ-Wssg85cKL_Z0NJhh5RG0EK8-skS0GhdqVI9tRyWIz6dJzG7PNnBGZno_lE3-PkI6NBQ-zBHWKE7ajigrzvkG_9eZEgHp6hjbKggFBNWztFyAgwMCSNWzg3cd-7eZPPcslgakXoWCb7hp-Ivg49csGvDPf"
              alt="Opponent"
            />
          </div>
          <div className="player-details text-right">
            <p className="player-status opponent-status">
              {!isCurrentTurn ? 'Su turno' : 'Esperando...'}
            </p>
            <div className="player-progress">
              <div className="progress-bar opponent" style={{ width: `${(Object.values(opponentData.board).filter(x => x).length / 6) * 100}%` }}></div>
            </div>
            <p className="player-level">
              {Object.values(opponentData.board).filter(x => x).length}/6 personajes
            </p>
          </div>
        </div>
      </div>

      {/* Mostrar personaje actual si es tu turno */}
      {isCurrentTurn && currentCharacter && (
        <div className="current-character-display">
          <div className="character-card">
            <img src={currentCharacter.image} alt={currentCharacter.name} />
            <h3>{currentCharacter.name}</h3>
            <p>Selecciona un rol para asignar</p>
            {!playerData.specialActionUsed && (
              <button className="btn-skip" onClick={handleSkip}>
                <span className="material-icons">skip_next</span>
                Saltar personaje
              </button>
            )}
          </div>
        </div>
      )}

      <main className="gameboard-main">
        <div className="game-board-grid">
          {/* Lado del jugador */}
          <div className="player-column player1">
            {ROLES.map((role) => (
              <CharacterSlot
                key={role}
                character={playerData.board[role]}
                isActive={isCurrentTurn && currentCharacter && !playerData.board[role]}
                onClick={() => isCurrentTurn && currentCharacter && handleAssignCharacter(role)}
              />
            ))}
          </div>

          {/* Divisor central con roles */}
          <div className="role-divider">
            {ROLES.map((role) => (
              <RoleLabel key={role} role={role} icon={ROLE_ICONS[role]} />
            ))}
          </div>

          {/* Lado del oponente */}
          <div className="player-column player2">
            {ROLES.map((role) => (
              <CharacterSlot
                key={role}
                character={opponentData.board[role]}
                isActive={false}
                isDimmed={true}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="gameboard-footer">
        <div className="action-buttons">
          <button className="btn-action info-btn">
            <span className="material-icons">info</span>
          </button>

          {isCurrentTurn && !currentCharacter && (
            <button 
              className="btn-primary" 
              onClick={handleDrawCharacter}
              disabled={gameState.state === 'GAME_END'}
            >
              <span className="material-icons">style</span>
              <span>ROBAR PERSONAJE</span>
            </button>
          )}

          {isCurrentTurn && currentCharacter && (
            <button
              className="btn-primary"
              onClick={handleEndTurn}
              disabled={gameState.state === 'GAME_END'}
            >
              <span>TERMINAR TURNO</span>
              <span className="material-icons">east</span>
            </button>
          )}

          <button className="btn-action history-btn">
            <span className="material-icons">history_edu</span>
          </button>
        </div>
      </footer>

      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="game-info">
        <p>Personajes restantes: {gameState.bagRemaining}</p>
        <p>Turno #{gameState.turnCount}</p>
        {playerData.specialActionUsed && (
          <p className="special-used">⚠️ Acción especial usada</p>
        )}
      </div>
    </div>
  );
}
