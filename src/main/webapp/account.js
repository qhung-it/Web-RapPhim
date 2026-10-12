'use strict';
/* account.js — Tài khoản khách hàng dùng dữ liệu đơn hàng từ API Java, không dùng đơn giả lập trong trình duyệt. */

let remoteOrders = [];
let ordFilter = 'all';
const OFILTERS = [['up', 'Sắp chiếu'], ['done', 'Đã xem'], ['cancel', 'Đã hủy'], ['all', 'Tất cả']];
const orderId = o => String(o.maDon || o.id || '');
const orderStatus = o => String(o.trangThai || '').toLowerCase();
const isCanceled = o => /dahuy|da_huy|cancel/.test(orderStatus(o));
const isPaid = o => /dathanhtoan|da_thanh_toan|paid|hoanthanh/.test(orderStatus(o));
const showDateTime = o => [o.ngayChieu, o.gioBatDau].filter(Boolean).join(' · ') || 'Chưa có thông tin suất chiếu';
const showSeats = o => Array.isArray(o.ghe) ? o.ghe.join(', ') : '';
const showStart = o => {
  const raw = [o.ngayChieu, o.gioBatDau].filter(Boolean).join('T');
  const parsed = raw ? Date.parse(raw.length === 10 ? `${raw}T23:59:59` : raw) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};
