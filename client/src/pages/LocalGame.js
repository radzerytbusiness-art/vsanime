import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/GameBoard.css';
import CharacterSlot from '../components/CharacterSlot';
import RoleLabel from '../components/RoleLabel';
import SocialLinks from '../components/SocialLinks';

const ROLES = ['CAPITAN', 'VICE_CAPITAN', 'TANQUE', 'HEALER', 'SOPORTE', 'SOPORTE_2'];
const ROLE_ICONS = {
  CAPITAN: 'stars',
  VICE_CAPITAN: 'security',
  TANQUE: 'shield',
  HEALER: 'favorite',
  SOPORTE: 'bolt',
  SOPORTE_2: 'auto_fix_high'
};

export default function LocalGame({ sessionId, socket, onStart, onReset }) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!sessionId);
  const [reorganizingRole, setReorganizingRole] = useState(null);
  const [showCharacterCard, setShowCharacterCard] = useState(true);
  const [showReorganizeCard, setShowReorganizeCard] = useState(true);
  const [showGameEndModal, setShowGameEndModal] = useState(false);

  useEffect(() => {
    // Verificar que el socket exista y esté conectado
    if (!socket) {
      setError('Error de conexión. Recarga la página.');
      setLoading(false);
      return;
    }

    const initializeGame = () => {
      if (!sessionId) {
        console.log('🎮 Iniciando juego local...');
        socket.emit('START_LOCAL_GAME');

        socket.once('LOCAL_GAME_STARTED', (data) => {
          console.log('✅ Juego local iniciado:', data);
          setGameState(data.gameState);
          if (onStart && typeof onStart === 'function') {
            onStart(data);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };

    // Si el socket ya está conectado, iniciar
    if (socket.connected) {
      initializeGame();
    } else {
      // Si no está conectado, esperar a que conecte
      console.log('⏳ Esperando conexión del servidor...');
      
      const connectHandler = () => {
        console.log('✅ Servidor conectado, iniciando juego...');
        initializeGame();
      };

      const errorHandler = () => {
        setError('No se pudo conectar al servidor');
        setLoading(false);
      };

      socket.once('connect', connectHandler);
      socket.once('connect_error', errorHandler);

      // Cleanup
      return () => {
        socket.off('connect', connectHandler);
        socket.off('connect_error', errorHandler);
      };
    }

    socket.on('CHARACTER_DRAWN', (data) => {
      setGameState(data.gameState);
      setCurrentCharacter(data.character);
      setShowCharacterCard(true); // Mostrar automáticamente
    });

    socket.on('CHARACTER_ASSIGNED', (data) => {
      setGameState(data.gameState);
      setCurrentCharacter(null);
      setShowCharacterCard(true);
    });

    socket.on('CHARACTER_SKIPPED', (data) => {
      setGameState(data.gameState);
      if (data.newCharacter) {
        setCurrentCharacter(data.newCharacter);
        setShowCharacterCard(true); // Mostrar automáticamente al saltar
      } else {
        setCurrentCharacter(null);
        setShowCharacterCard(true);
      }
    });

    socket.on('REORGANIZED', (data) => {
      setGameState(data.gameState);
      setReorganizingRole(null);
    });

    socket.on('REORGANIZE_SKIPPED', (data) => {
      setGameState(data.gameState);
      setShowReorganizeCard(true); // Mostrar automáticamente al pasar turno
    });

    socket.on('GAME_FINISHED', (data) => {
      setGameState(data.gameState);
      setShowGameEndModal(true);
    });

    socket.on('ERROR', (errorData) => {
      setError(errorData.message || 'Error desconocido');
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off('CHARACTER_DRAWN');
      socket.off('CHARACTER_ASSIGNED');
      socket.off('CHARACTER_SKIPPED');
      socket.off('REORGANIZED');
      socket.off('REORGANIZE_SKIPPED');
      socket.off('GAME_FINISHED');
      socket.off('ERROR');
    };
  }, [sessionId, socket, onStart]);

  const handleDrawCharacter = () => {
    if (!sessionId) return;
    socket.emit('LOCAL_DRAW_CHARACTER', { sessionId });
  };

  const handleAssignCharacter = (role) => {
    if (!sessionId || !currentCharacter) return;
    socket.emit('LOCAL_ASSIGN_CHARACTER', { sessionId, role });
  };

  const handleSkip = () => {
    if (!sessionId || !currentCharacter) return;
    socket.emit('LOCAL_SKIP_CHARACTER', { sessionId });
  };

  const handleReorganizeSelect = (role) => {
    if (!reorganizingRole) {
      // Primera selección
      setReorganizingRole(role);
    } else {
      // Segunda selección - hacer el swap
      socket.emit('LOCAL_REORGANIZE', { 
        sessionId, 
        roleA: reorganizingRole, 
        roleB: role 
      });
    }
  };

  const handleSkipReorganize = () => {
    if (!sessionId) return;
    socket.emit('LOCAL_SKIP_REORGANIZE', { sessionId });
  };

  const handleReset = () => {
    setGameState(null);
    setLoading(true);
    onReset();
    navigate('/');
  };

  const handleRestartGame = () => {
    setShowGameEndModal(false);
    setLoading(true);
    
    // Crear nueva sesión
    socket.emit('START_LOCAL_GAME');

    socket.once('LOCAL_GAME_STARTED', (data) => {
      setGameState(data.gameState);
      setCurrentCharacter(null);
      setReorganizingRole(null);
      setShowCharacterCard(true);
      setShowReorganizeCard(true);
      setLoading(false);
      
      // Llamar onStart solo si existe
      if (onStart && typeof onStart === 'function') {
        onStart(data);
      }
    });
  };

  if (loading) {
    return <div className="loading">Iniciando juego local...</div>;
  }

  if (!gameState) {
    return <div className="error">Error al cargar el juego</div>;
  }

  const isPlayer1Turn = gameState.currentPlayer === 1;
  const currentPlayerData = isPlayer1Turn ? gameState.player1 : gameState.player2;
  const opponentData = isPlayer1Turn ? gameState.player2 : gameState.player1;
  const canSkip = !currentPlayerData.specialActionUsed && currentCharacter;
  const isReorganizePhase = gameState.reorganizePhase;
  
  // En modo LOCAL, determinar quién debe reorganizar basado en el ID del backend
  let reorganizePlayerNumber = null;
  let reorganizePlayerData = null;
  
  if (isReorganizePhase && gameState.reorganizePlayer) {
    // Verificar si es player1 o player2 quien debe reorganizar
    if (gameState.reorganizePlayer === gameState.player1.id) {
      reorganizePlayerNumber = 1;
      reorganizePlayerData = gameState.player1;
    } else if (gameState.reorganizePlayer === gameState.player2.id) {
      reorganizePlayerNumber = 2;
      reorganizePlayerData = gameState.player2;
    }
    
    console.log('[FRONTEND DEBUG] Fase reorganizar activa');
    console.log('[FRONTEND DEBUG] reorganizePlayer (backend):', gameState.reorganizePlayer);
    console.log('[FRONTEND DEBUG] ¿Es Player 1?:', gameState.reorganizePlayer === gameState.player1.id);
    console.log('[FRONTEND DEBUG] ¿Es Player 2?:', gameState.reorganizePlayer === gameState.player2.id);
    console.log('[FRONTEND DEBUG] Debe reorganizar: Jugador', reorganizePlayerNumber);
  }

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
            {isReorganizePhase 
              ? `Fase Reorganizar - Turno Jugador ${reorganizePlayerNumber}`
              : `Turno: Jugador ${isPlayer1Turn ? '1' : '2'}`
            }
          </span>
          <div className="timer">∞</div>
        </div>
      </header>

      {/* Mostrar personaje actual (solo en fase normal) */}
      {!isReorganizePhase && currentCharacter && showCharacterCard && (
        <div className="current-character-display">
          <div className="character-card">
            <button 
              className="btn-hide-card" 
              onClick={() => setShowCharacterCard(false)}
              title="Ocultar tarjeta"
            >
              <span className="material-icons">visibility_off</span>
            </button>
            <img src={currentCharacter.image} alt={currentCharacter.name} />
            <h3>{currentCharacter.name}</h3>
            <p>Selecciona un rol para asignar</p>
            
            {canSkip && (
              <button className="btn-skip" onClick={handleSkip}>
                <span className="material-icons">skip_next</span>
                Saltar personaje (solo 1 vez)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante para mostrar la tarjeta cuando está oculta */}
      {!isReorganizePhase && currentCharacter && !showCharacterCard && (
        <button 
          className="btn-show-card-float" 
          onClick={() => setShowCharacterCard(true)}
          title="Mostrar personaje"
        >
          <span className="material-icons">visibility</span>
          <span>Ver Personaje</span>
        </button>
      )}

      {/* Instrucciones para reorganizar */}
      {isReorganizePhase && reorganizePlayerData && showReorganizeCard && (
        <div className="reorganize-instructions">
          <div className="reorganize-card">
            <button 
              className="btn-hide-card" 
              onClick={() => setShowReorganizeCard(false)}
              title="Ocultar"
            >
              <span className="material-icons">visibility_off</span>
            </button>
            <span className="material-icons">swap_horiz</span>
            <h3>Fase de Reorganizar</h3>
            <h4 style={{color: 'white', margin: '10px 0'}}>Jugador {reorganizePlayerNumber}</h4>
            
            {reorganizePlayerData.canReorganize ? (
              <>
                <p>
                  {reorganizingRole 
                    ? 'Selecciona el segundo personaje para intercambiar' 
                    : 'Selecciona dos personajes de tu tablero para intercambiar'
                  }
                </p>
                {reorganizingRole && (
                  <button className="btn-cancel" onClick={() => setReorganizingRole(null)}>
                    Cancelar selección
                  </button>
                )}
              </>
            ) : (
              <p>No puedes reorganizar porque usaste la acción de Saltar</p>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante para mostrar reorganizar cuando está oculto */}
      {isReorganizePhase && !showReorganizeCard && (
        <button 
          className="btn-show-card-float" 
          onClick={() => setShowReorganizeCard(true)}
          title="Mostrar reorganizar"
        >
          <span className="material-icons">swap_horiz</span>
          <span>Ver Reorganizar</span>
        </button>
      )}

      <main className="gameboard-main">
        <div className="game-board-grid">
          <div className="player-column player1">
            {ROLES.map((role) => {
              const char = gameState.player1.board[role];
              const canClick = !isReorganizePhase && isPlayer1Turn && currentCharacter && !char;
              const canReorganizeClick = isReorganizePhase && reorganizePlayerNumber === 1 && char && reorganizePlayerData?.canReorganize;
              const isSelected = reorganizingRole === role;
              const isGameEnd = gameState.state === 'GAME_END';

              return (
                <CharacterSlot
                  key={role}
                  character={char}
                  isActive={canClick || canReorganizeClick}
                  onClick={() => {
                    if (canClick) handleAssignCharacter(role);
                    if (canReorganizeClick) handleReorganizeSelect(role);
                  }}
                  isDimmed={!isPlayer1Turn && !isReorganizePhase && !isGameEnd}
                  style={isSelected ? { border: '3px solid #ffd700', boxShadow: '0 0 20px #ffd700' } : {}}
                />
              );
            })}
          </div>

          <div className="role-divider">
            {ROLES.map((role) => (
              <RoleLabel key={role} role={role} icon={ROLE_ICONS[role]} />
            ))}
          </div>

          <div className="player-column player2">
            {ROLES.map((role) => {
              const char = gameState.player2.board[role];
              const canClick = !isReorganizePhase && !isPlayer1Turn && currentCharacter && !char;
              const canReorganizeClick = isReorganizePhase && reorganizePlayerNumber === 2 && char && reorganizePlayerData?.canReorganize;
              const isSelected = reorganizingRole === role;
              const isGameEnd = gameState.state === 'GAME_END';

              return (
                <CharacterSlot
                  key={role}
                  character={char}
                  isActive={canClick || canReorganizeClick}
                  onClick={() => {
                    if (canClick) handleAssignCharacter(role);
                    if (canReorganizeClick) handleReorganizeSelect(role);
                  }}
                  isDimmed={isPlayer1Turn && !isReorganizePhase && !isGameEnd}
                  style={isSelected ? { border: '3px solid #ffd700', boxShadow: '0 0 20px #ffd700' } : {}}
                />
              );
            })}
          </div>
        </div>
      </main>

      <footer className="gameboard-footer">
        <div className="action-buttons">
          {/* Fase normal de juego */}
          {!isReorganizePhase && !currentCharacter && gameState.state !== 'GAME_END' && (
            <button className="btn-primary" onClick={handleDrawCharacter}>
              <span className="material-icons">style</span>
              <span>ROBAR PERSONAJE</span>
            </button>
          )}

          {/* Fase de reorganizar */}
          {isReorganizePhase && reorganizePlayerData?.canReorganize && (
            <button className="btn-secondary" onClick={handleSkipReorganize}>
              <span>NO REORGANIZAR</span>
              <span className="material-icons">close</span>
            </button>
          )}

          {/* Botón REVANCHA cuando termina el juego */}
          {gameState.state === 'GAME_END' && (
            <button className="btn-primary btn-restart-footer" onClick={handleRestartGame}>
              <span className="material-icons">refresh</span>
              <span>REVANCHA</span>
            </button>
          )}

          <button className="btn-action info-btn">
            <span className="material-icons">info</span>
          </button>

          <button className="btn-secondary" onClick={handleReset}>
            <span>SALIR</span>
            <span className="material-icons">exit_to_app</span>
          </button>
        </div>

        {/* Redes sociales */}
        <SocialLinks variant="footer-variant" />
      </footer>

      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Modal de Fin de Juego */}
      {showGameEndModal && gameState && gameState.state === 'GAME_END' && (
        <div className="game-end-overlay" onClick={() => setShowGameEndModal(false)}>
          <div className="game-end-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn" 
              onClick={() => setShowGameEndModal(false)}
              title="Cerrar"
            >
              <span className="material-icons">close</span>
            </button>
            
            <div className="modal-glow-effect"></div>
            
            <div className="modal-header">
              <h1 className="modal-title">¡FIN DE LA PARTIDA!</h1>
              <div className="modal-divider"></div>
            </div>

            <div className="modal-content">
              <div className="game-stats">
                <div className="stat-item">
                  <span className="stat-label">Turnos jugados</span>
                  <span className="stat-value">{gameState.turnCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Personajes usados</span>
                  <span className="stat-value">
                    {Object.values(gameState.player1.board).filter(x => x).length + 
                     Object.values(gameState.player2.board).filter(x => x).length}
                  </span>
                </div>
              </div>

              <div className="modal-message">
                Ambos tableros completados
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn btn-restart" onClick={handleRestartGame}>
                <span className="material-icons">refresh</span>
                <span>REVANCHA</span>
              </button>
              <button className="modal-btn btn-close" onClick={() => setShowGameEndModal(false)}>
                <span className="material-icons">visibility</span>
                <span>VER TABLERO</span>
              </button>
              <button className="modal-btn btn-home" onClick={handleReset}>
                <span className="material-icons">home</span>
                <span>INICIO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}