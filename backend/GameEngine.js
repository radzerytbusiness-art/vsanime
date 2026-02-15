const ROLES = ['CAPITAN', 'VICE_CAPITAN', 'TANQUE', 'HEALER', 'SOPORTE', 'SOPORTE_2'];

class Character {
  constructor(id, name, image) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.state = 'available'; // available | assigned | discarded
  }
}

class Player {
  constructor(id, playerNumber) {
    this.id = id;
    this.playerNumber = playerNumber;
    this.socketId = null;
    this.board = {
      CAPITAN: null,
      VICE_CAPITAN: null,
      TANQUE: null,
      HEALER: null,
      SOPORTE: null,
      SOPORTE_2: null
    };
    this.specialActionUsed = false;
    this.currentCharacter = null;
    this.hasReorganized = false;
  }

  isBoardFull() {
    return Object.values(this.board).every(role => role !== null);
  }

  getEmptyRoles() {
    return ROLES.filter(role => this.board[role] === null);
  }

  canReorganize() {
    return !this.specialActionUsed && this.isBoardFull() && !this.hasReorganized;
  }

  canSkip() {
    return !this.specialActionUsed;
  }
}

class CharacterBag {
  constructor() {
    this.characters = [];
    this.initializeBag();
    this.shuffle();
  }

