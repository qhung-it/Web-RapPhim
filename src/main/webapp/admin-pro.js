'use strict';
/* admin-pro.js — Quản trị: phòng chiếu, ghế và giá, suất chiếu (kiểm tra trùng lịch), loại khách hàng, vé, thống kê doanh thu */

const optMovies = () => MOVIES.map(m => [m.id, m.t]);
const optCins = () => CINEMAS.map(c => [c.id, c.n]);
const optRooms = () => DB.rooms.map(r => [r.id, roomLabel(r.id)]);
const optTiers = () => DB.tiers.map(t => [t.id, t.n]);
const STOK = [['on', 'Hoạt động'], ['off', 'Ngừng']];
const idGen = p => () => p + Date.now().toString(36);

/* ---- Khai báo các module CRUD dùng khung có sẵn (MOD/DB) ---- */
Object.assign(MOD, {
  showtimes: {
    title: 'Suất chiếu', cols: ['m', 'r', 'date', 'time', 'end', 'st'],
    get f() { return [{ k: 'm', l: 'Phim', sel: optMovies() }, { k: 'r', l: 'Phòng chiếu', sel: optRooms() }, { k: 'date', l: 'Ngày chiếu', sel: DATES.map(d => [d.k, d.l]) }, { k: 'time', l: 'Giờ bắt đầu (HH:MM)', req: 1 }, { k: 'end', l: 'Kết thúc', ro: 1 }, { k: 'st', l: 'Trạng thái', sel: [['on', 'Mở bán'], ['off', 'Đã hủy']] }]; },
    def: () => ({ id: 'sc' + Date.now().toString(36), m: MOVIES[0].id, r: DB.rooms[0]?.id, date: DATES[0].k, time: '19:30', st: 'on' }),
    check(d, it) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) return 'Giờ bắt đầu phải có dạng HH:MM, ví dụ 09:30.';
      const m = movieById(d.m), r = roomById(d.r); if (!m || !r) return 'Hãy chọn phim và phòng chiếu.';
      if (d.st !== 'on') return '';
      if (r.st !== 'on') return `${r.n} đang bảo trì, không thể xếp suất.`;
      if (!m.fm.includes(r.type)) return `Phim ${m.t} chỉ chiếu định dạng ${m.fm.join(', ')}, không phù hợp phòng ${r.type}.`;
      const c = findClash({ m: d.m, r: d.r, date: d.date, time: d.time }, it);
      return c ? `Trùng lịch phòng: ${movieById(c.m).t} đang chiếu ${c.time} – ${endTime(c.time, movieById(c.m))} (đã gồm 15 phút dọn phòng).` : '';
    }
  },
  rooms: {
    title: 'Phòng chiếu', cols: ['n', 'cin', 'type', 'cap', 'st'],
    get f() { return [{ k: 'n', l: 'Tên phòng', req: 1 }, { k: 'cin', l: 'Rạp', sel: optCins() }, { k: 'type', l: 'Loại phòng', sel: ['2D', '3D', 'IMAX', '4DX'].map(x => [x, x]) }, { k: 'cap', l: 'Số ghế (theo sơ đồ ghế)', ro: 1 }, { k: 'st', l: 'Trạng thái', sel: [['on', 'Hoạt động'], ['off', 'Bảo trì']] }]; },
    def: () => ({ id: 'rm' + Date.now().toString(36), cin: CINEMAS[0].id, type: '2D', st: 'on' })
  },
  seatrows: {
    title: 'Sơ đồ ghế', cols: ['id', 't', 'cnt'],
    get f() { return [{ k: 'id', l: 'Hàng ghế (A-Z)', req: 1, upper: 1 }, { k: 't', l: 'Loại ghế', sel: DB.seatTypes.map(t => [t.id, t.n]) }, { k: 'cnt', l: 'Số ghế trong hàng', num: 1 }]; },
    def: () => ({ id: '', t: 'standard', cnt: 10 }),
    check(d, it) {
      const id = d.id.toUpperCase(), n = Number(d.cnt);
      if (!/^[A-Z]$/.test(id)) return 'Hàng ghế là một chữ cái từ A đến Z.';
      if (DB.seatRows.some(x => x.id === id && x !== it)) return `Hàng ${id} đã tồn tại.`;
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
Object.assign(MOD.movies, { title: 'Phim', check: d => !/^photo-[\w-]+$/.test(d.p || '') ? 'Poster cần mã ảnh Unsplash dạng photo-...' : d.trailer && !ytId(d.trailer) ? 'Link trailer phải là link YouTube hợp lệ.' : '' });
MOD.movies.f.push({ k: 'age', l: 'Độ tuổi', sel: ['P', 'T13', 'T16', 'T18'].map(x => [x, x]) }, { k: 'desc', l: 'Mô tả' }, { k: 'p', l: 'Poster (mã ảnh Unsplash, dạng photo-...)' }, { k: 'trailer', l: 'Link trailer YouTube' });
MOD.cinemas.title = 'Rạp'; MOD.cinemas.f.find(f => f.k === 'rooms').ro = 1;
MOD.cinemas.f.find(f => f.k === 'room').l = 'Tên phòng chính (hiển thị)';
Object.defineProperty(MOD.customers.f.find(f => f.k === 'tier'), 'sel', { get: optTiers });
MOD.customers.f.splice(2, 0, { k: 'email', l: 'Email' }); MOD.customers.cols = ['n', 'email', 'phone', 'tier', 'st'];
MOD.customers.check = (d, it) => {
  if (d.email && !emailOk(d.email)) return 'Email không hợp lệ.';
  return DB.customers.some(c => c !== it && ((d.email && (c.email || '').toLowerCase() === d.email.toLowerCase()) || (d.phone && c.phone === d.phone))) ? 'Email hoặc số điện thoại đã tồn tại.' : '';
};
MOD.customers.def = () => ({ id: 'c' + Date.now(), tier: 'regular', st: 'on', pw: '123456', email: '' });
MOD.staff.f.splice(1, 0, { k: 'user', l: 'Tên đăng nhập', req: 1 }); MOD.staff.cols = ['n', 'user', 'role', 'cin', 'shift', 'st'];
MOD.staff.check = (d, it) => DB.staff.some(s => s !== it && s.user === d.user) ? 'Tên đăng nhập đã tồn tại.' : '';
MOD.staff.def = () => ({ id: 's' + Date.now(), role: 'Thu ngân', shift: 'Sáng', st: 'on', pw: '123456' });
MOD.orders.f.splice(4, 0, { k: 'date', l: 'Ngày chiếu' }); MOD.orders.f.push({ k: 'method', l: 'Thanh toán' });
MOD.orders.cols = ['code', 'movie', 'cin', 'date', 'time', 'seats', 'total', 'method', 'st'];
DB.seatrows = DB.seatRows; DB.seattypes = DB.seatTypes;   // cùng mảng, để khung CRUD gọi theo tên module

/* ---- Hiển thị ô tính toán, kiểm tra hợp lệ, đồng bộ sau khi lưu ---- */
const _cell = cell;
cell = function (mod, it, f) {
  if (f.k === 'end') return endTime(it.time, movieById(it.m));
  if (f.k === 'cap') return totalSeats();
  if (mod === 'tiers' && f.k === 'pct') return it.pct + '%';
  if (mod === 'orders' && f.k === 'total') return fmt(Number(it.total) || 0);
  return _cell(mod, it, f);
};
const _saveForm = saveForm;
saveForm = function (it) {
  const M = MOD[A.v];
  if (M.check) { const err = M.check(Object.fromEntries(new FormData($('#adm-form'))), it); if (err) return $('#form-err').textContent = err; }
  _saveForm(it);
};
const _confirmDel = confirmDel;
confirmDel = function (it) {
  const v = A.v, why = v === 'tiers' && DB.customers.some(c => c.tier === it.id) ? 'Đang có khách hàng thuộc loại này. Hãy chuyển họ sang loại khác trước.'
    : v === 'seattypes' ? 'Không thể xóa loại ghế có sẵn.' : v === 'seatrows' && DB.seatRows.length <= 1 ? 'Phải còn ít nhất một hàng ghế.'
    : v === 'tiers' && DB.tiers.length <= 1 ? 'Phải còn ít nhất một loại khách hàng.' : '';
  if (why) return dlg(`<h3>Không thể xóa</h3><p class="muted dark">${why}</p><div class="dlg-actions"><button class="btn-back-adm" data-x>Đã hiểu</button></div>`);
  _confirmDel(it);
};
const _afterSave = afterSave;
afterSave = function (mod) {
  _afterSave(mod);
  DB.rooms = DB.rooms.filter(r => CINEMAS.some(c => c.id === r.cin));
  DB.showtimes = DB.showtimes.filter(s => movieById(s.m) && roomById(s.r));
  DB.customers.forEach(c => { if (!DB.tiers.some(t => t.id === c.tier)) c.tier = DB.tiers[0].id; });
  CINEMAS.forEach(c => c.rooms = DB.rooms.filter(r => r.cin === c.id).length);
  syncLayout(); sortShows(); syncSeats(); fillExtraFilters(); renderShowtimes(); renderHeroNext(heroList[heroIdx]); drawPos(); renderAcct();
};

/* ---- Vé ---- */
let tkStat = 'all';
function paintTickets() {
  const rows = ticketRows(A.q, tkStat);
  $('#tk-count').textContent = `${rows.length} vé`;
  $('#tk-rows').innerHTML = rows.length ? rows.slice(0, 150).map(t => `<tr><td><code>${esc(t.code)}</code></td><td><strong>${esc(t.o.movie)}</strong></td><td>${esc(t.o.time)} · ${esc(t.o.date || '')}</td><td>${esc(t.o.cin)} · ${esc(t.o.room || '')}</td><td>${esc(t.seat)}</td><td>${esc(custName(t.o))}</td><td>${badge(...TK_ST[t.status])}</td>
    <td class="row-acts">${t.status === 'valid' ? `<button data-tk="use" data-id="${esc(t.o.id)}" data-seat="${esc(t.seat)}">Đánh dấu đã dùng</button>` : t.status === 'used' ? `<button data-tk="undo" data-id="${esc(t.o.id)}" data-seat="${esc(t.seat)}">Hoàn tác</button>` : ''}</td></tr>`).join('')
    : '<tr><td colspan="8" class="adm-empty">Không tìm thấy vé.</td></tr>';
}
function renderTickets() {
  $('#adm-title').textContent = 'Vé'; $('#adm-tools').innerHTML = '';
  $('#adm-content').innerHTML = `<div class="adm-table-card"><div class="adm-bar"><input type="search" id="tk-q" placeholder="Mã vé, phim, tên hoặc SĐT khách..." value="${esc(A.q)}" aria-label="Tìm vé"><select id="tk-st" aria-label="Lọc trạng thái"><option value="all">Mọi trạng thái</option>${Object.entries(TK_ST).map(([k, v]) => `<option value="${k}"${tkStat === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select><span class="adm-count" id="tk-count"></span></div>
    <div class="adm-scroll"><table class="adm-table"><thead><tr><th>Mã vé</th><th>Phim</th><th>Suất</th><th>Rạp · Phòng</th><th>Ghế</th><th>Khách</th><th>Trạng thái</th><th></th></tr></thead><tbody id="tk-rows"></tbody></table></div></div>`;
  $('#tk-q').oninput = e => { A.q = e.target.value; paintTickets(); }; $('#tk-st').onchange = e => { tkStat = e.target.value; paintTickets(); };
  paintTickets();
}

/* ---- Thống kê doanh thu (tính từ đơn hàng thật trong DB.orders) ---- */
const sumBy = (a, f) => a.reduce((x, o) => x + (Number(f(o)) || 0), 0), nTk = o => seatList(o).length;
function group(list, keyFn) {
  const m = new Map(); list.forEach(o => { const k = keyFn(o), g = m.get(k) || { k, rev: 0, tk: 0, n: 0 }; g.rev += Number(o.total) || 0; g.tk += nTk(o); g.n++; m.set(k, g); });
  return [...m.values()].sort((a, b) => b.rev - a.rev);
}
function renderStats() {
  const box = $('#adm-content'); box.classList.remove('enter'); void box.offsetWidth; box.classList.add('enter');
  A.gran ||= 'day'; $('#adm-title').textContent = 'Thống kê doanh thu';
  $('#adm-tools').innerHTML = [[1, 'Hôm nay'], [7, '7 ngày'], [30, '30 ngày'], [90, '90 ngày']].map(([r, l]) => `<button class="pill adm-pill${A.range === r ? ' active' : ''}" data-r="${r}">${l}</button>`).join('')
    + `<select id="adm-gran" aria-label="Nhóm theo"><option value="day">Theo ngày</option><option value="month">Theo tháng</option><option value="year">Theo năm</option></select>`;
  $('#adm-gran').value = A.gran; $('#adm-gran').onchange = e => { A.gran = e.target.value; renderStats(); };
  const t0 = new Date(); t0.setHours(0, 0, 0, 0); const from = +t0 - (A.range - 1) * 864e5, L = DB.orders.filter(o => o.st === 'ok' && o.at >= from);
  const rev = sumBy(L, o => o.total), tk = sumBy(L, nTk), seatAmt = sumBy(L, o => o.seatAmt), comboAmt = sumBy(L, o => o.comboAmt), disc = sumBy(L, o => o.disc);
  const kf = o => { const d = new Date(o.at); return A.gran === 'year' ? String(d.getFullYear()) : A.gran === 'month' ? `${pad2(d.getMonth() + 1)}/${d.getFullYear()}` : dayKey(d); };
  const bk = new Map(); L.slice().sort((a, b) => a.at - b.at).forEach(o => bk.set(kf(o), (bk.get(kf(o)) || 0) + o.total));
  const ent = [...bk], max = Math.max(1, ...ent.map(e => e[1])), bw = 44, w = Math.max(560, ent.length * bw), h = 210;
  const bars = ent.map(([k, v], i) => { const bh = v / max * (h - 44); return `<g><rect x="${i * bw + 6}" y="${h - bh - 22}" width="${bw - 12}" height="${bh}" rx="5"><title>${k}: ${fmt(v)}</title></rect><text x="${i * bw + bw / 2}" y="${h - 6}" text-anchor="middle">${k}</text></g>`; }).join('');
  const byMovie = group(L, o => o.movie), byCin = group(L, o => `${o.cin} · ${o.room || ''}`), byPay = group(L, o => o.method || 'Khác'), tot = Math.max(1, rev);
  const bar = g => `<div class="bar-row"><span>${esc(g.k)}</span><div class="bar-track"><i style="width:${Math.round(g.rev / tot * 100)}%"></i></div><b>${Math.round(g.rev / tot * 100)}%</b></div>`;
  const tbl = (hd, gs) => gs.length ? table(hd, gs.map(g => [`<strong>${esc(g.k)}</strong>`, g.n, g.tk, fmt(g.rev)])) : '<p class="adm-empty">Chưa có dữ liệu.</p>';
  box.innerHTML = `<section class="adm-kpi-grid">
    <div class="kpi-card"><span class="kpi-title">DOANH THU THỰC THU</span><div class="kpi-value">${fmt(rev)}</div><span class="kpi-change">${L.length} đơn thành công</span></div>
    <div class="kpi-card"><span class="kpi-title">VÉ ĐÃ BÁN</span><div class="kpi-value">${tk.toLocaleString('vi-VN')}</div><span class="kpi-change">${L.length ? (tk / L.length).toFixed(1) : 0} vé / đơn</span></div>
    <div class="kpi-card"><span class="kpi-title">DOANH THU TỪ VÉ</span><div class="kpi-value">${fmt(seatAmt)}</div><span class="kpi-change">${Math.round(seatAmt / Math.max(1, seatAmt + comboAmt) * 100)}% tổng bán</span></div>
    <div class="kpi-card"><span class="kpi-title">DOANH THU TỪ COMBO</span><div class="kpi-value">${fmt(comboAmt)}</div><span class="kpi-change">Đã giảm giá: ${fmt(disc)}</span></div></section>
    <div class="adm-table-card"><h3>Doanh thu theo ${{ day: 'ngày', month: 'tháng', year: 'năm' }[A.gran]}</h3><div class="adm-scroll">${ent.length ? `<svg class="adm-chart" viewBox="0 0 ${w} ${h}" style="min-width:${w}px" role="img" aria-label="Biểu đồ doanh thu">${bars}</svg>` : '<p class="adm-empty">Chưa có đơn trong khoảng này.</p>'}</div></div>
    <section class="adm-two"><div class="adm-table-card"><h3>Tỉ trọng theo phim</h3>${byMovie.slice(0, 6).map(bar).join('') || '<p class="adm-empty">Chưa có dữ liệu.</p>'}</div><div class="adm-table-card"><h3>Vé và combo</h3>${table(['Khoản mục', 'Số tiền'], [['Tiền vé', fmt(seatAmt)], ['Tiền combo', fmt(comboAmt)], ['Giảm giá', '-' + fmt(disc)], ['<strong>Thực thu</strong>', `<strong>${fmt(rev)}</strong>`]])}</div></section>
    <div class="adm-table-card"><h3>Theo phim</h3><div class="adm-scroll">${tbl(['Phim', 'Đơn', 'Vé bán', 'Doanh thu'], byMovie)}</div></div>
    <section class="adm-two"><div class="adm-table-card"><h3>Theo rạp và phòng</h3><div class="adm-scroll">${tbl(['Rạp · Phòng', 'Đơn', 'Vé bán', 'Doanh thu'], byCin)}</div></div><div class="adm-table-card"><h3>Theo phương thức thanh toán</h3><div class="adm-scroll">${tbl(['Phương thức', 'Đơn', 'Vé bán', 'Doanh thu'], byPay)}</div></div></section>`;
}

const _renderAdmin = renderAdmin;
renderAdmin = function () {
  if (A.v === 'stats' || A.v === 'tickets') { const b = $('#adm-content'); b.classList.remove('enter'); void b.offsetWidth; b.classList.add('enter'); return A.v === 'stats' ? renderStats() : renderTickets(); }
  _renderAdmin();
};

async function loginAdmin(u, p) {
  const data = await API.post('staff/login', { email: u, password: p });
  const x = data.staff || data;
  if (!x || !(x.maNV || x.id)) return 'Máy chủ không trả về thông tin nhân viên quản trị.';
  if (!['Admin', 'QuanLy'].includes(x.chucVu)) { API.post('staff/logout').catch(() => {}); return 'Tài khoản không có quyền truy cập khu vực quản trị.'; }
  CTX.admin = true;
  CTX.adminStaff = x;
  return '';
}
document.addEventListener('DOMContentLoaded', () => {
  mkGate('admin', 'Đăng nhập quản trị', 'Nhập email và mật khẩu tài khoản nhân viên có quyền quản trị trong database.', loginAdmin);
  const adminMenu = [['dash', 'Tổng quan'], ['stats', 'Thống kê doanh thu'], ['movies', 'Phim'], ['showtimes', 'Suất chiếu'], ['cinemas', 'Rạp'], ['rooms', 'Phòng chiếu'], ['seatrows', 'Sơ đồ ghế'], ['seattypes', 'Giá ghế'], ['combos', 'Combo bắp nước'], ['promos', 'Khuyến mãi'], ['tiers', 'Loại khách hàng'], ['customers', 'Khách hàng'], ['orders', 'Đơn đặt vé'], ['tickets', 'Vé']];
  if (CTX.adminStaff?.chucVu === 'Admin') adminMenu.push(['staff', 'Nhân sự']);
  $('#adm-menu').innerHTML = adminMenu.map(([k, l], i) => `<a href="#" class="adm-item${i ? '' : ' active'}" data-v="${k}">${l}</a>`).join('');
  $('.adm-sidebar').insertAdjacentHTML('beforeend', '<button class="adm-logout" id="adm-logout">Đăng xuất</button>');
  $('#adm-logout').onclick = () => { API.post('staff/logout').catch(() => {}); CTX.admin = false; CTX.adminStaff = null; lockView('admin'); toast('Đã đăng xuất'); };
  $('#view-admin').addEventListener('click', async e => {
    const b = e.target.closest('[data-tk]'); if (!b) return;
    const orderId = b.dataset.id;
    const action = b.dataset.tk;
    // API hiện tại chỉ hỗ trợ POST /api/tickets/{maVe}/use hoặc /validate.
    // Không gọi theo mã đơn hàng vì endpoint yêu cầu mã vé.
    const orderTickets = await API.get('tickets').catch(err => { toast(err.message || 'Không tải được danh sách vé'); return []; });
    const ticket = (Array.isArray(orderTickets) ? orderTickets : []).find(t =>
      String(t.maDon || '') === String(orderId) &&
      String(t.soGhe || '') === String(b.dataset.seat || '')
    );
    if (!ticket) { toast('Không tìm thấy mã vé tương ứng. Hãy tải lại danh sách vé.'); return; }
    try {
      await API.post(`tickets/${encodeURIComponent(ticket.maVe)}/${action === 'use' ? 'use' : 'validate'}`);
      toast(action === 'use' ? 'Đã đánh dấu vé đã sử dụng' : 'Đã kiểm tra vé');
      renderTickets();
    } catch (err) { toast(err.message || 'Không thể cập nhật trạng thái vé'); }
  });
  syncLayout();
});


/* Khuyến mãi: đồng bộ với entity KhuyenMai (maKM, tenKM, moTa,
   phanTramGiam, ngayBatDau, ngayKetThuc, trangThai). */
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
