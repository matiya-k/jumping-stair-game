import { GAME } from '../data/constants.js';
import { authService } from '../lib/authService.js';

/**
 * AuthScene — 로그인 / 회원가입
 * Phaser 캔버스 위에 DOM 오버레이로 HTML 폼을 렌더링.
 */
export class AuthScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AuthScene' });
  }

  create() {
    // 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.add.text(GAME.WIDTH / 2, 80, '🪜 계단 오르기', {
      fontSize: '28px', fill: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this._mode = 'login'; // 'login' | 'signup'
    this._buildForm();

    // 이미 로그인 상태면 바로 타이틀로
    authService.getUser().then(user => {
      if (user) this._goToTitle(user);
    });
  }

  _buildForm() {
    // 기존 DOM 폼 제거
    if (this._formEl) this._formEl.remove();

    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();

    const form = document.createElement('div');
    form.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top + 140}px;
      width: ${rect.width}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      z-index: 100;
      font-family: sans-serif;
    `;

    const inputStyle = `
      width: 260px; padding: 10px 14px;
      border-radius: 8px; border: 1px solid #4a90d9;
      background: #16213e; color: #fff;
      font-size: 15px; outline: none;
    `;
    const btnStyle = (bg) => `
      width: 260px; padding: 11px;
      border-radius: 8px; border: none;
      background: ${bg}; color: #1a1a2e;
      font-size: 15px; font-weight: bold;
      cursor: pointer;
    `;

    const isLogin = this._mode === 'login';

    // 탭
    const tabRow = document.createElement('div');
    tabRow.style.cssText = 'display:flex; gap:8px; margin-bottom:4px;';
    ['로그인', '회원가입'].forEach((label, i) => {
      const tab = document.createElement('button');
      tab.textContent = label;
      const active = (i === 0) === isLogin;
      tab.style.cssText = `
        padding: 7px 24px; border-radius: 20px; border: none; cursor: pointer;
        background: ${active ? '#4a90d9' : '#16213e'};
        color: ${active ? '#fff' : '#888'};
        font-size: 14px;
      `;
      tab.onclick = () => {
        this._mode = i === 0 ? 'login' : 'signup';
        this._buildForm();
      };
      tabRow.appendChild(tab);
    });
    form.appendChild(tabRow);

    // 이메일
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = '이메일';
    emailInput.style.cssText = inputStyle;
    form.appendChild(emailInput);

    // 비밀번호
    const pwInput = document.createElement('input');
    pwInput.type = 'password';
    pwInput.placeholder = '비밀번호 (6자 이상)';
    pwInput.style.cssText = inputStyle;
    form.appendChild(pwInput);

    // 유저네임 (회원가입만)
    let usernameInput = null;
    if (!isLogin) {
      usernameInput = document.createElement('input');
      usernameInput.type = 'text';
      usernameInput.placeholder = '닉네임';
      usernameInput.style.cssText = inputStyle;
      form.appendChild(usernameInput);
    }

    // 에러 메시지
    const errText = document.createElement('div');
    errText.style.cssText = 'color:#ff6b6b; font-size:13px; min-height:18px;';
    form.appendChild(errText);

    // 제출 버튼
    const submitBtn = document.createElement('button');
    submitBtn.textContent = isLogin ? '로그인' : '회원가입';
    submitBtn.style.cssText = btnStyle('#4a90d9');
    submitBtn.onmouseenter = () => submitBtn.style.background = '#5ba3e8';
    submitBtn.onmouseleave = () => submitBtn.style.background = '#4a90d9';

    submitBtn.onclick = async () => {
      errText.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = '처리 중...';

      try {
        const email = emailInput.value.trim();
        const pw = pwInput.value;

        if (isLogin) {
          const user = await authService.signIn(email, pw);
          this._goToTitle(user);
        } else {
          const username = usernameInput?.value.trim();
          if (!username) throw new Error('닉네임을 입력해주세요.');
          const user = await authService.signUp(email, pw, username);
          errText.style.color = '#44ff88';
          errText.textContent = '가입 완료! 이메일을 확인하거나 로그인하세요.';
          this._mode = 'login';
          setTimeout(() => this._buildForm(), 2000);
        }
      } catch (e) {
        errText.style.color = '#ff6b6b';
        errText.textContent = e.message || '오류가 발생했습니다.';
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? '로그인' : '회원가입';
      }
    };
    form.appendChild(submitBtn);

    // 게스트 플레이
    const guestBtn = document.createElement('button');
    guestBtn.textContent = '게스트로 플레이 (점수 저장 안됨)';
    guestBtn.style.cssText = `
      background: none; border: none; color: #888;
      font-size: 13px; cursor: pointer; text-decoration: underline; margin-top: 4px;
    `;
    guestBtn.onclick = () => this._goToTitle(null);
    form.appendChild(guestBtn);

    document.body.appendChild(form);
    this._formEl = form;
  }

  _goToTitle(user) {
    if (this._formEl) {
      this._formEl.remove();
      this._formEl = null;
    }
    this.scene.start('TitleScene', { user });
  }

  shutdown() {
    if (this._formEl) {
      this._formEl.remove();
      this._formEl = null;
    }
  }
}