  initializeBag() {
    const animeCharacters = [
      {name: "Goku", image: "./assets/images/characters/goku.jpg"},
      {name: "Vegeta", image: "./assets/images/characters/vegeta.jpg"},
      {name: "Naruto", image: "./assets/images/characters/naruto.jpg"},
      {name: "Sasuke", image: "./assets/images/characters/sasuke.jpg"},
      {name: "Luffy", image: "./assets/images/characters/luffy.jpg"},
      {name: "Zoro", image: "./assets/images/characters/zoro.jpg"},
      {name: "Ichigo", image: "./assets/images/characters/ichigo.jpg"},
      {name: "Natsu", image: "./assets/images/characters/natsu.jpg"},
      {name: "Deku", image: "./assets/images/characters/deku.jpg"},
      {name: "Zenitsu", image: "./assets/images/characters/zenitsu.jpg"},
      {name: "Kakashi", image: "./assets/images/characters/kakashi.jpg"},
      {name: "Lelouch", image: "./assets/images/characters/lelouch.jpg"},
      {name: "Saitama", image: "./assets/images/characters/saitama.jpg"},
      {name: "Genos", image: "./assets/images/characters/genos.jpg"},
      {name: "Tanjiro", image: "./assets/images/characters/tanjiro.jpg"},
      {name: "Inosuke", image: "./assets/images/characters/inosuke.jpg"},
      {name: "Giyu", image: "./assets/images/characters/giyu.jpg"},
      {name: "Rengoku", image: "./assets/images/characters/rengoku.jpg"},
      {name: "Todoroki", image: "./assets/images/characters/todoroki.jpg"},
      {name: "Bakugo", image: "./assets/images/characters/bakugo.jpg"},
      {name: "Allmight", image: "./assets/images/characters/allmight.jpg"},
      {name: "Erza", image: "./assets/images/characters/erza.jpg"},
      {name: "Gray", image: "./assets/images/characters/gray.jpg"},
      {name: "Lucy", image: "./assets/images/characters/lucy.jpg"},
      {name: "Wendy", image: "./assets/images/characters/wendy.jpg"},
      {name: "Edward", image: "./assets/images/characters/edward.jpg"},
      {name: "Alphonse", image: "./assets/images/characters/alphonse.jpg"},
      {name: "Mustang", image: "./assets/images/characters/mustang.jpg"},
      {name: "Winry", image: "./assets/images/characters/winry.jpg"},
      {name: "Sanji", image: "./assets/images/characters/sanji.jpg"},
      {name: "Nami", image: "./assets/images/characters/nami.jpg"},
      {name: "Chopper", image: "./assets/images/characters/chopper.jpg"},
      {name: "Robin", image: "./assets/images/characters/robin.jpg"},
      {name: "Franky", image: "./assets/images/characters/franky.jpg"},
      {name: "Brook", image: "./assets/images/characters/brook.jpg"},
      {name: "Jinbe", image: "./assets/images/characters/jinbe.jpg"},
      {name: "Ace", image: "./assets/images/characters/ace.jpg"},
      {name: "Sabo", image: "./assets/images/characters/sabo.jpg"},
      {name: "Law", image: "./assets/images/characters/law.jpg"},
      {name: "Kid", image: "./assets/images/characters/kid.jpg"},
      {name: "Shanks", image: "./assets/images/characters/shanks.jpg"},
      {name: "Whitebeard", image: "./assets/images/characters/whitebeard.jpg"},
      {name: "Gohan", image: "./assets/images/characters/gohan.jpg"},
      {name: "Piccolo", image: "./assets/images/characters/piccolo.jpg"},
      {name: "Frieza", image: "./assets/images/characters/frieza.jpg"},
      {name: "Cell", image: "./assets/images/characters/cell.jpg"},
      {name: "Trunks", image: "./assets/images/characters/trunks.jpg"},
      {name: "Goten", image: "./assets/images/characters/goten.jpg"},
      {name: "Broly", image: "./assets/images/characters/broly.jpg"},
      {name: "Beerus", image: "./assets/images/characters/beerus.jpg"},
      {name: "Jiren", image: "./assets/images/characters/jiren.jpg"},
      {name: "Sakura", image: "./assets/images/characters/sakura.jpg"},
      {name: "Hinata", image: "./assets/images/characters/hinata.jpg"},
      {name: "Neji", image: "./assets/images/characters/neji.jpg"},
      {name: "Rock", image: "./assets/images/characters/rock.jpg"},
      {name: "Gaara", image: "./assets/images/characters/gaara.jpg"},
      {name: "Itachi", image: "./assets/images/characters/itachi.jpg"},
      {name: "Madara", image: "./assets/images/characters/madara.jpg"},
      {name: "Hashirama", image: "./assets/images/characters/hashirama.jpg"},
      {name: "Minato", image: "./assets/images/characters/minato.jpg"},
      {name: "Jiraiya", image: "./assets/images/characters/jiraiya.jpg"},
      {name: "Orochimaru", image: "./assets/images/characters/orochimaru.jpg"},
      {name: "Tsunade", image: "./assets/images/characters/tsunade.jpg"},
      {name: "Rukia", image: "./assets/images/characters/rukia.jpg"},
      {name: "Uryu", image: "./assets/images/characters/uryu.jpg"},
      {name: "Chad", image: "./assets/images/characters/chad.jpg"},
      {name: "Orihime", image: "./assets/images/characters/orihime.jpg"},
      {name: "Byakuya", image: "./assets/images/characters/byakuya.jpg"},
      {name: "Kenpachi", image: "./assets/images/characters/kenpachi.jpg"},
      {name: "Toshiro", image: "./assets/images/characters/toshiro.jpg"},
      {name: "Urahara", image: "./assets/images/characters/urahara.jpg"},
      {name: "Yoruichi", image: "./assets/images/characters/yoruichi.jpg"},
      {name: "Aizen", image: "./assets/images/characters/aizen.jpg"},
      {name: "Ulquiorra", image: "./assets/images/characters/ulquiorra.jpg"},
      {name: "Grimmjow", image: "./assets/images/characters/grimmjow.jpg"},
      {name: "Meliodas", image: "./assets/images/characters/meliodas.jpg"},
      {name: "Elizabeth", image: "./assets/images/characters/elizabeth.jpg"},
      {name: "Ban", image: "./assets/images/characters/ban.jpg"},
      {name: "King", image: "./assets/images/characters/king.jpg"},
      {name: "Diane", image: "./assets/images/characters/diane.jpg"},
      {name: "Gowther", image: "./assets/images/characters/gowther.jpg"},
      {name: "Merlin", image: "./assets/images/characters/merlin.jpg"},
      {name: "Escanor", image: "./assets/images/characters/escanor.jpg"},
      {name: "Arthur", image: "./assets/images/characters/arthur.jpg"},
      {name: "Sailor Mars", image: "./assets/images/characters/sailormars.jpg"},
      {name: "Lancer", image: "./assets/images/characters/lancer.jpg"},
      {name: "Saber", image: "./assets/images/characters/saber.jpg"},
      {name: "Sailor Jupiter", image: "./assets/images/characters/sailorjupyter.jpg"},
      {name: "Archer", image: "./assets/images/characters/archer.jpg"},
      {name: "Gilgamesh", image: "./assets/images/characters/gilgamesh.jpg"},
      {name: "Sailor Moon", image: "./assets/images/characters/sailormoon.jpg"},
      {name: "Yajirobe", image: "./assets/images/characters/yajirobe.jpg"},
      {name: "Sailor Mercury", image: "./assets/images/characters/sailormercury.jpg"},
      {name: "Berserker", image: "./assets/images/characters/berseker.jpg"},
      {name: "Krilin", image: "./assets/images/characters/krilin.jpg"}
    ];

    this.characters = animeCharacters.map((char, index) => 
      new Character(`char_${String(index + 1).padStart(3, '0')}`, char.name, char.image)
    );
  }

