'use strict';
/* auth.js — Đăng ký / đăng nhập / quên mật khẩu cho khách hàng; màn hình đăng nhập cho nhân viên và quản trị */

const AUTHQ = { next: null, code: null, email: null };
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e), phoneOk = p => /^0\d{9}$/.test(p);
const tierName = id => tierOf(id).n;

function cxOpen(html, wide) {
  const m = $('#cx-modal'); m.innerHTML = `<div class="cx-box${wide ? ' wide' : ''}" role="dialog" aria-modal="true"><button class="cx-x" data-cx-close aria-label="Đóng">✕</button>${html}</div>`;
  m.hidden = false; document.body.classList.add('modal-open'); m.querySelector('input,select')?.focus();
}
function cxClose() { $('#cx-modal').hidden = true; if (!$('#booking-modal').classList.contains('active') && $('#detail').hidden) document.body.classList.remove('modal-open'); }
const fld = (n, l, type = 'text', x = '') => `<label class="cx-f">${l}<input name="${n}" type="${type}" ${x}></label>`;
const val = (f, n) => f.elements[n].value.trim();

function renderAuth(mode = 'login') {
  const T = {
    login: `<h2>Đăng nhập</h2><p class="cx-sub">Đăng nhập để đặt vé, xem vé đã mua và lịch sử đặt vé.</p>
      <form data-form="login" novalidate>${fld('ident', 'Email', 'text', 'autocomplete="username"')}${fld('pw', 'Mật khẩu', 'password', 'autocomplete="current-password"')}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đăng nhập</button></form>
      <div class="cx-links"><button data-auth="forgot">Quên mật khẩu?</button><button data-auth="register">Tạo tài khoản mới</button></div><small class="cx-hint">Sử dụng tài khoản đã đăng ký trong hệ thống.</small>`,
    register: `<h2>Tạo tài khoản</h2><p class="cx-sub">Miễn phí, đặt vé chỉ mất vài giây.</p>
      <form data-form="register" novalidate>${fld('n', 'Họ và tên')}${fld('email', 'Email', 'email', 'autocomplete="email"')}${fld('phone', 'Số điện thoại', 'tel', 'inputmode="numeric" maxlength="10"')}${fld('dob', 'Ngày sinh', 'date')}${fld('pw', 'Mật khẩu (tối thiểu 6 ký tự)', 'password', 'autocomplete="new-password"')}${fld('pw2', 'Nhập lại mật khẩu', 'password', 'autocomplete="new-password"')}
      <label class="cx-check"><input type="checkbox" name="student"> Tôi là học sinh, sinh viên (nhận ưu đãi ${tierOf('student').pct}%)</label><p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đăng ký</button></form>
      <div class="cx-links"><button data-auth="login">Đã có tài khoản? Đăng nhập</button></div>`,
    forgot: `<h2>Quên mật khẩu</h2><p class="cx-sub">Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận.</p>
      <form data-form="forgot" novalidate>${fld('email', 'Email', 'email')}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Gửi mã xác nhận</button></form><div class="cx-links"><button data-auth="login">Quay lại đăng nhập</button></div>`,
    reset: `<h2>Đặt lại mật khẩu</h2><p class="cx-sub">Mã xác nhận đã gửi tới ${esc(AUTHQ.email || '')}. <em>Mã OTP có hiệu lực trong 5 phút.</em></p>
      <form data-form="reset" novalidate>${fld('code', 'Mã xác nhận', 'text', 'inputmode="numeric" maxlength="6"')}${fld('pw', 'Mật khẩu mới', 'password', 'autocomplete="new-password"')}${fld('pw2', 'Nhập lại mật khẩu mới', 'password', 'autocomplete="new-password"')}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đổi mật khẩu</button></form>`
  };
  cxOpen(T[mode]);
}
function loginAs(c) {
  CTX.user = c; renderAcct(); cxClose(); toast(`Xin chào ${c.n}`);
  const n = AUTHQ.next; AUTHQ.next = null; n && n();
}
async function apiAuth(path, payload) {
  const response = await fetch(new URL(`api/${path}`, document.baseURI).toString(), {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || 'Yêu cầu không thành công.');
  return data;
}
function customerForUi(user) {
  const rawTier = String(user.tier || 'regular').toLowerCase();
  const tier = rawTier.includes('sv') || rawTier.includes('student') || rawTier.includes('sinhvien') ? 'student' : rawTier.includes('gold') || rawTier.includes('vang') ? 'gold' : rawTier.includes('silver') || rawTier.includes('bac') ? 'silver' : 'regular';
  return { id: user.id || user.maKH, n: user.n || user.hoTen, email: user.email, phone: user.phone || user.soDienThoai || '', dob: user.dob || user.ngaySinh || '', tier, st: 'on' };
}
async function submitAuthToBackend(f) {
  const mode = f.dataset.form;
  if (mode === 'login') {
    const ident = val(f, 'ident').toLowerCase(), password = f.elements.pw.value;
    if (!ident || !password) throw new Error('Vui lòng nhập đầy đủ thông tin.');
    const data = await apiAuth('auth/login', { email: ident, password });
    loginAs(customerForUi(data.user));
    return;
  }
  if (mode === 'register') {
    const n=val(f,'n'), email=val(f,'email').toLowerCase(), phone=val(f,'phone'), dob=val(f,'dob'), pw=f.elements.pw.value;
    if(n.length<2)throw new Error('Vui lòng nhập họ tên.');
    if(!emailOk(email))throw new Error('Email không hợp lệ.');
    if(!phoneOk(phone))throw new Error('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.');
    if(pw.length<6)throw new Error('Mật khẩu tối thiểu 6 ký tự.');
    if(pw!==f.elements.pw2.value)throw new Error('Mật khẩu nhập lại không khớp.');
    let maLoai;
    try { const r=await fetch(new URL('api/tiers', document.baseURI).toString(),{credentials:'same-origin'}); if(r.ok){const list=await r.json(); const preferred=list.find(x=>f.elements.student.checked ? /sinh|sinh viên|student|học/i.test(`${x.maLoai} ${x.tenLoai}`) : /thường|regular/i.test(`${x.maLoai} ${x.tenLoai}`)); maLoai=(preferred||list[0]||{}).maLoai;} } catch (_) {}
    const data=await apiAuth('auth/register',{hoTen:n,email,soDienThoai:phone,ngaySinh:dob||null,matKhau:pw,maLoai});
    loginAs(customerForUi(data.user)); toast('Đăng ký thành công'); return;
  }
  if (mode === 'forgot') {
    const email=val(f,'email').toLowerCase(); if(!emailOk(email))throw new Error('Email không hợp lệ.');
    await apiAuth('auth/forgot',{email}); AUTHQ.email=email; AUTHQ.code=null; renderAuth('reset'); toast('Nếu email tồn tại và cấu hình email hợp lệ, mã OTP sẽ được gửi.'); return;
  }
  if (mode === 'reset') {
    const otp=val(f,'code'), pw=f.elements.pw.value;
    if(!/^\d{6}$/.test(otp))throw new Error('Mã OTP gồm 6 chữ số.');
    if(pw.length<6)throw new Error('Mật khẩu mới tối thiểu 6 ký tự.');
    if(pw!==f.elements.pw2.value)throw new Error('Mật khẩu nhập lại không khớp.');
    await apiAuth('auth/verify-otp',{email:AUTHQ.email,otp});
    await apiAuth('auth/reset-password',{email:AUTHQ.email,otp,matKhauMoi:pw});
    AUTHQ.code=null; renderAuth('login'); toast('Đã đổi mật khẩu. Hãy đăng nhập lại');
  }
}

const FORMS = {
  login(f) {
    const id = val(f, 'ident').toLowerCase(), c = DB.customers.find(x => (x.email || '').toLowerCase() === id || x.phone === id);
    if (!id || !f.elements.pw.value) return 'Vui lòng nhập đầy đủ thông tin.';
    if (!c || c.pw !== f.elements.pw.value) return 'Email/số điện thoại hoặc mật khẩu không đúng.';
    if (c.st !== 'on') return 'Tài khoản đã bị khóa. Vui lòng liên hệ hotline 08 14149 579.';
    loginAs(c);
  },
  register(f) {
    const n = val(f, 'n'), email = val(f, 'email').toLowerCase(), phone = val(f, 'phone'), pw = f.elements.pw.value;
    if (n.length < 2) return 'Vui lòng nhập họ tên.';
    if (!emailOk(email)) return 'Email không hợp lệ.';
    if (!phoneOk(phone)) return 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
    if (pw.length < 6) return 'Mật khẩu tối thiểu 6 ký tự.';
    if (pw !== f.elements.pw2.value) return 'Mật khẩu nhập lại không khớp.';
    if (DB.customers.some(c => (c.email || '').toLowerCase() === email)) return 'Email này đã được đăng ký.';
    if (DB.customers.some(c => c.phone === phone)) return 'Số điện thoại này đã được đăng ký.';
    const c = { id: 'c' + Date.now(), n, email, phone, dob: val(f, 'dob'), pw, tier: f.elements.student.checked ? 'student' : 'regular', st: 'on' };
    DB.customers.unshift(c); loginAs(c); toast('Đăng ký thành công');
  },
  forgot(f) {
    const email = val(f, 'email').toLowerCase(), c = DB.customers.find(x => (x.email || '').toLowerCase() === email);
    if (!emailOk(email)) return 'Email không hợp lệ.';
    if (!c) return 'Không tìm thấy tài khoản với email này.';
    AUTHQ.email = email; AUTHQ.code = String(100000 + Math.random() * 900000 | 0); renderAuth('reset');
  },
  reset(f) {
    if (val(f, 'code') !== AUTHQ.code) return 'Mã xác nhận không đúng.';
    if (f.elements.pw.value.length < 6) return 'Mật khẩu mới tối thiểu 6 ký tự.';
    if (f.elements.pw.value !== f.elements.pw2.value) return 'Mật khẩu nhập lại không khớp.';
    DB.customers.find(x => (x.email || '').toLowerCase() === AUTHQ.email).pw = f.elements.pw.value; AUTHQ.code = null;
    renderAuth('login'); toast('Đã đổi mật khẩu. Hãy đăng nhập lại');
  }
};

/* ---- Nút tài khoản trên thanh điều hướng ---- */
function renderAcct() {
  const el = $('#acct'), u = CTX.user;
  el.innerHTML = u ? `<button class="acct-btn" data-acct="toggle" aria-haspopup="true" aria-expanded="false" aria-label="Tài khoản"><span class="acct-av">${esc(u.n.trim().split(/\s+/).pop()[0] || '?').toUpperCase()}</span></button>
    <div class="acct-menu" hidden><div class="acct-head"><strong>${esc(u.n)}</strong><span>${esc(tierName(u.tier))}${tierOf(u.tier).pct ? ` · ưu đãi ${tierOf(u.tier).pct}%` : ''}</span></div>
      <button data-acct="tickets">Vé của tôi</button><button data-acct="history">Lịch sử đặt vé</button><button data-acct="profile">Thông tin tài khoản</button><button data-acct="pw">Đổi mật khẩu</button><button data-acct="logout" class="out">Đăng xuất</button></div>`
    : `<button class="btn-glass acct-login" data-auth="login">Đăng nhập</button>`;
}

/* ---- Khóa thao tác đặt vé khi chưa đăng nhập ---- */
const _ob2 = openBooking;
openBooking = function (m, o) {
  if (!CTX.user) { AUTHQ.next = () => openBooking(m, o); toast('Vui lòng đăng nhập để đặt vé'); return renderAuth('login'); }
  _ob2(m, o);
};
const _pay = pay;
pay = function () {
  const sold = soldFor(S.show), bad = S.sel.filter(s => sold.has(s.id));
  if (bad.length) {
    S.sel = S.sel.filter(s => !sold.has(s.id)); drawSeats($('#seat-matrix'), sold, S.sel, update); setStep(1); update();
    return toast(`Ghế ${bad.map(s => s.id).join(', ')} vừa được người khác đặt. Vui lòng chọn lại.`);
  }
  _pay();
};
const _update = update;
update = function () {
  _update();
  const t = totals(S.sel, S.combos, S.promo);
  if (t.pct) $('#disc-label').textContent = `Ưu đãi (${S.promo ? S.promo + ' + ' : ''}${t.tier} ${t.pct}%)`;
};

/* ---- Màn hình đăng nhập cho nhân viên / quản trị ---- */
function mkGate(role, title, hint, login) {
  const v = $('#view-' + role), g = document.createElement('div'); g.className = 'gate';
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
const lockView = role => $('#view-' + role).classList.add('locked');

document.addEventListener('DOMContentLoaded', () => {
  renderAcct();
  // Khôi phục phiên đăng nhập từ HttpSession của Java sau khi tải lại trang.
  // Không lưu mật khẩu/token trong localStorage; cookie phiên do máy chủ quản lý.
  RapPhimAPI.currentCustomer().then(data => {
    if (data && data.user && !CTX.user) {
      CTX.user = customerForUi(data.user);
      renderAcct();
    }
  }).catch(() => { /* Khách chưa đăng nhập: giữ giao diện khách */ });
  const cx = $('#cx-modal');
  cx.addEventListener('mousedown', e => { if (e.target === cx) cxClose(); });
  cx.addEventListener('submit', async e => {
    const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    const errorBox = f.querySelector('.form-err');
    if (['login', 'register', 'forgot', 'reset'].includes(f.dataset.form)) {
      errorBox.textContent = '';
      const button = f.querySelector('button[type="submit"],button:not([type])');
      if (button) { button.disabled = true; button.dataset.oldText = button.textContent; button.textContent = 'Đang xử lý...'; }
      try { await submitAuthToBackend(f); }
      catch (err) { errorBox.textContent = err.message || 'Không thể kết nối máy chủ. Hãy kiểm tra ứng dụng Java và database.'; }
      finally { if (button) { button.disabled = false; button.textContent = button.dataset.oldText || 'Tiếp tục'; } }
      return;
    }
    errorBox.textContent = '';
    const button = f.querySelector('button[type="submit"],button:not([type])');
    if (button) { button.disabled = true; button.dataset.oldText = button.textContent; button.textContent = 'Đang xử lý...'; }
    try {
      const err = await FORMS[f.dataset.form](f);
      if (err) errorBox.textContent = err;
    } catch (err) {
      errorBox.textContent = err.message || 'Không thể hoàn tất thao tác.';
    } finally {
      if (button) { button.disabled = false; button.textContent = button.dataset.oldText || 'Tiếp tục'; }
    }
  });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-cx-close]') && e.target.closest('#cx-modal')) return cxClose();
    const a = e.target.closest('[data-auth]'); if (a) return renderAuth(a.dataset.auth);
    const menu = $('.acct-menu'); if (menu && !e.target.closest('#acct')) { menu.hidden = true; $('.acct-btn')?.setAttribute('aria-expanded', false); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#cx-modal').hidden) cxClose(); });
});
