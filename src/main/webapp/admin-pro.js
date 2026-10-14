'use strict';
/* admin-pro.js — Quản trị: phòng chiếu, ghế và giá, suất chiếu (kiểm tra trùng lịch), loại khách hàng, vé, thống kê doanh thu.
   Đã được kết nối đồng bộ với Backend ApiServlet qua API Client. */

window.MOD = window.MOD || {};
window.DB = window.DB || {};
window.CTX = window.CTX || {};
window.A = window.A || { v: 'dash', q: '', gran: 'day', range: 1 };

const MOD = window.MOD;
const A = window.A;

MOD.movies = MOD.movies || { f: [] };
MOD.cinemas = MOD.cinemas || { f: [] };
MOD.customers = MOD.customers || { f: [] };
MOD.staff = MOD.staff || { f: [] };
MOD.orders = MOD.orders || { f: [] };

const safeMovieById = id => typeof movieById === 'function' ? movieById(id) : (window.MOVIES || []).find(m => m.id === id);
const safeRoomById = id => typeof roomById === 'function' ? roomById(id) : (window.DB?.rooms || []).find(r => r.id === id);
const safeEndTime = (t, m) => typeof endTime === 'function' ? endTime(t, m) : t;
const safeTotalSeats = () => typeof totalSeats === 'function' ? totalSeats() : 60;
const safeEmailOk = e => typeof emailOk === 'function' ? emailOk(e) : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const safeYtId = u => typeof ytId === 'function' ? ytId(u) : /(?:youtu\.be\/|v=|embed\/)([\w-]{11})/.exec(u || '')?.[1];
const safeCustName = o => typeof custName === 'function' ? custName(o) : (o.guest?.n || o.cust || '');

const optMovies = () => (window.MOVIES || []).map(m => [m.id, m.t]);
const optCins = () => (window.CINEMAS || []).map(c => [c.id, c.n]);
const optRooms = () => (window.DB?.rooms || []).map(r => [r.id, typeof roomLabel === 'function' ? roomLabel(r.id) : r.n]);
const optTiers = () => (window.DB?.tiers || []).map(t => [t.id, t.n]);
const STOK = [['on', 'Hoạt động'], ['off', 'Ngừng']];
const idGen = p => () => p + Date.now().toString(36);

