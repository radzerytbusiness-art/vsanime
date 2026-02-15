import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/CreateRoom.css';

export default function CreateRoom({ socket, onRoomCreated, onCancel }) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!roomName.trim()) {
      setError('Por favor ingresa un nombre para la sala');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingresa una contraseña');
      setLoading(false);
      return;
    }

    socket.emit('CREATE_ROOM', {
      roomName: roomName.trim(),
      password: password
    });

    socket.once('ROOM_CREATED', (data) => {
      setLoading(false);
      onRoomCreated(data);
      navigate('/game');
    });

    socket.once('ERROR', (error) => {
      setLoading(false);
      setError(error.message);
    });
  };

  return (
    <div className="create-room-container">
      <div className="create-room-background">
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      <main className="create-room-main">
        <div className="create-room-header">
          <div className="header-icon">
            <span className="material-icons">hub</span>
          </div>
          <h1 className="header-title">AnimeVS</h1>
          <p className="header-subtitle">MODO ONLINE</p>
        </div>

        <div className="create-room-panel">
          <h2 className="panel-title">Crear Nueva Sala</h2>

          {error && (
            <div className="error-box">
              <span className="material-icons">error</span>
              <div>
                <span className="error-title">Error al crear la sala</span>
                <span className="error-message">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-room-form">
            <div className="form-group">
              <label className="form-label">Nombre de la Sala</label>
              <div className="input-group">
                <span className="material-icons input-icon">sports_esports</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Duelo de Titanes"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="material-icons input-icon">vpn_key</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                <span>{loading ? 'Creando...' : 'Crear Sala'}</span>
                <span className="material-icons">rocket_launch</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
              >
                <span className="material-icons">arrow_back</span>
                Volver
              </button>
            </div>
          </form>
        </div>

        <div className="server-stats">
          <div className="stat-badge">
            <span className="material-icons">bolt</span>
            <span>Ping: 24ms</span>
          </div>
          <div className="stat-badge">
            <span className="material-icons">public</span>
            <span>Región: LATAM</span>
          </div>
          <div className="stat-badge">
            <span className="material-icons">groups</span>
            <span>Slots: 2/2</span>
          </div>
        </div>
      </main>
    </div>
  );
}