'use strict';
/* staff-pro.js — Nhân viên: đăng nhập + phân quyền, tra cứu phim/suất chiếu, tra cứu vé, quản lý đơn đặt vé */

const perm = () => { const r = CTX.staff?.role; return { sell: r !== 'Soát vé', confirm: r !== 'Soát vé', cancelAny: r === 'Quản lý ca', orders: r !== 'Soát vé' }; };
let posTab = 'sell';
const PF = { q: '', date: '', cin: '' }, PT = { q: '', st: 'all' }, PO = { q: '', st: 'all' };

function loginStaff(u, p) {
  const s = DB.staff.find(x => x.user === u);
  if (!s || s.pw !== p) return 'Sai tên đăng nhập hoặc mật khẩu.';
  if (s.st !== 'on') return 'Tài khoản đã ngừng hoạt động.';
  CTX.staff = s; paintStaff(); return '';
}
function paintStaff() {
  const s = CTX.staff, p = perm();
  $('.pos-user').innerHTML = `${esc(s.role)}: ${esc(s.n)} (#${esc(s.id.toUpperCase())}) <button class="btn-glass pos-logout" data-pos="logout">Đăng xuất</button>`;
  $$('#pos-tabs [data-tab]').forEach(b => b.hidden = (b.dataset.tab === 'sell' && !p.sell) || (b.dataset.tab === 'orders' && !p.orders));
  showTab(p.sell ? 'sell' : 'tickets');
}
function showTab(t) {
  posTab = t;
  $$('#pos-tabs [data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  $$('#view-staff [data-pane]').forEach(p => p.hidden = p.dataset.pane !== t);
  if (t === 'find') renderFind(true); if (t === 'tickets') renderTickets2(true); if (t === 'orders') renderOrders2(true);
}

/* ---- Tra cứu phim và suất chiếu ---- */
function renderFind(full) {
  const box = $('[data-pane="find"]');
  if (full) {
    box.innerHTML = `<div class="pos-bar"><input class="pos-input" id="pf-q" placeholder="Tìm tên phim, thể loại, đạo diễn..." value="${esc(PF.q)}"><select class="pos-input" id="pf-date">${DATES.map(d => `<option value="${d.k}"${(PF.date || DATES[0].k) === d.k ? ' selected' : ''}>${d.l}</option>`).join('')}</select>
      <select class="pos-input" id="pf-cin"><option value="">Tất cả rạp</option>${CINEMAS.map(c => `<option value="${c.id}"${PF.cin === c.id ? ' selected' : ''}>${c.n}</option>`).join('')}</select></div><div id="pf-res"></div>`;
    $('#pf-q').oninput = e => { PF.q = e.target.value; renderFind(); }; $('#pf-date').onchange = e => { PF.date = e.target.value; renderFind(); }; $('#pf-cin').onchange = e => { PF.cin = e.target.value; renderFind(); };
  }
  const q = norm(PF.q.trim()), date = PF.date || DATES[0].k, cap = totalSeats(), now = new Date(), nowStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const rows = DB.showtimes.filter(s => { const m = movieById(s.m), r = roomById(s.r); return m && r && s.st === 'on' && s.date === date && (!PF.cin || r.cin === PF.cin) && (!q || norm([m.t, m.g, m.dir, m.cast].join(' ')).includes(q)); });
  $('#pf-res').innerHTML = rows.length ? `<table class="pos-table"><thead><tr><th>Phim</th><th>Giờ chiếu</th><th>Rạp · Phòng</th><th>Ghế trống</th><th></th></tr></thead><tbody>${rows.map(s => {
    const m = movieById(s.m), r = roomById(s.r), c = CINEMAS.find(x => x.id === r.cin), free = Math.max(0, cap - soldFor({ m, date: s.date, cin: c, time: s.time }).size), past = date === DATES[0].k && s.time < nowStr;
    return `<tr><td><strong>${esc(m.t)}</strong><small>${esc(m.d)} · ${esc(m.age)} · ${esc(m.g)} · ${esc(m.fm.join('/'))}</small></td><td>${s.time} – ${endTime(s.time, m)}</td><td>${esc(c.n)} · ${esc(r.n)}</td><td>${free}/${cap}</td><td>${perm().sell ? `<button class="btn-glass" data-pos="sell" data-id="${s.id}" ${past || !free ? 'disabled' : ''}>Bán vé</button>` : ''}</td></tr>`;
  }).join('')}</tbody></table>` : '<p class="muted pos-empty">Không có suất chiếu phù hợp.</p>';
}
function sellShow(id) {
  const s = DB.showtimes.find(x => x.id === id), r = roomById(s.r), P = S.pos;
  P.show = { m: movieById(s.m), date: s.date, cin: CINEMAS.find(c => c.id === r.cin), time: s.time }; P.sel = []; P.paid = false;
  $$('#pos-shows .pos-movie-btn').forEach(b => b.classList.remove('active'));
  showTab('sell'); drawPos(); toast(`Đang bán vé: ${P.show.m.t} · ${s.time}`);
}

/* ---- Tra cứu vé ---- */
function renderTickets2(full) {
  const box = $('[data-pane="tickets"]');
  if (full) {
    box.innerHTML = `<div class="pos-bar"><input class="pos-input" id="pt-q" placeholder="Mã vé, mã đơn, tên hoặc số điện thoại khách..." value="${esc(PT.q)}"><select class="pos-input" id="pt-st"><option value="all">Mọi trạng thái</option>${Object.entries(TK_ST).map(([k, v]) => `<option value="${k}"${PT.st === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></div><div id="pt-res"></div>`;
    $('#pt-q').oninput = e => { PT.q = e.target.value; renderTickets2(); }; $('#pt-st').onchange = e => { PT.st = e.target.value; renderTickets2(); };
  }
  const rows = ticketRows(PT.q, PT.st);
  $('#pt-res').innerHTML = rows.length ? `<table class="pos-table"><thead><tr><th>Mã vé</th><th>Phim</th><th>Suất · Phòng</th><th>Ghế</th><th>Khách</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.slice(0, 60).map(t => `<tr><td><code>${esc(t.code)}</code></td><td>${esc(t.o.movie)}</td><td>${esc(t.o.time)} · ${esc(t.o.date || '')}<small>${esc(t.o.room || '')}</small></td><td>${esc(t.seat)}</td><td>${esc(custName(t.o))}</td><td>${chip(TK_ST[t.status])}</td>
    <td>${t.status === 'valid' ? `<button class="btn-glass" data-pos="use" data-id="${esc(t.o.id)}" data-seat="${esc(t.seat)}">Soát vé</button>` : ''}<button class="btn-glass" data-pos="order" data-id="${esc(t.o.id)}">Chi tiết</button></td></tr>`).join('')}</tbody></table>${rows.length > 60 ? `<p class="muted pos-empty">Hiển thị 60/${rows.length} vé. Hãy nhập thêm từ khóa.</p>` : ''}` : '<p class="muted pos-empty">Không tìm thấy vé.</p>';
}

/* ---- Quản lý đơn đặt vé ---- */
function renderOrders2(full) {
  const box = $('[data-pane="orders"]');
  if (full) {
    box.innerHTML = `<div class="pos-bar"><input class="pos-input" id="po-q" placeholder="Mã đơn, phim, tên hoặc số điện thoại khách..." value="${esc(PO.q)}"><select class="pos-input" id="po-st"><option value="all">Mọi trạng thái</option>${Object.entries(ORD_ST).map(([k, v]) => `<option value="${k}"${PO.st === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></div><div id="po-res"></div>`;
    $('#po-q').oninput = e => { PO.q = e.target.value; renderOrders2(); }; $('#po-st').onchange = e => { PO.st = e.target.value; renderOrders2(); };
  }
  const q = norm(PO.q.trim()), p = perm(), rows = DB.orders.filter(o => (PO.st === 'all' || o.st === PO.st) && (!q || norm([o.id, o.movie, custName(o), DB.customers.find(c => c.id === o.cust)?.phone, o.guest?.phone].join(' ')).includes(q))).slice(0, 60);
  $('#po-res').innerHTML = rows.length ? `<table class="pos-table"><thead><tr><th>Mã đơn</th><th>Phim · Suất</th><th>Ghế</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.map(o => `<tr><td><code>${esc(o.id)}</code></td><td>${esc(o.movie)}<small>${esc(o.time)} · ${esc(o.date || '')}</small></td><td>${esc(o.seats)}</td><td>${esc(custName(o))}</td><td>${fmt(Number(o.total) || 0)}</td><td>${chip(ordBadge(o))}</td>
    <td><button class="btn-glass" data-pos="order" data-id="${esc(o.id)}">Chi tiết</button>${o.st === 'wait' && p.confirm ? `<button class="btn-glass" data-pos="confirm" data-id="${esc(o.id)}">Xác nhận</button>` : ''}${o.st !== 'cancel' && !(o.used || []).length && (o.st === 'wait' || p.cancelAny) ? `<button class="btn-glass danger" data-pos="cancel" data-id="${esc(o.id)}">Hủy đơn</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted pos-empty">Không có đơn phù hợp.</p>';
}
const showOrderDlg = o => dlg(`<h3>Đơn ${esc(o.id)}</h3><dl class="adm-dl">${orderLines(o)}</dl><div class="dlg-actions"><button class="btn-back-adm" data-x>Đóng</button></div>`);
const refreshStaff = () => { if (posTab === 'tickets') renderTickets2(); if (posTab === 'orders') renderOrders2(); if (posTab === 'find') renderFind(); drawPos(); };

document.addEventListener('DOMContentLoaded', () => {
  mkGate('staff', 'Đăng nhập nhân viên', 'Demo: thungan1 / 123456 · quanly / 123456 (quản lý ca) · soatve / 123456 (soát vé)', loginStaff);
  const sell = $('.pos3'); sell.dataset.pane = 'sell';
  $('.pos-header').insertAdjacentHTML('afterend', `<nav class="pos-tabs" id="pos-tabs"><button data-tab="sell">Bán vé</button><button data-tab="find">Tra cứu phim và suất chiếu</button><button data-tab="tickets">Tra cứu vé</button><button data-tab="orders">Đơn đặt vé</button></nav>`);
  sell.insertAdjacentHTML('afterend', ['find', 'tickets', 'orders'].map(k => `<section class="pos-pane" data-pane="${k}" hidden></section>`).join(''));
  $('#view-staff').addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) return showTab(t.dataset.tab);
    const b = e.target.closest('[data-pos]'); if (!b) return;
    const a = b.dataset.pos, o = DB.orders.find(x => x.id === b.dataset.id);
    if (a === 'logout') { CTX.staff = null; lockView('staff'); toast('Đã đăng xuất'); }
    else if (a === 'sell') sellShow(b.dataset.id);
    else if (a === 'order' && o) showOrderDlg(o);
    else if (a === 'use' && o) { useTicket(o, b.dataset.seat); renderTickets2(); toast(`Đã soát vé ${o.id}-${b.dataset.seat}`); }
    else if (a === 'confirm' && o) { o.st = 'ok'; syncSeats(); refreshStaff(); toast(`Đã xác nhận đơn ${o.id}`); }
    else if (a === 'cancel' && o) {
      dlg(`<h3>Hủy đơn ${esc(o.id)}?</h3><p class="muted dark">Ghế sẽ được trả lại và đơn chuyển sang trạng thái đã hủy.</p><div class="dlg-actions"><button class="btn-back-adm" data-x>Giữ lại</button><button class="btn-adm-action danger-fill" id="pos-del-ok">Hủy đơn</button></div>`);
      $('#pos-del-ok').onclick = () => { cancelOrder(o); closeDlg(); refreshStaff(); toast(`Đã hủy đơn ${o.id}`); };
    }
  });
  $('#pos-phone').addEventListener('input', e => {
    const c = custByPhone(e.target.value), box = $('#pos-member');
    if (c) { const t = tierOf(c.tier); box.textContent = `${c.n} · ${t.n}${t.pct ? ` · giảm ${t.pct}%` : ''}`; }
    posTotals();
  });
});
