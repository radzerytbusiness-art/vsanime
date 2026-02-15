import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/JoinRoom.css';

export default function JoinRoom({ socket, onRoomJoined, onCancel }) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!roomName.trim()) {
      setError('Por favor ingresa el nombre de la sala');
      setLoading(false);
      return;
    }

    socket.emit('JOIN_ROOM', {
      roomName: roomName.trim(),
      password: password || null
    });

    socket.once('ROOM_JOINED', (data) => {
      setLoading(false);
      onRoomJoined(data);
      navigate('/game');
    });

    socket.once('ERROR', (error) => {
      setLoading(false);
      setError(error.message);
    });
  };

  return (
    <div className="join-room-container">
      <div className="join-room-background">
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      <main className="join-room-main">
        <div className="join-room-left">
          <button className="back-button">
            <span className="material-icons">chevron_left</span>
          </button>

          <div className="profile-section">
            <div className="profile-avatar">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHWPYCb7cu_vKf7TjHSBVU4uIAocCEp1oXE3o1GFKF-3HB961HKPoLvasnQVxkNZ3UoWrRrMk6iJrrc3ZRkwMjhE7-tDDrSU6heSrQTxfqM3aI5sywNg1S5xD59d8FGXnfQOH4jq5i60NeCI7_x_layKtJefOsIhtDAy3u6ZnDN_dF6gJgDowiIWI76-rAjjbjR7nop1U-a9JgM7TlPUOcWu2Iu6EJqHEiQdp1vEA3TT3Cm1ZdavRqbuilpUz3_0xpKVT40T4Ahf_R"
                alt="RadzerYT"
              />
            </div>
            <h1 className="profile-name">AnimeVS</h1>
            <p className="profile-desc">Únete a la batalla. Desafía oponentes en tiempo real.</p>
          </div>
        </div>

        <div className="join-room-right">
          {error && (
            <div className="error-alert">
              <div className="error-icon">
                <span className="material-icons">error</span>
              </div>
              <div>
                <h4 className="error-title">Error de Conexión</h4>
                <p className="error-message">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="join-room-form">
            <div className="form-group">
              <label className="form-label">Nombre de la Sala</label>
              <div className="input-group">
                <span className="material-icons input-icon">meeting_room</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Torneo-Oficial-01"
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
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-join"
                disabled={loading}
              >
                <span className="material-icons">login</span>
                <span>{loading ? 'Uniéndose...' : 'UNIRSE AHORA'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}