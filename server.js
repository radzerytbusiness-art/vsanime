// ============================================
// SERVER.JS - ANIME VS GAME SERVER
// ============================================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Importar managers
const RoomManager = require('./backend/RoomManager');
const LocalGameManager = require('./backend/LocalGameManager');

// ============================================
// CONFIGURACIÓN DEL SERVIDOR
// ============================================

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// INICIALIZAR MANAGERS GLOBALES
// ============================================

global.roomManager = new RoomManager();
global.localGameManager = new LocalGameManager();

console.log('✅ RoomManager inicializado');
console.log('✅ LocalGameManager inicializado');

// ============================================
// RUTAS HTTP (OPCIONAL)
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'AnimeVS Game Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/rooms', (req, res) => {
  const rooms = global.roomManager.getAllRooms();
  res.json({ success: true, rooms });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      activeRooms: global.roomManager.rooms.size,
      localSessions: global.localGameManager.sessions.size,
      connectedPlayers: io.sockets.sockets.size
    }
  });
});

// ============================================
// SOCKET.IO - GESTIÓN DE CONEXIONES
// ============================================

io.on('connection', (socket) => {
  console.log(`\n🟢 [CONNECT] Cliente conectado: ${socket.id}`);

  // ==========================================
  // EVENTOS DE SALAS ONLINE
  // ==========================================

  // Crear sala
  socket.on('CREATE_ROOM', (data) => {
    console.log(`📝 [CREATE_ROOM] Socket ${socket.id} creando sala: ${data.roomName}`);
    
    const result = global.roomManager.createRoom(data.roomName, data.password);
    
    if (!result.success) {
      console.log(`❌ [CREATE_ROOM] Error: ${result.error}`);
      socket.emit('ERROR', {
        event: 'CREATE_ROOM',
        error: result.error,
        message: global.roomManager.getErrorMessage(result.error)
      });
      return;
    }

    const room = global.roomManager.getRoom(result.roomId);
    room.players[0].socketId = socket.id;
    
    socket.join(result.roomId);
    
    console.log(`✅ [CREATE_ROOM] Sala creada exitosamente: ${result.roomName} (${result.roomId})`);
    
    socket.emit('ROOM_CREATED', {
      roomId: result.roomId,
      roomName: result.roomName,
      playerRole: 'PLAYER_1',
      playerId: room.players[0].id
    });
  });

  // Unirse a sala
  socket.on('JOIN_ROOM', (data) => {
    console.log(`🚪 [JOIN_ROOM] Socket ${socket.id} intentando unirse a: ${data.roomName}`);
    
    const result = global.roomManager.joinRoom(data.roomName, data.password);
    
    if (!result.success) {
      console.log(`❌ [JOIN_ROOM] Error: ${result.error}`);
      socket.emit('ERROR', {
        event: 'JOIN_ROOM',
        error: result.error,
        message: global.roomManager.getErrorMessage(result.error)
      });
      return;
    }

    const room = global.roomManager.getRoom(result.roomId);
    room.players[1].socketId = socket.id;
    
    socket.join(result.roomId);
    
    console.log(`✅ [JOIN_ROOM] Jugador 2 unido a sala: ${room.roomName}`);
    
    // Notificar al jugador que se unió
    socket.emit('ROOM_JOINED', {
      roomId: result.roomId,
      roomName: room.roomName,
      playerRole: 'PLAYER_2',
      playerId: room.players[1].id
    });

    // Notificar a ambos jugadores que la sala está llena
    io.to(result.roomId).emit('ROOM_FULL', {
      roomId: result.roomId,
      players: room.players.map(p => ({ id: p.id, role: p.role }))
    });

    // Auto-iniciar el juego
    setTimeout(() => {
      const startResult = global.roomManager.startGame(result.roomId);
      if (startResult.success) {
        console.log(`🎮 [GAME_START] Juego iniciado en sala: ${room.roomName}`);
        io.to(result.roomId).emit('GAME_STARTED', {
          gameState: startResult.gameState,
          currentPlayer: startResult.currentPlayer
        });
      }
    }, 1000);
  });

  // ==========================================
  // EVENTOS DE JUEGO ONLINE
  // ==========================================

  // Solicitar estado del juego
  socket.on('GAME_STATE_REQUEST', (data) => {
    const room = global.roomManager.getRoom(data.roomId);
    if (!room || !room.gameEngine) {
      socket.emit('ERROR', { message: 'Sala no encontrada o juego no iniciado' });
      return;
    }

    socket.emit('GAME_STATE', {
      gameState: room.gameEngine.getGameState()
    });
  });

  // Robar personaje
  socket.on('DRAW_CHARACTER', (data) => {
    console.log(`🎴 [DRAW] Socket ${socket.id} robando personaje en sala ${data.roomId}`);
    
    const room = global.roomManager.getRoom(data.roomId);
    if (!room || !room.gameEngine) {
      socket.emit('ERROR', { message: 'Sala no encontrada' });
      return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) {
      socket.emit('ERROR', { message: 'Jugador no encontrado' });
      return;
    }

    const result = room.gameEngine.drawCharacter(player.id);
    
    if (!result.success) {
      console.log(`❌ [DRAW] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [DRAW] Personaje robado: ${result.character.name}`);
    
    io.to(data.roomId).emit('CHARACTER_DRAWN', {
      gameState: room.gameEngine.getGameState(),
      character: result.character
    });
  });

  // Asignar personaje
  socket.on('ASSIGN_CHARACTER', (data) => {
    console.log(`⚔️ [ASSIGN] Socket ${socket.id} asignando a rol ${data.role}`);
    
    const room = global.roomManager.getRoom(data.roomId);
    if (!room || !room.gameEngine) {
      socket.emit('ERROR', { message: 'Sala no encontrada' });
      return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) {
      socket.emit('ERROR', { message: 'Jugador no encontrado' });
      return;
    }

    const result = room.gameEngine.assignCharacter(player.id, data.role);
    
    if (!result.success) {
      console.log(`❌ [ASSIGN] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [ASSIGN] Personaje asignado a ${data.role}`);
    
    io.to(data.roomId).emit('CHARACTER_ASSIGNED', {
      gameState: room.gameEngine.getGameState(),
      role: data.role,
      character: result.character
    });
  });

  // Saltar personaje
  socket.on('SKIP_CHARACTER', (data) => {
    console.log(`⏭️ [SKIP] Socket ${socket.id} saltando personaje`);
    
    const room = global.roomManager.getRoom(data.roomId);
    if (!room || !room.gameEngine) {
      socket.emit('ERROR', { message: 'Sala no encontrada' });
      return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) {
      socket.emit('ERROR', { message: 'Jugador no encontrado' });
      return;
    }

    const result = room.gameEngine.skipCharacter(player.id);
    
    if (!result.success) {
      console.log(`❌ [SKIP] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [SKIP] Personaje saltado`);
    
    io.to(data.roomId).emit('CHARACTER_SKIPPED', {
      gameState: room.gameEngine.getGameState(),
      skipped: result.skipped,
      newCharacter: result.newCharacter
    });
  });

  // Reorganizar
  socket.on('REORGANIZE', (data) => {
    console.log(`🔄 [REORGANIZE] Socket ${socket.id} reorganizando ${data.roleA} ↔ ${data.roleB}`);
    
    const room = global.roomManager.getRoom(data.roomId);
    if (!room || !room.gameEngine) {
      socket.emit('ERROR', { message: 'Sala no encontrada' });
      return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) {
      socket.emit('ERROR', { message: 'Jugador no encontrado' });
      return;
    }

    const result = room.gameEngine.reorganize(player.id, data.roleA, data.roleB);
    
    if (!result.success) {
      console.log(`❌ [REORGANIZE] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [REORGANIZE] Reorganización exitosa`);
    
    io.to(data.roomId).emit('REORGANIZED', {
      gameState: room.gameEngine.getGameState()
    });
  });

  // Terminar turno
  socket.on('END_TURN', (data) => {
    console.log(`⏩ [END_TURN] Socket ${socket.id} terminando turno`);
    
    const room = global.roomManager.getRoom(data.roomId);
    if (!room || !room.gameEngine) {
      socket.emit('ERROR', { message: 'Sala no encontrada' });
      return;
    }

    const result = room.gameEngine.endTurn();
    
    if (!result.success) {
      console.log(`❌ [END_TURN] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [END_TURN] Turno terminado`);
    
    // Verificar si el juego terminó
    const gameEnded = room.gameEngine.checkGameEnd();
    
    if (gameEnded) {
      console.log(`🏁 [GAME_END] Juego terminado en sala ${data.roomId}`);
      io.to(data.roomId).emit('GAME_FINISHED', {
        gameState: room.gameEngine.getGameState()
      });
    } else {
      io.to(data.roomId).emit('TURN_ENDED', {
        gameState: room.gameEngine.getGameState(),
        nextPlayer: room.gameEngine.currentPlayerTurn
      });
    }
  });

  // ==========================================
  // EVENTOS DE JUEGO LOCAL
  // ==========================================

  // Iniciar juego local
  socket.on('START_LOCAL_GAME', () => {
    console.log(`🏠 [LOCAL] Socket ${socket.id} iniciando juego local`);
    
    const sessionId = global.localGameManager.createSession();
    const session = global.localGameManager.getSession(sessionId);
    
    console.log(`✅ [LOCAL] Sesión local creada: ${sessionId}`);
    
    socket.emit('LOCAL_GAME_STARTED', {
      sessionId,
      gameState: session.gameEngine.getGameState()
    });
  });

  // Robar personaje (local)
  socket.on('LOCAL_DRAW_CHARACTER', (data) => {
    const session = global.localGameManager.getSession(data.sessionId);
    if (!session) {
      socket.emit('ERROR', { message: 'Sesión no encontrada' });
      return;
    }

    const currentPlayer = session.gameEngine.currentPlayerTurn === 1 
      ? session.gameEngine.player1 
      : session.gameEngine.player2;

    const result = session.gameEngine.drawCharacter(currentPlayer.id);
    
    if (!result.success) {
      socket.emit('ERROR', { message: result.error });
      return;
    }

    session.lastActivity = new Date();
    
    socket.emit('CHARACTER_DRAWN', {
      gameState: session.gameEngine.getGameState(),
      character: result.character
    });
  });

  // Asignar personaje (local)
  socket.on('LOCAL_ASSIGN_CHARACTER', (data) => {
    const session = global.localGameManager.getSession(data.sessionId);
    if (!session) {
      socket.emit('ERROR', { message: 'Sesión no encontrada' });
      return;
    }

    const currentPlayer = session.gameEngine.currentPlayerTurn === 1 
      ? session.gameEngine.player1 
      : session.gameEngine.player2;

    const result = session.gameEngine.assignCharacter(currentPlayer.id, data.role);
    
    if (!result.success) {
      socket.emit('ERROR', { message: result.error });
      return;
    }

    session.lastActivity = new Date();
    
    socket.emit('CHARACTER_ASSIGNED', {
      gameState: session.gameEngine.getGameState(),
      role: data.role,
      character: result.character
    });
  });

  // Saltar personaje (local)
  socket.on('LOCAL_SKIP_CHARACTER', (data) => {
    console.log(`⏭️ [LOCAL_SKIP] Socket ${socket.id} saltando personaje`);
    
    const session = global.localGameManager.getSession(data.sessionId);
    if (!session) {
      socket.emit('ERROR', { message: 'Sesión no encontrada' });
      return;
    }

    const currentPlayer = session.gameEngine.currentPlayerTurn === 1 
      ? session.gameEngine.player1 
      : session.gameEngine.player2;

    const result = session.gameEngine.skipCharacter(currentPlayer.id);
    
    if (!result.success) {
      console.log(`❌ [LOCAL_SKIP] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [LOCAL_SKIP] Personaje saltado`);
    
    session.lastActivity = new Date();
    
    socket.emit('CHARACTER_SKIPPED', {
      gameState: session.gameEngine.getGameState(),
      skipped: result.skipped,
      newCharacter: result.newCharacter
    });
  });

  // Reorganizar (local)
  socket.on('LOCAL_REORGANIZE', (data) => {
    console.log(`🔄 [LOCAL_REORGANIZE] Socket ${socket.id} reorganizando ${data.roleA} ↔ ${data.roleB}`);
    
    const session = global.localGameManager.getSession(data.sessionId);
    if (!session) {
      socket.emit('ERROR', { message: 'Sesión no encontrada' });
      return;
    }

    const currentPlayer = session.gameEngine.reorganizePlayer === session.gameEngine.player1.id
      ? session.gameEngine.player1
      : session.gameEngine.player2;

    const result = session.gameEngine.reorganize(currentPlayer.id, data.roleA, data.roleB);
    
    if (!result.success) {
      console.log(`❌ [LOCAL_REORGANIZE] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [LOCAL_REORGANIZE] Reorganización exitosa`);
    
    session.lastActivity = new Date();

    const gameEnded = session.gameEngine.checkGameEnd();
    
    if (gameEnded) {
      socket.emit('GAME_FINISHED', {
        gameState: session.gameEngine.getGameState()
      });
    } else {
      socket.emit('REORGANIZED', {
        gameState: session.gameEngine.getGameState()
      });
    }
  });

  // Saltar reorganizar (local)
  socket.on('LOCAL_SKIP_REORGANIZE', (data) => {
    console.log(`⏭️ [LOCAL_SKIP_REORGANIZE] Socket ${socket.id} saltando reorganizar`);
    
    const session = global.localGameManager.getSession(data.sessionId);
    if (!session) {
      socket.emit('ERROR', { message: 'Sesión no encontrada' });
      return;
    }

    const currentPlayer = session.gameEngine.reorganizePlayer === session.gameEngine.player1.id
      ? session.gameEngine.player1
      : session.gameEngine.player2;

    const result = session.gameEngine.skipReorganize(currentPlayer.id);
    
    if (!result.success) {
      console.log(`❌ [LOCAL_SKIP_REORGANIZE] Error: ${result.error}`);
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`✅ [LOCAL_SKIP_REORGANIZE] Reorganizar saltado`);
    
    session.lastActivity = new Date();

    const gameEnded = session.gameEngine.checkGameEnd();
    
    if (gameEnded) {
      socket.emit('GAME_FINISHED', {
        gameState: session.gameEngine.getGameState()
      });
    } else {
      socket.emit('REORGANIZE_SKIPPED', {
        gameState: session.gameEngine.getGameState()
      });
    }
  });

  // Terminar turno (local)
  socket.on('LOCAL_END_TURN', (data) => {
    const session = global.localGameManager.getSession(data.sessionId);
    if (!session) {
      socket.emit('ERROR', { message: 'Sesión no encontrada' });
      return;
    }

    const result = session.gameEngine.endTurn();
    
    if (!result.success) {
      socket.emit('ERROR', { message: result.error });
      return;
    }

    session.lastActivity = new Date();

    const gameEnded = session.gameEngine.checkGameEnd();
    
    if (gameEnded) {
      socket.emit('GAME_FINISHED', {
        gameState: session.gameEngine.getGameState()
      });
    } else {
      socket.emit('TURN_ENDED', {
        gameState: session.gameEngine.getGameState(),
        nextPlayer: session.gameEngine.currentPlayerTurn
      });
    }
  });

  // ==========================================
  // DESCONEXIÓN
  // ==========================================

  socket.on('disconnect', () => {
    console.log(`🔴 [DISCONNECT] Cliente desconectado: ${socket.id}`);
    
    // Buscar si el socket estaba en alguna sala
    for (const [roomId, room] of global.roomManager.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        console.log(`⚠️ [DISCONNECT] Jugador desconectado de sala: ${room.roomName}`);
        
        // Notificar al otro jugador
        io.to(roomId).emit('PLAYER_DISCONNECTED', {
          message: 'El otro jugador se ha desconectado'
        });
        
        // Marcar sala como abandonada
        global.roomManager.handlePlayerDisconnection(roomId);
        
        break;
      }
    }
  });

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================

  socket.on('error', (error) => {
    console.error(`❌ [ERROR] Socket ${socket.id}:`, error);
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

server.listen(port, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🎮  ANIME VS GAME SERVER');
  console.log('='.repeat(50));
  console.log(`🌐 Servidor corriendo en http://localhost:${port}`);
  console.log(`🔌 Socket.IO listo para conexiones`);
  console.log(`📅 Iniciado: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50) + '\n');
});

// ============================================
// MANEJO DE ERRORES DEL SERVIDOR
// ============================================

process.on('uncaughtException', (error) => {
  console.error('💥 [UNCAUGHT EXCEPTION]:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [UNHANDLED REJECTION]:', reason);
});

// ============================================
// LIMPIEZA AL CERRAR
// ============================================

process.on('SIGINT', () => {
  console.log('\n⚠️  Cerrando servidor...');
  
  io.close(() => {
    console.log('✅ Socket.IO cerrado');
  });
  
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado');
    process.exit(0);
  });
});

module.exports = { app, server, io };