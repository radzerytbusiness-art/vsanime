const crypto = require('crypto');

class Room {
  constructor(roomId, roomName, passwordHash) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.passwordHash = passwordHash;
    this.players = [
      { id: crypto.randomUUID(), socketId: null, role: 'PLAYER_1' },
      { id: null, socketId: null, role: 'PLAYER_2' }
    ];
    this.gameEngine = null;
    this.status = 'WAITING'; // WAITING | FULL | IN_GAME | FINISHED | ABANDONED
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.roomNameIndex = new Map();
  }

  // ==========================================
  // CREAR SALA
  // ==========================================
  createRoom(roomName, password) {
    // Validaciones
    if (!roomName || roomName.trim().length === 0) {
      return { success: false, error: 'INVALID_ROOM_NAME' };
    }

    if (roomName.trim().length > 50) {
      return { success: false, error: 'ROOM_NAME_TOO_LONG' };
    }

    if (this.roomNameIndex.has(roomName)) {
      return { success: false, error: 'ROOM_NAME_TAKEN' };
    }

    // Hashear password si existe (sin bcrypt, usar crypto simple)
    let passwordHash = null;
    if (password && password.length > 0) {
      try {
        const crypto = require('crypto');
        passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      } catch (error) {
        return { success: false, error: 'PASSWORD_HASH_ERROR' };
      }
    }

    // Crear sala
    const roomId = crypto.randomUUID();
    const room = new Room(roomId, roomName, passwordHash);
    
    this.rooms.set(roomId, room);
    this.roomNameIndex.set(roomName, roomId);

    console.log(`[ROOM] Sala creada: ${roomName} (${roomId})`);

    return { 
      success: true, 
      roomId,
      roomName
    };
  }

  // ==========================================
  // UNIRSE A SALA
  // ==========================================
  joinRoom(roomName, password) {
    if (!this.roomNameIndex.has(roomName)) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    const roomId = this.roomNameIndex.get(roomName);
    const room = this.rooms.get(roomId);

    // Validar estado
    if (room.status === 'FULL' || room.status === 'IN_GAME') {
      return { success: false, error: 'ROOM_FULL' };
    }

    if (room.status === 'FINISHED' || room.status === 'ABANDONED') {
      return { success: false, error: 'ROOM_UNAVAILABLE' };
    }

    // Validar contraseña
    if (room.passwordHash) {
      const crypto = require('crypto');
      const providedHash = crypto.createHash('sha256').update(password || '').digest('hex');
      if (providedHash !== room.passwordHash) {
        return { success: false, error: 'INVALID_PASSWORD' };
      }
    }

    // Agregar jugador
    room.players[1].id = crypto.randomUUID();
    room.status = 'FULL';
    room.lastActivity = new Date();

    console.log(`[ROOM] Jugador unido a sala: ${roomName} (${roomId})`);

    return { 
      success: true, 
      roomId
    };
  }

  // ==========================================
  // INICIAR JUEGO
  // ==========================================
  startGame(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (room.status !== 'FULL') {
      return { success: false, error: 'INVALID_STATE' };
    }

    // Crear GameEngine
    const GameEngine = require('./GameEngine');
    const gameEngine = new GameEngine(room.players[0].id, room.players[1].id);
    gameEngine.startGame();
    
    room.gameEngine = gameEngine;
    room.status = 'IN_GAME';
    room.lastActivity = new Date();

    console.log(`[GAME] Juego iniciado en sala: ${room.roomName}`);

    return {
      success: true,
      gameState: gameEngine.getGameState(),
      currentPlayer: gameEngine.currentPlayerTurn
    };
  }

  // ==========================================
  // RESETEAR JUEGO (REVANCHA)
  // ==========================================
  resetGame(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (!room.gameEngine) {
      return { success: false, error: 'NO_GAME_TO_RESET' };
    }

    // Crear nuevo GameEngine manteniendo los mismos jugadores
    const GameEngine = require('./GameEngine');
    const gameEngine = new GameEngine(room.players[0].id, room.players[1].id);
    gameEngine.startGame();
    
    room.gameEngine = gameEngine;
    room.status = 'IN_GAME';
    room.lastActivity = new Date();

    console.log(`[GAME] Revancha iniciada en sala: ${room.roomName}`);

    return {
      success: true,
      gameState: gameEngine.getGameState(),
      currentPlayer: gameEngine.currentPlayerTurn
    };
  }

  // ==========================================
  // OBTENER SALA
  // ==========================================
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  // ==========================================
  // OBTENER TODAS LAS SALAS
  // ==========================================
  getAllRooms() {
    const rooms = [];
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.status !== 'ABANDONED' && room.status !== 'FINISHED') {
        rooms.push({
          roomId,
          roomName: room.roomName,
          status: room.status,
          playerCount: room.players.filter(p => p.id !== null).length,
          hasPassword: room.passwordHash !== null,
          createdAt: room.createdAt
        });
      }
    }
    return rooms;
  }

  // ==========================================
  // MANEJAR DESCONEXIÓN
  // ==========================================
  handlePlayerDisconnection(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.status === 'WAITING') {
      room.status = 'ABANDONED';
    } else if (room.status === 'IN_GAME') {
      room.status = 'ABANDONED';
      console.log(`[ROOM] Sala abandonada durante el juego: ${room.roomName}`);
    }

    room.lastActivity = new Date();
  }

  // ==========================================
  // LIMPIAR SALAS INACTIVAS
  // ==========================================
  cleanupInactiveRooms(timeoutMinutes = 30) {
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > timeoutMs) {
        this.rooms.delete(roomId);
        this.roomNameIndex.delete(room.roomName);
        console.log(`[CLEANUP] Sala eliminada: ${room.roomName}`);
      }
    }
  }

  // ==========================================
  // MENSAJES DE ERROR
  // ==========================================
  getErrorMessage(errorCode) {
    const messages = {
      'INVALID_ROOM_NAME': 'El nombre de la sala es inválido.',
      'ROOM_NAME_TAKEN': 'El nombre de la sala ya está en uso.',
      'ROOM_NAME_TOO_LONG': 'El nombre de la sala es muy largo.',
      'PASSWORD_HASH_ERROR': 'Error al procesar la contraseña.',
      'ROOM_NOT_FOUND': 'Sala no encontrada.',
      'ROOM_FULL': 'La sala está llena.',
      'INVALID_PASSWORD': 'Contraseña incorrecta.',
      'INVALID_STATE': 'Estado de sala inválido.',
      'ROOM_UNAVAILABLE': 'La sala no está disponible.'
    };
    return messages[errorCode] || 'Error desconocido.';
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(() => {
  if (global.roomManager) {
    global.roomManager.cleanupInactiveRooms();
  }
}, 5 * 60 * 1000);

module.exports = RoomManager;