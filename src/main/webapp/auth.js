'use strict';
/* auth.js — Đăng ký / đăng nhập / quên mật khẩu */

const AUTHQ = { next: null, code: null, email: null };
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e), phoneOk = p => /^0\d{9}$/.test(p);
const safeTierOf = id => (typeof tierOf === 'function' ? tierOf(id) : (window.tierOf ? window.tierOf(id) : { n: 'Thường', pct: 0 }));
const tierName = id => safeTierOf(id).n;

function cxOpen(html, wide) {
  const m = document.querySelector('#cx-modal');
  if (!m) return;
  m.innerHTML = `<div class="cx-box${wide ? ' wide' : ''}" role="dialog" aria-modal="true"><button class="cx-x" data-cx-close aria-label="Đóng">✕</button>${html}</div>`;
  m.hidden = false; document.body.classList.add('modal-open'); m.querySelector('input,select')?.focus();
}

function cxClose() {
  const m = document.querySelector('#cx-modal');
  if (m) m.hidden = true;
  const bookingModal = document.querySelector('#booking-modal');
  const detailModal = document.querySelector('#detail');
  if ((!bookingModal || !bookingModal.classList.contains('active')) && (!detailModal || detailModal.hidden)) {
    document.body.classList.remove('modal-open');
  }
}

const fld = (n, l, type = 'text', x = '') => `<label class="cx-f">${l}<input name="${n}" type="${type}" ${x}></label>`;
const val = (f, n) => f.elements[n]?.value.trim() || '';

function renderAuth(mode = 'login') {
  const studentPct = safeTierOf('student').pct;
  const T = {
    login: `<h2>Đăng nhập</h2><p class="cx-sub">Đăng nhập để đặt vé, xem vé đã mua và lịch sử đặt vé.</p>
      <form data-form="login" novalidate>${fld('ident', 'Email', 'text', 'autocomplete="username"')}${fld('pw', 'Mật khẩu', 'password', 'autocomplete="current-password"')}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đăng nhập</button></form>
      <div class="cx-links"><button data-auth="forgot">Quên mật khẩu?</button><button data-auth="register">Tạo tài khoản mới</button></div><small class="cx-hint">Sử dụng tài khoản đã đăng ký trong hệ thống.</small>`,
    register: `<h2>Tạo tài khoản</h2><p class="cx-sub">Miễn phí, đặt vé chỉ mất vài giây.</p>
      <form data-form="register" novalidate>${fld('n', 'Họ và tên')}${fld('email', 'Email', 'email', 'autocomplete="email"')}${fld('phone', 'Số điện thoại', 'tel', 'inputmode="numeric" maxlength="10"')}${fld('dob', 'Ngày sinh', 'date')}${fld('pw', 'Mật khẩu (tối thiểu 6 ký tự)', 'password', 'autocomplete="new-password"')}${fld('pw2', 'Nhập lại mật khẩu', 'password', 'autocomplete="new-password"')}
      <label class="cx-check"><input type="checkbox" name="student"> Tôi là học sinh, sinh viên (nhận ưu đãi ${studentPct}%)</label><p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đăng ký</button></form>
      <div class="cx-links"><button data-auth="login">Đã có tài khoản? Đăng nhập</button></div>`,
    forgot: `<h2>Quên mật khẩu</h2><p class="cx-sub">Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận.</p>
      <form data-form="forgot" novalidate>${fld('email', 'Email', 'email')}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Gửi mã xác nhận</button></form><div class="cx-links"><button data-auth="login">Quay lại đăng nhập</button></div>`,
    reset: `<h2>Đặt lại mật khẩu</h2><p class="cx-sub">Mã xác nhận đã gửi tới ${typeof esc === 'function' ? esc(AUTHQ.email || '') : (AUTHQ.email || '')}. <em>Mã OTP có hiệu lực trong 5 phút.</em></p>
      <form data-form="reset" novalidate>${fld('code', 'Mã xác nhận', 'text', 'inputmode="numeric" maxlength="6"')}${fld('pw', 'Mật khẩu mới', 'password', 'autocomplete="new-password"')}${fld('pw2', 'Nhập lại mật khẩu mới', 'password', 'autocomplete="new-password"')}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đổi mật khẩu</button></form>`
  };
  cxOpen(T[mode]);
}

function loginAs(c) {
  if (!window.CTX) window.CTX = {};
  window.CTX.user = c;
  renderAcct();
  cxClose();
  if (typeof toast === 'function') toast(`Xin chào ${c.n}`);
  const n = AUTHQ.next; AUTHQ.next = null; n && n();
}

function customerForUi(user) {
  if (!user) return null;
  const rawTier = String(user.tier || user.maLoai || 'regular').toLowerCase();
  const tier = rawTier.includes('sv') || rawTier.includes('student') || rawTier.includes('sinhvien') || rawTier.includes('lkh02') ? 'student' : rawTier.includes('gold') || rawTier.includes('vang') ? 'gold' : rawTier.includes('silver') || rawTier.includes('bac') ? 'silver' : 'regular';
  return { id: user.id || user.maKH, n: user.n || user.hoTen, email: user.email, phone: user.phone || user.soDienThoai || '', dob: user.dob || user.ngaySinh || '', tier, st: 'on' };
}

