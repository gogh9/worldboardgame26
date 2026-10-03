// ========================================================================
// CLASS MODE MANAGER (우리반 함께 게임하기)
// 교사 관리 대시보드 + 학생 대기실 + 모둠 자동/수동 편성 + 실시간 모둠 대전
// ========================================================================

export class ClassModeManager {
  constructor(gameApp) {
    this.app = gameApp;
    this.mqttClient = null;

    // State
    this.role = null; // 'TEACHER' | 'STUDENT' | null
    this.classCode = null;
    this.className = '우리반 탐험대';
    this.teacherName = '선생님';
    this.studentId = null;
    this.studentName = null;

    this.students = []; // [{ id, name, teamId, lastSeen }]
    this.teams = []; // [{ id, name, maxPlayers, players: [{ id, name, charId }] }]
    this.teamResults = {}; // { [teamId]: { winner, scores, finished: true } }
    this.isGameRunning = false;

    this.heartbeatTimer = null;
    this.classTopic = null;

    this.initDOM();
    this.bindEvents();
  }

  setMqttClient(client) {
    this.mqttClient = client;
  }

  initDOM() {
    this.screenTeacher = document.getElementById('screen-class-teacher');
    this.screenStudent = document.getElementById('screen-class-student');
    this.btnOpenClassMode = document.getElementById('btn-open-class-mode');
  }