/* ---- Khai báo các module CRUD dùng khung có sẵn (MOD/DB) ---- */
Object.assign(MOD, {
  showtimes: {
    title: 'Suất chiếu', cols: ['m', 'r', 'date', 'time', 'end', 'st'],
    get f() { return [{ k: 'm', l: 'Phim', sel: optMovies() }, { k: 'r', l: 'Phòng chiếu', sel: optRooms() }, { k: 'date', l: 'Ngày chiếu', sel: (window.DATES || []).map(d => [d.k, d.l]) }, { k: 'time', l: 'Giờ bắt đầu (HH:MM)', req: 1 }, { k: 'end', l: 'Kết thúc', ro: 1 }, { k: 'st', l: 'Trạng thái', sel: [['on', 'Mở bán'], ['off', 'Đã hủy']] }]; },
    def: () => ({ id: 'sc' + Date.now().toString(36), m: window.MOVIES?.[0]?.id || '', r: window.DB?.rooms?.[0]?.id || '', date: window.DATES?.[0]?.k || '', time: '19:30', st: 'on' }),
    check(d, it) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) return 'Giờ bắt đầu phải có dạng HH:MM, ví dụ 09:30.';
      const m = safeMovieById(d.m), r = safeRoomById(d.r); if (!m || !r) return 'Hãy chọn phim và phòng chiếu.';
      if (d.st !== 'on') return '';
      if (r.st !== 'on') return `${r.n} đang bảo trì, không thể xếp suất.`;
      if (m.fm && !m.fm.includes(r.type)) return `Phim ${m.t} chỉ chiếu định dạng ${m.fm.join(', ')}, không phù hợp phòng ${r.type}.`;
      const c = typeof findClash === 'function' ? findClash({ m: d.m, r: d.r, date: d.date, time: d.time }, it) : null;
      return c ? `Trùng lịch phòng: ${safeMovieById(c.m)?.t || 'Phim khác'} đang chiếu ${c.time} – ${safeEndTime(c.time, safeMovieById(c.m))} (đã gồm 15 phút dọn phòng).` : '';
    }
  },
  rooms: {
    title: 'Phòng chiếu', cols: ['n', 'cin', 'type', 'cap', 'st'],
    get f() { return [{ k: 'n', l: 'Tên phòng', req: 1 }, { k: 'cin', l: 'Rạp', sel: optCins() }, { k: 'type', l: 'Loại phòng', sel: ['2D', '3D', 'IMAX', '4DX'].map(x => [x, x]) }, { k: 'cap', l: 'Số ghế (theo sơ đồ ghế)', ro: 1 }, { k: 'st', l: 'Trạng thái', sel: [['on', 'Hoạt động'], ['off', 'Bảo trì']] }]; },
    def: () => ({ id: 'rm' + Date.now().toString(36), cin: window.CINEMAS?.[0]?.id || '', type: '2D', st: 'on' })
  },
  seatrows: {
    title: 'Sơ đồ ghế', cols: ['id', 't', 'cnt'],
    get f() { return [{ k: 'id', l: 'Hàng ghế (A-Z)', req: 1, upper: 1 }, { k: 't', l: 'Loại ghế', sel: (window.DB?.seatTypes || []).map(t => [t.id, t.n]) }, { k: 'cnt', l: 'Số ghế trong hàng', num: 1 }]; },
    def: () => ({ id: '', t: 'standard', cnt: 10 }),
    check(d, it) {
      const id = d.id.toUpperCase(), n = Number(d.cnt);
      if (!/^[A-Z]$/.test(id)) return 'Hàng ghế là một chữ cái từ A đến Z.';
      if ((window.DB?.seatRows || []).some(x => x.id === id && x !== it)) return `Hàng ${id} đã tồn tại.`;
      return n >= 1 && n <= 20 ? '' : 'Số ghế mỗi hàng từ 1 đến 20.';
    }
  },
  seattypes: {
    title: 'Loại ghế và giá', cols: ['n', 'p'],
    f: [{ k: 'n', l: 'Tên loại ghế', req: 1 }, { k: 'p', l: 'Giá vé (đồng)', num: 1, money: 1 }],
    def: () => ({}), check: (d, it) => it ? (Number(d.p) > 0 ? '' : 'Giá phải lớn hơn 0.') : 'Chỉ chỉnh sửa giá của 3 loại ghế có sẵn.'
  },
  tiers: {
    title: 'Loại khách hàng', cols: ['n', 'pct', 'desc'],
    f: [{ k: 'n', l: 'Tên loại', req: 1 }, { k: 'pct', l: 'Mức ưu đãi (% mỗi đơn)', num: 1 }, { k: 'desc', l: 'Mô tả' }],
    def: () => ({ id: 't' + Date.now().toString(36), pct: 0 }), check: d => Number(d.pct) > 50 ? 'Mức ưu đãi tối đa 50%.' : ''
  }
});

if (MOD.movies) {
  Object.assign(MOD.movies, { title: 'Phim', check: d => !/^photo-[\w-]+$/.test(d.p || '') ? 'Poster cần mã ảnh Unsplash dạng photo-...' : d.trailer && !safeYtId(d.trailer) ? 'Link trailer phải là link YouTube hợp lệ.' : '' });
  MOD.movies.f = MOD.movies.f || [];
  MOD.movies.f.push({ k: 'age', l: 'Độ tuổi', sel: ['P', 'T13', 'T16', 'T18'].map(x => [x, x]) }, { k: 'desc', l: 'Mô tả' }, { k: 'p', l: 'Poster (mã ảnh Unsplash, dạng photo-...)' }, { k: 'trailer', l: 'Link trailer YouTube' });
}