async function submitAuthToBackend(f) {
  const mode = f.dataset.form;
  if (typeof API === 'undefined') throw new Error('Chưa kết nối API client.');

  if (mode === 'login') {
    const ident = val(f, 'ident').toLowerCase(), password = f.elements.pw?.value || '';
    if (!ident || !password) throw new Error('Vui lòng nhập đầy đủ thông tin.');
    const data = await API.dangNhapKhachHang(ident, password);
    if (!data) throw new Error('Email/số điện thoại hoặc mật khẩu không đúng.');
    const user = data.user || data;
    loginAs(customerForUi(user));
    return;
  }

  if (mode === 'register') {
    const n = val(f, 'n'), email = val(f, 'email').toLowerCase(), phone = val(f, 'phone'), dob = val(f, 'dob'), pw = f.elements.pw?.value || '';
    if (n.length < 2) throw new Error('Vui lòng nhập họ tên.');
    if (!emailOk(email)) throw new Error('Email không hợp lệ.');
    if (!phoneOk(phone)) throw new Error('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.');
    if (pw.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự.');
    if (pw !== f.elements.pw2?.value) throw new Error('Mật khẩu nhập lại không khớp.');

    let maLoai = f.elements.student?.checked ? 'LKH02' : 'LKH01';
    await API.dangKyKhachHang({ hoTen: n, email, soDienThoai: phone, ngaySinh: dob || null, matKhau: pw, maLoai });
    const loginRes = await API.dangNhapKhachHang(email, pw);
    const user = loginRes?.user || loginRes;
    if (user) loginAs(customerForUi(user));
    if (typeof toast === 'function') toast('Đăng ký thành công');
    return;
  }
}

function renderAcct() {
  const el = document.querySelector('#acct'), u = window.CTX?.user;
  if (!el) return;
  const tObj = safeTierOf(u?.tier);
  const escFn = typeof esc === 'function' ? esc : (s => s || '');
  el.innerHTML = u ? `<button class="acct-btn" data-acct="toggle" aria-haspopup="true" aria-expanded="false" aria-label="Tài khoản"><span class="acct-av">${escFn(u.n.trim().split(/\s+/).pop()[0] || '?').toUpperCase()}</span></button>
    <div class="acct-menu" hidden><div class="acct-head"><strong>${escFn(u.n)}</strong><span>${escFn(tObj.n)}${tObj.pct ? ` · ưu đãi ${tObj.pct}%` : ''}</span></div>
      <button data-acct="tickets">Vé của tôi</button><button data-acct="history">Lịch sử đặt vé</button><button data-acct="profile">Thông tin tài khoản</button><button data-acct="pw">Đổi mật khẩu</button><button data-acct="logout" class="out">Đăng xuất</button></div>`
    : `<button class="btn-glass acct-login" data-auth="login">Đăng nhập</button>`;
}

function mkGate(role, title, hint, login) {
  const v = document.querySelector('#view-' + role);
  if (!v) return;
  const g = document.createElement('div'); g.className = 'gate';
  g.innerHTML = `<form class="gate-box" novalidate><h2>${title}</h2><label class="cx-f">Tên đăng nhập<input name="u" autocomplete="username"></label><label class="cx-f">Mật khẩu<input name="p" type="password" autocomplete="current-password"></label><p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đăng nhập</button><small class="cx-hint">${hint}</small></form>`;
  v.prepend(g); v.classList.add('locked');
  g.querySelector('form').onsubmit = async e => {
    e.preventDefault(); const f = e.target, button = f.querySelector('button');
    const errorBox = f.querySelector('.form-err');
    errorBox.textContent = ''; button.disabled = true;
    try {
      const err = await login(f.elements.u.value.trim(), f.elements.p.value);
      if (err) { errorBox.textContent = err; return; }
      f.reset(); v.classList.remove('locked'); scrollTo(0, 0);
    } catch (error) {
      errorBox.textContent = error?.message || 'Không thể đăng nhập. Vui lòng thử lại.';
    } finally { button.disabled = false; }
  };
}

const lockView = role => {
  const v = document.querySelector('#view-' + role);
  if (v) v.classList.add('locked');
};

document.addEventListener('DOMContentLoaded', () => {
  renderAcct();

  if (typeof API !== 'undefined') {
    // Gọi API im lặng (silent = true) để không bắn lỗi F12 khi chưa đăng nhập
    API.get('auth/me', true).then(data => {
      if (data && (data.user || data.maKH)) {
        if (!window.CTX) window.CTX = {};
        window.CTX.user = customerForUi(data.user || data);
        renderAcct();
      }
    }).catch(() => {});
  }

  const cx = document.querySelector('#cx-modal');
  if (cx) {
    cx.addEventListener('mousedown', e => { if (e.target === cx) cxClose(); });
    cx.addEventListener('submit', async e => {
      const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
      const errorBox = f.querySelector('.form-err');
      errorBox.textContent = '';
      const button = f.querySelector('button[type="submit"],button:not([type])');
      if (button) { button.disabled = true; button.textContent = 'Đang xử lý...'; }
      try { await submitAuthToBackend(f); }
      catch (err) { errorBox.textContent = err.message || 'Thao tác thất bại.'; }
      finally { if (button) { button.disabled = false; button.textContent = 'Tiếp tục'; } }
    });
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-cx-close]') && e.target.closest('#cx-modal')) return cxClose();
    const a = e.target.closest('[data-auth]'); if (a) return renderAuth(a.dataset.auth);
    const menu = document.querySelector('.acct-menu');
    if (menu && !e.target.closest('#acct')) menu.hidden = true;
  });
});

window.cxOpen = cxOpen;
window.cxClose = cxClose;
window.renderAuth = renderAuth;
window.loginAs = loginAs;
window.customerForUi = customerForUi;
window.renderAcct = renderAcct;
window.mkGate = mkGate;
window.lockView = lockView;