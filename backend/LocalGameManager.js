const crypto = require('crypto');
const GameEngine = require('./GameEngine');

class LocalGameSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.gameEngine = null;
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }
}

class LocalGameManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession() {
    const sessionId = crypto.randomUUID();
    const session = new LocalGameSession(sessionId);

    const player1Id = `local_p1_${sessionId}`;
    const player2Id = `local_p2_${sessionId}`;
    
    session.gameEngine = new GameEngine(player1Id, player2Id);
    session.gameEngine.startGame();

    this.sessions.set(sessionId, session);

    console.log(`[LOCAL] Nueva sesión local creada: ${sessionId}`);

    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  cleanupInactiveSessions(timeoutMinutes = 60) {
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeoutMs) {
        this.sessions.delete(sessionId);
        console.log(`[CLEANUP] Sesión local eliminada: ${sessionId}`);
      }
    }
  }

  getAllSessions() {
    return Array.from(this.sessions.keys());
  }
}

// Ejecutar limpieza cada 10 minutos
setInterval(() => {
  if (global.localGameManager) {
    global.localGameManager.cleanupInactiveSessions();
  }
}, 10 * 60 * 1000);

module.exports = LocalGameManager;