if (MOD.cinemas) {
  MOD.cinemas.title = 'Rạp';
  if (MOD.cinemas.f && MOD.cinemas.f.find(f => f.k === 'rooms')) MOD.cinemas.f.find(f => f.k === 'rooms').ro = 1;
  if (MOD.cinemas.f && MOD.cinemas.f.find(f => f.k === 'room')) MOD.cinemas.f.find(f => f.k === 'room').l = 'Tên phòng chính (hiển thị)';
}

if (MOD.customers && MOD.customers.f) {
  Object.defineProperty(MOD.customers.f.find(f => f.k === 'tier') || {}, 'sel', { get: optTiers });
  MOD.customers.f.splice(2, 0, { k: 'email', l: 'Email' }); MOD.customers.cols = ['n', 'email', 'phone', 'tier', 'st'];
  MOD.customers.check = (d, it) => {
    if (d.email && !safeEmailOk(d.email)) return 'Email không hợp lệ.';
    return (window.DB?.customers || []).some(c => c !== it && ((d.email && (c.email || '').toLowerCase() === d.email.toLowerCase()) || (d.phone && c.phone === d.phone))) ? 'Email hoặc số điện thoại đã tồn tại.' : '';
  };
  MOD.customers.def = () => ({ id: 'c' + Date.now(), tier: 'regular', st: 'on', pw: '123456', email: '' });
}

if (MOD.staff && MOD.staff.f) {
  MOD.staff.f.splice(1, 0, { k: 'user', l: 'Tên đăng nhập', req: 1 }); MOD.staff.cols = ['n', 'user', 'role', 'cin', 'shift', 'st'];
  MOD.staff.check = (d, it) => (window.DB?.staff || []).some(s => s !== it && s.user === d.user) ? 'Tên đăng nhập đã tồn tại.' : '';
  MOD.staff.def = () => ({ id: 's' + Date.now(), role: 'Thu ngân', shift: 'Sáng', st: 'on', pw: '123456' });
}

if (MOD.orders && MOD.orders.f) {
  MOD.orders.f.splice(4, 0, { k: 'date', l: 'Ngày chiếu' }); MOD.orders.f.push({ k: 'method', l: 'Thanh toán' });
  MOD.orders.cols = ['code', 'movie', 'cin', 'date', 'time', 'seats', 'total', 'method', 'st'];
}

window.DB.seatRows = window.DB.seatRows || [];
window.DB.seatTypes = window.DB.seatTypes || [];
window.DB.seatrows = window.DB.seatRows;
window.DB.seattypes = window.DB.seatTypes;

/* ---- Hiển thị ô tính toán, kiểm tra hợp lệ, đồng bộ sau khi lưu ---- */
if (typeof cell !== 'undefined' || typeof window.cell !== 'undefined') {
  const _cell = window.cell || cell;
  window.cell = function (mod, it, f) {
    if (f.k === 'end') return safeEndTime(it.time, safeMovieById(it.m));
    if (f.k === 'cap') return safeTotalSeats();
    if (mod === 'tiers' && f.k === 'pct') return it.pct + '%';
    if (mod === 'orders' && f.k === 'total') return typeof fmt === 'function' ? fmt(Number(it.total) || 0) : (it.total + 'đ');
    return _cell(mod, it, f);
  };
}

if (typeof saveForm !== 'undefined' || typeof window.saveForm !== 'undefined') {
  const _saveForm = window.saveForm || saveForm;
  window.saveForm = function (it) {
    const M = MOD[A.v];
    if (M && M.check) {
      const formEl = document.querySelector('#adm-form');
      if (formEl) {
        const err = M.check(Object.fromEntries(new FormData(formEl)), it);
        const errBox = document.querySelector('#form-err');
        if (err) { if (errBox) errBox.textContent = err; return; }
      }
    }
    _saveForm(it);
  };
}

