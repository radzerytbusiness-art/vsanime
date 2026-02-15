import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import GameBoard from './pages/GameBoard';
import LocalGame from './pages/LocalGame';
import './styles/index.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [localSessionId, setLocalSessionId] = useState(null);
  const [socketConnecting, setSocketConnecting] = useState(true);
  const [socketError, setSocketError] = useState(false);
  const [roomData, setRoomData] = useState(null); // Para guardar roomId, playerRole, playerId

  useEffect(() => {
    console.log('🔌 Connecting to server:', SERVER_URL);
    
    const newSocket = io(SERVER_URL, {
      timeout: 10000, // 10 segundos timeout
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', newSocket.id);
      setSocket(newSocket);
      setSocketConnecting(false);
      setSocketError(false);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setSocketError(true);
      setSocketConnecting(false);
    });

    // Timeout: Si no conecta en 10 segundos, seguir sin socket
    const timeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.warn('⚠️ Socket timeout - continuing without connection');
        setSocketConnecting(false);
        setSocketError(true);
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const handleModeSelect = (mode) => {
    setGameMode(mode);
  };

  const handleRoomCreated = (data) => {
    setRoomData(data);
    setGameMode('online');
  };

  const handleRoomJoined = (data) => {
    setRoomData(data);
    setGameMode('online');
  };

  const handleLocalGameStart = (data) => {
    setLocalSessionId(data.sessionId);
  };

  const handleLocalGameReset = () => {
    setLocalSessionId(null);
    setGameMode(null);
  };

  // NO bloquear la app - mostrar Home inmediatamente
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                onModeSelect={handleModeSelect} 
                socket={socket}
                socketError={socketError}
                onRoomCreated={handleRoomCreated}
                onRoomJoined={handleRoomJoined}
              />
            } 
          />
          <Route 
            path="/create-room" 
            element={
              <CreateRoom 
                socket={socket} 
                onRoomCreated={handleRoomCreated}
              />
            } 
          />
          <Route 
            path="/join-room" 
            element={
              <JoinRoom 
                socket={socket} 
                onRoomJoined={handleRoomJoined}
              />
            } 
          />
          <Route 
            path="/game" 
            element={
              <GameBoard 
                socket={socket}
                roomId={roomData?.roomId}
                playerRole={roomData?.playerRole}
                playerId={roomData?.playerId}
                gameMode={gameMode}
                onReset={() => {
                  setRoomData(null);
                  setGameMode(null);
                }}
              />
            } 
          />
          <Route 
            path="/local-game" 
            element={
              <LocalGame 
                socket={socket} 
                sessionId={localSessionId}
                onStart={handleLocalGameStart}
                onReset={handleLocalGameReset}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;