  shuffle() {
    for (let i = this.characters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.characters[i], this.characters[j]] = [this.characters[j], this.characters[i]];
    }
  }

  drawCharacter() {
    const available = this.characters.find(c => c.state === 'available');
    if (!available) return null;
    available.state = 'assigned';
    return available;
  }

  discardCharacter(character) {
    if (character) {
      character.state = 'discarded';
    }
  }

  getRemainingCount() {
    return this.characters.filter(c => c.state === 'available').length;
  }

  isEmpty() {
    return this.getRemainingCount() === 0;
  }
}

class GameEngine {
  constructor(player1Id, player2Id) {
    this.player1 = new Player(player1Id, 1);
    this.player2 = new Player(player2Id, 2);
    this.characterBag = new CharacterBag();
    
    this.gameState = 'INIT';
    this.currentPlayerTurn = 1;
    this.turnCount = 0;
    this.history = [];
    this.reorganizePhase = false;
    this.reorganizePlayer = null;
  }

  startGame() {
    if (this.gameState !== 'INIT') {
      return { success: false, error: 'INVALID_STATE' };
    }

    this.gameState = 'TURN_PLAYER_1';
    this.currentPlayerTurn = 1;
    this.turnCount = 0;

    return { 
      success: true, 
      gameState: this.getGameState(),
      currentPlayer: this.currentPlayerTurn
    };
  }

  drawCharacter(playerId) {
    if (this.gameState === 'GAME_END') {
      return { success: false, error: 'GAME_FINISHED' };
    }

    if (this.reorganizePhase) {
      return { success: false, error: 'REORGANIZE_PHASE' };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'PLAYER_NOT_FOUND' };
    }

    // Verificar que es su turno
    if (player.playerNumber !== this.currentPlayerTurn) {
      return { success: false, error: 'NOT_YOUR_TURN' };
    }

    // No puede robar si ya tiene un personaje actual
    if (player.currentCharacter) {
      return { success: false, error: 'ALREADY_HAS_CHARACTER' };
    }

    const character = this.characterBag.drawCharacter();
    if (!character) {
      return { success: false, error: 'BAG_EMPTY' };
    }

    player.currentCharacter = character;

    this.history.push({
      timestamp: new Date(),
      action: 'DRAW',
      playerId,
      characterId: character.id,
      characterName: character.name
    });