if (typeof confirmDel !== 'undefined' || typeof window.confirmDel !== 'undefined') {
  const _confirmDel = window.confirmDel || confirmDel;
  window.confirmDel = function (it) {
    const dbCust = window.DB?.customers || [];
    const dbSeatRows = window.DB?.seatRows || [];
    const dbTiers = window.DB?.tiers || [];
    const v = A.v;
    const why = v === 'tiers' && dbCust.some(c => c.tier === it.id) ? 'Đang có khách hàng thuộc loại này. Hãy chuyển họ sang loại khác trước.'
      : v === 'seattypes' ? 'Không thể xóa loại ghế có sẵn.' : v === 'seatrows' && dbSeatRows.length <= 1 ? 'Phải còn ít nhất một hàng ghế.'
      : v === 'tiers' && dbTiers.length <= 1 ? 'Phải còn ít nhất một loại khách hàng.' : '';
    if (why && typeof dlg === 'function') return dlg(`<h3>Không thể xóa</h3><p class="muted dark">${why}</p><div class="dlg-actions"><button class="btn-back-adm" data-x>Đã hiểu</button></div>`);
    _confirmDel(it);
  };
}

if (typeof afterSave !== 'undefined' || typeof window.afterSave !== 'undefined') {
  const _afterSave = window.afterSave || afterSave;
  window.afterSave = function (mod) {
    _afterSave(mod);
    if (window.DB) {
      const cins = window.CINEMAS || [];
      const dbTiers = window.DB.tiers || [];
      window.DB.rooms = (window.DB.rooms || []).filter(r => cins.some(c => c.id === r.cin));
      window.DB.showtimes = (window.DB.showtimes || []).filter(s => safeMovieById(s.m) && safeRoomById(s.r));
      (window.DB.customers || []).forEach(c => { if (dbTiers.length && !dbTiers.some(t => t.id === c.tier)) c.tier = dbTiers[0].id; });
      cins.forEach(c => c.rooms = (window.DB.rooms || []).filter(r => r.cin === c.id).length);
    }
    if (typeof syncLayout === 'function') syncLayout();
    if (typeof sortShows === 'function') sortShows();
    if (typeof syncSeats === 'function') syncSeats();
    if (typeof fillExtraFilters === 'function') fillExtraFilters();
    if (typeof renderShowtimes === 'function') renderShowtimes();
    if (typeof heroList !== 'undefined' && typeof heroIdx !== 'undefined' && heroList[heroIdx]) {
      if (typeof renderHeroNext === 'function') renderHeroNext(heroList[heroIdx]);
    }
    if (typeof drawPos === 'function') drawPos();
    if (typeof renderAcct === 'function') renderAcct();
  };
}

/* ---- Vé ---- */
let tkStat = 'all';

function paintTickets() {
  const rows = typeof ticketRows === 'function' ? ticketRows(A.q, tkStat) : [];
  const countEl = document.querySelector('#tk-count');
  const container = document.querySelector('#tk-rows');
  const escFn = typeof esc === 'function' ? esc : (s => s || '');
  const badgeFn = typeof badge === 'function' ? badge : (() => '');
  const tkStList = window.TK_ST || {};

  if (countEl) countEl.textContent = `${rows.length} vé`;
  if (container) {
    container.innerHTML = rows.length ? rows.slice(0, 150).map(t => `<tr><td><code>${escFn(t.code)}</code></td><td><strong>${escFn(t.o.movie)}</strong></td><td>${escFn(t.o.time)} · ${escFn(t.o.date || '')}</td><td>${escFn(t.o.cin)} · ${escFn(t.o.room || '')}</td><td>${escFn(t.seat)}</td><td>${escFn(safeCustName(t.o))}</td><td>${badgeFn(...(tkStList[t.status] || ['Chờ', 'pending']))}</td>
      <td class="row-acts">${t.status === 'valid' ? `<button data-tk="use" data-id="${escFn(t.o.id)}" data-seat="${escFn(t.seat)}">Đánh dấu đã dùng</button>` : t.status === 'used' ? `<button data-tk="undo" data-id="${escFn(t.o.id)}" data-seat="${escFn(t.seat)}">Hoàn tác</button>` : ''}</td></tr>`).join('')
      : '<tr><td colspan="8" class="adm-empty">Không tìm thấy vé.</td></tr>';
  }
}

