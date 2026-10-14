'use strict';
/* staff-pro.js — Nhân viên: đăng nhập + phân quyền, tra cứu phim/suất chiếu, tra cứu vé, quản lý đơn đặt vé.
   Đã được kết nối đồng bộ với Backend ApiServlet qua API Client. */

const perm = () => {
  const r = window.CTX?.staff?.role;
  return {
    sell: ['Admin', 'QuanLy', 'NhanVienBanVe', 'Thu ngân'].includes(r),
    confirm: ['Admin', 'QuanLy', 'NhanVienBanVe', 'Thu ngân'].includes(r),
    cancelAny: ['Admin', 'QuanLy'].includes(r),
    orders: ['Admin', 'QuanLy', 'NhanVienBanVe', 'Thu ngân'].includes(r),
    tickets: ['Admin', 'QuanLy', 'NhanVienKiemVe', 'Soát vé'].includes(r)
  };
};

let posTab = 'sell';
const PF = { q: '', date: '', cin: '' }, PT = { q: '', st: 'all' }, PO = { q: '', st: 'all' };

/* Xác thực đăng nhập nhân viên qua API */
async function loginStaff(u, p) {
  try {
    const data = (typeof API !== 'undefined' && typeof API.dangNhapNhanVien === 'function')
      ? await API.dangNhapNhanVien(u, p)
      : (typeof API !== 'undefined' ? await API.post('staff/login', { email: u, password: p }) : {});

    const x = data.staff || data;
    if (!x || !(x.maNV || x.id)) return 'Máy chủ không trả về thông tin nhân viên.';

    window.CTX.staff = {
      id: String(x.maNV || x.id),
      n: x.hoTen || x.n || 'Nhân viên',
      role: x.chucVu || x.role || 'Nhân viên',
      email: x.email || u,
      st: 'on'
    };
    paintStaff();
    return '';
  } catch (err) {
    return err.message || 'Không thể đăng nhập tài khoản nhân viên.';
  }
}

function paintStaff() {
  const s = window.CTX?.staff, p = perm();
  if (!s) return;
  if ($('.pos-user')) {$('.pos-user').innerHTML = `${esc(s.role)}: ${esc(s.n)} (#${esc(s.id.toUpperCase())}) <button class="btn-glass pos-logout" data-pos="logout">Đăng xuất</button>`;
  }
  $$('#pos-tabs [data-tab]').forEach(b => b.hidden = (b.dataset.tab === 'sell' && !p.sell) || (b.dataset.tab === 'orders' && !p.orders) || (b.dataset.tab === 'tickets' && !p.tickets));
  showTab(p.sell ? 'sell' : p.tickets ? 'tickets' : 'find');
}

