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

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleModeSelect = (mode) => {
    setGameMode(mode);
  };

  const handleLocalGameStart = (data) => {
    setLocalSessionId(data.sessionId);
  };

  const handleLocalGameReset = () => {
    setLocalSessionId(null);
    setGameMode(null);
  };

  if (!socket) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Conectando al servidor...</p>
      </div>
    );
  }

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
              />
            } 
          />
          <Route 
            path="/create-room" 
            element={
              <CreateRoom 
                socket={socket} 
                onRoomCreated={() => setGameMode('online')} 
              />
            } 
          />
          <Route 
            path="/join-room" 
            element={
              <JoinRoom 
                socket={socket} 
                onRoomJoined={() => setGameMode('online')} 
              />
            } 
          />
          <Route 
            path="/game" 
            element={
              <GameBoard 
                socket={socket} 
                gameMode={gameMode} 
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