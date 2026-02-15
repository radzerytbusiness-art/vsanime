# 🎮 AnimeVS - Competitive Arena

Una aplicación fullstack de juego multiplayer por turnos inspirada en anime, con soporte para modo online y modo local.

## 🚀 Características

- **Modo Online**: Crea y únete a salas con contraseña
- **Modo Local**: Juega contra otro jugador en la misma pantalla
- **Sistema de Personajes**: Bolsa compartida de 14 personajes anime únicos
- **Mecánicas de Juego**: Asignación estratégica de personajes a roles
- **Acciones Especiales**: Skip (descartar personaje) y Reorganizar (intercambiar roles)
- **WebSockets**: Sincronización en tiempo real con Socket.IO
- **Diseño Responsivo**: Funciona en desktop y mobile
- **UI Moderna**: Diseño con degradientes y efectos neón

## 📋 Requisitos

- Node.js >= 14.16.0
- npm >= 6.14.0

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/RadzerQA/vsanime.git
cd vsanime
```

### 2. Instalar dependencias

#### Opción A - Instalar todo de una vez (Recomendado)
```bash
npm run install:all
```

#### Opción B - Instalar manualmente
```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita el archivo `.env`:
```env
# Backend Server URL
REACT_APP_SERVER_URL=http://localhost:5000

# Puerto del servidor (backend)
PORT=5000

# URL del cliente (para CORS)
CLIENT_URL=http://localhost:3000
```

## 🚀 Ejecución

### Modo Desarrollo (Frontend + Backend simultáneamente)

```bash
npm run dev:full
```

Esto inicia:
- Backend en `http://localhost:5000`
- Frontend en `http://localhost:3000`

### Solo Backend

```bash
npm start
# o con auto-reload
npm run dev
```

### Solo Frontend

```bash
cd client
npm start
```

## 📁 Estructura del Proyecto

```
vsanime/
├── backend/
│   ├── GameEngine.js          # Lógica principal del juego
│   ├── RoomManager.js          # Gestión de salas multijugador
│   └── LocalGameManager.js     # Gestión de juego local
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js              # Componente raíz
│       ├── index.js            # Entry point
│       ├── pages/
│       │   ├── Home.js         # Pantalla principal
│       │   ├── CreateRoom.js   # Crear sala online
│       │   ├── JoinRoom.js     # Unirse a sala
│       │   ├── GameBoard.js    # Tablero online
│       │   └── LocalGame.js    # Tablero local
│       ├── components/
│       │   ├── CharacterSlot.js
│       │   └── RoleLabel.js
│       └── styles/
│           ├── index.css
│           ├── components/
│           └── pages/
├── server.js                   # Servidor Express + Socket.IO
├── package.json
├── .env
└── README.md
```

## 🎮 Cómo Jugar

### Modo Online

1. **Crear Sala**:
   - Click en "Online Match"
   - Ingresa nombre de sala (ej: "Duelo-01")
   - (Opcional) Ingresa contraseña
   - Espera al segundo jugador

2. **Unirse a Sala**:
   - Otro jugador da click en "Online Match"
   - Selecciona "Unirse a Sala"
   - Ingresa mismo nombre y contraseña
   - El juego inicia automáticamente

3. **Mecánicas**:
   - **Tu turno**: Roba un personaje → Asígnalo a un rol
   - **Acción Especial**: Una vez por juego puedes:
     - **Skip**: Descartar personaje actual y robar otro (debes asignarlo)
     - **Reorganizar**: Intercambiar 2 personajes ya asignados
   - **Objetivo**: Ser el primero en completar los 6 roles

### Modo Local

1. Click en "Local VS"
2. Turno del Jugador 1: Roba → Asigna
3. Click "Siguiente Turno"
4. Turno del Jugador 2: Roba → Asigna
5. Repite hasta completar

## 🏗️ Tecnologías

### Backend
- **Node.js** + **Express** - Servidor HTTP
- **Socket.IO** - WebSockets en tiempo real
- **Crypto** - Generación de UUIDs y hash de contraseñas

### Frontend
- **React 18** - UI Library
- **React Router v6** - Navegación
- **Socket.IO Client** - Comunicación en tiempo real
- **CSS3** - Estilos modernos con gradientes y animaciones

## 🎯 Roles del Juego

| Rol | Icono | Descripción |
|-----|-------|-------------|
| **Capitán** | ⭐ | Líder del equipo |
| **Vice Capitán** | 🛡️ | Segundo al mando |
| **Tanque** | 🛡️ | Defensa principal |
| **Healer** | ❤️ | Soporte de curación |
| **Soporte** | ⚡ | Apoyo táctico |
| **Soporte 2** | ✨ | Apoyo secundario |

## 🔌 API Endpoints

### HTTP
- `GET /` - Estado del servidor
- `GET /api/rooms` - Lista de salas activas
- `GET /api/stats` - Estadísticas del servidor

### WebSocket Events

#### Salas Online
- `CREATE_ROOM` - Crear sala
- `JOIN_ROOM` - Unirse a sala
- `ROOM_CREATED` - Sala creada exitosamente
- `ROOM_JOINED` - Unido a sala exitosamente
- `ROOM_FULL` - Sala completa (2 jugadores)
- `GAME_STARTED` - Juego iniciado

#### Acciones de Juego
- `DRAW_CHARACTER` - Robar personaje
- `ASSIGN_CHARACTER` - Asignar a rol
- `SKIP_CHARACTER` - Saltar personaje (acción especial)
- `REORGANIZE` - Reorganizar roles (acción especial)
- `END_TURN` - Terminar turno

#### Eventos del Sistema
- `GAME_FINISHED` - Juego terminado
- `PLAYER_DISCONNECTED` - Jugador desconectado
- `ERROR` - Error general

## 🐛 Debugging

El servidor muestra logs detallados:

```
🟢 [CONNECT] Cliente conectado: abc123
📝 [CREATE_ROOM] Socket abc123 creando sala: Mi-Sala
✅ [CREATE_ROOM] Sala creada exitosamente
🎴 [DRAW] Personaje robado: Naruto Uzumaki
⚔️ [ASSIGN] Personaje asignado a CAPITAN
⏩ [END_TURN] Turno terminado
🔴 [DISCONNECT] Cliente desconectado: abc123
```

## 📝 Scripts Disponibles

```bash
npm start              # Iniciar servidor backend
npm run dev            # Servidor con auto-reload (nodemon)
npm run client         # Solo frontend
npm run dev:full       # Frontend + Backend simultáneo
npm run build          # Build producción del frontend
npm run install:all    # Instalar todas las dependencias
```

## 🚧 Próximas Características

- [ ] Sistema de matchmaking automático
- [ ] Chat en tiempo real
- [ ] Historial de partidas
- [ ] Estadísticas de jugador
- [ ] Más personajes de anime
- [ ] Sistema de habilidades únicas por personaje
- [ ] Torneos y rankings
- [ ] Música y efectos de sonido
- [ ] Modo espectador

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**RadzerYT**
- YouTube: [@RadzerYT](https://youtube.com/@radzeryt)
- GitHub: [@RadzerQA](https://github.com/RadzerQA)

## 🙏 Agradecimientos

- Personajes de anime utilizados son propiedad de sus respectivos autores
- Inspirado en juegos de estrategia por turnos
- Comunidad de React y Socket.IO

---

⭐ Si te gusta el proyecto, dale una estrella en GitHub!
