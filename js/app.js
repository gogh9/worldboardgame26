// 세계여행 말판놀이 - Main Application Logic (Perfect Multiplayer Synchronization)
import { BOARD_CELLS, CLIMATE_CARDS, TERRAIN_CARDS, PLAYER_PROFILES, MAP_CELL_COORDINATES } from './boardData.js';
import { HybridNetworkManager } from './network.js';
import { sound } from './sound.js';
import { ClassModeManager } from './classMode.js';

class WorldGameApp {
  constructor() {
    this.network = null;
    this.mode = 'LOCAL'; // 'LOCAL' | 'ONLINE'
    this.myPlayerId = 0;
    this.selectedCharId = 0;
    this.joinRetryTimer = null;

    // Game Core State
    this.state = {
      status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'GAMEOVER'
      round: 1,
      turnIndex: 0,
      players: [],
      cells: JSON.parse(JSON.stringify(BOARD_CELLS)).map(cell => ({
        ...cell,
        ownerId: null
      })),
      lastDice: 1,
      isRolling: false,
      worldTravelPending: false,
      activeQuiz: null,
      activeCard: null
    };

    this.initDOM();
    this.initNickname();
    this.classMode = new ClassModeManager(this);
    this.initEvents();
    this.initLobbyNetwork();
    
    // 기본 시작 화면을 방 선택 로비로 바로 진입
    this.switchScreen('lobby');
    this.setupLobbyView(false);
    this.checkUrlParams();
  }