const chip = b => `<span class="chip ${b[1]}">${b[0]}</span>`;
function ordBadge(o) {
  if (isCanceled(o)) return ['Đã hủy', 'muted'];
  if (isPaid(o)) return ['Đã thanh toán', 'success'];
  if (/chothanhtoan|cho_thanh_toan|pending/.test(orderStatus(o))) return ['Chờ thanh toán', 'pending'];
  return [o.trangThai || 'Đang xử lý', 'muted'];
}
function canCancel(o) { return !isCanceled(o) && !isPaid(o) && /chothanhtoan|cho_thanh_toan|pending/.test(orderStatus(o)); }
function filteredOrders(filter) {
  const now = Date.now();
  const predicate = {
    up: o => !isCanceled(o) && showStart(o) >= now,
    done: o => !isCanceled(o) && showStart(o) > 0 && showStart(o) < now,
    cancel: isCanceled,
    all: () => true
  }[filter] || (() => true);
  return remoteOrders.filter(predicate);
}
async function loadCustomerOrders() {
  const data = await RapPhimAPI.customerHistory();
  remoteOrders = Array.isArray(data) ? data : (data.orders || []);
  return remoteOrders;
}
async function openOrders(filter) {
  ordFilter = filter || ordFilter;
  cxOpen('<h2>Đang tải lịch sử đặt vé…</h2><p class="cx-sub">Đang lấy dữ liệu từ máy chủ.</p>', true);
  try {
    await loadCustomerOrders();
    const all = remoteOrders, list = filteredOrders(ordFilter);
    cxOpen(`<h2>${ordFilter === 'up' ? 'Vé của tôi' : 'Lịch sử đặt vé'}</h2>
      <div class="filter-pills" id="ord-pills">${OFILTERS.map(([k, label]) => `<button class="pill${k === ordFilter ? ' active' : ''}" data-ordf="${k}">${label} (${filteredOrders(k).length})</button>`).join('')}</div>
      <div class="cx-list">${list.length ? list.map(o => `<button class="cx-order" data-ord="${esc(orderId(o))}"><div><strong>${esc(o.tenPhim || `Đơn ${orderId(o)}`)}</strong><span>${esc(showDateTime(o))} ·${esc(o.tenRap || 'Rạp chưa xác định')}</span><span>Ghế ${esc(showSeats(o) \vert{}\vert{} 'Đang cập nhật')}</span><small>Mã đơn: ${esc(orderId(o))}</small></div><div class="r"><b>${fmt(Number(o.tongTien \vert{}\vert{} 0) - Number(o.tienGiam \vert{}\vert{} 0))}</b>${chip(ordBadge(o))}</div></button>`).join('') : `<div class="cx-empty"><p>${all.length ? 'Không có đơn trong mục này.' : 'Bạn chưa có lịch sử đặt vé.'}</p><button class="btn-glass" data-cx-close>Đóng</button></div>`}</div>`, true);
  } catch (error) {
    cxOpen(`<h2>Lịch sử đặt vé</h2><div class="cx-empty"><p>${esc(error.message || 'Không tải được lịch sử đặt vé.')}</p><button class="btn-glass" data-acct="history">Thử lại</button></div>`, true);
  }
}
async function openOrder(id) {
  let o = remoteOrders.find(x => orderId(x) === id);
  if (!o) {
    try { o = await RapPhimAPI.order(id); }
    catch (error) { return toast(error.message || 'Không tải được chi tiết đơn hàng.'); }
  }
  if (!o) return toast('Không tìm thấy đơn hàng.');
  const b = ordBadge(o), cancelable = canCancel(o);
  cxOpen(`<button class="cx-back" data-acct="back">← Quay lại danh sách</button><h2>${esc(o.tenPhim || `Đơn ${orderId(o)}`)}</h2>${chip(b)}
    <div class="cx-ticket"><dl class="cx-dl"><dt>Mã đặt vé</dt><dd>${esc(orderId(o))}</dd><dt>Ngày đặt</dt><dd>${esc(o.ngayDat || '—')}</dd><dt>Suất chiếu</dt><dd>${esc(showDateTime(o))}</dd><dt>Rạp</dt><dd>${esc(o.tenRap || '—')}</dd><dt>Phòng</dt><dd>${esc(o.tenPhong || '—')}</dd><dt>Ghế</dt><dd>${esc(showSeats(o) || '—')}</dd></dl>
      <div class="ticket-qr">${isCanceled(o) ? '<p class="muted">Đơn đã hủy</p>' : `<p class="muted">Mã đơn</p><strong>${esc(orderId(o))}</strong>`}</div></div>
    <div class="cx-lines"><div><span>Tiền đơn hàng</span><b>${fmt(Number(o.tongTien) || 0)}</b></div>${Number(o.tienGiam || 0) > 0 ? `<div class="hl"><span>Giảm giá${o.maKM ? ` (${esc(o.maKM)})` : ''}</span><b>-${fmt(Number(o.tienGiam))}</b></div>` : ''}<div class="tot"><span>Tổng cần thanh toán</span><b>${fmt(Math.max(0, Number(o.tongTien || 0) - Number(o.tienGiam || 0)))}</b></div><div><span>Thanh toán</span><b>${esc(o.phuongThuc || '—')} · ${esc(o.trangThaiThanhToan || b[0])}</b></div></div>
    <div class="cx-actions">${cancelable ? `<button class="btn-danger" data-acct="cancel" data-id="${esc(orderId(o))}">Hủy đơn</button>` : ''}</div>
    ${cancelable ? '<small class="cx-hint">Đơn chỉ có thể hủy khi chưa thanh toán và còn ở trạng thái chờ thanh toán.</small>' : ''}`, true);
}
function openProfile() {
  const u = CTX.user, t = tierOf(u.tier);
  cxOpen(`<h2>Thông tin tài khoản</h2><p class="cx-sub">Hạng: <strong>${esc(t.n)}</strong>${t.pct ? ` · ưu đãi ${t.pct}%` : ''}</p>
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
      renderAcct(); cxClose(); toast('Đã cập nhật thông tin'); return '';
    } catch (error) { return error.message || 'Không thể cập nhật hồ sơ.'; }
  },
  async pw(f) {
    if (f.elements.pw.value.length < 6) return 'Mật khẩu mới tối thiểu 6 ký tự.';
    if (f.elements.pw.value !== f.elements.pw2.value) return 'Mật khẩu nhập lại không khớp.';
    try { await RapPhimAPI.changePassword(f.elements.old.value, f.elements.pw.value); cxClose(); toast('Đã đổi mật khẩu'); return ''; }
    catch (error) { return error.message || 'Không thể đổi mật khẩu.'; }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', async e => {
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
    else if (act === 'logout') {
      try { await RapPhimAPI.logoutCustomer(); } catch (error) { return toast(error.message || 'Không thể đăng xuất khỏi máy chủ.'); }
      CTX.user = null; remoteOrders = []; renderAcct(); closeModal(); closeDetail(); cxClose(); toast('Đã đăng xuất');
    } else if (act === 'cancel') {
      const id = a.dataset.id, o = remoteOrders.find(x => orderId(x) === id);
      if (!o || !canCancel(o)) return toast('Đơn này không thể hủy.');
      a.disabled = true;
      try {
        await RapPhimAPI.cancelOrder(id);
        await loadCustomerOrders();
        toast(`Đã gửi yêu cầu hủy đơn ${id}.`);
        openOrder(id);
      } catch (error) { toast(error.message || 'Không thể hủy đơn.'); a.disabled = false; }
    }
  });
});