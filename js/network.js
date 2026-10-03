// Hybrid Network Manager: MQTT Realtime Messaging + PeerJS WebRTC
// Netlify 정적 배포에서 100% 안정적으로 작동하는 무설치 실시간 멀티플레이어 엔진

export class HybridNetworkManager {
  constructor(onMessageCallback, onStatusCallback, onRoomsUpdateCallback) {
    this.onMessage = onMessageCallback;
    this.onStatus = onStatusCallback;
    this.onRoomsUpdate = onRoomsUpdateCallback;

    this.mqttClient = null;
    this.peer = null;
    this.isHost = false;
    this.roomCode = null;
    this.myId = 'user_' + Math.random().toString(36).substring(2, 9);
    this.myNickname = '탐험가';

    this.lobbyTopic = 'worldgame/rooms/lobby/v2';
    this.roomTopic = null;

    this.roomsMap = new Map();
    this.heartbeatTimer = null;
    this.cleanupTimer = null;

    this.initMQTT();
  }

  // MQTT 브로커 연결 (공개 무료 WebSocket 브로커)
  initMQTT() {
    try {
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
      if (window.mqtt) {
        this.mqttClient = window.mqtt.connect(brokerUrl, {
          clientId: 'wg_' + this.myId,
          clean: true,
          connectTimeout: 5000,
          reconnectPeriod: 2500
        });

        this.mqttClient.on('connect', () => {
          console.log('[Network] Connected to MQTT Broker');
          this.mqttClient.subscribe(this.lobbyTopic);
          if (this.roomTopic) {
            this.mqttClient.subscribe(this.roomTopic);
          }
          if (this.onStatus) {
            this.onStatus({ type: 'LOBBY_READY' });
          }
        });

        this.mqttClient.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleIncomingMessage(topic, data);
          } catch (e) {
            console.warn('[Network] Parse error:', e);
          }
        });

        this.mqttClient.on('error', (err) => {
          console.warn('[Network] MQTT Error:', err);
        });
      }
    } catch (e) {
      console.error('[Network] MQTT Init error:', e);
    }

    // 로비 방 목록 주기적 만료 청소 (5초 이상 하트비트 없는 방 제거)
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [code, info] of this.roomsMap.entries()) {
        if (now - info.lastSeen > 6000 || info.status === 'CLOSED') {
          this.roomsMap.delete(code);
          changed = true;
        }
      }
      if (changed && this.onRoomsUpdate) {
        this.onRoomsUpdate(this.getRoomsList());
      }
    }, 2000);
  }

  // 수신된 MQTT 메시지 디스패치
  handleIncomingMessage(topic, data) {
    // 1. 로비 방 목록 메시지
    if (topic === this.lobbyTopic) {
      if (data.type === 'ROOM_ANNOUNCE') {
        const info = data.room;
        info.lastSeen = Date.now();
        this.roomsMap.set(info.roomCode, info);
        if (this.onRoomsUpdate) {
          this.onRoomsUpdate(this.getRoomsList());
        }
      } else if (data.type === 'ROOM_CLOSED') {
        this.roomsMap.delete(data.roomCode);
        if (this.onRoomsUpdate) {
          this.onRoomsUpdate(this.getRoomsList());
        }
      }
      return;
    }

    // 2. 인게임 룸 메시지 (내 방 토픽)
    if (topic === this.roomTopic) {
      // 내가 보낸 메시지는 스킵 (타 사용자 메시지만 처리)
      if (data.senderId === this.myId) return;

      if (this.onMessage) {
        this.onMessage(data, data.senderId);
      }
    }
  }

  getRoomsList() {
    return Array.from(this.roomsMap.values()).filter(r => r.status !== 'CLOSED');
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 1. 방 만들기 (호스트)
  createRoom(hostName, customCode = null) {
    return new Promise((resolve) => {
      const code = customCode || this.generateRoomCode();
      this.roomCode = code;
      this.isHost = true;
      this.myNickname = hostName || '탐험대장';
      this.roomTopic = `worldgame/rooms/game_${code}`;

      if (this.mqttClient && this.mqttClient.connected) {
        this.mqttClient.subscribe(this.roomTopic);
      }

      this.currentHostingRoom = {
        roomCode: code,
        hostId: this.myId,
        hostName: this.myNickname,
        title: `${this.myNickname}님의 세계여행`,
        playerCount: 1,
        maxPlayers: 4,
        status: 'WAITING'
      };

      this.startRoomHeartbeat();
      if (this.onStatus) {
        this.onStatus({ type: 'HOST_READY', roomCode: code, peerId: this.myId });
      }
      resolve({ roomCode: code, peerId: this.myId });
    });
  }

  startRoomHeartbeat() {
    this.sendRoomAnnounce();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendRoomAnnounce();
    }, 2000);
  }

  sendRoomAnnounce() {
    if (this.currentHostingRoom && this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(this.lobbyTopic, JSON.stringify({
        type: 'ROOM_ANNOUNCE',
        room: this.currentHostingRoom
      }));
    }
  }

  updateHostingInfo(updatedInfo) {
    if (this.currentHostingRoom) {
      this.currentHostingRoom = { ...this.currentHostingRoom, ...updatedInfo };
      this.sendRoomAnnounce();
    }
  }

  // 2. 방 참여하기 (클라이언트)
  joinRoom(roomCode, nickName = '원정대원') {
    return new Promise((resolve) => {
      const cleanCode = roomCode.trim().toUpperCase().replace(/^WG-/, '');
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myNickname = nickName;
      this.roomTopic = `worldgame/rooms/game_${cleanCode}`;

      if (this.mqttClient && this.mqttClient.connected) {
        this.mqttClient.subscribe(this.roomTopic, () => {
          this.onStatus({ type: 'JOINED_SUCCESS', roomCode: cleanCode });
          resolve({ roomCode: cleanCode });
        });
      } else {
        this.onStatus({ type: 'JOINED_SUCCESS', roomCode: cleanCode });
        resolve({ roomCode: cleanCode });
      }
    });
  }

  // 3. 메시지 전송 (호스트/클라이언트 모두 실시간 전송)
  send(action, payload = {}) {
    if (!this.roomTopic || !this.mqttClient || !this.mqttClient.connected) return;

    const msg = {
      action,
      payload,
      senderId: this.myId,
      senderName: this.myNickname,
      timestamp: Date.now()
    };

    this.mqttClient.publish(this.roomTopic, JSON.stringify(msg));
  }

  // 4. 방 퇴장 및 리셋
  disconnect() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.isHost && this.currentHostingRoom && this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(this.lobbyTopic, JSON.stringify({
        type: 'ROOM_CLOSED',
        roomCode: this.roomCode
      }));
    }

    if (this.roomTopic && this.mqttClient) {
      this.mqttClient.unsubscribe(this.roomTopic);
      this.roomTopic = null;
    }

    this.isHost = false;
    this.roomCode = null;
    this.currentHostingRoom = null;
  }
}