  // 닉네임 로컬스토리지 영구 저장 및 자동 로드
  initNickname() {
    const savedNick = localStorage.getItem('worldgame_nickname');
    if (savedNick) {
      this.inputNickname.value = savedNick;
    } else {
      const randNum = Math.floor(Math.random() * 89 + 10);
      this.inputNickname.value = `탐험가${randNum}`;
      localStorage.setItem('worldgame_nickname', this.inputNickname.value);
    }

    this.inputNickname.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        localStorage.setItem('worldgame_nickname', val);
      }
    });
  }

  // URL 파라미터 확인 (?class=CODE 형태 접속 시 학생 대기실로 자동 이동)
  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const classCode = params.get('class');
    if (classCode && this.classMode) {
      this.classMode.openStudentEntry(classCode);
    }
  }

  // DOM 캐싱
  initDOM() {
    this.screens = {
      lobby: document.getElementById('screen-lobby'),
      classTeacher: document.getElementById('screen-class-teacher'),
      classStudent: document.getElementById('screen-class-student'),
      game: document.getElementById('screen-game')
    };

    // Lobby Elements
    this.lobbyJoinSec = document.getElementById('lobby-join-section');
    this.lobbyRoomSec = document.getElementById('lobby-room-section');
    this.inputNickname = document.getElementById('input-nickname');
    this.inputRoomCode = document.getElementById('input-room-code');
    this.dispRoomCode = document.getElementById('disp-room-code');
    this.lobbySlots = document.getElementById('lobby-player-slots');
    this.charChipsContainer = document.getElementById('character-chips-container');
    this.btnToggleReady = document.getElementById('btn-toggle-ready');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.roomsListContainer = document.getElementById('rooms-list-container');
    this.noRoomsPlaceholder = document.getElementById('no-rooms-placeholder');

    // Game Elements
    this.boardCellsGrid = document.getElementById('board-cells-grid');
    this.pawnsLayer = document.getElementById('pawns-layer');
    this.mapPawnsLayer = document.getElementById('map-pawns-layer');
    this.playersPanel = document.getElementById('players-status-panel');
    this.turnBanner = document.getElementById('turn-announcer-banner');
    this.turnPlayerName = document.getElementById('turn-player-name');
    this.turnDot = document.getElementById('turn-dot');
    this.gameRoundTag = document.getElementById('game-round-tag');
    this.gameModeTag = document.getElementById('game-mode-tag');
    
    // Dice Elements
    this.diceWidget = document.getElementById('dice-widget');
    this.diceCube = document.getElementById('dice-cube');

    // Modals
    this.modalQuiz = document.getElementById('modal-quiz');
    this.modalCard = document.getElementById('modal-card');
    this.modalSpecial = document.getElementById('modal-special');
    this.modalVictory = document.getElementById('modal-victory');
  }

  // 이벤트 바인딩
  initEvents() {
    // 1. Navigation & Modals
    const btnGotoLocal = document.getElementById('btn-goto-local');
    if (btnGotoLocal) {
      btnGotoLocal.addEventListener('click', () => {
        this.switchScreen('localSetup');
        this.setupLocalView(3);
      });
    }

    const btnGotoLocalQuick = document.getElementById('btn-goto-local-quick');
    if (btnGotoLocalQuick) {
      btnGotoLocalQuick.addEventListener('click', () => {
        this.switchScreen('localSetup');
        this.setupLocalView(3);
      });
    }

    // 2. Lobby & Local Back Navigation

    // 3. Lobby & Local Back Navigation
    const btnLobbyBack = document.getElementById('btn-lobby-back');
    if (btnLobbyBack) {
      btnLobbyBack.addEventListener('click', () => {
        if (this.network) this.network.disconnect();
        this.setupLobbyView(false);
      });
    }

    const btnLocalBack = document.getElementById('btn-local-back');
    if (btnLocalBack) {
      btnLocalBack.addEventListener('click', () => {
        this.switchScreen('lobby');
        this.setupLobbyView(false);
      });
    }

    const btnRefreshRooms = document.getElementById('btn-refresh-rooms');
    if (btnRefreshRooms) {
      btnRefreshRooms.addEventListener('click', () => {
        if (this.network) {
          this.renderRoomsList(this.network.getRoomsList());
          this.showToast('방 목록을 새로고침했습니다. 🔄');
        }
      });
    }

    // 4. Online Create & Join
    const btnCreateRoom = document.getElementById('btn-create-room');
    if (btnCreateRoom) btnCreateRoom.addEventListener('click', () => this.handleCreateRoom());

    const btnJoinRoom = document.getElementById('btn-join-room');
    if (btnJoinRoom) btnJoinRoom.addEventListener('click', () => this.handleJoinRoom());

    const btnLeaveRoom = document.getElementById('btn-leave-room');
    if (btnLeaveRoom) btnLeaveRoom.addEventListener('click', () => this.leaveRoom());

    if (this.btnToggleReady) this.btnToggleReady.addEventListener('click', () => this.toggleReady());
    if (this.btnStartGame) this.btnStartGame.addEventListener('click', () => this.startOnlineGame());

    // 5. Local Setup Count Selection (선택적)
    document.querySelectorAll('.btn-count').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-count').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const count = parseInt(btn.dataset.count, 10);
        this.setupLocalView(count);
      });
    });

    const btnStartLocalGame = document.getElementById('btn-start-local-game');
    if (btnStartLocalGame) btnStartLocalGame.addEventListener('click', () => this.startLocalGame());

    // 6. Game Actions: 주사위 클릭 굴리기
    if (this.diceWidget) this.diceWidget.addEventListener('click', () => this.handleRollDice());
    if (this.diceCube) this.diceCube.addEventListener('click', () => this.handleRollDice());

    // 7. Victory Modal
    const btnVictoryRestart = document.getElementById('btn-victory-restart');
    if (btnVictoryRestart) {
      btnVictoryRestart.addEventListener('click', () => {
        this.closeModal(this.modalVictory);
        if (this.mode === 'LOCAL') {
          this.startLocalGame();
        } else if (this.isHost()) {
          this.network.send('RESTART_GAME', {});
          this.resetGameState();
        }
      });
    }
  }

  // URL Query Parameter ?room=XXXXXX 처리
  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      this.switchScreen('lobby');
      this.setupLobbyView(false);
      this.joinRoomByCode(roomCode.toUpperCase());
    }
  }

  switchScreen(screenName) {
    Object.values(this.screens).forEach(scr => {
      if (scr) scr.classList.remove('active');
    });
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
  }

  openModal(modalElem) {
    if (!modalElem) return;
    modalElem.classList.add('active');
    modalElem.style.display = 'flex';
  }

  closeModal(modalElem) {
    if (!modalElem) return;
    modalElem.classList.remove('active');
    modalElem.style.display = 'none';
  }

  showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  addLog(text, type = 'normal') {
    console.log(`[Game] ${text}`);
    if (!this.gameLogList) this.gameLogList = document.getElementById('game-log-list');
    if (!this.gameLogList) return; // 로그 패널이 없는 레이아웃에서는 콘솔에만 기록
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    item.textContent = text;
    this.gameLogList.appendChild(item);
    this.gameLogList.scrollTop = this.gameLogList.scrollHeight;
  }

  /* ========================================================================
     LOBBY & NETWORK MANAGEMENT
     ======================================================================== */
  initLobbyNetwork() {
    if (!this.network) {
      this.network = new HybridNetworkManager(
        (data, sender) => this.handleNetworkMessage(data, sender),
        (status) => this.handleNetworkStatus(status),
        (rooms) => this.renderRoomsList(rooms)
      );
    }
    if (this.classMode) {
      this.network.onClassMessage = (action, payload, senderId) => {
        this.classMode.handleClassMessage(action, payload, senderId);
      };
      if (this.network.mqttClient) {
        this.classMode.setMqttClient(this.network.mqttClient);
      }
    }
  }

  renderRoomsList(rooms) {
    if (!this.roomsListContainer) return;

    if (!rooms || rooms.length === 0) {
      this.roomsListContainer.innerHTML = '';
      if (this.noRoomsPlaceholder) {
        this.roomsListContainer.appendChild(this.noRoomsPlaceholder);
        this.noRoomsPlaceholder.classList.remove('hidden');
      }
      return;
    }

    if (this.noRoomsPlaceholder) {
      this.noRoomsPlaceholder.classList.add('hidden');
    }

    this.roomsListContainer.innerHTML = '';
    rooms.forEach(room => {
      const card = document.createElement('div');
      card.className = 'room-card';

      const isFull = room.playerCount >= room.maxPlayers;
      const isPlaying = room.status === 'PLAYING';
      
      // 진행 중인 방도 같은 이름으로 언제든 재접속할 수 있도록 항상 클릭 허용
      const canJoin = true;

      let statusBadgeHtml = '';
      let btnText = '입장하기 ➔';

      if (isPlaying) {
        statusBadgeHtml = '<span style="color: #38bdf8; font-weight: 700;">⚔️ 게임 진행 중 (재접속 가능)</span>';
        btnText = '재접속 / 입장 ➔';
      } else if (isFull) {
        statusBadgeHtml = '<span style="color: #f87171; font-weight: 700;">🚫 정원 마감 (4/4명)</span>';
        btnText = '입장하기 ➔';
      } else {
        statusBadgeHtml = `<span style="color: #34d399; font-weight: 700;">🟢 대기 중 (${room.playerCount}/${room.maxPlayers}명)</span>`;
        btnText = '입장하기 ➔';
      }

      card.innerHTML = `
        <div class="room-card-info">
          <div class="room-card-title">
            <span>🧭 ${room.title || '세계여행 탐험 방'}</span>
            <span class="room-code-tag">${room.roomCode}</span>
          </div>
          <div class="room-card-meta">
            <span>방장: <strong>${room.hostName}</strong></span>
            <span class="room-player-count">👥 ${room.playerCount} / ${room.maxPlayers}명</span>
            <span>${statusBadgeHtml}</span>
          </div>
        </div>
        <div class="room-card-actions">
          <button class="btn btn-primary btn-join-action ${canJoin ? 'btn-pulse' : ''}">
            ${btnText}
          </button>
        </div>
      `;

      card.querySelector('.btn-join-action').addEventListener('click', () => {
        this.joinRoomByCode(room.roomCode);
      });

      this.roomsListContainer.appendChild(card);
    });
  }

  setupLobbyView(isInRoom = false) {
    if (isInRoom) {
      if (this.lobbyJoinSec) this.lobbyJoinSec.classList.add('hidden');
      if (this.lobbyRoomSec) this.lobbyRoomSec.classList.remove('hidden');
      this.renderCharacterChips();
      this.renderLobbySlots();
    } else {
      if (this.lobbyJoinSec) this.lobbyJoinSec.classList.remove('hidden');
      if (this.lobbyRoomSec) this.lobbyRoomSec.classList.add('hidden');
      if (this.network) {
        this.renderRoomsList(this.network.getRoomsList());
      }
    }
  }

  renderCharacterChips() {
    if (!this.charChipsContainer) return;
    this.charChipsContainer.innerHTML = '';
    PLAYER_PROFILES.forEach(profile => {
      const isTaken = this.state.players.some(p => p.charId === profile.id && p.id !== this.myPlayerId);
      const isSelected = this.selectedCharId === profile.id;

      const chip = document.createElement('div');
      chip.className = `char-chip ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`;
      chip.innerHTML = `
        <span style="font-size: 1.6rem;">${profile.avatar}</span>
        <strong style="font-size: 0.85rem; color: ${profile.colorHex}">${profile.name}</strong>
        <span style="font-size: 0.7rem; color: #94a3b8">${profile.role}</span>
      `;

      if (!isTaken) {
        chip.addEventListener('click', () => {
          this.selectedCharId = profile.id;
          this.renderCharacterChips();
          if (this.mode === 'ONLINE') {
            this.sendPlayerUpdate();
          }
        });
      }

      this.charChipsContainer.appendChild(chip);
    });
  }

  renderLobbySlots() {
    if (!this.lobbySlots) return;
    this.lobbySlots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const player = this.state.players[i];
      const slot = document.createElement('div');

      if (player) {
        const profile = PLAYER_PROFILES[player.charId] || PLAYER_PROFILES[0];
        slot.className = 'player-slot occupied';
        slot.style.setProperty('--slot-color', profile.colorHex);
        slot.innerHTML = `
          <div class="slot-avatar">${profile.avatar}</div>
          <div class="slot-info">
            <div class="slot-name">${player.name} ${player.id === this.myPlayerId ? '(나)' : ''}</div>
            <div class="slot-role" style="color: ${profile.colorHex}">${profile.role} · ${profile.colorName}</div>
          </div>
          <div>
            ${player.isHost ? '<span class="slot-badge badge-host">👑 방장</span>' : 
              (player.isReady ? '<span class="slot-badge badge-ready">✔ 준비</span>' : '<span class="slot-badge">대기중</span>')}
          </div>
        `;
      } else {
        slot.className = 'player-slot empty';
        slot.innerHTML = `<span>+ 탐험가 대기중 (${i + 1}P)</span>`;
      }

      this.lobbySlots.appendChild(slot);
    }

    // 방장 여부에 따른 버튼 제어
    const me = this.state.players.find(p => p.id === this.myPlayerId);
    if (me && me.isHost) {
      if (this.btnToggleReady) this.btnToggleReady.classList.add('hidden');
      if (this.btnStartGame) {
        this.btnStartGame.classList.remove('hidden');
        const otherClients = this.state.players.filter(p => !p.isHost);
        const allClientsReady = otherClients.length === 0 || otherClients.every(p => p.isReady);
        this.btnStartGame.disabled = false;
        this.btnStartGame.style.opacity = allClientsReady ? '1' : '0.7';
        this.btnStartGame.className = allClientsReady ? 'btn btn-primary btn-pulse' : 'btn btn-primary';
      }

      if (this.network) {
        this.network.updateHostingInfo({
          playerCount: this.state.players.length
        });
      }
    } else {
      if (this.btnToggleReady) {
        this.btnToggleReady.classList.remove('hidden');
        if (me) {
          this.btnToggleReady.textContent = me.isReady ? '준비 해제 (CANCEL)' : '준비 완료 (READY)';
          this.btnToggleReady.className = me.isReady ? 'btn btn-secondary' : 'btn btn-primary';
        }
      }
      if (this.btnStartGame) this.btnStartGame.classList.add('hidden');
    }
  }

  // 방 만들기
  async handleCreateRoom() {
    const nick = this.inputNickname ? (this.inputNickname.value.trim() || '탐험대장') : '탐험대장';
    this.mode = 'ONLINE';
    this.myPlayerId = 0;
    this.selectedCharId = 0;

    this.updateNetworkBadge('connecting', '방 생성 중...');

    try {
      if (!this.network) {
        this.initLobbyNetwork();
      }
      const res = await this.network.createRoom(nick);
      if (this.dispRoomCode) this.dispRoomCode.textContent = res.roomCode;
      this.state.players = [{
        id: 0,
        peerId: this.network ? this.network.myId : 'host_1',
        name: nick,
        charId: 0,
        isHost: true,
        isReady: true,
        position: 0,
        conqueredCount: 0,
        isIslandSkip: false
      }];

      this.setupLobbyView(true);
      this.showToast(`방이 생성되었습니다! (방 코드: ${res.roomCode})`);
      sound.playItemGet();
    } catch (err) {
      console.error('방 생성 오류:', err);
      alert('방 생성에 실패했습니다: ' + (err && err.message ? err.message : err));
      this.updateNetworkBadge('offline', '오류 발생');
    }
  }

  // 방 클릭 또는 코드로 입장
  async joinRoomByCode(code) {
    const nick = this.inputNickname.value.trim() || '원정대원';
    this.mode = 'ONLINE';
    this.updateNetworkBadge('connecting', '방 접속 중...');

    try {
      const res = await this.network.joinRoom(code, nick);
      if (this.dispRoomCode) this.dispRoomCode.textContent = res.roomCode;
      this.setupLobbyView(true);

      const sendJoin = () => {
        this.network.send('JOIN_REQUEST', {
          name: nick,
          charId: this.findAvailableCharId()
        });
      };

      sendJoin();
      if (this.joinRetryTimer) clearInterval(this.joinRetryTimer);
      let retries = 0;
      this.joinRetryTimer = setInterval(() => {
        if (this.state.players.some(p => p.peerId === this.network.myId) || retries++ > 4) {
          clearInterval(this.joinRetryTimer);
          this.joinRetryTimer = null;
        } else {
          sendJoin();
        }
      }, 1000);

    } catch (err) {
      alert('방 접속에 실패했습니다.');
      this.updateNetworkBadge('offline', '접속 실패');
    }
  }

  handleJoinRoom() {
    const code = this.inputRoomCode.value.trim().toUpperCase();
    if (!code) {
      alert('방 코드를 입력해주세요.');
      return;
    }
    this.joinRoomByCode(code);
  }

  findAvailableCharId() {
    const taken = this.state.players.map(p => p.charId);
    for (let i = 0; i < 4; i++) {
      if (!taken.includes(i)) return i;
    }
    return 0;
  }

  toggleReady() {
    const me = this.state.players.find(p => p.id === this.myPlayerId);
    if (!me) return;
    me.isReady = !me.isReady;
    this.renderLobbySlots();
    this.sendPlayerUpdate();
  }

  sendPlayerUpdate() {
    const me = this.state.players.find(p => p.id === this.myPlayerId);
    if (!me) return;
    me.charId = this.selectedCharId;

    if (this.isHost()) {
      this.broadcastState();
    } else {
      this.network.send('UPDATE_PLAYER', {
        id: this.myPlayerId,
        charId: this.selectedCharId,
        isReady: me.isReady
      });
    }
    this.renderLobbySlots();
  }

  leaveRoom() {
    if (this.network) {
      this.network.send('PLAYER_LEAVE', { id: this.myPlayerId });
      this.network.disconnect();
    }
    this.state.players = [];
    this.setupLobbyView(false);
  }

  isHost() {
    return this.mode === 'ONLINE' && this.network && this.network.isHost;
  }

  updateNetworkBadge(status, text) {
    if (this.netBadge) this.netBadge.className = `network-badge ${status}`;
    if (this.netStatusText) this.netStatusText.textContent = text;
  }

  handleNetworkStatus(status) {
    if (status.type === 'LOBBY_READY') {
      this.updateNetworkBadge('online', '로비 연결됨');
    } else if (status.type === 'HOST_READY') {
      this.updateNetworkBadge('online', '방장 (대기중)');
    } else if (status.type === 'JOINED_SUCCESS') {
      this.updateNetworkBadge('online', '방 접속 완료');
      this.showToast('방에 접속했습니다. 준비를 완료해주세요!');
    }
  }

  /* ========================================================================
     NETWORK MESSAGE DISPATCHER (실시간 액션 & 상태 동기화)
     ======================================================================== */
  handleNetworkMessage(data, senderId) {
    const { action, payload } = data;

    switch (action) {
      // 1. 신규 참가자 입장 및 기존 참가자 재접속(Reconnect)
      case 'JOIN_REQUEST':
        if (this.isHost()) {
          const reqName = (payload.name || '').trim();

          // 1-1. 이미 동일한 peerId로 존재하는 경우
          const existingByPeer = this.state.players.find(p => p.peerId === senderId);
          if (existingByPeer) {
            existingByPeer.name = reqName || existingByPeer.name;
            this.broadcastState();
            return;
          }

          // 1-2. 동일한 닉네임으로 참가했던 기존 플레이어인지 확인 (중간 이탈자 완벽 재접속!)
          const existingByName = this.state.players.find(p => p.name.trim().toLowerCase() === reqName.toLowerCase());
          if (existingByName) {
            existingByName.peerId = senderId;
            this.addLog(`🔄 [${existingByName.name}] 님이 게임에 재접속했습니다!`, 'system');
            this.showToast(`🎉 ${existingByName.name}님이 게임에 다시 연결되었습니다!`);
            sound.playItemGet();
            this.broadcastState();
            return;
          }

          // 1-3. 게임이 이미 진행 중인데 기존 참가자가 아닌 새로운 사용자일 경우
          if (this.state.status === 'PLAYING') {
            const playerNames = this.state.players.map(p => `[${p.name}]`).join(', ');
            this.network.send('JOIN_DENIED', { 
              message: `현재 게임이 진행 중인 방입니다.\n처음 참가하셨던 닉네임(${playerNames})으로 입력하시면 게임을 이어서 진행할 수 있습니다.` 
            });
            return;
          }

          // 1-4. 대기실 상태에서 4명 정원 초과인 경우
          if (this.state.players.length >= 4) {
            this.network.send('JOIN_DENIED', { message: '방 인원이 가득 찼습니다. (최대 4인)' });
            return;
          }

          // 1-5. 대기실 상태에서 신규 참가자 추가
          const newId = this.state.players.length;
          const assignedChar = this.findAvailableCharId();
          this.state.players.push({
            id: newId,
            peerId: senderId,
            name: reqName || `탐험가${newId + 1}`,
            charId: assignedChar,
            isHost: false,
            isReady: false,
            position: 0,
            conqueredCount: 0,
            isIslandSkip: false
          });

          this.showToast(`🎉 ${reqName}님이 방에 참가했습니다!`);
          sound.playItemGet();

          this.renderLobbySlots();
          this.broadcastState();
        }
        break;

      // 2. 플레이어 설정 변경
      case 'UPDATE_PLAYER':
        if (this.isHost()) {
          const target = this.state.players.find(p => p.peerId === senderId);
          if (target) {
            target.charId = payload.charId;
            target.isReady = payload.isReady;
            this.renderLobbySlots();
            this.broadcastState();
          }
        }
        break;

      // 3. 전체 게임 상태 동기화 (재접속 포함)
      case 'SYNC_STATE':
        const wasInGame = this.screens.game.classList.contains('active');
        this.state = payload.state;
        
        const me = this.state.players.find(p => p.peerId === this.network.myId);
        if (me) {
          this.myPlayerId = me.id;
          this.selectedCharId = me.charId;
        }

        if (this.state.status === 'PLAYING') {
          if (!wasInGame) {
            this.switchScreen('game');
            this.renderBoard();
            this.showToast(`🎮 게임에 성공적으로 재접속했습니다! (닉네임: ${me ? me.name : '탐험가'})`);
            sound.playCorrect();
          }
          this.renderPawns();
          this.updateGameUI();
        } else if (this.screens.lobby.classList.contains('active')) {
          this.setupLobbyView(true);
        }
        break;

      // 4. 게임 시작
      case 'START_GAME':
        this.state = payload.state;
        const meStart = this.state.players.find(p => p.peerId === this.network.myId);
        if (meStart) {
          this.myPlayerId = meStart.id;
        }
        this.switchScreen('game');
        this.renderBoard();
        this.updateGameUI();
        this.addLog('온라인 탐험이 시작되었습니다! 행운을 빕니다.', 'system');
        sound.playCorrect();
        break;

      // 5. 플레이어 퇴장 또는 일시 접속 끊김
      case 'PLAYER_LEAVE':
        if (this.isHost()) {
          if (this.state.status === 'PLAYING') {
            // 게임 진행 중일 때는 플레이어 슬롯과 진행 상태(말 위치, 점령 현황 등)를 영구 보존하여 재접속 가능하게 유지
            const target = this.state.players.find(p => p.peerId === senderId);
            if (target) {
              this.addLog(`⚠️ [${target.name}] 님의 연결이 일시 중단되었습니다. (동일 닉네임으로 언제든 재접속 가능)`, 'system');
              this.showToast(`${target.name}님의 연결이 일시 중단되었습니다.`);
            }
            this.broadcastState();
          } else {
            this.state.players = this.state.players.filter(p => p.peerId !== senderId);
            this.renderLobbySlots();
            this.broadcastState();
            this.showToast('참가자 한 명이 방을 나갔습니다.');
          }
        }
        break;

      // 입장 거부 알림
      case 'JOIN_DENIED':
        alert(payload.message || '방에 입장할 수 없습니다.');
        this.leaveRoom();
        break;

      // 6. 주사위 굴림 동기화 (모든 참여자 화면 동시 회전 및 이동)
      case 'DICE_ROLLED':
        this.state.turnIndex = payload.playerIndex;
        this.animateDiceRoll(payload.diceNum, payload.playerIndex, () => {
          this.movePawn(payload.playerIndex, payload.steps);
        });
        break;

      // 7. 세계여행 워프 이동 동기화
      case 'WORLD_TRAVEL_MOVE':
        this.teleportPawn(payload.playerIndex, payload.targetCellIndex);
        break;

      // 8. 퀴즈/카드 답안 결과 동기화
      case 'SUBMIT_ANSWER':
        this.handleRemoteSubmitAnswer(payload);
        break;

      // 9. 다음 턴 전환 동기화
      case 'ADVANCE_TURN':
        this.closeModal(this.modalQuiz);
        this.closeModal(this.modalCard);
        this.closeModal(this.modalSpecial);
        this.state.worldTravelPending = false;
        this.state.isRolling = false;
        this.state.turnIndex = payload.turnIndex;
        this.state.round = payload.round;
        if (payload.players) {
          this.state.players = payload.players;
        }
        if (payload.cells) {
          this.state.cells = payload.cells;
        }
        
        this.renderPawns();
        this.updateGameUI();

        const nextPlayer = this.state.players[this.state.turnIndex];
        const nextProf = nextPlayer ? (PLAYER_PROFILES[nextPlayer.charId] || PLAYER_PROFILES[0]) : null;
        
        if (this.isMyTurn()) {
          sound.playItemGet();
          if (nextPlayer && nextPlayer.isIslandSkip) {
            this.showToast(`🏝️ 무인도에 조난 중입니다! [무인도 1턴 쉬기] 버튼을 눌러 차례를 넘기세요.`);
          } else {
            this.showToast(`🔔 나의 차례입니다! [주사위 굴리기] 버튼을 눌러 이동하세요! 🎲`);
          }
        } else {
          this.addLog(`👉 다음 차례: ${nextPlayer ? nextPlayer.name : '플레이어'}님`, 'normal');
        }

        if (this.isHost()) {
          this.broadcastState();
        }
        break;

      // 10. 재시작
      case 'RESTART_GAME':
        this.resetGameState();
        break;
    }
  }

  broadcastState() {
    if (!this.isHost()) return;
    this.network.send('SYNC_STATE', { state: this.state });
  }

  startOnlineGame() {
    if (!this.isHost()) {
      this.showToast('방장만 게임을 시작할 수 있습니다.');
      return;
    }

    const otherClients = this.state.players.filter(p => !p.isHost);
    const unreadyClients = otherClients.filter(p => !p.isReady);
    if (unreadyClients.length > 0) {
      const names = unreadyClients.map(p => `[${p.name}]`).join(', ');
      this.showToast(`아직 준비하지 않은 참가자가 있습니다: ${names}`);
      return;
    }

    this.state.status = 'PLAYING';
    this.state.turnIndex = 0;
    this.state.round = 1;
    this.state.cells.forEach(c => c.ownerId = null);
    this.state.players.forEach(p => {
      p.position = 0;
      p.conqueredCount = 0;
      p.isIslandSkip = false;
    });

    if (this.network) {
      this.network.updateHostingInfo({
        status: 'PLAYING',
        playerCount: this.state.players.length
      });
    }

    this.network.send('START_GAME', { state: this.state });
    this.switchScreen('game');
    this.renderBoard();
    this.updateGameUI();
    this.addLog('온라인 탐험이 시작되었습니다!', 'system');
    sound.playCorrect();
  }

  /* ========================================================================
     LOCAL PASS & PLAY MODE SETUP
     ======================================================================== */
  setupLocalView(count) {
    const container = document.getElementById('local-players-inputs');
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
      const prof = PLAYER_PROFILES[i];
      const row = document.createElement('div');
      row.className = 'local-player-row';
      row.innerHTML = `
        <span style="font-size: 1.5rem;">${prof.avatar}</span>
        <strong style="color: ${prof.colorHex}; min-width: 60px;">${prof.colorName} (${i + 1}P)</strong>
        <input type="text" id="local-nick-${i}" value="${prof.name}" maxlength="8" placeholder="이름 입력">
      `;
      container.appendChild(row);
    }
  }

  startLocalGame() {
    this.mode = 'LOCAL';
    const activeCountBtn = document.querySelector('.btn-count.active');
    const count = parseInt(activeCountBtn ? activeCountBtn.dataset.count : 3, 10);

    this.state.status = 'PLAYING';
    this.state.turnIndex = 0;
    this.state.round = 1;
    this.state.players = [];
    this.state.cells = JSON.parse(JSON.stringify(BOARD_CELLS)).map(c => ({ ...c, ownerId: null }));

    for (let i = 0; i < count; i++) {
      const input = document.getElementById(`local-nick-${i}`);
      const name = input && input.value.trim() ? input.value.trim() : PLAYER_PROFILES[i].name;
      this.state.players.push({
        id: i,
        name: name,
        charId: i,
        position: 0,
        conqueredCount: 0,
        isIslandSkip: false
      });
    }

    this.switchScreen('game');
    this.renderBoard();
    this.updateGameUI();
    this.addLog('로컬 탐험이 시작되었습니다! 주사위를 굴려보세요.', 'system');
    sound.playCorrect();
  }

  /* ========================================================================
     BOARD RENDERING & PAWN MOVEMENT
     ======================================================================== */
  renderBoard() {
    this.boardCellsGrid.innerHTML = '';

    this.state.cells.forEach(cell => {
      const cellElem = document.createElement('div');
      let extraClass = '';
      if (cell.type === 'start') extraClass = 'cell-start';
      else if (cell.type === 'world_travel' || cell.type === 'desert_island' || cell.type === 'hint_key') extraClass = 'cell-special';
      else if (cell.type.includes('card')) extraClass = 'cell-card';

      cellElem.className = `board-cell cell-pos-${cell.index} ${extraClass}`;
      cellElem.id = `board-cell-${cell.index}`;

      const trackArrow = this.getTrackDirectionIcon(cell.index);

      cellElem.innerHTML = `
        <div class="cell-bg-art" style="background-image: url('assets/board/cells/cell_${cell.index}.jpg');"></div>
        <div class="cell-overlay"></div>
        <div class="cell-track-lane"></div>
        <div class="cell-content">
          <div class="cell-top-bar">
            <span class="cell-badge">${cell.badge}</span>
            <span class="track-direction-arrow">${trackArrow}</span>
            <span class="cell-icon">${cell.type === 'start' ? '🏁' : (cell.type.includes('card') ? '🎴' : (cell.type === 'world_travel' ? '✈️' : (cell.type === 'desert_island' ? '🏝️' : (cell.type === 'hint_key' ? '📖' : '❓'))))}</span>
          </div>
        </div>
        <div class="cell-owner-stamp" id="cell-owner-${cell.index}"></div>
      `;

      if (cell.ownerId !== null && cell.type === 'quiz') {
        const owner = this.state.players.find(p => p.id === cell.ownerId);
        if (owner) {
          const prof = PLAYER_PROFILES[owner.charId] || PLAYER_PROFILES[0];
          cellElem.classList.add('conquered');
          cellElem.style.borderColor = prof.colorHex;
          cellElem.style.boxShadow = `inset 0 0 16px ${prof.glowHex}, 0 0 18px ${prof.glowHex}`;
          const tagElem = cellElem.querySelector('.cell-owner-stamp');
          if (tagElem) {
            tagElem.innerHTML = `<span class="stamp-icon">${prof.avatar}</span>`;
            tagElem.style.backgroundColor = prof.colorHex;
            tagElem.style.setProperty('--owner-glow', prof.glowHex);
            tagElem.style.display = 'flex';
          }
        }
      }

      cellElem.addEventListener('click', () => {
        if (this.state.worldTravelPending && this.isMyTurn()) {
          this.handleWorldTravelSelect(cell.index);
          return;
        }

        // 보드판의 칸을 클릭했을 때 문제/카드 내용 즉시 팝업 표시
        const currPlayer = this.state.players[this.state.turnIndex];
        const isCurrentCell = currPlayer && currPlayer.position === cell.index;

        if (cell.type === 'quiz') {
          this.openQuizModal(cell, this.state.turnIndex, cell.index, !isCurrentCell);
        } else if (cell.type === 'terrain_card' || cell.type === 'climate_card') {
          this.openCardModal(cell.type, this.state.turnIndex, cell.index, !isCurrentCell);
        } else if (cell.type === 'desert_island' || cell.type === 'world_travel' || cell.type === 'hint_key') {
          const icon = cell.badge || (cell.type === 'desert_island' ? '🏝️' : cell.type === 'world_travel' ? '✈️' : '📖');
          this.openSpecialModal(cell.title, cell.description, null, icon);
        }
      });

      this.boardCellsGrid.appendChild(cellElem);
    });

    this.renderPawns();
    this.renderMapPawns();
  }

  getTrackDirectionIcon(index) {
    if (index === 0) return '🏁';
    if (index >= 1 && index <= 5) return '➔';
    if (index === 6) return '⤵';
    if (index >= 7 && index <= 9) return '⬇';
    if (index === 10) return '↙';
    if (index >= 11 && index <= 15) return '⬅';
    if (index === 16) return '↖';
    if (index >= 17 && index <= 19) return '⬆';
    return '➔';
  }

  renderPawns() {
    if (!this.pawnsLayer) return;
    this.pawnsLayer.innerHTML = '';
    this.state.players.forEach((player) => {
      const prof = PLAYER_PROFILES[player.charId] || PLAYER_PROFILES[0];
      const pawn = document.createElement('div');
      pawn.className = 'pawn-piece';
      pawn.id = `pawn-player-${player.id}`;
      pawn.style.backgroundColor = prof.colorHex;
      pawn.style.boxShadow = `0 0 12px ${prof.glowHex}`;
      pawn.innerHTML = `<span>${prof.avatar}</span>`;
      this.pawnsLayer.appendChild(pawn);
      this.updatePawnPosition(player.id, player.position);
    });
  }

  renderMapPawns() {
    if (!this.mapPawnsLayer) return;
    this.mapPawnsLayer.innerHTML = '';
    this.state.players.forEach((player) => {
      const prof = PLAYER_PROFILES[player.charId] || PLAYER_PROFILES[0];
      const mapPawn = document.createElement('div');
      mapPawn.className = 'map-pawn-piece';
      mapPawn.id = `map-pawn-player-${player.id}`;
      mapPawn.style.backgroundColor = prof.colorHex;
      mapPawn.style.setProperty('--pawn-color', prof.colorHex);
      mapPawn.style.setProperty('--pawn-glow', prof.glowHex);
      mapPawn.style.boxShadow = `0 0 10px ${prof.glowHex}, 0 2px 6px rgba(0,0,0,0.8)`;
      mapPawn.innerHTML = `
        <span class="map-pawn-icon">${prof.avatar}</span>
        <span class="map-pawn-tooltip">${player.name}</span>
      `;
      this.mapPawnsLayer.appendChild(mapPawn);
      this.updateMapPawnPosition(player.id, player.position);
    });
  }

  updatePawnPosition(playerId, cellIndex) {
    const pawn = document.getElementById(`pawn-player-${playerId}`);
    const cell = document.getElementById(`board-cell-${cellIndex}`);
    if (pawn && cell && this.pawnsLayer) {
      const cellRect = cell.getBoundingClientRect();
      const layerRect = this.pawnsLayer.getBoundingClientRect();

      const playersInCell = this.state.players.filter(p => p.position === cellIndex);
      const orderIndex = playersInCell.findIndex(p => p.id === playerId);
      const totalInCell = playersInCell.length;

      let offsetX = 0;
      let offsetY = 0;
      if (totalInCell > 1) {
        const angles = [0, Math.PI, Math.PI / 2, (3 * Math.PI) / 2];
        const radius = 12;
        offsetX = Math.cos(angles[orderIndex % 4]) * radius;
        offsetY = Math.sin(angles[orderIndex % 4]) * radius;
      }

      const centerX = cellRect.left - layerRect.left + cellRect.width / 2 + offsetX;
      const centerY = cellRect.top - layerRect.top + cellRect.height / 2 + offsetY;

      pawn.style.left = `${centerX}px`;
      pawn.style.top = `${centerY}px`;
    }

    this.updateMapPawnPosition(playerId, cellIndex);
  }

  updateMapPawnPosition(playerId, cellIndex) {
    const mapPawn = document.getElementById(`map-pawn-player-${playerId}`);
    if (!mapPawn) return;

    const coord = MAP_CELL_COORDINATES[cellIndex] || { x: 50, y: 50 };
    const playersInCell = this.state.players.filter(p => p.position === cellIndex);
    const orderIndex = playersInCell.findIndex(p => p.id === playerId);
    const totalInCell = playersInCell.length;

    let offsetX = 0;
    let offsetY = 0;
    if (totalInCell > 1) {
      const angles = [0, Math.PI, Math.PI / 2, (3 * Math.PI) / 2];
      const radius = 1.8;
      offsetX = Math.cos(angles[orderIndex % 4]) * radius;
      offsetY = Math.sin(angles[orderIndex % 4]) * (radius * 1.5);
    }

    mapPawn.style.left = `${coord.x + offsetX}%`;
    mapPawn.style.top = `${coord.y + offsetY}%`;
  }

  // 캐릭터가 이동하거나 서 있는 카드 확대 및 강조 하이라이트
  highlightActiveCell(cellIndex, isArrival = false) {
    document.querySelectorAll('.board-cell').forEach(c => {
      c.classList.remove('cell-active-step', 'cell-arrival-sparkle');
    });
    const targetCell = document.getElementById(`board-cell-${cellIndex}`);
    if (targetCell) {
      targetCell.classList.add(isArrival ? 'cell-arrival-sparkle' : 'cell-active-step');
    }
  }

  isMyTurn() {
    if (this.mode === 'LOCAL') return true;
    const currPlayer = this.state.players[this.state.turnIndex];
    return currPlayer && currPlayer.id === this.myPlayerId;
  }

  handleRollDice() {
    if (this.state.isRolling) return;
    if (!this.isMyTurn()) {
      this.showToast('상대방의 턴입니다!');
      return;
    }

    const currPlayer = this.state.players[this.state.turnIndex];

    if (currPlayer.isIslandSkip) {
      currPlayer.isIslandSkip = false;
      this.addLog(`🏝️ ${currPlayer.name}님이 무인도에서 1턴을 쉬며 탈출 준비를 마쳤습니다. (다음 차례부터 주사위 이동)`, 'wrong');
      sound.playWrong();
      this.showToast(`${currPlayer.name}님이 무인도에서 1턴을 쉬어갔습니다. 다음 차례부터 정상 이동합니다!`);
      this.advanceTurn();
      return;
    }

    const diceNum = Math.floor(Math.random() * 6) + 1;
    this.state.lastDice = diceNum;

    if (this.mode === 'ONLINE') {
      this.network.send('DICE_ROLLED', { diceNum, playerIndex: this.state.turnIndex, steps: diceNum });
    }

    this.animateDiceRoll(diceNum, this.state.turnIndex, () => {
      this.movePawn(this.state.turnIndex, diceNum);
    });
  }

  animateDiceRoll(targetNum, playerIdx, callback) {
    this.state.isRolling = true;
    if (this.diceWidget) this.diceWidget.classList.remove('my-turn-active');
    if (this.diceCube) this.diceCube.classList.add('rolling');
    sound.playDiceRoll();

    setTimeout(() => {
      if (this.diceCube) {
        this.diceCube.classList.remove('rolling');
        this.diceCube.dataset.face = targetNum;
      }
      this.state.isRolling = false;
      if (callback) callback();
    }, 900);
  }

  movePawn(playerIdx, steps) {
    const player = this.state.players[playerIdx];
    if (!player) return;
    let remainingSteps = steps;
    const pawn = document.getElementById(`pawn-player-${player.id}`);
    const mapPawn = document.getElementById(`map-pawn-player-${player.id}`);
    if (pawn) pawn.classList.add('jumping');
    if (mapPawn) mapPawn.classList.add('jumping');

    const stepInterval = setInterval(() => {
      if (remainingSteps <= 0) {
        clearInterval(stepInterval);
        if (pawn) pawn.classList.remove('jumping');
        if (mapPawn) mapPawn.classList.remove('jumping');
        this.highlightActiveCell(player.position, true);
        setTimeout(() => {
          this.handleCellArrival(playerIdx, player.position);
        }, 320);
        return;
      }

      player.position = (player.position + 1) % this.state.cells.length;
      sound.playStep();
      this.updatePawnPosition(player.id, player.position);
      this.highlightActiveCell(player.position, false);
      remainingSteps--;
    }, 320);
  }

  teleportPawn(playerIdx, targetCellIndex) {
    const player = this.state.players[playerIdx];
    if (!player) return;
    player.position = targetCellIndex;
    sound.playVictory();
    this.updatePawnPosition(player.id, player.position);
    this.addLog(`✈️ ${player.name}님이 세계여행 찬스로 [${this.state.cells[targetCellIndex].title}] 칸으로 즉시 이동했습니다!`, 'correct');
    this.state.worldTravelPending = false;
    this.handleCellArrival(playerIdx, targetCellIndex);
  }

  /* ========================================================================
     CELL ARRIVAL & EVENT HANDLING (Quiz / Cards / Special)
     ======================================================================== */
  handleCellArrival(playerIdx, cellIndex) {
    this.state.isRolling = false;
    const cell = this.state.cells[cellIndex];
    const player = this.state.players[playerIdx];
    if (!player || !cell) return;

    this.addLog(`📍 ${player.name}님이 [${cell.title}] 칸에 도착했습니다.`);

    // 1. 출발선
    if (cell.type === 'start') {
      sound.playItemGet();
      this.showToast('출발선을 통과하여 한 바퀴를 완주했습니다! 🚀');
      if (this.isMyTurn()) this.advanceTurn();
      return;
    }

    // 2. 무인도
    if (cell.type === 'desert_island') {
      player.isIslandSkip = true;
      sound.playWrong();
      this.openSpecialModal('🏝️ 무인도 조난!', `${player.name}님이 무인도에 표류되었습니다. 다음 차례 1회 휴식합니다!`, () => {
        if (this.isMyTurn()) this.advanceTurn();
      });
      return;
    }

    // 3. 교과서 찬스 칸
    if (cell.type === 'hint_key') {
      sound.playItemGet();
      this.openSpecialModal('📖 교과서 찬스!', `다음 차례에 교과서를 10초 동안 볼 수 있어요.`, () => {
        if (this.isMyTurn()) this.advanceTurn();
      }, '📖');
      return;
    }

    // 4. 세계여행
    if (cell.type === 'world_travel') {
      sound.playItemGet();
      this.openSpecialModal('✈️ 세계여행 찬스!', `축하합니다! 지금 보드판에서 원하는 칸을 직접 클릭하여 즉시 날아갈 수 있습니다!`, () => {
        if (this.isMyTurn()) {
          this.state.worldTravelPending = true;
          this.showToast('보드판에서 가고 싶은 칸을 클릭하세요! ✈️');
        }
      });
      return;
    }

    // 5. 지형/기후 보너스 카드 미션 (점령되지 않고 누구나 도착할 때마다 계속 도전하여 점수 획득!)
    if (cell.type === 'terrain_card' || cell.type === 'climate_card') {
      this.openCardModal(cell.type, playerIdx, cellIndex);
      return;
    }

    // 6. 이미 점령된 칸 (일반 퀴즈 칸만 점령됨)
    if (cell.ownerId !== null) {
      const owner = this.state.players.find(p => p.id === cell.ownerId);
      const ownerName = owner ? owner.name : '다른 플레이어';
      this.addLog(`이미 ${ownerName}님이 점령한 칸입니다. 다음 턴으로 넘어갑니다.`);
      this.showToast(`이미 ${ownerName}님이 점령한 칸입니다.`);
      if (this.isMyTurn()) this.advanceTurn();
      return;
    }

    // 7. 일반 퀴즈 (언제나 팝업 표시!)
    if (cell.type === 'quiz') {
      this.openQuizModal(cell, playerIdx, cellIndex);
      return;
    }
  }

  handleWorldTravelSelect(targetIndex) {
    if (this.mode === 'ONLINE') {
      this.network.send('WORLD_TRAVEL_MOVE', { playerIndex: this.state.turnIndex, targetCellIndex: targetIndex });
    }
    this.teleportPawn(this.state.turnIndex, targetIndex);
  }

  openSpecialModal(title, desc, onConfirm, icon = null) {
    const iconElem = document.getElementById('special-icon');
    if (iconElem) {
      if (icon) {
        iconElem.textContent = icon;
      } else if (title && title.includes('무인도')) {
        iconElem.textContent = '🏝️';
      } else if (title && title.includes('세계여행')) {
        iconElem.textContent = '✈️';
      } else if (title && title.includes('교과서')) {
        iconElem.textContent = '📖';
      } else {
        iconElem.textContent = '⭐';
      }
    }
    const titleElem = document.getElementById('special-title');
    if (titleElem) titleElem.textContent = title;
    const descElem = document.getElementById('special-desc');
    if (descElem) descElem.textContent = desc;

    if (!this.modalSpecial) {
      this.modalSpecial = document.getElementById('modal-special');
    }
    this.openModal(this.modalSpecial);

    const btn = document.getElementById('btn-special-confirm');
    if (btn) {
      const handler = () => {
        btn.removeEventListener('click', handler);
        this.closeModal(this.modalSpecial);
        if (onConfirm) onConfirm();
      };
      btn.addEventListener('click', handler);
    }
  }

  /* ========================================================================
     QUIZ MODAL HANDLING (단답형 주관식)
     ======================================================================== */
  openQuizModal(cell, playerIdx, cellIndex, isPreview = false) {
    const player = this.state.players[playerIdx] || this.state.players[0] || { name: '탐험가', id: 0 };
    this.state.activeQuiz = { cell, playerIdx, cellIndex };

    const badgeElem = document.getElementById('quiz-cell-badge');
    if (badgeElem) {
      badgeElem.textContent = cell.badge && !isNaN(cell.badge) ? `문제 ${cell.badge} (${cell.category || '퀴즈'})` : (cell.category || '퀴즈');
    }
    const regionElem = document.getElementById('quiz-cell-region');
    if (regionElem) regionElem.textContent = cell.region || '';
    const qTextElem = document.getElementById('quiz-question-text');
    if (qTextElem) qTextElem.textContent = cell.question || '';

    // 단답형 입력 폼 및 버튼 초기화
    const inputForm = document.getElementById('quiz-input-form');
    const inputAnswer = document.getElementById('quiz-input-answer');
    const btnSubmit = document.getElementById('btn-quiz-submit');
    const feedbackBox = document.getElementById('quiz-feedback-box');
    if (feedbackBox) feedbackBox.classList.add('hidden');

    // 현재 플레이어가 직접 정답을 맞힐 수 있는 권한인지 확인
    const canAnswer = !isPreview && (
      (this.mode === 'LOCAL') || 
      (this.state.players.length <= 1) || 
      (playerIdx === this.state.turnIndex && (player.id === this.myPlayerId || !this.network))
    );

    if (canAnswer) {
      if (inputForm) inputForm.style.display = 'flex';
      if (inputAnswer) {
        inputAnswer.value = '';
        inputAnswer.placeholder = '정답을 입력하세요';
        inputAnswer.disabled = false;
      }
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '정답 제출 ➔';
        btnSubmit.style.display = 'block';
      }

      if (inputForm) {
        inputForm.onsubmit = (e) => {
          e.preventDefault();
          const userText = inputAnswer ? inputAnswer.value.trim() : '';
          if (!userText) {
            this.showToast('⚠️ 정답을 입력해주세요!');
            if (inputAnswer) inputAnswer.focus();
            return;
          }
          this.submitQuizAnswer(userText, cell, playerIdx, cellIndex);
        };
      }
    } else if (isPreview) {
      if (inputForm) inputForm.style.display = 'none';
      if (feedbackBox) {
        const icon = document.getElementById('feedback-icon');
        const title = document.getElementById('feedback-title');
        const desc = document.getElementById('feedback-desc');
        const btnConfirm = document.getElementById('btn-quiz-confirm');
        if (icon) icon.textContent = '📖';
        if (title) title.textContent = cell.ownerId !== null ? `점령 완료 (${cell.answer})` : '교과서 탐험 퀴즈';
        if (desc) desc.textContent = cell.explanation || '교과서에 수록된 지형/기후 문제 칸입니다.';
        if (btnConfirm) {
          btnConfirm.textContent = '확인 (닫기)';
          btnConfirm.onclick = () => this.closeModal(this.modalQuiz);
        }
        feedbackBox.classList.remove('hidden');
      }
    } else {
      if (inputForm) inputForm.style.display = 'flex';
      if (inputAnswer) {
        inputAnswer.value = '';
        inputAnswer.placeholder = `⏳ ${player.name}님이 정답을 생각하고 있습니다...`;
        inputAnswer.disabled = true;
      }
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = `${player.name}님의 차례 ⏳`;
        btnSubmit.style.display = 'block';
      }
    }

    if (!this.modalQuiz) {
      this.modalQuiz = document.getElementById('modal-quiz');
    }
    this.openModal(this.modalQuiz);

    if (canAnswer && inputAnswer) {
      setTimeout(() => inputAnswer.focus(), 250);
    }
  }

  // 텍스트 유사도 및 한국어 정규화 정답 판정
  checkAnswerCorrectness(userAnswer, targetAnswer, acceptableList = []) {
    if (!userAnswer) return false;
    const norm = (s) => (s || '').toLowerCase().replace(/[\s\(\)\[\]\.\,\/\-_~]/g, '');
    const userNorm = norm(userAnswer);
    if (!userNorm) return false;

    const targetNorm = norm(targetAnswer);
    if (userNorm === targetNorm) return true;

    for (const acc of acceptableList) {
      if (userNorm === norm(acc)) return true;
    }
    return false;
  }

  submitQuizAnswer(userText, cell, playerIdx, cellIndex) {
    const isCorrect = this.checkAnswerCorrectness(userText, cell.answer, cell.acceptableAnswers);
    const player = this.state.players[playerIdx];

    const inputAnswer = document.getElementById('quiz-input-answer');
    const btnSubmit = document.getElementById('btn-quiz-submit');
    if (inputAnswer) inputAnswer.disabled = true;
    if (btnSubmit) btnSubmit.disabled = true;

    if (isCorrect) {
      sound.playCorrect();
      this.claimCell(playerIdx, cellIndex);
      this.addLog(`🎉 ${player.name}님이 [${cell.title}] 정답('${cell.answer}')을 맞혀 칸을 점령했습니다!`, 'correct');
    } else {
      sound.playWrong();
      this.addLog(`❌ ${player.name}님이 오답('${userText}')을 제출했습니다. (정답: ${cell.answer})`, 'wrong');
    }

    const feedbackBox = document.getElementById('quiz-feedback-box');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackDesc = document.getElementById('feedback-desc');

    if (feedbackIcon) feedbackIcon.textContent = isCorrect ? '🎉' : '💡';
    if (feedbackTitle) {
      feedbackTitle.textContent = isCorrect
        ? `정답입니다! ('${cell.answer}') 칸을 점령했습니다.`
        : `아쉽네요! 입력: '${userText}' ➔ 정답: '${cell.answer}'`;
    }
    if (feedbackDesc) feedbackDesc.textContent = cell.explanation;
    if (feedbackBox) feedbackBox.classList.remove('hidden');

    // 온라인 멀티 동기화 전송
    if (this.mode === 'ONLINE') {
      this.network.send('SUBMIT_ANSWER', {
        type: 'QUIZ',
        isCorrect,
        userText,
        correctAnswer: cell.answer,
        playerIdx,
        cellIndex,
        explanation: cell.explanation
      });
    }

    const btnConfirm = document.getElementById('btn-quiz-confirm');
    let autoTimer = null;
    let countdown = 3;
    if (btnConfirm) {
      btnConfirm.textContent = `다음으로 진행 ➔ (${countdown}초)`;

      autoTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(autoTimer);
          this.closeModal(this.modalQuiz);
          this.advanceTurn();
        } else {
          btnConfirm.textContent = `다음으로 진행 ➔ (${countdown}초)`;
        }
      }, 1000);

      btnConfirm.onclick = () => {
        if (autoTimer) clearInterval(autoTimer);
        this.closeModal(this.modalQuiz);
        this.advanceTurn();
      };
    }
  }

  /* ========================================================================
     CARD MISSION MODAL HANDLING (단답형 주관식)
     ======================================================================== */
  openCardModal(cardType, playerIdx, cellIndex, isPreview = false) {
    const isClimate = cardType === 'climate_card';
    const cardList = isClimate ? CLIMATE_CARDS : TERRAIN_CARDS;
    const cardData = cardList[Math.floor(Math.random() * cardList.length)];
    this.state.activeCard = { cardData, cardType, playerIdx, cellIndex };
    const player = this.state.players[playerIdx] || this.state.players[0] || { name: '탐험가', id: 0 };

    const typeBadge = document.getElementById('card-type-badge');
    if (typeBadge) {
      typeBadge.textContent = isClimate ? '☀️ 기후 카드 미션' : '🏔️ 지형 카드 미션';
      typeBadge.style.background = isClimate ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';
    }

    const photoImg = document.getElementById('card-photo-img');
    if (photoImg) {
      photoImg.src = cardData.image;
      photoImg.style.animation = 'none';
      void photoImg.offsetWidth;
      photoImg.style.animation = 'cardPhotoReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    sound.playCardFlip();

    const questionElem = document.getElementById('card-question-text');
    if (questionElem) {
      questionElem.textContent = cardData.question || (isClimate ? '위 사진이 나타내는 기후는 무엇일까요? (○○)' : '위 사진이 나타내는 지형은 무엇일까요? (○○)');
    }

    const cardInputForm = document.getElementById('card-input-form');
    const cardInputAnswer = document.getElementById('card-input-answer');
    const btnCardSubmit = document.getElementById('btn-card-submit');
    const feedbackBox = document.getElementById('card-feedback-box');
    if (feedbackBox) feedbackBox.classList.add('hidden');

    const canAnswer = !isPreview && (
      (this.mode === 'LOCAL') || 
      (this.state.players.length <= 1) || 
      (playerIdx === this.state.turnIndex && (player.id === this.myPlayerId || !this.network))
    );

    if (canAnswer) {
      if (cardInputForm) cardInputForm.style.display = 'flex';
      if (cardInputAnswer) {
        cardInputAnswer.value = '';
        cardInputAnswer.placeholder = '정답을 입력하세요';
        cardInputAnswer.disabled = false;
      }
      if (btnCardSubmit) {
        btnCardSubmit.disabled = false;
        btnCardSubmit.textContent = '정답 제출 ➔';
        btnCardSubmit.style.display = 'block';
      }

      if (cardInputForm) {
        cardInputForm.onsubmit = (e) => {
          e.preventDefault();
          const userText = cardInputAnswer ? cardInputAnswer.value.trim() : '';
          if (!userText) {
            this.showToast('⚠️ 사진의 정답을 입력해주세요!');
            if (cardInputAnswer) cardInputAnswer.focus();
            return;
          }
          this.submitCardAnswer(userText, cardData, playerIdx, cellIndex);
        };
      }
    } else if (isPreview) {
      if (cardInputForm) cardInputForm.style.display = 'none';
      if (feedbackBox) {
        const title = document.getElementById('card-feedback-title');
        const desc = document.getElementById('card-feedback-desc');
        const btnConfirm = document.getElementById('btn-card-confirm');
        if (title) title.textContent = `카드: ${cardData.name}`;
        if (desc) desc.textContent = cardData.description;
        if (btnConfirm) {
          btnConfirm.textContent = '확인 (닫기)';
          btnConfirm.onclick = () => this.closeModal(this.modalCard);
        }
        feedbackBox.classList.remove('hidden');
      }
    } else {
      if (cardInputForm) cardInputForm.style.display = 'flex';
      if (cardInputAnswer) {
        cardInputAnswer.value = '';
        cardInputAnswer.placeholder = `⏳ ${player.name}님이 사진의 정답을 생각하고 있습니다...`;
        cardInputAnswer.disabled = true;
      }
      if (btnCardSubmit) {
        btnCardSubmit.disabled = true;
        btnCardSubmit.textContent = `${player.name}님의 차례 ⏳`;
        btnCardSubmit.style.display = 'block';
      }
    }

    if (!this.modalCard) {
      this.modalCard = document.getElementById('modal-card');
    }
    this.openModal(this.modalCard);

    if (canAnswer && cardInputAnswer) {
      setTimeout(() => cardInputAnswer.focus(), 250);
    }
  }

  submitCardAnswer(userText, cardData, playerIdx, cellIndex) {
    const isCorrect = this.checkAnswerCorrectness(userText, cardData.answer, cardData.acceptableAnswers);
    const player = this.state.players[playerIdx];

    const cardInputAnswer = document.getElementById('card-input-answer');
    const btnCardSubmit = document.getElementById('btn-card-submit');
    if (cardInputAnswer) cardInputAnswer.disabled = true;
    if (btnCardSubmit) btnCardSubmit.disabled = true;

    if (isCorrect) {
      sound.playCorrect();
      player.conqueredCount = (player.conqueredCount || 0) + 1;
      this.updateGameUI();
      this.checkGameVictory();
      this.addLog(`🌟 ${player.name}님이 [${cardData.name}] 카드 미션 정답('${cardData.answer}')을 맞혀 탐험 점수 1점을 획득했습니다! (총 ${player.conqueredCount}점)`, 'correct');
    } else {
      sound.playWrong();
      this.addLog(`❌ ${player.name}님이 카드 미션 오답('${userText}')을 제출했습니다. (정답: ${cardData.answer})`, 'wrong');
    }

    const feedbackBox = document.getElementById('card-feedback-box');
    const feedbackTitle = document.getElementById('card-feedback-title');
    const feedbackDesc = document.getElementById('card-feedback-desc');

    if (feedbackTitle) {
      feedbackTitle.textContent = isCorrect
        ? `정답입니다! ('${cardData.answer}') 탐험 점수 1점을 획득했습니다! ⭐`
        : `아쉽네요! 입력: '${userText}' ➔ 정답: '${cardData.answer}'`;
    }
    if (feedbackDesc) feedbackDesc.textContent = cardData.description;
    if (feedbackBox) feedbackBox.classList.remove('hidden');

    if (this.mode === 'ONLINE') {
      this.network.send('SUBMIT_ANSWER', {
        type: 'CARD',
        isCorrect,
        userText,
        correctAnswer: cardData.answer,
        playerIdx,
        cellIndex,
        description: cardData.description
      });
    }

    const btnConfirm = document.getElementById('btn-card-confirm');
    let autoCardTimer = null;
    let cardCountdown = 3;
    if (btnConfirm) {
      btnConfirm.textContent = `다음으로 진행 ➔ (${cardCountdown}초)`;

      autoCardTimer = setInterval(() => {
        cardCountdown--;
        if (cardCountdown <= 0) {
          clearInterval(autoCardTimer);
          this.closeModal(this.modalCard);
          this.advanceTurn();
        } else {
          btnConfirm.textContent = `다음으로 진행 ➔ (${cardCountdown}초)`;
        }
      }, 1000);

      btnConfirm.onclick = () => {
        if (autoCardTimer) clearInterval(autoCardTimer);
        this.closeModal(this.modalCard);
        this.advanceTurn();
      };
    }
  }

  // 타 플레이어의 답안 제출 결과 반영
  handleRemoteSubmitAnswer(payload) {
    const player = this.state.players[payload.playerIdx];
    const cell = this.state.cells[payload.cellIndex];
    const isCard = payload.type === 'CARD';

    if (payload.isCorrect) {
      sound.playCorrect();
      if (isCard) {
        if (player) player.conqueredCount = (player.conqueredCount || 0) + 1;
        this.updateGameUI();
        this.checkGameVictory();
        this.addLog(`🌟 ${player ? player.name : '플레이어'}님이 [${cell ? cell.title : '카드 미션'}] 정답('${payload.correctAnswer}')을 맞혀 탐험 점수 1점을 획득했습니다!`, 'correct');
      } else {
        this.claimCell(payload.playerIdx, payload.cellIndex);
        this.addLog(`🎉 ${player ? player.name : '플레이어'}님이 [${cell ? cell.title : '미션'}] 정답을 맞혀 점령했습니다!`, 'correct');
      }
    } else {
      sound.playWrong();
      this.addLog(`❌ ${player ? player.name : '플레이어'}님이 아쉽게 문제를 틀렸습니다. (정답: ${payload.correctAnswer})`, 'wrong');
    }

    // 모달 결과 화면 갱신
    const targetModal = isCard ? this.modalCard : this.modalQuiz;
    const feedbackBox = document.getElementById(isCard ? 'card-feedback-box' : 'quiz-feedback-box');
    const feedbackTitle = document.getElementById(isCard ? 'card-feedback-title' : 'feedback-title');
    const feedbackDesc = document.getElementById(isCard ? 'card-feedback-desc' : 'feedback-desc');
    const inputForm = document.getElementById(isCard ? 'card-input-form' : 'quiz-input-form');
    const btnConfirm = document.getElementById(isCard ? 'btn-card-confirm' : 'btn-quiz-confirm');

    if (inputForm) inputForm.style.display = 'none';
    if (feedbackBox) {
      if (feedbackTitle) {
        feedbackTitle.textContent = payload.isCorrect
          ? (isCard ? `🎉 ${player ? player.name : '플레이어'}님 정답! ('${payload.correctAnswer}') 탐험 점수 1점 획득! ⭐` : `🎉 ${player ? player.name : '플레이어'}님 정답! ('${payload.correctAnswer}') 칸을 점령했습니다.`)
          : `아쉽네요! 입력: '${payload.userText}' ➔ 정답: '${payload.correctAnswer}'`;
      }
      if (feedbackDesc) {
        feedbackDesc.textContent = payload.explanation || payload.description || '';
      }
      feedbackBox.classList.remove('hidden');

      if (btnConfirm) {
        btnConfirm.textContent = '다음으로 진행 ➔';
        btnConfirm.onclick = () => {
          this.closeModal(targetModal);
        };
      }
    }
  }

  // 칸 점령 공통 처리
  claimCell(playerIdx, cellIndex) {
    const player = this.state.players[playerIdx];
    const cell = this.state.cells[cellIndex];
    if (!player || !cell) return;
    const prof = PLAYER_PROFILES[player.charId] || PLAYER_PROFILES[0];

    cell.ownerId = player.id;
    player.conqueredCount = (player.conqueredCount || 0) + 1;

    const cellElem = document.getElementById(`board-cell-${cellIndex}`);
    const tagElem = document.getElementById(`cell-owner-${cellIndex}`);
    if (cellElem && tagElem) {
      cellElem.classList.add('conquered');
      cellElem.style.borderColor = prof.colorHex;
      cellElem.style.boxShadow = `inset 0 0 16px ${prof.glowHex}, 0 0 18px ${prof.glowHex}`;
      tagElem.innerHTML = `<span class="stamp-icon">${prof.avatar}</span>`;
      tagElem.style.backgroundColor = prof.colorHex;
      tagElem.style.setProperty('--owner-glow', prof.glowHex);
      tagElem.style.display = 'flex';
    }

    this.updateGameUI();
    this.checkGameVictory();
  }

  // 턴 전환 (온라인/로컬 완벽 동기화)
  advanceTurn() {
    const nextTurn = (this.state.turnIndex + 1) % this.state.players.length;
    let nextRound = this.state.round;
    if (nextTurn === 0) {
      nextRound++;
    }

    this.state.turnIndex = nextTurn;
    this.state.round = nextRound;

    this.updateGameUI();

    if (this.mode === 'ONLINE') {
      this.network.send('ADVANCE_TURN', { 
        turnIndex: nextTurn, 
        round: nextRound,
        players: this.state.players,
        cells: this.state.cells
      });
      if (this.isHost()) {
        this.broadcastState();
      }
    }
  }

  updateGameUI() {
    const currPlayer = this.state.players[this.state.turnIndex];
    if (!currPlayer) return;

    const prof = PLAYER_PROFILES[currPlayer.charId] || PLAYER_PROFILES[0];

    // 현재 턴인 플레이어가 서 있는 카드를 육상 트랙 포커스로 확대 강조
    document.querySelectorAll('.board-cell').forEach(c => {
      c.classList.remove('cell-turn-focus');
    });
    const currentCell = document.getElementById(`board-cell-${currPlayer.position}`);
    if (currentCell && !this.state.isRolling) {
      currentCell.classList.add('cell-turn-focus');
    }

    // 상단 턴 배너 (존재할 경우에만 갱신)
    if (this.turnPlayerName) {
      this.turnPlayerName.textContent = currPlayer.name;
      this.turnPlayerName.style.color = prof.colorHex;
    }
    if (this.turnDot) {
      this.turnDot.style.backgroundColor = prof.colorHex;
      this.turnDot.style.boxShadow = `0 0 10px ${prof.colorHex}`;
    }
    if (this.gameRoundTag) this.gameRoundTag.textContent = `${this.state.round} 라운드`;
    if (this.gameModeTag) this.gameModeTag.textContent = this.mode === 'ONLINE' ? '온라인 멀티' : '로컬 1기기';

    // 주사위 활성화 & 차례 강조 (Turn Glowing)
    const canRoll = this.isMyTurn() && !this.state.isRolling;
    if (this.diceWidget) {
      this.diceWidget.classList.toggle('my-turn-active', canRoll);
    }

    // 좌측 플레이어 카드 패널 (컴팩트 & 세련된 디자인)
    this.playersPanel.innerHTML = '';
    this.state.players.forEach((p, idx) => {
      const pProf = PLAYER_PROFILES[p.charId] || PLAYER_PROFILES[0];
      const isTurn = idx === this.state.turnIndex;

      const card = document.createElement('div');
      card.className = `player-card ${isTurn ? 'active-turn' : ''}`;
      card.style.setProperty('--card-color', pProf.colorHex);
      card.style.setProperty('--card-glow', pProf.glowHex);

      card.innerHTML = `
        <div class="card-left">
          <div class="card-avatar-wrap">
            <span class="card-avatar">${pProf.avatar}</span>
            ${isTurn ? '<span class="turn-pulse-ring"></span>' : ''}
          </div>
          <div class="card-info">
            <div class="card-player-name">
              ${p.name} ${this.mode === 'ONLINE' && p.id === this.myPlayerId ? '<span class="me-tag">나</span>' : ''}
            </div>
            <div class="card-player-role" style="color: ${pProf.colorHex}">${pProf.role}</div>
          </div>
        </div>
        <div class="card-stats-pills">
          <span class="stat-pill conquer" title="탐험 점수 (점령 및 카드 미션 성공)">⭐ <strong>${p.conqueredCount || 0}점</strong></span>
        </div>
        ${p.isIslandSkip ? '<span class="island-status-badge">🏝️ 무인도</span>' : ''}
      `;

      this.playersPanel.appendChild(card);

      const mapPawn = document.getElementById(`map-pawn-player-${p.id}`);
      if (mapPawn) {
        mapPawn.classList.toggle('active-turn', isTurn);
      }
    });
  }

  checkGameVictory() {
    const quizCells = this.state.cells.filter(c => c.type === 'quiz');
    const allConquered = quizCells.length > 0 && quizCells.every(c => c.ownerId !== null);

    if (allConquered || this.state.round > 15) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.state.status = 'GAMEOVER';
    sound.playVictory();

    if (window.confetti) {
      window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    const sorted = [...this.state.players].sort((a, b) => (b.conqueredCount || 0) - (a.conqueredCount || 0));

    const podium = document.getElementById('victory-podium');
    podium.innerHTML = '';

    const podiumOrder = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : sorted;
    const rankLabels = sorted.length >= 3 ? [2, 1, 3] : [1, 2];

    podiumOrder.forEach((player, i) => {
      if (!player) return;
      const rank = rankLabels[i];
      const prof = PLAYER_PROFILES[player.charId] || PLAYER_PROFILES[0];
      const slot = document.createElement('div');
      slot.className = `podium-slot rank-${rank}`;
      slot.innerHTML = `
        <div style="font-size: 2rem;">${prof.avatar}</div>
        <div class="podium-player" style="color: ${prof.colorHex}">${player.name}</div>
        <div class="podium-bar">${rank}위</div>
      `;
      podium.appendChild(slot);
    });

    const statsTable = document.getElementById('victory-stats-table');
    statsTable.innerHTML = '';
    sorted.forEach((p, idx) => {
      const prof = PLAYER_PROFILES[p.charId] || PLAYER_PROFILES[0];
      const row = document.createElement('div');
      row.className = 'stats-row';
      row.innerHTML = `
        <span><strong>${idx + 1}위</strong> ${prof.avatar} ${p.name}</span>
        <strong style="color: ${prof.colorHex}">${p.conqueredCount || 0}칸 점령</strong>
      `;
      statsTable.appendChild(row);
    });

    this.openModal(this.modalVictory);

    // 학급 모드인 경우 '대기실로 돌아가기' 버튼 활성화 및 결과 교사에게 보고
    const btnClassReturn = document.getElementById('btn-victory-class-return');
    if (btnClassReturn) {
      if (this.classMode && this.classMode.role === 'STUDENT') {
        btnClassReturn.classList.remove('hidden');
        btnClassReturn.onclick = () => {
          this.closeModal(this.modalVictory);
          this.classMode.returnToWaitingRoom();
        };
        const myTeam = (this.classMode.teams || []).find(t => t.players.some(p => p.id === this.classMode.studentId));
        this.classMode.sendClassMsg('TEAM_GAME_RESULT', {
          teamId: myTeam ? myTeam.id : 1,
          winner: sorted[0] ? sorted[0].name : '탐험가',
          scores: sorted.map(p => ({ name: p.name, score: p.conqueredCount || 0 }))
        });
      } else {
        btnClassReturn.classList.add('hidden');
      }
    }
  }

  resetGameState() {
    this.state.status = 'PLAYING';
    this.state.round = 1;
    this.state.turnIndex = 0;
    this.state.cells.forEach(c => c.ownerId = null);
    this.state.players.forEach(p => {
      p.position = 0;
      p.conqueredCount = 0;
      p.isIslandSkip = false;
    });
    this.renderBoard();
    this.updateGameUI();
  }
}

// Start Application
window.addEventListener('DOMContentLoaded', () => {
  window.worldGame = new WorldGameApp();
});
