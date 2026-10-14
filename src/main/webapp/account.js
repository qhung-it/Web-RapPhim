'use strict';
/* account.js — Khách hàng: vé đã mua, lịch sử đặt vé, chi tiết/hủy đơn, hồ sơ, đổi mật khẩu */

const myOrders = () => DB.orders.filter(o => o.cust === CTX.user?.id);
const chip = b => `<span class="chip ${b[1]}">${b[0]}</span>`;
const isUpcoming = o => o.st !== 'cancel' && (o.startAt || 0) > Date.now();
const OFILTERS = [['up', 'Sắp chiếu'], ['done', 'Đã xem'], ['cancel', 'Đã hủy'], ['all', 'Tất cả']];
let ordFilter = 'all';

function openOrders(f) {
  ordFilter = f || ordFilter;
  const all = myOrders(), pass = { up: isUpcoming, done: o => o.st !== 'cancel' && !isUpcoming(o), cancel: o => o.st === 'cancel', all: () => true }[ordFilter];
  const list = all.filter(pass);
  cxOpen(`<h2>${f === 'up' || ordFilter === 'up' ? 'Vé của tôi' : 'Lịch sử đặt vé'}</h2>
    <div class="filter-pills" id="ord-pills">${OFILTERS.map(([k, l]) => `<button class="pill${k === ordFilter ? ' active' : ''}" data-ordf="${k}">${l} (${all.filter({ up: isUpcoming, done: o => o.st !== 'cancel' && !isUpcoming(o), cancel: o => o.st === 'cancel', all: () => true }[k]).length})</button>`).join('')}</div>
    <div class="cx-list">${list.length ? list.map(o => `<button class="cx-order" data-ord="${esc(o.id)}"><div><strong>${esc(o.movie)}</strong><span>${esc(o.time)} · ${esc(o.date || '')} · ${esc(o.cin)}</span><span>Ghế ${esc(o.seats)}</span></div><div class="r"><b>${fmt(Number(o.total) || 0)}</b>${chip(ordBadge(o))}</div></button>`).join('')
      : `<div class="cx-empty"><p>Chưa có đơn nào trong mục này.</p><button class="btn-glass" data-cx-close>Đặt vé ngay</button></div>`}</div>`, true);
}
function openOrder(id) {
  const o = DB.orders.find(x => x.id === id); if (!o) return;
  const b = ordBadge(o), cancelable = canCancel(o);
  cxOpen(`<button class="cx-back" data-acct="back">← Quay lại danh sách</button><h2>${esc(o.movie)}</h2>${chip(b)}
    <div class="cx-ticket"><dl class="cx-dl"><dt>Mã đặt vé</dt><dd>${esc(o.id)}</dd><dt>Suất chiếu</dt><dd>${esc(o.time)} · ${esc(o.date || '')}</dd><dt>Rạp</dt><dd>${esc(o.cin)}</dd><dt>Phòng</dt><dd>${esc(o.room || '')}</dd><dt>Ghế</dt><dd>${esc(o.seats)}</dd></dl>
      <div class="ticket-qr">${o.st === 'cancel' ? '<p class="muted">Vé đã hủy</p>' : qr(o.id + o.seats)}</div></div>
    <div class="cx-lines"><div><span>Tiền vé</span><b>${fmt(o.seatAmt ?? o.total)}</b></div>${(o.items || []).map(i => `<div><span>${i.q} × ${esc(i.n)}</span><b>${fmt(i.q * i.p)}</b></div>`).join('')}
      ${o.disc ? `<div class="hl"><span>Giảm giá${o.promo ? ' (' + esc(o.promo) + ')' : ''}</span><b>-${fmt(o.disc)}</b></div>` : ''}<div class="tot"><span>Tổng cộng</span><b>${fmt(Number(o.total) || 0)}</b></div>
      <div><span>Thanh toán</span><b>${esc(o.method || '—')} · ${b[0]}</b></div></div>
    <div class="cx-actions"><button class="btn-glass" data-acct="dl" data-id="${esc(o.id)}">Tải vé</button>${cancelable ? `<button class="btn-danger" data-acct="cancel" data-id="${esc(o.id)}">Hủy đơn</button>` : ''}</div>
    ${cancelable ? '<small class="cx-hint">Được hủy khi suất chiếu chưa bắt đầu. Ghế sẽ được trả lại ngay.</small>' : ''}`, true);
}
function openProfile() {
  const u = CTX.user, t = tierOf(u.tier);
  cxOpen(`<h2>Thông tin tài khoản</h2><p class="cx-sub">Hạng: <strong>${esc(t.n)}</strong>${t.pct ? ` · giảm ${t.pct}% mỗi đơn` : ''}</p>
    <form data-form="profile" novalidate>${fld('n', 'Họ và tên', 'text', `value="${esc(u.n)}"`)}${fld('email', 'Email', 'email', `value="${esc(u.email)}"`)}${fld('phone', 'Số điện thoại', 'tel', `value="${esc(u.phone)}" maxlength="10"`)}${fld('dob', 'Ngày sinh', 'date', `value="${esc(u.dob || '')}"`)}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Lưu thay đổi</button></form>`);
}
function openPw() {
  cxOpen(`<h2>Đổi mật khẩu</h2><form data-form="pw" novalidate>${fld('old', 'Mật khẩu hiện tại', 'password')}${fld('pw', 'Mật khẩu mới', 'password')}${fld('pw2', 'Nhập lại mật khẩu mới', 'password')}<p class="form-err" role="alert"></p><button class="btn-primary-gold btn-large">Đổi mật khẩu</button></form>`);
}
Object.assign(FORMS, {
  async profile(f) {
    const u = CTX.user, n = val(f, 'n'), email = val(f, 'email').toLowerCase(), phone = val(f, 'phone');
    if (n.length < 2) return 'Vui lòng nhập họ tên.';
    if (!emailOk(email)) return 'Email không hợp lệ.';
    if (!phoneOk(phone)) return 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
    try {
      const result = await RapPhimAPI.updateProfile({ hoTen: n, email, soDienThoai: phone, ngaySinh: val(f, 'dob') || null });
      const uDto = result.user || {};
      Object.assign(u, { n: uDto.hoTen || n, email: uDto.email || email, phone: uDto.soDienThoai || phone, dob: uDto.ngaySinh || val(f, 'dob') });
      renderAcct(); cxClose(); toast('Đã cập nhật thông tin');
      return '';
    } catch (error) { return error.message || 'Không thể cập nhật hồ sơ.'; }
  },
  async pw(f) {
    if (f.elements.pw.value.length < 6) return 'Mật khẩu mới tối thiểu 6 ký tự.';
    if (f.elements.pw.value !== f.elements.pw2.value) return 'Mật khẩu nhập lại không khớp.';
    try {
      await RapPhimAPI.changePassword(f.elements.old.value, f.elements.pw.value);
      cxClose(); toast('Đã đổi mật khẩu'); return '';
    } catch (error) { return error.message || 'Không thể đổi mật khẩu.'; }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-acct]'), pf = e.target.closest('[data-ordf]'), od = e.target.closest('[data-ord]');
    if (pf) return openOrders(pf.dataset.ordf);
    if (od) return openOrder(od.dataset.ord);
    if (!a) return;
    const act = a.dataset.acct, menu = $('.acct-menu');
    if (act === 'toggle') { menu.hidden = !menu.hidden; a.setAttribute('aria-expanded', !menu.hidden); return; }
    if (menu) menu.hidden = true;
    if (act === 'tickets') { ordFilter = 'up'; openOrders('up'); }
    else if (act === 'history') { ordFilter = 'all'; openOrders('all'); }
    else if (act === 'back') openOrders();
    else if (act === 'profile') openProfile();
    else if (act === 'pw') openPw();
    else if (act === 'logout') { fetch(new URL('api/auth/logout', document.baseURI), { method: 'POST', credentials: 'same-origin' }).catch(() => {}); CTX.user = null; renderAcct(); closeModal(); closeDetail(); cxClose(); toast('Đã đăng xuất'); }
    else if (act === 'dl') { const o = DB.orders.find(x => x.id === a.dataset.id); downloadTicket({ code: o.id, movie: o.movie, cin: o.cin, time: o.time, date: o.date, seats: o.seats, total: o.total }); }
    else if (act === 'cancel') {
      const o = DB.orders.find(x => x.id === a.dataset.id); if (!o || !canCancel(o)) return toast('Đơn này không thể hủy');
      cancelOrder(o); drawPos(); openOrder(o.id); toast(`Đã hủy đơn ${o.id}. Tiền hoàn về phương thức thanh toán trong 3–5 ngày`);
    }
  });
});
