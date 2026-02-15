import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Home.css';

export default function Home({ onModeSelect, socket, onRoomCreated, onRoomJoined, socketError }) {
  const navigate = useNavigate();
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showOnlineOptions, setShowOnlineOptions] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);

  // Estados para crear/unirse sala
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdRoomData, setCreatedRoomData] = useState(null);

  const handlePlayClick = () => {
    setShowModeSelection(true);
  };

  const handleLocalVS = () => {
    onModeSelect('local');
    navigate('/local-game');
  };

  const handleOnlineMatch = () => {
    setShowOnlineOptions(true);
    setShowModeSelection(false);
  };

  const handleCreateRoom = () => {
    setShowOnlineOptions(false);
    setShowCreateRoom(true);
  };

  const handleJoinRoom = () => {
    setShowOnlineOptions(false);
    setShowJoinRoom(true);
  };

  const handleCreateRoomSubmit = (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Por favor ingresa un nombre para la sala');
      return;
    }
    setLoading(true);
    setError('');

    socket.emit('CREATE_ROOM', {
      roomName: roomName.trim(),
      password: password || null
    });

    socket.once('ROOM_CREATED', (data) => {
      console.log('✅ Sala creada:', data);
      setLoading(false);
      setCreatedRoomData(data);
      
      // Ocultar modal de crear y mostrar modal de espera
      setShowCreateRoom(false);
      setShowWaitingRoom(true);
      
      // Pasar los datos completos al App.js
      if (onRoomCreated) {
        onRoomCreated(data);
      }
    });

    socket.once('ERROR', (error) => {
      setLoading(false);
      setError(error.message || 'Error al crear la sala');
    });

    // Escuchar cuando la sala se llena
    socket.once('ROOM_FULL', () => {
      console.log('✅ Sala llena, iniciando juego...');
      setShowWaitingRoom(false);
      navigate('/game');
    });
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Por favor ingresa el nombre de la sala');
      return;
    }
    setLoading(true);
    setError('');

    socket.emit('JOIN_ROOM', {
      roomName: roomName.trim(),
      password: password || null
    });

    socket.once('ROOM_JOINED', (data) => {
      console.log('✅ Unido a sala:', data);
      setLoading(false);
      // Pasar los datos completos al App.js
      if (onRoomJoined) {
        onRoomJoined(data);
      }
      navigate('/game');
    });

    socket.once('ERROR', (error) => {
      setLoading(false);
      setError(error.message || 'Error al unirse a la sala');
    });
  };

  const handleBack = () => {
    setShowCreateRoom(false);
    setShowJoinRoom(false);
    setShowOnlineOptions(false);
    setShowModeSelection(false);
    setShowWaitingRoom(false);
    setRoomName('');
    setPassword('');
    setError('');
  };

  const handleCancelWaitingRoom = () => {
    if (createdRoomData) {
      socket.emit('LEAVE_ROOM', { roomId: createdRoomData.roomId });
    }
    setShowWaitingRoom(false);
    setCreatedRoomData(null);
    handleBack();
  };

  return (
    <div className="home-container">
      <div className="home-background">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ7BQPvtZSbFwTcdPT_4UDu9cIzpQqftyMlkk04WYLKrtaWGNrvTnXg2O3dyC-wCUB2JvjAFvlwsTCJaedkYdjDRG2kSFl1moOtITNOXZD42JN5JMoi_CMJKaUz3-705Vg90Yz9O6udmdsBgBxs1SBz1sOhDMlpXVs-lF0bZhzXEAIMpkWgz1B4ZRQz4Dk6EyzEEJ9dRmCaEjnrNplSpkyWaPJE5iHrPQnlCviZub40wIEevhOeftoAwK8UhQmR4RALcJcVtfF" 
          alt="Background"
          className="home-bg-image"
        />
        <div className="home-overlay"></div>
      </div>

      <div className="home-content">
        <header className="home-header">
          <div className="version-badge">Ver 1.0.4 Alpha</div>
        </header>

        <main className="home-main">
          {/* Título principal */}
          <div className="title-section">
            <h1 className="main-title">
              ANIME<span className="primary-text">VS</span>
            </h1>
            <div className="title-divider">
              <div className="divider-line"></div>
              <p className="subtitle">Competitive Arena</p>
              <div className="divider-line"></div>
            </div>
          </div>

          {/* Botón JUGAR principal */}
          {!showModeSelection && !showOnlineOptions && !showCreateRoom && !showJoinRoom && (
            <div className="play-button-container">
              <button className="play-button" onClick={handlePlayClick}>
                <div className="play-button-text">
                  <span className="play-label">START GAME</span>
                  <span className="play-title">JUGAR</span>
                </div>
                <div className="play-button-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </button>
            </div>
          )}

          {/* Selección de modo */}
          {showModeSelection && (
            <div className="mode-buttons fade-in">
              <button className="mode-btn online-btn" onClick={handleOnlineMatch}>
                <span className="material-icons">public</span>
                <span>Online Match</span>
              </button>
              <button className="mode-btn local-btn" onClick={handleLocalVS}>
                <span className="material-icons">desktop_windows</span>
                <span>Local VS</span>
              </button>
              <button className="mode-btn-back" onClick={handleBack}>
                <span className="material-icons">arrow_back</span>
                <span>Volver</span>
              </button>
            </div>
          )}

          {/* Opciones Online */}
          {showOnlineOptions && (
            <div className="online-options fade-in">
              <button className="online-option-btn" onClick={handleCreateRoom}>
                <span className="material-icons">add_circle</span>
                <span>Crear Sala</span>
              </button>
              <button className="online-option-btn" onClick={handleJoinRoom}>
                <span className="material-icons">login</span>
                <span>Unirse a Sala</span>
              </button>
              <button className="mode-btn-back" onClick={handleBack}>
                <span className="material-icons">arrow_back</span>
                <span>Volver</span>
              </button>
            </div>
          )}

          {/* Modal Crear Sala */}
          {showCreateRoom && (
            <div className="room-modal fade-in">
              <div className="room-modal-content">
                <h2>Crear Nueva Sala</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleCreateRoomSubmit}>
                  <div className="form-group">
                    <label>Nombre de la Sala</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Ej: Duelo de Titanes"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password (Opcional)</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? 'Creando...' : 'Crear Sala'}
                    </button>
                    <button type="button" className="btn-cancel" onClick={handleBack}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Unirse a Sala */}
          {showJoinRoom && (
            <div className="room-modal fade-in">
              <div className="room-modal-content">
                <h2>Unirse a Sala</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleJoinRoomSubmit}>
                  <div className="form-group">
                    <label>Nombre de la Sala</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Ej: Duelo de Titanes"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? 'Uniéndose...' : 'Unirse'}
                    </button>
                    <button type="button" className="btn-cancel" onClick={handleBack}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Esperando Jugador */}
          {showWaitingRoom && createdRoomData && (
            <div className="waiting-room-overlay">
              <div className="waiting-room-modal">
                <span className="material-icons waiting-icon">schedule</span>
                
                <h2 className="waiting-title">Sala Creada</h2>
                
                <p className="waiting-message">
                  Esperando que un jugador se una
                  <span className="waiting-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </p>

                <div className="room-info-box">
                  <div className="room-info-item">
                    <span className="room-info-label">Nombre de Sala</span>
                    <span className="room-info-value">
                      <span className="material-icons">label</span>
                      {createdRoomData.roomName}
                    </span>
                  </div>
                  <div className="room-info-item">
                    <span className="room-info-label">ID de Sala</span>
                    <span className="room-info-value">
                      <span className="material-icons">fingerprint</span>
                      {createdRoomData.roomId.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="room-info-item">
                    <span className="room-info-label">Protección</span>
                    <span className="room-info-value">
                      <span className="material-icons">{password ? 'lock' : 'lock_open'}</span>
                      {password ? 'Con Contraseña' : 'Sin Contraseña'}
                    </span>
                  </div>
                </div>

                <button className="waiting-cancel-btn" onClick={handleCancelWaitingRoom}>
                  <span className="material-icons">close</span>
                  Cancelar y Volver
                </button>
              </div>
            </div>
          )}

          {/* Créditos */}
          {!showModeSelection && !showOnlineOptions && !showCreateRoom && !showJoinRoom && !showWaitingRoom && (
            <div className="credits-section fade-in">
              <p className="credits-text">
                Inspirado en el concepto de{' '}
                <a 
                  href="https://www.youtube.com/@shonenshowdown" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="credits-link"
                >
                  Shonen Showdown
                </a>
              </p>
              <p className="credits-disclaimer">
                (No afiliado - Proyecto independiente)
              </p>
            </div>
          )}
        </main>

        <footer className="home-footer">
          <div className="server-info">
            <div className="server-status">
              <span className="status-dot"></span>
              <span className="status-text">Server: Online</span>
            </div>
          </div>
          
          {/* Redes sociales */}
          <div className="social-links">
            <a 
              href="https://youtube.com/@radzeryt" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-link youtube-link"
              title="YouTube"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>@RadzerYT</span>
            </a>
            
            <a 
              href="https://www.tiktok.com/@radzeryt" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-link tiktok-link"
              title="TikTok"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span>@RadzerYT</span>
            </a>
          </div>
        </footer>
      </div>

      <div className="glow-effect glow-top-left"></div>
      <div className="glow-effect glow-bottom-right"></div>
    </div>
  );
}