function renderTickets() {
  const titleEl = document.querySelector('#adm-title');
  const toolsEl = document.querySelector('#adm-tools');
  const contentEl = document.querySelector('#adm-content');
  const escFn = typeof esc === 'function' ? esc : (s => s || '');
  const tkStList = window.TK_ST || {};

  if (titleEl) titleEl.textContent = 'Vé';
  if (toolsEl) toolsEl.innerHTML = '';
  if (contentEl) {
    contentEl.innerHTML = `<div class="adm-table-card"><div class="adm-bar"><input type="search" id="tk-q" placeholder="Mã vé, phim, tên hoặc SĐT khách..." value="${escFn(A.q)}" aria-label="Tìm vé"><select id="tk-st" aria-label="Lọc trạng thái"><option value="all">Mọi trạng thái</option>${Object.entries(tkStList).map(([k, v]) => `<option value="${k}"${tkStat === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select><span class="adm-count" id="tk-count"></span></div>
      <div class="adm-scroll"><table class="adm-table"><thead><tr><th>Mã vé</th><th>Phim</th><th>Suất</th><th>Rạp · Phòng</th><th>Ghế</th><th>Khách</th><th>Trạng thái</th><th></th></tr></thead><tbody id="tk-rows"></tbody></table></div></div>`;
  }
  const qEl = document.querySelector('#tk-q');
  const stEl = document.querySelector('#tk-st');
  if (qEl) qEl.oninput = e => { A.q = e.target.value; paintTickets(); };
  if (stEl) stEl.onchange = e => { tkStat = e.target.value; paintTickets(); };
  paintTickets();
}

/* ---- Thống kê doanh thu (kết nối trực tiếp API Backend) ---- */
const sumBy = (a, f) => a.reduce((x, o) => x + (Number(f(o)) || 0), 0);
const nTk = o => typeof seatList === 'function' ? seatList(o).length : (Array.isArray(o.seats) ? o.seats.length : String(o.seats || '').split(',').filter(Boolean).length);

function group(list, keyFn) {
  const m = new Map(); list.forEach(o => { const k = keyFn(o), g = m.get(k) || { k, rev: 0, tk: 0, n: 0 }; g.rev += Number(o.total || o.tongTien) || 0; g.tk += nTk(o); g.n++; m.set(k, g); });
  return [...m.values()].sort((a, b) => b.rev - a.rev);
}

async function renderStats() {
  const box = document.querySelector('#adm-content');
  if (!box) return;
  box.classList.remove('enter'); void box.offsetWidth; box.classList.add('enter');
  A.gran = A.gran || 'day';

  const titleEl = document.querySelector('#adm-title');
  const toolsEl = document.querySelector('#adm-tools');
  const escFn = typeof esc === 'function' ? esc : (s => s || '');
  const fmtFn = typeof fmt === 'function' ? fmt : (val => val + 'đ');
  const tableFn = typeof table === 'function' ? table : ((hd, gs) => '');

  if (titleEl) titleEl.textContent = 'Thống kê doanh thu';
  if (toolsEl) {
    toolsEl.innerHTML = [[1, 'Hôm nay'], [7, '7 ngày'], [30, '30 ngày'], [90, '90 ngày']].map(([r, l]) => `<button class="pill adm-pill${A.range === r ? ' active' : ''}" data-r="${r}">${l}</button>`).join('')
      + `<select id="adm-gran" aria-label="Nhóm theo"><option value="day">Theo ngày</option><option value="month">Theo tháng</option><option value="year">Theo năm</option></select>`;
  }

  const granEl = document.querySelector('#adm-gran');
  if (granEl) {
    granEl.value = A.gran;
    granEl.onchange = e => { A.gran = e.target.value; renderStats(); };
  }

  let apiOrders = [];
  try {
    if (typeof API !== 'undefined') apiOrders = await API.layDanhSachDon();
  } catch (_) {
    apiOrders = window.DB?.orders || [];
  }

  const t0 = new Date(); t0.setHours(0, 0, 0, 0); const from = +t0 - ((A.range || 1) - 1) * 864e5;
  const dbOrders = window.DB?.orders || [];
  const L = (Array.isArray(apiOrders) && apiOrders.length ? apiOrders : dbOrders).filter(o => (o.st === 'ok' || String(o.trangThai || '').toLowerCase().includes('thanh')) && (o.at >= from || !o.at));

  const rev = sumBy(L, o => o.total || o.tongTien), tk = sumBy(L, nTk), seatAmt = sumBy(L, o => o.seatAmt || o.tongTien), comboAmt = sumBy(L, o => o.comboAmt || 0), disc = sumBy(L, o => o.disc || o.tienGiam);
  const kf = o => {
    const d = new Date(o.at || Date.now());
    if (A.gran === 'year') return String(d.getFullYear());
    if (A.gran === 'month') return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return typeof dayKey === 'function' ? dayKey(d) : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const bk = new Map(); L.slice().sort((a, b) => (a.at || 0) - (b.at || 0)).forEach(o => bk.set(kf(o), (bk.get(kf(o)) || 0) + (Number(o.total || o.tongTien) || 0)));

  const ent = [...bk], max = Math.max(1, ...ent.map(e => e[1])), bw = 44, w = Math.max(560, ent.length * bw), h = 210;
  const bars = ent.map(([k, v], i) => { const bh = v / max * (h - 44); return `<g><rect x="${i * bw + 6}" y="${h - bh - 22}" width="${bw - 12}" height="${bh}" rx="5"><title>${k}: ${fmtFn(v)}</title></rect><text x="${i * bw + bw / 2}" y="${h - 6}" text-anchor="middle">${k}</text></g>`; }).join('');

  const byMovie = group(L, o => o.movie || o.tenPhim || 'Khác'), byCin = group(L, o => `${o.cin || o.tenRap || 'Rạp'} · ${o.room || o.tenPhong || ''}`), byPay = group(L, o => o.method || o.phuongThuc || 'Khác'), tot = Math.max(1, rev);
  const bar = g => `<div class="bar-row"><span>${escFn(g.k)}</span><div class="bar-track"><i style="width:${Math.round(g.rev / tot * 100)}%"></i></div><b>${Math.round(g.rev / tot * 100)}%</b></div>`;
  const tbl = (hd, gs) => gs.length ? tableFn(hd, gs.map(g => [`<strong>${escFn(g.k)}</strong>`, g.n, g.tk, fmtFn(g.rev)])) : '<p class="adm-empty">Chưa có dữ liệu.</p>';

  box.innerHTML = `<section class="adm-kpi-grid">
    <div class="kpi-card"><span class="kpi-title">DOANH THU THỰC THU</span><div class="kpi-value">${fmtFn(rev)}</div><span class="kpi-change">${L.length} đơn thành công</span></div>
    <div class="kpi-card"><span class="kpi-title">VÉ ĐÃ BÁN</span><div class="kpi-value">${tk.toLocaleString('vi-VN')}</div><span class="kpi-change">${L.length ? (tk / L.length).toFixed(1) : 0} vé / đơn</span></div>
    <div class="kpi-card"><span class="kpi-title">DOANH THU TỪ VÉ</span><div class="kpi-value">${fmtFn(seatAmt)}</div><span class="kpi-change">${Math.round(seatAmt / Math.max(1, seatAmt + comboAmt) * 100)}% tổng bán</span></div>
    <div class="kpi-card"><span class="kpi-title">DOANH THU TỪ COMBO</span><div class="kpi-value">${fmtFn(comboAmt)}</div><span class="kpi-change">Đã giảm giá: ${fmtFn(disc)}</span></div></section>
    <div class="adm-table-card"><h3>Doanh thu theo ${{ day: 'ngày', month: 'tháng', year: 'năm' }[A.gran]}</h3><div class="adm-scroll">${ent.length ? `<svg class="adm-chart" viewBox="0 0 ${w} ${h}" style="min-width:${w}px" role="img" aria-label="Biểu đồ doanh thu">${bars}</svg>` : '<p class="adm-empty">Chưa có đơn trong khoảng này.</p>'}</div></div>
    <section class="adm-two"><div class="adm-table-card"><h3>Tỉ trọng theo phim</h3>${byMovie.slice(0, 6).map(bar).join('') || '<p class="adm-empty">Chưa có dữ liệu.</p>'}</div><div class="adm-table-card"><h3>Vé và combo</h3>${tableFn(['Khoản mục', 'Số tiền'], [['Tiền vé', fmtFn(seatAmt)], ['Tiền combo', fmtFn(comboAmt)], ['Giảm giá', '-' + fmtFn(disc)], ['<strong>Thực thu</strong>', `<strong>${fmtFn(rev)}</strong>`]])}</div></section>
    <div class="adm-table-card"><h3>Theo phim</h3><div class="adm-scroll">${tbl(['Phim', 'Đơn', 'Vé bán', 'Doanh thu'], byMovie)}</div></div>
    <section class="adm-two"><div class="adm-table-card"><h3>Theo rạp và phòng</h3><div class="adm-scroll">${tbl(['Rạp · Phòng', 'Đơn', 'Vé bán', 'Doanh thu'], byCin)}</div></div><div class="adm-table-card"><h3>Theo phương thức thanh toán</h3><div class="adm-scroll">${tbl(['Phương thức', 'Đơn', 'Vé bán', 'Doanh thu'], byPay)}</div></div></section>`;
}

if (typeof renderAdmin !== 'undefined' || typeof window.renderAdmin !== 'undefined') {
  const _renderAdmin = window.renderAdmin || renderAdmin;
  window.renderAdmin = function () {
    if (A.v === 'stats' || A.v === 'tickets') {
      const b = document.querySelector('#adm-content');
      if (b) { b.classList.remove('enter'); void b.offsetWidth; b.classList.add('enter'); }
      return A.v === 'stats' ? renderStats() : renderTickets();
    }
    _renderAdmin();
  };
}

/* Đăng nhập Admin qua API Backend */
async function loginAdmin(u, p) {
  try {
    const data = typeof API !== 'undefined' ? await API.dangNhapNhanVien(u, p) : {};
    const x = data.staff || data;
    if (!x || !(x.maNV || x.id)) return 'Máy chủ không trả về thông tin nhân viên quản trị.';

    const role = String(x.chucVu || x.role || '').toLowerCase();
    if (!role.includes('admin') && !role.includes('quanly') && !role.includes('quản lý')) {
      if (typeof API !== 'undefined') await API.post('staff/logout').catch(() => {});
      return 'Tài khoản không có quyền truy cập khu vực quản trị.';
    }
    window.CTX.admin = true;
    window.CTX.adminStaff = x;
    return '';
  } catch (err) {
    return err.message || 'Không thể đăng nhập tài khoản quản trị.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof mkGate === 'function') {
    mkGate('admin', 'Đăng nhập quản trị', 'Nhập email và mật khẩu tài khoản nhân viên có quyền quản trị trong database.', loginAdmin);
  }

  const adminMenu = [['dash', 'Tổng quan'], ['stats', 'Thống kê doanh thu'], ['movies', 'Phim'], ['showtimes', 'Suất chiếu'], ['cinemas', 'Rạp'], ['rooms', 'Phòng chiếu'], ['seatrows', 'Sơ đồ ghế'], ['seattypes', 'Giá ghế'], ['combos', 'Combo bắp nước'], ['promos', 'Khuyến mãi'], ['tiers', 'Loại khách hàng'], ['customers', 'Khách hàng'], ['orders', 'Đơn đặt vé'], ['tickets', 'Vé']];
  if (window.CTX?.adminStaff?.chucVu === 'Admin' || window.CTX?.admin) adminMenu.push(['staff', 'Nhân sự']);

  const menuEl = document.querySelector('#adm-menu');
  if (menuEl) {
    menuEl.innerHTML = adminMenu.map(([k, l], i) => `<a href="#" class="adm-item${i ? '' : ' active'}" data-v="${k}">${l}</a>`).join('');
  }

  const sidebar = document.querySelector('.adm-sidebar');
  if (sidebar && !document.querySelector('#adm-logout')) {
    sidebar.insertAdjacentHTML('beforeend', '<button class="adm-logout" id="adm-logout">Đăng xuất</button>');
    const logoutBtn = document.querySelector('#adm-logout');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (typeof API !== 'undefined') API.post('staff/logout').catch(() => {});
        window.CTX.admin = false;
        window.CTX.adminStaff = null;
        if (typeof lockView === 'function') lockView('admin');
        if (typeof toast === 'function') toast('Đã đăng xuất');
      };
    }
  }

  const adminView = document.querySelector('#view-admin');
  if (adminView) {
    adminView.addEventListener('click', async e => {
      const b = e.target.closest('[data-tk]'); if (!b) return;
      const orderId = b.dataset.id;
      const action = b.dataset.tk;

      if (typeof API === 'undefined') return;
      const orderTickets = await API.get('tickets').catch(err => {
        if (typeof toast === 'function') toast(err.message || 'Không tải được danh sách vé');
        return [];
      });
      const ticket = (Array.isArray(orderTickets) ? orderTickets : []).find(t =>
        String(t.maDon || '') === String(orderId) &&
        String(t.soGhe || '') === String(b.dataset.seat || '')
      );

      if (!ticket) {
        if (typeof toast === 'function') toast('Không tìm thấy mã vé tương ứng. Hãy tải lại danh sách vé.');
        return;
      }
      try {
        await API.post(`tickets/${encodeURIComponent(ticket.maVe)}/${action === 'use' ? 'use' : 'validate'}`);
        if (typeof toast === 'function') toast(action === 'use' ? 'Đã đánh dấu vé đã sử dụng' : 'Đã kiểm tra vé');
        renderTickets();
      } catch (err) {
        if (typeof toast === 'function') toast(err.message || 'Không thể cập nhật trạng thái vé');
      }
    });
  }

  if (typeof syncLayout === 'function') syncLayout();
});

/* Khuyến mãi: đồng bộ với entity KhuyenMai */
MOD.promos = {
  title: 'Khuyến mãi',
  cols: ['code', 'desc', 'value', 'start', 'end', 'st'],
  f: [
    { k: 'code', l: 'Mã khuyến mãi', req: 1, upper: 1 },
    { k: 'desc', l: 'Tên / mô tả khuyến mãi', req: 1 },
    { k: 'value', l: 'Phần trăm giảm (%)', num: 1, req: 1 },
    { k: 'start', l: 'Ngày bắt đầu', date: 1, req: 1 },
    { k: 'end', l: 'Ngày kết thúc', date: 1, req: 1 },
    { k: 'st', l: 'Trạng thái', sel: [['on', 'Đang hoạt động'], ['off', 'Ngừng hoạt động']] }
  ],
  def: () => {
    const today = new Date().toISOString().slice(0, 10);
    const later = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return { id: 'KM' + Date.now().toString(36).toUpperCase(), code: 'KM' + Date.now().toString(36).toUpperCase(), desc: '', value: 10, start: today, end: later, st: 'on' };
  },
  check: d => {
    if (!d.code || !/^[A-Z0-9_-]{2,20}$/.test(d.code)) return 'Mã khuyến mãi gồm 2–20 ký tự chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.';
    if (Number(d.value) <= 0 || Number(d.value) > 100) return 'Phần trăm giảm phải lớn hơn 0 và không quá 100%.';
    if (!d.start || !d.end) return 'Vui lòng chọn ngày bắt đầu và kết thúc.';
    if (d.end < d.start) return 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
    return '';
  }
};

/* Xuất các hàm ra phạm vi window */
window.loginAdmin = loginAdmin;
window.paintTickets = paintTickets;
window.renderTickets = renderTickets;
window.renderStats = renderStats;