    return { success: true, character };
  }

  assignCharacter(playerId, role) {
    if (this.gameState === 'GAME_END') {
      return { success: false, error: 'GAME_FINISHED' };
    }

    if (this.reorganizePhase) {
      return { success: false, error: 'REORGANIZE_PHASE' };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'PLAYER_NOT_FOUND' };
    }

    if (!player.currentCharacter) {
      return { success: false, error: 'NO_CHARACTER_TO_ASSIGN' };
    }

    if (!ROLES.includes(role)) {
      return { success: false, error: 'INVALID_ROLE' };
    }

    if (player.board[role] !== null) {
      return { success: false, error: 'ROLE_OCCUPIED' };
    }

    player.board[role] = player.currentCharacter;
    const assignedCharacter = player.currentCharacter;
    player.currentCharacter = null;

    this.history.push({
      timestamp: new Date(),
      action: 'ASSIGN',
      playerId,
      role,
      characterId: assignedCharacter.id
    });

    console.log('[DEBUG] Personaje asignado. P1 completo:', this.player1.isBoardFull(), 'P2 completo:', this.player2.isBoardFull());

    // Verificar si ambos completaron para entrar en fase de reorganizar
    if (this.player1.isBoardFull() && this.player2.isBoardFull()) {
      console.log('[DEBUG] AMBOS COMPLETARON - Iniciando fase de reorganizar');
      this.checkReorganizePhase();
    } else {
      // Solo cambiar turno si no entramos en fase de reorganizar
      this.switchTurn();
    }

    return { success: true, character: assignedCharacter };
  }

  skipCharacter(playerId) {
    if (this.gameState === 'GAME_END') {
      return { success: false, error: 'GAME_FINISHED' };
    }

    if (this.reorganizePhase) {
      return { success: false, error: 'REORGANIZE_PHASE' };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'PLAYER_NOT_FOUND' };
    }

    if (!player.canSkip()) {
      return { success: false, error: 'SPECIAL_ACTION_ALREADY_USED' };
    }

    if (!player.currentCharacter) {
      return { success: false, error: 'NO_CHARACTER_TO_SKIP' };
    }

    const skippedChar = player.currentCharacter;
    this.characterBag.discardCharacter(skippedChar);
    player.currentCharacter = null;
    player.specialActionUsed = true;

    this.history.push({
      timestamp: new Date(),
      action: 'SKIP',
      playerId,
      characterId: skippedChar.id
    });

    // Robar nuevo personaje inmediatamente
    const newCharacter = this.characterBag.drawCharacter();
    if (newCharacter) {
      player.currentCharacter = newCharacter;
      return { 
        success: true, 
        skipped: skippedChar,
        newCharacter,
        message: 'Debes asignar este personaje ahora'
      };
    } else {
      return { success: true, skipped: skippedChar };
    }
  }

  reorganize(playerId, roleA, roleB) {
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] reorganize llamado por:', playerId);
    console.log('[DEBUG] Roles a intercambiar:', roleA, '↔', roleB);
    console.log('[DEBUG] ========================================');
    
    if (this.gameState === 'GAME_END') {
      return { success: false, error: 'GAME_FINISHED' };
    }

    if (!this.reorganizePhase) {
      console.log('[DEBUG] ❌ No estamos en fase de reorganizar');
      return { success: false, error: 'NOT_REORGANIZE_PHASE' };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'PLAYER_NOT_FOUND' };
    }

    if (player.id !== this.reorganizePlayer) {
      console.log('[DEBUG] ❌ No es tu turno de reorganizar');
      console.log('[DEBUG] Se esperaba:', this.reorganizePlayer);
      console.log('[DEBUG] Se recibió:', player.id);
      return { success: false, error: 'NOT_YOUR_REORGANIZE_TURN' };
    }

    if (!player.canReorganize()) {
      console.log('[DEBUG] ❌ Jugador no puede reorganizar');
      console.log('[DEBUG] specialActionUsed:', player.specialActionUsed);
      console.log('[DEBUG] hasReorganized:', player.hasReorganized);
      return { success: false, error: 'CANNOT_REORGANIZE' };
    }

    if (!ROLES.includes(roleA) || !ROLES.includes(roleB)) {
      return { success: false, error: 'INVALID_ROLE' };
    }

    if (player.board[roleA] === null || player.board[roleB] === null) {
      return { success: false, error: 'ROLES_NOT_OCCUPIED' };
    }

    console.log('[DEBUG] ✅ Reorganizando:', roleA, '↔', roleB);

    const temp = player.board[roleA];
    player.board[roleA] = player.board[roleB];
    player.board[roleB] = temp;

    player.hasReorganized = true;

    this.history.push({
      timestamp: new Date(),
      action: 'REORGANIZE',
      playerId,
      roleA,
      roleB
    });

    // Pasar al siguiente jugador en reorganizar
    this.nextReorganizePlayer();

    return { success: true };
  }

  skipReorganize(playerId) {
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] skipReorganize llamado por:', playerId);
    console.log('[DEBUG] ========================================');
    
    if (!this.reorganizePhase) {
      return { success: false, error: 'NOT_REORGANIZE_PHASE' };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'PLAYER_NOT_FOUND' };
    }

    if (player.id !== this.reorganizePlayer) {
      console.log('[DEBUG] ❌ No es tu turno de reorganizar');
      console.log('[DEBUG] Se esperaba:', this.reorganizePlayer);
      console.log('[DEBUG] Se recibió:', player.id);
      return { success: false, error: 'NOT_YOUR_REORGANIZE_TURN' };
    }

    console.log('[DEBUG] ✅ Jugador decidió NO reorganizar');
    player.hasReorganized = true;

    this.history.push({
      timestamp: new Date(),
      action: 'SKIP_REORGANIZE',
      playerId
    });

    // Pasar al siguiente jugador o terminar
    this.nextReorganizePlayer();

    return { success: true };
  }

  switchTurn() {
    this.currentPlayerTurn = this.currentPlayerTurn === 1 ? 2 : 1;
    this.turnCount++;
    this.gameState = `TURN_PLAYER_${this.currentPlayerTurn}`;
  }

  checkReorganizePhase() {
    // Solo entra si AMBOS tienen tablero completo
    if (!this.player1.isBoardFull() || !this.player2.isBoardFull()) {
      console.log('[DEBUG] Todavía no completan ambos jugadores');
      return;
    }

    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] AMBOS TABLEROS COMPLETOS');
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] Player 1 specialActionUsed (saltó):', this.player1.specialActionUsed);
    console.log('[DEBUG] Player 2 specialActionUsed (saltó):', this.player2.specialActionUsed);
    console.log('[DEBUG] Player 1 canReorganize:', this.player1.canReorganize());
    console.log('[DEBUG] Player 2 canReorganize:', this.player2.canReorganize());
    
    // Activar fase de reorganización
    this.reorganizePhase = true;
    
    // LÓGICA: Siempre empieza el Jugador 1
    // Si J1 no puede reorganizar (porque saltó), pasa directamente a J2
    
    if (this.player1.canReorganize()) {
      // J1 SÍ puede reorganizar
      console.log('[DEBUG] → Jugador 1 puede reorganizar (no usó saltar)');
      this.reorganizePlayer = this.player1.id;
    } else if (this.player2.canReorganize()) {
      // J1 NO puede, pero J2 SÍ puede
      console.log('[DEBUG] → Jugador 1 NO puede (usó saltar), pasando a Jugador 2');
      this.reorganizePlayer = this.player2.id;
    } else {
      // Ninguno puede reorganizar (ambos saltaron)
      console.log('[DEBUG] → NADIE puede reorganizar (ambos usaron saltar)');
      console.log('[DEBUG] → Terminando juego directamente');
      this.gameState = 'GAME_END';
      this.reorganizePhase = false;
    }
    
    console.log('[DEBUG] ========================================');
  }

  nextReorganizePlayer() {
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] nextReorganizePlayer llamado');
    console.log('[DEBUG] Jugador actual que terminó:', this.reorganizePlayer);
    console.log('[DEBUG] ========================================');
    
    // CASO 1: Acabó el turno del Jugador 1
    if (this.reorganizePlayer === this.player1.id) {
      console.log('[DEBUG] Jugador 1 terminó su fase de reorganizar');
      console.log('[DEBUG] Verificando si Jugador 2 puede reorganizar...');
      console.log('[DEBUG] - Player 2 canReorganize():', this.player2.canReorganize());
      console.log('[DEBUG] - Player 2 hasReorganized:', this.player2.hasReorganized);
      console.log('[DEBUG] - Player 2 specialActionUsed (saltó):', this.player2.specialActionUsed);
      
      // Verificar si el jugador 2 puede reorganizar
      if (this.player2.canReorganize() && !this.player2.hasReorganized) {
        console.log('[DEBUG] ✅ Jugador 2 SÍ puede reorganizar - Pasando turno');
        this.reorganizePlayer = this.player2.id;
        return;
      } else {
        console.log('[DEBUG] ❌ Jugador 2 NO puede reorganizar - Terminando juego');
        this.gameState = 'GAME_END';
        this.reorganizePhase = false;
        return;
      }
    }
    
    // CASO 2: Acabó el turno del Jugador 2
    if (this.reorganizePlayer === this.player2.id) {
      console.log('[DEBUG] Jugador 2 terminó su fase de reorganizar');
      console.log('[DEBUG] Ya no hay más turnos - Terminando juego');
      this.gameState = 'GAME_END';
      this.reorganizePhase = false;
      return;
    }
    
    console.log('[DEBUG] ========================================');
  }

  checkGameEnd() {
    const player1Full = this.player1.isBoardFull();
    const player2Full = this.player2.isBoardFull();
    const bagEmpty = this.characterBag.isEmpty();

    if (bagEmpty) {
      this.gameState = 'GAME_END';
      return true;
    }

    if (player1Full && player2Full && !this.reorganizePhase) {
      this.checkReorganizePhase();
    }

    return this.gameState === 'GAME_END';
  }

  getPlayer(playerId) {
    if (this.player1.id === playerId) return this.player1;
    if (this.player2.id === playerId) return this.player2;
    return null;
  }

  getGameState() {
    return {
      state: this.gameState,
      currentPlayer: this.currentPlayerTurn,
      turnCount: this.turnCount,
      reorganizePhase: this.reorganizePhase,
      reorganizePlayer: this.reorganizePlayer,
      player1: {
        id: this.player1.id,
        board: this.player1.board,
        currentCharacter: this.player1.currentCharacter,
        specialActionUsed: this.player1.specialActionUsed,
        hasReorganized: this.player1.hasReorganized,
        boardFull: this.player1.isBoardFull(),
        canReorganize: this.player1.canReorganize()
      },
      player2: {
        id: this.player2.id,
        board: this.player2.board,
        currentCharacter: this.player2.currentCharacter,
        specialActionUsed: this.player2.specialActionUsed,
        hasReorganized: this.player2.hasReorganized,
        boardFull: this.player2.isBoardFull(),
        canReorganize: this.player2.canReorganize()
      },
      bagRemaining: this.characterBag.getRemainingCount()
    };
  }
}

module.exports = GameEngine;