function showTab(t) {
  posTab = t;
  $$('#pos-tabs [data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); $$
('#view-staff [data-pane]').forEach(p => p.hidden = p.dataset.pane !== t);
  if (t === 'find') renderFind(true);
  if (t === 'tickets') renderTickets2(true);
  if (t === 'orders') renderOrders2(true);
}

/* ---- Tra cứu phim và suất chiếu ---- */
function renderFind(full) {
  const box = $('[data-pane="find"]');
  if (!box) return;
  if (full) {
    box.innerHTML = `<div class="pos-bar"><input class="pos-input" id="pf-q" placeholder="Tìm tên phim, thể loại, đạo diễn..." value="${esc(PF.q)}"><select class="pos-input" id="pf-date">${(window.DATES || []).map(d => `<option value="${d.k}"${(PF.date \vert{}\vert{} (window.DATES?.[0] ? window.DATES[0].k : '')) === d.k ? ' selected' : ''}>${d.l}</option>`).join('')}</select>
      <select class="pos-input" id="pf-cin"><option value="">Tất cả rạp</option>${(window.CINEMAS || []).map(c => `<option value="${c.id}"${PF.cin === c.id ? ' selected' : ''}>${c.n}</option>`).join('')}</select></div><div id="pf-res"></div>`;
    if ($('#pf-q')) $('#pf-q').oninput = e => { PF.q = e.target.value; renderFind(); };
    if ($('#pf-date')) $('#pf-date').onchange = e => { PF.date = e.target.value; renderFind(); };
    if ($('#pf-cin')) $('#pf-cin').onchange = e => { PF.cin = e.target.value; renderFind(); };
  }
  const q = norm(PF.q.trim()), date = PF.date || window.DATES?.[0]?.k || '', cap = typeof totalSeats === 'function' ? totalSeats() : 60, now = new Date(), nowStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const rows = (window.DB?.showtimes || []).filter(s => { const m = typeof movieById === 'function' ? movieById(s.m) : null, r = typeof roomById === 'function' ? roomById(s.r) : null; return m && r && s.st === 'on' && s.date === date && (!PF.cin || r.cin === PF.cin) && (!q || norm([m.t, m.g, m.dir, m.cast].join(' ')).includes(q)); });

  if ($('#pf-res')) {
    $('#pf-res').innerHTML = rows.length ? `<table class="pos-table"><thead><tr><th>Phim</th><th>Giờ chiếu</th><th>Rạp · Phòng</th><th>Ghế trống</th><th></th></tr></thead><tbody>${rows.map(s => {
      const m = movieById(s.m), r = roomById(s.r), c = (window.CINEMAS || []).find(x => x.id === r.cin) || window.CINEMAS?.[0] || {}, free = Math.max(0, cap - (typeof soldFor === 'function' ? soldFor({ m, date: s.date, cin: c, time: s.time }).size : 0)), past = date === window.DATES?.[0]?.k && s.time < nowStr;
      return `<tr><td><strong>${esc(m.t)}</strong><small>${esc(m.d)} · ${esc(m.age)} ·${esc(m.g)} · ${esc(m.fm.join('/'))}</small></td><td>${s.time} – ${typeof endTime === 'function' ? endTime(s.time, m) : s.time}</td><td>${esc(c.n)} · ${esc(r.n)}</td><td>${free}/${cap}</td><td>${perm().sell ? `<button class="btn-glass" data-pos="sell" data-id="${s.id}" ${past || !free ? 'disabled' : ''}>Bán vé</button>` : ''}</td></tr>`;
    }).join('')}</tbody></table>` : '<p class="muted pos-empty">Không có suất chiếu phù hợp.</p>';
  }
}

function sellShow(id) {
  const s = (window.DB?.showtimes || []).find(x => x.id === id), r = typeof roomById === 'function' ? roomById(s?.r) : null, P = window.S?.pos;
  if (!s || !r || !P) return typeof toast === 'function' ? toast('Không tìm thấy thông tin suất chiếu.') : null;
  P.show = { m: movieById(s.m), date: s.date, cin: (window.CINEMAS || []).find(c => c.id === r.cin) || window.CINEMAS[0], time: s.time }; P.sel = []; P.paid = false;
  $$('#pos-shows .pos-movie-btn').forEach(b => b.classList.remove('active'));
  showTab('sell');
  if (typeof drawPos === 'function') drawPos();
  if (typeof toast === 'function') toast(`Đang bán vé: ${P.show.m.t} · ${s.time}`);
}

/* ---- Tra cứu vé ---- */
function renderTickets2(full) {
  const box = $('[data-pane="tickets"]');
  if (!box) return;
  const tkStList = window.TK_ST || {};
  if (full) {
    box.innerHTML = `<div class="pos-bar"><input class="pos-input" id="pt-q" placeholder="Mã vé, mã đơn, tên hoặc số điện thoại khách..." value="${esc(PT.q)}"><select class="pos-input" id="pt-st"><option value="all">Mọi trạng thái</option>${Object.entries(tkStList).map(([k, v]) => `<option value="${k}"${PT.st === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></div><div id="pt-res"></div>`;
    if ($('#pt-q')) $('#pt-q').oninput = e => { PT.q = e.target.value; renderTickets2(); };
    if ($('#pt-st')) $('#pt-st').onchange = e => { PT.st = e.target.value; renderTickets2(); };
  }
  const rows = typeof ticketRows === 'function' ? ticketRows(PT.q, PT.st) : [];
  if ($('#pt-res')) {
    $('#pt-res').innerHTML = rows.length ? `<table class="pos-table"><thead><tr><th>Mã vé</th><th>Phim</th><th>Suất · Phòng</th><th>Ghế</th><th>Khách</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.slice(0, 60).map(t => `<tr><td><code>${esc(t.code)}</code></td><td>${esc(t.o.movie)}</td><td>${esc(t.o.time)} ·${esc(t.o.date || '')}<small>${esc(t.o.room \vert{}\vert{} '')}</small></td><td>${esc(t.seat)}</td><td>${esc(typeof custName === 'function' ? custName(t.o) : '')}</td><td>${typeof chip === 'function' ? chip(tkStList[t.status] || ['Chờ', 'pending']) : ''}</td>
      <td>${t.status === 'valid' ? `<button class="btn-glass" data-pos="use" data-id="${esc(t.o.id)}" data-seat="${esc(t.seat)}">Soát vé</button>` : ''}<button class="btn-glass" data-pos="order" data-id="${esc(t.o.id)}">Chi tiết</button></td></tr>`).join('')}</tbody></table>${rows.length > 60 ? `<p class="muted pos-empty">Hiển thị 60/${rows.length} vé. Hãy nhập thêm từ khóa.</p>` : ''}` : '<p class="muted pos-empty">Không tìm thấy vé.</p>';
  }
}

/* ---- Quản lý đơn đặt vé ---- */
function renderOrders2(full) {
  const box = $('[data-pane="orders"]');
  if (!box) return;
  const ordStList = window.ORD_ST || {};
  if (full) {
    box.innerHTML = `<div class="pos-bar"><input class="pos-input" id="po-q" placeholder="Mã đơn, phim, tên hoặc số điện thoại khách..." value="${esc(PO.q)}"><select class="pos-input" id="po-st"><option value="all">Mọi trạng thái</option>${Object.entries(ordStList).map(([k, v]) => `<option value="${k}"${PO.st === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></div><div id="po-res"></div>`;
    if ($('#po-q')) $('#po-q').oninput = e => { PO.q = e.target.value; renderOrders2(); };
    if ($('#po-st')) $('#po-st').onchange = e => { PO.st = e.target.value; renderOrders2(); };
  }
  const q = norm(PO.q.trim()), p = perm(), rows = (window.DB?.orders || []).filter(o => (PO.st === 'all' || o.st === PO.st) && (!q || norm([o.id, o.movie, typeof custName === 'function' ? custName(o) : '', window.DB?.customers?.find(c => c.id === o.cust)?.phone, o.guest?.phone].join(' ')).includes(q))).slice(0, 60);

  if ($('#po-res')) {
    $('#po-res').innerHTML = rows.length ? `<table class="pos-table"><thead><tr><th>Mã đơn</th><th>Phim · Suất</th><th>Ghế</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.map(o => `<tr><td><code>${esc(o.id)}</code></td><td>${esc(o.movie)}<small>${esc(o.time)} ·${esc(o.date || '')}</small></td><td>${esc(o.seats)}</td><td>${esc(typeof custName === 'function' ? custName(o) : '')}</td><td>${fmt(Number(o.total) \vert{}\vert{} 0)}</td><td>${typeof chip === 'function' && typeof ordBadge === 'function' ? chip(ordBadge(o)) : ''}</td>
      <td><button class="btn-glass" data-pos="order" data-id="${esc(o.id)}">Chi tiết</button>${o.st === 'wait' && p.confirm ? `<button class="btn-glass" data-pos="confirm" data-id="${esc(o.id)}">Xác nhận</button>` : ''}${o.st !== 'cancel' && !(o.used || []).length && (o.st === 'wait' || p.cancelAny) ? `<button class="btn-glass danger" data-pos="cancel" data-id="${esc(o.id)}">Hủy đơn</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted pos-empty">Không có đơn phù hợp.</p>';
  }
}

const showOrderDlg = o => typeof dlg === 'function' ? dlg(`<h3>Đơn ${esc(o.id)}</h3><dl class="adm-dl">${typeof orderLines === 'function' ? orderLines(o) : ''}</dl><div class="dlg-actions"><button class="btn-back-adm" data-x>Đóng</button></div>`) : null;
const refreshStaff = () => { if (posTab === 'tickets') renderTickets2(); if (posTab === 'orders') renderOrders2(); if (posTab === 'find') renderFind(); if (typeof drawPos === 'function') drawPos(); };

document.addEventListener('DOMContentLoaded', () => {
  if (typeof mkGate === 'function') mkGate('staff', 'Đăng nhập nhân viên', 'Nhập email và mật khẩu nhân viên đã được lưu trong database.', loginStaff);

  const sell = $('.pos3');
  if (sell) {
    sell.dataset.pane = 'sell';
    if ($('.pos-header') && !$('#pos-tabs')) {
      $('.pos-header').insertAdjacentHTML('afterend', `<nav class="pos-tabs" id="pos-tabs"><button data-tab="sell">Bán vé</button><button data-tab="find">Tra cứu phim và suất chiếu</button><button data-tab="tickets">Tra cứu vé</button><button data-tab="orders">Đơn đặt vé</button></nav>`);
    }
    sell.insertAdjacentHTML('afterend', ['find', 'tickets', 'orders'].map(k => `<section class="pos-pane" data-pane="${k}" hidden></section>`).join(''));
  }

  const staffView = $('#view-staff');
  if (staffView) {
    staffView.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]'); if (t) return showTab(t.dataset.tab);
      const b = e.target.closest('[data-pos]'); if (!b) return;
      const a = b.dataset.pos, o = (window.DB?.orders || []).find(x => x.id === b.dataset.id);

      if (a === 'logout') {
        if (typeof API !== 'undefined') API.post('staff/logout').catch(() => {});
        window.CTX.staff = null;
        if (typeof lockView === 'function') lockView('staff');
        if (typeof toast === 'function') toast('Đã đăng xuất');
      }
      else if (a === 'sell') sellShow(b.dataset.id);
      else if (a === 'order' && o) showOrderDlg(o);
      else if (a === 'use' && o) {
        if (typeof API !== 'undefined') {
          API.get('tickets').then(tickets => {
            const tk = (Array.isArray(tickets) ? tickets : []).find(t => String(t.maDon || '') === String(o.id) && String(t.soGhe || '') === String(b.dataset.seat || ''));
            if (tk) API.post(`tickets/${encodeURIComponent(tk.maVe)}/use`).catch(() => {});
          }).catch(() => {});
        }

        if (typeof useTicket === 'function') useTicket(o, b.dataset.seat);
        renderTickets2();
        if (typeof toast === 'function') toast(`Đã soát vé ${o.id}-${b.dataset.seat}`);
      }
      else if (a === 'confirm' && o) {
        o.st = 'ok';
        if (typeof syncSeats === 'function') syncSeats();
        if (o.id && typeof API !== 'undefined') API.xacNhanDon(o.id).catch(() => {});
        refreshStaff();
        if (typeof toast === 'function') toast(`Đã xác nhận đơn ${o.id}`);
      }
      else if (a === 'cancel' && o) {
        if (typeof dlg === 'function') {
          dlg(`<h3>Hủy đơn ${esc(o.id)}?</h3><p class="muted dark">Ghế sẽ được trả lại và đơn chuyển sang trạng thái đã hủy.</p><div class="dlg-actions"><button class="btn-back-adm" data-x>Giữ lại</button><button class="btn-adm-action danger-fill" id="pos-del-ok">Hủy đơn</button></div>`);
          if ($('#pos-del-ok')) {
            $('#pos-del-ok').onclick = async () => {
              if (typeof cancelOrder === 'function') cancelOrder(o);
              if (o.id && typeof API !== 'undefined') await API.huyDon(o.id).catch(() => {});
              if (typeof closeDlg === 'function') closeDlg();
              refreshStaff();
              if (typeof toast === 'function') toast(`Đã hủy đơn ${o.id}`);
            };
          }
        }
      }
    });
  }

  if ($('#pos-phone')) {
    $('#pos-phone').addEventListener('input', e => {
      const c = typeof custByPhone === 'function' ? custByPhone(e.target.value) : null, box = $('#pos-member');
      if (box) {
        if (c) { const t = typeof tierOf === 'function' ? tierOf(c.tier) : { n: 'Thường', pct: 0 }; box.textContent = `${c.n} · ${t.n}${t.pct ? ` · giảm ${t.pct}%` : ''}`; }
        else box.textContent = '';
      }
      if (typeof posTotals === 'function') posTotals();
    });
  }
});

/* Xuất các hàm ra phạm vi window */
window.loginStaff = loginStaff;
window.paintStaff = paintStaff;
window.showTab = showTab;
window.renderFind = renderFind;
window.renderTickets2 = renderTickets2;
window.renderOrders2 = renderOrders2;