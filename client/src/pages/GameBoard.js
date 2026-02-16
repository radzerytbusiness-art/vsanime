import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/GameBoard.css';
import '../styles/pages/GameBoardExtras.css';
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

export default function GameBoard({ roomId, playerRole, playerId, socket, onReset }) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reorganizingRole, setReorganizingRole] = useState(null);
  const [showCharacterCard, setShowCharacterCard] = useState(true);
  const [showReorganizeCard, setShowReorganizeCard] = useState(true);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    console.log('🎮 GameBoard montado - RoomID:', roomId, 'PlayerRole:', playerRole, 'PlayerID:', playerId);

    // Esperar evento GAME_STARTED
    socket.on('GAME_STARTED', (data) => {
      console.log('✅ Juego iniciado!', data);
      setGameState(data.gameState);
      setLoading(false);
    });

    socket.on('GAME_STATE', (data) => {
      console.log('📊 Estado del juego recibido:', data);
      setGameState(data.gameState);
      setLoading(false);
    });

    socket.on('CHARACTER_DRAWN', (data) => {
      console.log('🎴 Personaje robado:', data.character);
      setGameState(data.gameState);
      setCurrentCharacter(data.character);
      setShowCharacterCard(true);
    });

    socket.on('CHARACTER_ASSIGNED', (data) => {
      console.log('✅ Personaje asignado');
      setGameState(data.gameState);
      setCurrentCharacter(null);
      setShowCharacterCard(true);
    });

    socket.on('CHARACTER_SKIPPED', (data) => {
      console.log('⏭️ Personaje saltado');
      setGameState(data.gameState);
      if (data.newCharacter) {
        setCurrentCharacter(data.newCharacter);
        setShowCharacterCard(true);
      } else {
        setCurrentCharacter(null);
      }
    });

    socket.on('REORGANIZED', (data) => {
      console.log('🔄 Reorganizado');
      setGameState(data.gameState);
      setReorganizingRole(null);
    });

    socket.on('REORGANIZE_SKIPPED', (data) => {
      console.log('⏭️ Reorganizar saltado');
      setGameState(data.gameState);
      setShowReorganizeCard(true);
    });

    socket.on('GAME_FINISHED', (data) => {
      console.log('🏁 Juego terminado');
      setGameState(data.gameState);
      setShowGameEndModal(true);
    });

    socket.on('PLAYER_DISCONNECTED', (data) => {
      setError(data.message);
    });

    socket.on('ERROR', (errorData) => {
      console.error('❌ Error:', errorData);
      setError(errorData.message || 'Error desconocido');
      setTimeout(() => setError(null), 5000);
    });

    // Solicitar estado inicial con delay para dar tiempo a que el juego inicie
    setTimeout(() => {
      socket.emit('GAME_STATE_REQUEST', { roomId });
    }, 500);

    return () => {
      socket.off('GAME_STARTED');
      socket.off('GAME_STATE');
      socket.off('CHARACTER_DRAWN');
      socket.off('CHARACTER_ASSIGNED');
      socket.off('CHARACTER_SKIPPED');
      socket.off('REORGANIZED');
      socket.off('REORGANIZE_SKIPPED');
      socket.off('GAME_FINISHED');
      socket.off('PLAYER_DISCONNECTED');
      socket.off('ERROR');
    };
  }, [roomId, socket, playerRole, playerId]);

  const handleDrawCharacter = () => {
    console.log('🎴 Robando personaje...');
    socket.emit('DRAW_CHARACTER', { roomId });
  };

  const handleAssignCharacter = (role) => {
    console.log('✅ Asignando personaje a', role);
    socket.emit('ASSIGN_CHARACTER', { roomId, role });
  };

  const handleSkipCharacter = () => {
    console.log('⏭️ Saltando personaje...');
    socket.emit('SKIP_CHARACTER', { roomId });
  };

  const handleReorganizeSelect = (role) => {
    if (!reorganizingRole) {
      setReorganizingRole(role);
    } else if (reorganizingRole === role) {
      setReorganizingRole(null);
    } else {
      console.log('🔄 Reorganizando:', reorganizingRole, '↔', role);
      socket.emit('REORGANIZE', { roomId, roleA: reorganizingRole, roleB: role });
      setReorganizingRole(null);
    }
  };

  const handleSkipReorganize = () => {
    console.log('⏭️ Saltando reorganizar...');
    socket.emit('SKIP_REORGANIZE', { roomId });
  };

  const handleReset = () => {
    // Emitir evento para abandonar la sala
    if (roomId) {
      console.log('🚪 Abandonando sala:', roomId);
      socket.emit('LEAVE_ROOM', { roomId });
    }
    
    if (onReset) onReset();
    navigate('/');
  };

  const handleRestartGame = () => {
    setError('La revancha aún no está implementada en modo online');
    setShowGameEndModal(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando juego...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Esperando estado del juego...</p>
      </div>
    );
  }

  // Determinar datos del jugador
  const isPlayer1 = playerRole === 'PLAYER_1';
  const myPlayerData = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponentData = isPlayer1 ? gameState.player2 : gameState.player1;
  const isMyTurn = gameState.currentPlayer === (isPlayer1 ? 1 : 2);
  const canSkip = !myPlayerData.specialActionUsed && currentCharacter && isMyTurn;
  const isReorganizePhase = gameState.reorganizePhase;

  // Determinar quién debe reorganizar
  let isMyReorganizeTurn = false;
  let reorganizePlayerNumber = null;
  
  if (isReorganizePhase && gameState.reorganizePlayer) {
    isMyReorganizeTurn = gameState.reorganizePlayer === myPlayerData.id;
    reorganizePlayerNumber = gameState.reorganizePlayer === gameState.player1.id ? 1 : 2;
  }

  return (
    <div className="gameboard-container">
      <div className="gameboard-background"></div>

      <header className="gameboard-header">
        <div className="turn-indicator">
          <span className="material-icons">info</span>
          <span className="turn-text">
            {isReorganizePhase 
              ? `Fase Reorganizar - Jugador ${reorganizePlayerNumber}`
              : `Turno: Jugador ${gameState.currentPlayer}`
            }
          </span>
          <div className="timer">∞</div>
        </div>
      </header>

      {/* Tarjeta de personaje actual */}
      {currentCharacter && isMyTurn && showCharacterCard && (
        <div className="current-character-display">
          <div className="character-card">
            <button 
              className="btn-hide-card" 
              onClick={() => setShowCharacterCard(false)}
              title="Ocultar"
            >
              <span className="material-icons">visibility_off</span>
            </button>
            <img 
              src={`/assets/images/characters/${currentCharacter.name.toLowerCase().replace(/\s+/g, '_')}.jpg`} 
              alt={currentCharacter.name}
              onError={(e) => e.target.src = '/assets/images/characters/placeholder.jpg'}
            />
            <h3>{currentCharacter.name}</h3>
            <p>{currentCharacter.anime}</p>
            {canSkip && (
              <button className="btn-skip" onClick={handleSkipCharacter}>
                <span>Saltar</span>
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante para mostrar personaje */}
      {currentCharacter && !showCharacterCard && isMyTurn && (
        <button 
          className="btn-show-card-float" 
          onClick={() => setShowCharacterCard(true)}
          title="Ver personaje"
        >
          <span className="material-icons">visibility</span>
          <span>Ver Personaje</span>
        </button>
      )}

      {/* Instrucciones para reorganizar */}
      {isReorganizePhase && isMyReorganizeTurn && showReorganizeCard && (
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
            <h4 style={{color: 'white', margin: '10px 0'}}>Tu turno</h4>
            
            {myPlayerData.canReorganize ? (
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

      {/* Botón flotante reorganizar */}
      {isReorganizePhase && isMyReorganizeTurn && !showReorganizeCard && (
        <button 
          className="btn-show-card-float" 
          onClick={() => setShowReorganizeCard(true)}
          title="Ver reorganizar"
        >
          <span className="material-icons">swap_horiz</span>
          <span>Ver Reorganizar</span>
        </button>
      )}

      <main className="gameboard-main">
        <div className="game-board-grid">
          {/* Columna Jugador 1 */}
          <div className="player-column player1">
            {ROLES.map((role) => {
              const char = gameState.player1.board[role];
              const canClick = !isReorganizePhase && isPlayer1 && isMyTurn && currentCharacter && !char;
              const canReorganizeClick = isReorganizePhase && isPlayer1 && isMyReorganizeTurn && char && myPlayerData.canReorganize;
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
                  isDimmed={!isPlayer1 && !isReorganizePhase && !isGameEnd}
                  style={isSelected ? { border: '3px solid #ffd700', boxShadow: '0 0 20px #ffd700' } : {}}
                />
              );
            })}
          </div>

          {/* Roles */}
          <div className="role-divider">
            {ROLES.map((role) => (
              <RoleLabel key={role} role={role} icon={ROLE_ICONS[role]} />
            ))}
          </div>

          {/* Columna Jugador 2 */}
          <div className="player-column player2">
            {ROLES.map((role) => {
              const char = gameState.player2.board[role];
              const canClick = !isReorganizePhase && !isPlayer1 && isMyTurn && currentCharacter && !char;
              const canReorganizeClick = isReorganizePhase && !isPlayer1 && isMyReorganizeTurn && char && myPlayerData.canReorganize;
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
                  isDimmed={isPlayer1 && !isReorganizePhase && !isGameEnd}
                  style={isSelected ? { border: '3px solid #ffd700', boxShadow: '0 0 20px #ffd700' } : {}}
                />
              );
            })}
          </div>
        </div>
      </main>

      <footer className="gameboard-footer">
        <div className="action-buttons">
          {/* Fase normal - Robar personaje */}
          {!isReorganizePhase && !currentCharacter && isMyTurn && gameState.state !== 'GAME_END' && (
            <button className="btn-primary" onClick={handleDrawCharacter}>
              <span className="material-icons">style</span>
              <span>ROBAR PERSONAJE</span>
            </button>
          )}

          {/* Fase de reorganizar - Saltar */}
          {isReorganizePhase && isMyReorganizeTurn && myPlayerData.canReorganize && (
            <button className="btn-secondary" onClick={handleSkipReorganize}>
              <span>NO REORGANIZAR</span>
              <span className="material-icons">close</span>
            </button>
          )}

          {/* Botón REVANCHA cuando termina */}
          {gameState.state === 'GAME_END' && (
            <button className="btn-primary btn-restart-footer" onClick={handleRestartGame}>
              <span className="material-icons">refresh</span>
              <span>REVANCHA</span>
            </button>
          )}

          <button className="btn-action info-btn" onClick={() => setShowInfoModal(true)}>
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

      {/* Toast de error */}
      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Modal de Información del Juego */}
      {showInfoModal && (
        <div className="game-end-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="game-end-modal info-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn" 
              onClick={() => setShowInfoModal(false)}
              title="Cerrar"
            >
              <span className="material-icons">close</span>
            </button>
            
            <div className="modal-glow-effect"></div>
            
            <div className="modal-header">
              <h1 className="modal-title">¿CÓMO JUGAR?</h1>
              <div className="modal-divider"></div>
            </div>

            <div className="modal-content info-content">
              <div className="info-section">
                <h3>🎯 Objetivo</h3>
                <p>Completa tu tablero de 6 personajes. Cada personaje debe ocupar un rol específico y al final se evaluará qué personaje es mejor en base al rol y la propia fuerza del personaje.</p>
              </div>

              <div className="info-section">
                <h3>⚔️ Roles del Tablero</h3>
                <p>El tablero cuenta con 6 roles:<br/>
                <strong>Capitán:</strong> Líder del equipo<br/>
                <strong>Vice-Capitán:</strong> Segunda al mando<br/>
                <strong>Tanque:</strong> Defensor<br/>
                <strong>Healer:</strong> Sanador<br/>
                <strong>Soporte 1 y 2:</strong> Apoyo</p>
              </div>

              <div className="info-section">
                <h3>🎴 Turnos</h3>
                <p>1. Roba un personaje de la bolsa<br/>
                2. Asigna el personaje a un rol vacío de tu tablero<br/>
                3. Opcional: Usa "Saltar" (solo 1 vez por partida) para cambiar de personaje. Si lo haces, no podrás usar tu opción de reorganizar.</p>
              </div>

              <div className="info-section">
                <h3>🔄 Fase de Reorganizar</h3>
                <p>Después de asignar, puedes intercambiar 1 personaje de posición en tu tablero. Si usaste "Saltar", no puedes reorganizar.</p>
              </div>

              <div className="info-section">
                <h3>🏆 Victoria</h3>
                <p>Se debate quién tiene un mejor equipo en base a sus roles y capacidades. El público o participantes votan por cada rol, el que tenga más puntos gana.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn btn-close" onClick={() => setShowInfoModal(false)}>
                <span className="material-icons">check_circle</span>
                <span>ENTENDIDO</span>
              </button>
            </div>
          </div>
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
                  <span className="stat-value">{gameState.turnCount || 0}</span>
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