  bindEvents() {
    // 1. 로비에서 '우리반 함께 게임하기' 클릭
    if (this.btnOpenClassMode) {
      this.btnOpenClassMode.addEventListener('click', () => {
        this.openTeacherSetup();
      });
    }

    // 2. 교사: 대기실 생성 폼 제출
    const formTeacherSetup = document.getElementById('form-teacher-setup');
    if (formTeacherSetup) {
      formTeacherSetup.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputClassName = document.getElementById('input-class-name');
        const inputTeacherName = document.getElementById('input-teacher-name');
        const className = inputClassName ? inputClassName.value.trim() : '우리반 탐험대';
        const teacherName = inputTeacherName ? inputTeacherName.value.trim() : '선생님';
        this.createClassRoom(className, teacherName);
      });
    }

    // 3. 교사: 뒤로가기 (로비 복귀)
    const btnTeacherBack = document.getElementById('btn-class-teacher-back');
    if (btnTeacherBack) {
      btnTeacherBack.addEventListener('click', () => {
        if (confirm('학급 대기실을 종료하고 메인 로비로 돌아가시겠습니까?')) {
          this.leaveClassMode();
          this.app.switchScreen('lobby');
          this.app.setupLobbyView(false);
        }
      });
    }

    // 4. 학생: 대기실 입장 폼 제출
    const formStudentJoin = document.getElementById('form-student-join');
    if (formStudentJoin) {
      formStudentJoin.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputStudentName = document.getElementById('input-student-name');
        const name = inputStudentName ? inputStudentName.value.trim() : '';
        if (!name) {
          this.app.showToast('⚠️ 이름을 입력해주세요!');
          return;
        }
        this.joinAsStudent(name);
      });
    }

    // 5. 학생: 나가기
    const btnStudentLeave = document.getElementById('btn-class-student-leave');
    if (btnStudentLeave) {
      btnStudentLeave.addEventListener('click', () => {
        if (confirm('학급 대기실에서 나가시겠습니까?')) {
          this.leaveClassMode();
          this.app.switchScreen('lobby');
          this.app.setupLobbyView(false);
        }
      });
    }

    // 5-1. 학생: 이름 변경
    const btnStudentRename = document.getElementById('btn-class-student-rename');
    if (btnStudentRename) {
      btnStudentRename.addEventListener('click', () => {
        const newName = prompt('변경할 이름(또는 번호+이름)을 입력하세요:', this.studentName || '');
        if (newName && newName.trim()) {
          this.studentName = newName.trim();
          localStorage.setItem('worldgame_nickname', this.studentName);
          const dispMyName = document.getElementById('student-disp-my-name');
          if (dispMyName) dispMyName.textContent = this.studentName;
          this.sendStudentPing();
          this.app.showToast(`✏️ 이름이 [${this.studentName}]으로 변경되었습니다.`);
        }
      });
    }

    // 6. 교사: 학생 접속 링크 복사
    const btnCopyClassLink = document.getElementById('btn-copy-class-link');
    if (btnCopyClassLink) {
      btnCopyClassLink.addEventListener('click', () => {
        const link = this.getClassJoinUrl();
        navigator.clipboard.writeText(link).then(() => {
          this.app.showToast('📋 학생 접속 링크가 복사되었습니다!');
        });
      });
    }

    // 7. 교사: 랜덤 모둠 배정 버튼들
    const btnRandomTeams3 = document.getElementById('btn-random-teams-3');
    if (btnRandomTeams3) {
      btnRandomTeams3.addEventListener('click', () => this.autoAssignTeams(3));
    }
    const btnRandomTeams4 = document.getElementById('btn-random-teams-4');
    if (btnRandomTeams4) {
      btnRandomTeams4.addEventListener('click', () => this.autoAssignTeams(4));
    }

    // 8. 교사: 모둠 추가 & 초기화
    const btnAddTeam = document.getElementById('btn-add-team');
    if (btnAddTeam) {
      btnAddTeam.addEventListener('click', () => this.addNewTeam());
    }
    const btnResetTeams = document.getElementById('btn-reset-teams');
    if (btnResetTeams) {
      btnResetTeams.addEventListener('click', () => this.resetTeams());
    }

    // 9. 교사: 전체 게임 시작!
    const btnStartAllGames = document.getElementById('btn-start-all-games');
    if (btnStartAllGames) {
      btnStartAllGames.addEventListener('click', () => this.startAllTeamGames());
    }

    // 10. 교사: 전체 학생 대기실로 소환/복귀
    const btnRecallStudents = document.getElementById('btn-recall-students');
    if (btnRecallStudents) {
      btnRecallStudents.addEventListener('click', () => {
        if (confirm('모든 학생을 학급 대기실로 복귀시키겠습니까? 진행 중인 게임은 종료됩니다.')) {
          this.recallAllStudents();
        }
      });
    }
  }

  getClassJoinUrl() {
    return `${window.location.origin}${window.location.pathname}?class=${this.classCode}`;
  }

  // ========================================================================
  // TEACHER FLOW (교사 화면 및 상태 관리)
  // ========================================================================
  openTeacherSetup() {
    this.role = 'TEACHER';
    this.app.switchScreen('classTeacher');
    const setupView = document.getElementById('class-teacher-setup-view');
    const dashView = document.getElementById('class-teacher-dashboard-view');
    if (setupView) setupView.classList.remove('hidden');
    if (dashView) dashView.classList.add('hidden');
  }

  createClassRoom(className, teacherName) {
    this.className = className || '우리반 탐험대';
    this.teacherName = teacherName || '선생님';
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'C-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.classCode = code;
    this.students = [];
    this.teams = [
      { id: 1, name: '1모둠', maxPlayers: 4, players: [] },
      { id: 2, name: '2모둠', maxPlayers: 4, players: [] }
    ];
    this.teamResults = {};
    this.isGameRunning = false;

    this.connectClassMQTT();

    const setupView = document.getElementById('class-teacher-setup-view');
    const dashView = document.getElementById('class-teacher-dashboard-view');
    if (setupView) setupView.classList.add('hidden');
    if (dashView) dashView.classList.remove('hidden');

    this.renderTeacherDashboard();
    this.startTeacherHeartbeat();
    this.app.showToast(`🎉 [${this.className}] 대기실이 생성되었습니다!`);
  }

  startTeacherHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.broadcastState();
    this.heartbeatTimer = setInterval(() => {
      // 10초 이상 응답 없는 학생 오프라인 처리
      const now = Date.now();
      let changed = false;
      this.students = this.students.filter(s => {
        if (now - s.lastSeen > 12000) {
          this.removeStudentFromAllTeams(s.id);
          changed = true;
          return false;
        }
        return true;
      });
      if (changed) {
        this.renderTeacherDashboard();
      }
      this.broadcastState();
    }, 2500);
  }

  broadcastState() {
    this.sendClassMsg('CLASS_STATE_UPDATE', {
      className: this.className,
      teacherName: this.teacherName,
      classCode: this.classCode,
      students: this.students.map(s => ({ id: s.id, name: s.name, teamId: s.teamId })),
      teams: this.teams,
      isGameRunning: this.isGameRunning,
      teamResults: this.teamResults
    });
  }

  renderTeacherDashboard() {
    // 1. 헤더 정보
    const dispClassName = document.getElementById('teacher-disp-class-name');
    if (dispClassName) dispClassName.textContent = this.className;
    const dispClassLink = document.getElementById('teacher-disp-class-link');
    if (dispClassLink) dispClassLink.textContent = this.getClassJoinUrl();

    // 2. 접속 학생 현황
    const countElem = document.getElementById('teacher-student-count');
    if (countElem) countElem.textContent = `${this.students.length}명`;

    const unassignedContainer = document.getElementById('teacher-unassigned-students');
    if (unassignedContainer) {
      unassignedContainer.innerHTML = '';
      const unassignedList = this.students.filter(s => !s.teamId);
      if (unassignedList.length === 0) {
        unassignedContainer.innerHTML = `<span class="empty-hint">모든 학생이 모둠에 배정되었습니다. 👍</span>`;
      } else {
        unassignedList.forEach(s => {
          const chip = document.createElement('div');
          chip.className = 'student-chip unassigned';
          chip.innerHTML = `
            <span class="chip-avatar">🎒</span>
            <span class="chip-name">${s.name}</span>
            <button class="chip-assign-btn" title="모둠 배정">배정 ▾</button>
          `;
          const btnAssign = chip.querySelector('.chip-assign-btn');
          if (btnAssign) {
            btnAssign.onclick = (e) => {
              e.stopPropagation();
              this.showAssignMenu(s, btnAssign);
            };
          }
          unassignedContainer.appendChild(chip);
        });
      }
    }

    // 3. 모둠별 카드 렌더링
    const teamsGrid = document.getElementById('teacher-teams-grid');
    if (teamsGrid) {
      teamsGrid.innerHTML = '';
      this.teams.forEach(t => {
        const card = document.createElement('div');
        card.className = 'team-manage-card';
        const isFull = t.players.length >= t.maxPlayers;

        let playersHtml = '';
        for (let i = 0; i < t.maxPlayers; i++) {
          const p = t.players[i];
          if (p) {
            playersHtml += `
              <div class="team-slot occupied">
                <span class="slot-num">${i + 1}</span>
                <span class="slot-name">${p.name}</span>
                <button class="slot-remove-btn" title="모둠에서 제외" data-team="${t.id}" data-student="${p.id}">✕</button>
              </div>
            `;
          } else {
            playersHtml += `
              <div class="team-slot empty" data-team="${t.id}">
                <span class="slot-num">${i + 1}</span>
                <span class="slot-placeholder">빈 자리</span>
              </div>
            `;
          }
        }

        const resultInfo = this.teamResults[t.id];
        let statusBadge = `<span class="team-status-tag waiting">${t.players.length}명 / ${t.maxPlayers}명</span>`;
        if (this.isGameRunning) {
          if (resultInfo && resultInfo.finished) {
            statusBadge = `<span class="team-status-tag finished">🏁 완료 (1위: ${resultInfo.winner || '우승자'})</span>`;
          } else {
            statusBadge = `<span class="team-status-tag playing">🎮 탐험 진행 중...</span>`;
          }
        }

        card.innerHTML = `
          <div class="team-card-header">
            <div class="team-title-wrap">
              <h4>${t.name}</h4>
              ${statusBadge}
            </div>
            ${this.teams.length > 1 && !this.isGameRunning ? `<button class="btn-del-team" data-team="${t.id}" title="모둠 삭제">🗑️</button>` : ''}
          </div>
          <div class="team-slots-list">
            ${playersHtml}
          </div>
        `;

        // 모둠 제외 버튼 이벤트
        card.querySelectorAll('.slot-remove-btn').forEach(b => {
          b.onclick = () => {
            const sId = b.getAttribute('data-student');
            const teamId = parseInt(b.getAttribute('data-team'), 10);
            this.removeStudentFromTeam(sId, teamId);
          };
        });

        // 모둠 삭제 이벤트
        const delBtn = card.querySelector('.btn-del-team');
        if (delBtn) {
          delBtn.onclick = () => {
            const teamId = parseInt(delBtn.getAttribute('data-team'), 10);
            this.removeTeam(teamId);
          };
        }

        teamsGrid.appendChild(card);
      });
    }

    // 4. 게임 시작 버튼 활성화 여부
    const btnStartAll = document.getElementById('btn-start-all-games');
    const btnRecall = document.getElementById('btn-recall-students');
    const teacherControlStatus = document.getElementById('teacher-control-status');

    const validTeams = this.teams.filter(t => t.players.length >= 2);
    const totalAssigned = this.teams.reduce((acc, t) => acc + t.players.length, 0);

    if (btnStartAll) {
      if (this.isGameRunning) {
        btnStartAll.disabled = true;
        btnStartAll.textContent = '🎮 전체 모둠 탐험 진행 중...';
        if (btnRecall) btnRecall.classList.remove('hidden');
      } else {
        btnStartAll.disabled = validTeams.length === 0;
        btnStartAll.textContent = `🚀 전체 모둠 게임 동시 시작 (${validTeams.length}개 모둠 / ${totalAssigned}명)`;
        if (btnRecall) btnRecall.classList.add('hidden');
      }
    }

    if (teacherControlStatus) {
      if (this.isGameRunning) {
        teacherControlStatus.textContent = '학생들이 각 모둠별로 실시간 게임을 플레이하고 있습니다.';
      } else if (validTeams.length === 0) {
        teacherControlStatus.textContent = '⚠️ 게임을 시작하려면 최소 1개 모둠에 2명 이상의 학생을 배정해주세요.';
      } else {
        teacherControlStatus.textContent = `준비 완료! ${validTeams.length}개 모둠에서 동시에 게임을 시작할 수 있습니다.`;
      }
    }
  }

  showAssignMenu(student, anchorBtn) {
    const existingMenu = document.getElementById('student-assign-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'student-assign-menu';
    menu.className = 'student-assign-popup glass-card';

    let html = `<div class="assign-menu-title">${student.name} 모둠 선택</div>`;
    this.teams.forEach(t => {
      const isFull = t.players.length >= t.maxPlayers;
      html += `
        <button class="assign-menu-item ${isFull ? 'disabled' : ''}" data-team="${t.id}" ${isFull ? 'disabled' : ''}>
          ${t.name} (${t.players.length}/${t.maxPlayers})
        </button>
      `;
    });
    html += `<button class="assign-menu-cancel">취소</button>`;
    menu.innerHTML = html;

    menu.querySelectorAll('.assign-menu-item:not(.disabled)').forEach(b => {
      b.onclick = () => {
        const teamId = parseInt(b.getAttribute('data-team'), 10);
        this.assignStudentToTeam(student.id, teamId);
        menu.remove();
      };
    });

    const cancelBtn = menu.querySelector('.assign-menu-cancel');
    if (cancelBtn) cancelBtn.onclick = () => menu.remove();

    document.body.appendChild(menu);
    const rect = anchorBtn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.max(10, rect.left - 50)}px`;
    menu.style.zIndex = '9999';

    const closeHandler = (e) => {
      if (!menu.contains(e.target) && e.target !== anchorBtn) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  assignStudentToTeam(studentId, teamId) {
    const student = this.students.find(s => s.id === studentId);
    const team = this.teams.find(t => t.id === teamId);
    if (!student || !team) return;

    if (team.players.length >= team.maxPlayers) {
      this.app.showToast('⚠️ 해당 모둠이 꽉 찼습니다!');
      return;
    }

    this.removeStudentFromAllTeams(studentId);

    // 색상 프로필 자동 분배 (0, 1, 2, 3)
    const usedCharIds = team.players.map(p => p.charId);
    let charId = 0;
    for (let c = 0; c < 4; c++) {
      if (!usedCharIds.includes(c)) {
        charId = c;
        break;
      }
    }

    team.players.push({
      id: student.id,
      name: student.name,
      charId
    });
    student.teamId = teamId;

    this.renderTeacherDashboard();
    this.broadcastState();
  }

  removeStudentFromTeam(studentId, teamId) {
    const team = this.teams.find(t => t.id === teamId);
    if (team) {
      team.players = team.players.filter(p => p.id !== studentId);
    }
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      student.teamId = null;
    }
    this.renderTeacherDashboard();
    this.broadcastState();
  }

  removeStudentFromAllTeams(studentId) {
    this.teams.forEach(t => {
      t.players = t.players.filter(p => p.id !== studentId);
    });
    const s = this.students.find(st => st.id === studentId);
    if (s) s.teamId = null;
  }

  addNewTeam() {
    const nextId = this.teams.length > 0 ? Math.max(...this.teams.map(t => t.id)) + 1 : 1;
    this.teams.push({
      id: nextId,
      name: `${nextId}모둠`,
      maxPlayers: 4,
      players: []
    });
    this.renderTeacherDashboard();
    this.broadcastState();
  }

  removeTeam(teamId) {
    const team = this.teams.find(t => t.id === teamId);
    if (team) {
      team.players.forEach(p => {
        const s = this.students.find(st => st.id === p.id);
        if (s) s.teamId = null;
      });
    }
    this.teams = this.teams.filter(t => t.id !== teamId);
    this.renderTeacherDashboard();
    this.broadcastState();
  }

  resetTeams() {
    this.teams.forEach(t => {
      t.players = [];
    });
    this.students.forEach(s => {
      s.teamId = null;
    });
    this.teamResults = {};
    this.renderTeacherDashboard();
    this.broadcastState();
    this.app.showToast('모둠 배정이 초기화되었습니다.');
  }

  // 🎲 자동 랜덤 모둠 배정 (모둠당 targetPerTeam명 균등 분배)
  autoAssignTeams(targetPerTeam = 4) {
    if (this.students.length < 2) {
      this.app.showToast('⚠️ 접속한 학생이 2명 이상이어야 모둠을 나눌 수 있습니다!');
      return;
    }

    // 학생 목록 무작위 셔플
    const shuffled = [...this.students].sort(() => Math.random() - 0.5);
    const numTeams = Math.max(1, Math.ceil(shuffled.length / targetPerTeam));

    this.teams = [];
    for (let i = 1; i <= numTeams; i++) {
      this.teams.push({
        id: i,
        name: `${i}모둠`,
        maxPlayers: 4,
        players: []
      });
    }

    // 균등 분배
    shuffled.forEach((student, idx) => {
      const teamIdx = idx % numTeams;
      const team = this.teams[teamIdx];
      const charId = team.players.length % 4;
      team.players.push({
        id: student.id,
        name: student.name,
        charId
      });
      student.teamId = team.id;
    });

    this.renderTeacherDashboard();
    this.broadcastState();
    this.app.showToast(`🎲 ${this.students.length}명의 학생이 ${numTeams}개 모둠으로 랜덤 배정되었습니다!`);
  }

  startAllTeamGames() {
    const validTeams = this.teams.filter(t => t.players.length >= 2);
    if (validTeams.length === 0) {
      this.app.showToast('⚠️ 최소 1개 모둠에 2명 이상의 학생이 있어야 합니다!');
      return;
    }

    this.isGameRunning = true;
    this.teamResults = {};

    this.sendClassMsg('CLASS_GAMES_START', {
      classCode: this.classCode,
      className: this.className,
      teams: this.teams
    });

    this.renderTeacherDashboard();
    this.broadcastState();
    this.app.showToast('🚀 모든 모둠의 탐험 게임이 일괄 시작되었습니다!');
  }

  recallAllStudents() {
    this.isGameRunning = false;
    this.sendClassMsg('CLASS_GAMES_RECALL', {
      classCode: this.classCode
    });
    this.renderTeacherDashboard();
    this.broadcastState();
    this.app.showToast('📢 모든 학생을 학급 대기실로 복귀시켰습니다.');
  }

  // ========================================================================
  // STUDENT FLOW (학생 대기실 및 게임 참가)
  // ========================================================================
  openStudentEntry(classCode) {
    this.role = 'STUDENT';
    this.classCode = classCode ? classCode.trim().toUpperCase() : null;
    this.studentId = 'stu_' + Math.random().toString(36).substring(2, 9);

    this.app.switchScreen('classStudent');

    // 기기 로컬에 저장된 이름이 있는 경우 즉시 학급 대기실로 다이렉트 입장
    const savedNick = localStorage.getItem('worldgame_nickname');
    if (savedNick && savedNick.trim()) {
      this.joinAsStudent(savedNick.trim());
    } else {
      // 이름이 없는 경우 이름 입력 폼 노출
      const joinView = document.getElementById('class-student-join-view');
      const waitView = document.getElementById('class-student-waiting-view');
      if (joinView) joinView.classList.remove('hidden');
      if (waitView) waitView.classList.add('hidden');

      const inputName = document.getElementById('input-student-name');
      if (inputName) {
        inputName.focus();
      }
    }
  }

  joinAsStudent(studentName) {
    this.studentName = (studentName || '').trim();
    if (!this.studentName) {
      this.studentName = '탐험가' + Math.floor(Math.random() * 89 + 10);
    }
    localStorage.setItem('worldgame_nickname', this.studentName);

    if (!this.classCode) {
      const params = new URLSearchParams(window.location.search);
      const qCode = params.get('class');
      if (qCode) this.classCode = qCode.trim().toUpperCase();
    }

    if (!this.classCode) {
      this.app.showToast('⚠️ 초대 링크를 통해 접속해주세요!');
      return;
    }

    this.connectClassMQTT();

    const joinView = document.getElementById('class-student-join-view');
    const waitView = document.getElementById('class-student-waiting-view');
    if (joinView) joinView.classList.add('hidden');
    if (waitView) waitView.classList.remove('hidden');

    const dispMyName = document.getElementById('student-disp-my-name');
    if (dispMyName) dispMyName.textContent = this.studentName;

    // 참가 알림 및 지속적 핑 전송
    this.sendStudentPing();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendStudentPing();
    }, 3000);

    this.app.showToast(`🎒 [${this.studentName}]님, 학급 대기실에 입장했습니다!`);
  }

  sendStudentPing() {
    this.sendClassMsg('STUDENT_PING', {
      studentId: this.studentId,
      studentName: this.studentName,
      classCode: this.classCode
    });
  }

  renderStudentWaiting(state) {
    const dispClassTitle = document.getElementById('student-disp-class-title');
    if (dispClassTitle) dispClassTitle.textContent = state.className || '우리반 탐험대';

    const dispTeacherName = document.getElementById('student-disp-teacher-name');
    if (dispTeacherName) dispTeacherName.textContent = `${state.teacherName || '선생님'}의 학급 대기실`;

    // 내 모둠 배정 상태 확인
    const myStudent = (state.students || []).find(s => s.id === this.studentId);
    const myTeam = (state.teams || []).find(t => t.players.some(p => p.id === this.studentId));

    const statusBadge = document.getElementById('student-my-team-status');
    if (statusBadge) {
      if (myTeam) {
        const teamMates = myTeam.players.map(p => p.name).join(', ');
        statusBadge.innerHTML = `
          <div class="team-assigned-box">
            <span class="badge-icon">🚩</span>
            <div class="badge-text">
              <strong>${myTeam.name}</strong>에 배정되었습니다!
              <div class="team-mates-preview">팀원: ${teamMates}</div>
            </div>
          </div>
        `;
      } else {
        statusBadge.innerHTML = `
          <div class="team-unassigned-box">
            <span class="pulse-dot"></span> 선생님이 모둠을 편성하는 중입니다...
          </div>
        `;
      }
    }

    // 접속한 친구들 목록
    const friendsCount = document.getElementById('student-friends-count');
    if (friendsCount) friendsCount.textContent = `${(state.students || []).length}명`;

    const friendsGrid = document.getElementById('student-friends-grid');
    if (friendsGrid) {
      friendsGrid.innerHTML = '';
      (state.students || []).forEach(s => {
        const chip = document.createElement('div');
        const isMe = s.id === this.studentId;
        const studentTeam = (state.teams || []).find(t => t.players.some(p => p.id === s.id));
        chip.className = `student-friend-chip ${isMe ? 'is-me' : ''}`;
        chip.innerHTML = `
          <span class="friend-avatar">${isMe ? '⭐' : '🎒'}</span>
          <span class="friend-name">${s.name} ${isMe ? '(나)' : ''}</span>
          ${studentTeam ? `<span class="friend-team-tag">${studentTeam.name}</span>` : ''}
        `;
        friendsGrid.appendChild(chip);
      });
    }
  }

  // 모둠 경기 시작 신호 수신 시 해당 모둠 방으로 진입!
  handleGameStartSignal(payload) {
    const teams = payload.teams || [];
    const myTeam = teams.find(t => t.players.some(p => p.id === this.studentId));
    if (!myTeam) {
      this.app.showToast('⚠️ 아직 모둠에 배정되지 않았습니다. 잠시만 대기해주세요.');
      return;
    }

    this.app.showToast(`🎮 ${myTeam.name} 탐험 게임을 시작합니다!`);

    // 팀 전용 방 코드: CLASS_{classCode}_T{teamId}
    const teamRoomCode = `CLS_${this.classCode}_T${myTeam.id}`;
    const myPlayerIndex = myTeam.players.findIndex(p => p.id === this.studentId);
    const isFirstPlayer = myPlayerIndex === 0;

    // 게임 시작 시 해당 방으로 온라인 접속
    this.launchTeamGame(teamRoomCode, myTeam, isFirstPlayer);
  }

  launchTeamGame(teamRoomCode, teamInfo, isHost) {
    // 플레이어 목록 구성 (0, 1, 2, 3 인덱스 기반 ID & 학생 고유 peerId)
    const myPlayerIndex = teamInfo.players.findIndex(p => p.id === this.studentId);
    const players = teamInfo.players.map((p, idx) => ({
      id: idx,
      peerId: p.id,
      name: p.name,
      charId: p.charId !== undefined ? p.charId : idx % 4,
      isHost: idx === 0,
      position: 0,
      conqueredCount: 0,
      isIslandSkip: false,
      isOnline: true
    }));

    // 학생의 네트워크를 팀 토픽으로 전환
    if (this.app.network) {
      this.app.network.disconnect();
    }

    this.app.myPlayerId = myPlayerIndex >= 0 ? myPlayerIndex : 0;
    this.app.selectedCharId = players[this.app.myPlayerId] ? players[this.app.myPlayerId].charId : 0;
    this.app.mode = 'ONLINE';
    this.app.state.players = players;
    this.app.state.round = 1;
    this.app.state.turnIndex = 0;
    this.app.state.status = 'PLAYING';
    this.app.state.cells.forEach(c => c.ownerId = null);

    // 팀 방 접속
    const netManager = this.app.network;
    if (netManager) {
      netManager.roomCode = teamRoomCode;
      netManager.isHost = isHost;
      netManager.myId = this.studentId;
      netManager.myNickname = this.studentName;
      netManager.roomTopic = `worldgame/rooms/game_${teamRoomCode}`;

      if (netManager.mqttClient && netManager.mqttClient.connected) {
        netManager.mqttClient.subscribe(netManager.roomTopic);
      }
    }

    // 게임 화면으로 전환 및 UI 렌더링
    this.app.switchScreen('game');
    this.app.renderBoard();
    this.app.updateGameUI();
    this.app.showToast(`🗺️ ${teamInfo.name} 게임이 시작되었습니다!`);
  }

  // 게임 종료 후 대기실 복귀
  returnToWaitingRoom() {
    this.app.switchScreen('classStudent');
    const joinView = document.getElementById('class-student-join-view');
    const waitView = document.getElementById('class-student-waiting-view');
    if (joinView) joinView.classList.add('hidden');
    if (waitView) waitView.classList.remove('hidden');

    this.connectClassMQTT();
    this.sendStudentPing();
    this.app.showToast('🏫 학급 대기실로 돌아왔습니다. 다음 게임을 기다려주세요!');
  }

  // ========================================================================
  // MQTT 실시간 학급 메시징 통신
  // ========================================================================
  connectClassMQTT() {
    if (!this.classCode) return;
    this.classTopic = `worldgame/class/v1/${this.classCode}`;

    if (!this.mqttClient && this.app && this.app.network && this.app.network.mqttClient) {
      this.mqttClient = this.app.network.mqttClient;
    }

    if (this.mqttClient) {
      if (this.mqttClient.connected) {
        this.mqttClient.subscribe(this.classTopic);
      } else {
        this.mqttClient.once('connect', () => {
          if (this.classTopic) {
            this.mqttClient.subscribe(this.classTopic);
          }
        });
      }
    }
  }

  sendClassMsg(action, payload) {
    if (!this.mqttClient && this.app && this.app.network && this.app.network.mqttClient) {
      this.mqttClient = this.app.network.mqttClient;
    }
    if (!this.classTopic || !this.mqttClient || !this.mqttClient.connected) return;
    const msg = {
      action,
      payload,
      senderId: this.role === 'TEACHER' ? 'TEACHER' : this.studentId,
      timestamp: Date.now()
    };
    this.mqttClient.publish(this.classTopic, JSON.stringify(msg));
  }

  handleClassMessage(action, payload, senderId) {
    // 1. 교사 수신 메시지
    if (this.role === 'TEACHER') {
      if (action === 'STUDENT_PING') {
        const { studentId, studentName } = payload;
        let existing = this.students.find(s => s.id === studentId);
        if (!existing) {
          existing = { id: studentId, name: studentName, teamId: null, lastSeen: Date.now() };
          this.students.push(existing);
          this.app.showToast(`🎒 [${studentName}] 학생이 대기실에 입장했습니다!`);
        } else {
          existing.name = studentName;
          existing.lastSeen = Date.now();
        }
        this.renderTeacherDashboard();
      } else if (action === 'TEAM_GAME_RESULT') {
        const { teamId, winner, scores } = payload;
        this.teamResults[teamId] = { winner, scores, finished: true };
        this.renderTeacherDashboard();
        this.broadcastState();
      }
      return;
    }

    // 2. 학생 수신 메시지
    if (this.role === 'STUDENT') {
      if (action === 'CLASS_STATE_UPDATE') {
        this.renderStudentWaiting(payload);
      } else if (action === 'CLASS_GAMES_START') {
        this.handleGameStartSignal(payload);
      } else if (action === 'CLASS_GAMES_RECALL') {
        this.returnToWaitingRoom();
      }
    }
  }

  leaveClassMode() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.classTopic && this.mqttClient) {
      this.mqttClient.unsubscribe(this.classTopic);
      this.classTopic = null;
    }
    this.role = null;
    this.classCode = null;
    this.students = [];
    this.teams = [];
  }
}
