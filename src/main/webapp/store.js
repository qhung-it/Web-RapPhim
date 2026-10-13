'use strict';
/* store.js — Lớp dữ liệu mở rộng: loại khách hàng, phòng chiếu, ghế, suất chiếu, đơn hàng, vé.
   Nạp ngay sau scriptcnm.js. Đã được kết nối đồng bộ với API Servlet qua API Client. */

const CTX = { user: null, staff: null, admin: false, inPos: 0, posTier: 'regular', src: 'online', method: '' };
const ADMIN_ACC = { user: 'admin', pw: 'admin123' };
const pad2 = n => String(n).padStart(2, '0');
const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const durMin = m => { const x = /(\d+)h\s*(\d+)?/.exec(m?.d || ''); return x ? +x[1] * 60 + (+x[2] || 0) : 120; };
const endTime = (t, m) => { const e = toMin(t) + durMin(m); return pad2((e / 60 | 0) % 24) + ':' + pad2(e % 60); };

function parseShow(k, t) {
  const [d, mo] = k.split('/').map(Number), n = new Date(), dt = new Date(n.getFullYear(), mo - 1, d, +t.slice(0, 2), +t.slice(3, 5));
  if (dt - n < -180 * 864e5) dt.setFullYear(n.getFullYear() + 1);
  return dt.getTime();
}

/* ---- Loại khách hàng & tài khoản ---- */
DB.tiers = [
  { id: 'regular', n: 'Thường', pct: 0, desc: 'Khách mới đăng ký' },
  { id: 'student', n: 'Học sinh, sinh viên', pct: 5, desc: 'Có thẻ học sinh, sinh viên' },
  { id: 'silver', n: 'Thành viên Bạc', pct: 4, desc: 'Khách thân thiết' },
  { id: 'gold', n: 'Thành viên Vàng', pct: 8, desc: 'Khách VIP' }
];

const SEED_ACC = { c1: ['khoa@example.com', '2001-05-14'], c2: ['ha@example.com', '2004-09-02'], c3: ['huy@example.com', '1998-12-20'] };
DB.customers.forEach(c => Object.assign(c, { email: SEED_ACC[c.id]?.[0] || c.email, dob: SEED_ACC[c.id]?.[1] || c.dob, pw: '123456' }));
Object.values(MEMBERS).forEach(m => m.promo = '');
[['s1', 'thungan1'], ['s2', 'thungan2'], ['s3', 'quanly']].forEach(([id, u]) => Object.assign(DB.staff.find(s => s.id === id) || {}, { user: u, pw: '123456' }));
DB.staff.push({ id: 's4', n: 'Phạm Văn D', role: 'Soát vé', cin: 'Vincom Center Q1', shift: 'Tối', st: 'on', user: 'soatve', pw: '123456' });

const tierOf = id => DB.tiers.find(t => t.id === id) || DB.tiers[0];
const custByPhone = p => p ? DB.customers.find(c => c.phone === p && c.st === 'on') : null;

/* ---- Ghế: giá theo loại, sơ đồ theo hàng ---- */
DB.seatTypes = [
  { id: 'standard', n: 'Thường', p: 120000 }, { id: 'vip', n: 'VIP', p: 150000 }, { id: 'couple', n: 'Ghế đôi', p: 280000 }
];
DB.seatRows = ROWS.map(r => ({ id: r, t: rowType(r), cnt: rowCount(r) }));
const totalSeats = () => ROWS.reduce((a, r) => a + rowCount(r), 0);

function syncLayout() {
  DB.seatRows.sort((a, b) => a.id.localeCompare(b.id));
  ROWS.length = 0; DB.seatRows.forEach(x => ROWS.push(x.id));
  DB.seatTypes.forEach(t => { PRICE[t.id] = Number(t.p) || 0; TYPE_NAME[t.id] = t.n; });
  $$('#pane-step-1 .seat-legend .legend-item').slice(0, 3).forEach((el, i) => { const t = DB.seatTypes[i]; if (t) el.lastChild.textContent = ` ${t.n} ${Math.round(t.p / 1000)}K`; });
}

/* ---- Phòng chiếu & suất chiếu ---- */
DB.rooms = [];
CINEMAS.forEach(c => {
  const main = /IMAX|4DX|3D/.exec(c.room)?.[0] || '2D';
  DB.rooms.push({ id: c.id + '1', cin: c.id, n: c.room, type: main, st: 'on' }, { id: c.id + '2', cin: c.id, n: 'Phòng 02', type: '2D', st: 'on' }, { id: c.id + '3', cin: c.id, n: 'Phòng 03', type: '2D', st: 'on' });
});

const roomById = id => DB.rooms.find(r => r.id === id);
const movieById = id => MOVIES.find(m => m.id === id);
const roomLabel = id => { const r = roomById(id); return r ? `${CINEMAS.find(c => c.id === r.cin)?.n || '?'} · ${r.n}` : '—'; };

function findClash(x, ignore) {
  const s0 = toMin(x.time), e0 = s0 + durMin(movieById(x.m)) + 15;
  return DB.showtimes.find(s => s !== ignore && s.st === 'on' && s.r === x.r && s.date === x.date && s0 < toMin(s.time) + durMin(movieById(s.m)) + 15 && e0 > toMin(s.time));
}

DB.showtimes = [];
MOVIES.filter(m => m.st === 'now').sort((a, b) => a.fm.length - b.fm.length).forEach((m, mi) => CINEMAS.forEach(c => DATES.forEach(d => TIMES.forEach((t, ti) => {
  if ((ti + mi) % 5 > 2) return;
  const room = DB.rooms.find(r => r.cin === c.id && m.fm.includes(r.type) && !findClash({ m: m.id, r: r.id, date: d.k, time: t }));
  if (room) DB.showtimes.push({ id: 'sc' + DB.showtimes.length, m: m.id, r: room.id, date: d.k, time: t, st: 'on' });
}))));

const showRoom = sh => { const s = DB.showtimes.find(x => x.m === sh.m.id && x.date === sh.date && x.time === sh.time && roomById(x.r)?.cin === sh.cin.id); return s && roomById(s.r); };

function timesFor(m, c, date) {
  return DB.showtimes.filter(s => s.m === m.id && s.date === date && s.st === 'on' && roomById(s.r)?.st === 'on' && roomById(s.r)?.cin === c.id).sort((a, b) => a.time.localeCompare(b.time));
}

function sortShows() { DB.showtimes.sort((a, b) => DATES.findIndex(d => d.k === a.date) - DATES.findIndex(d => d.k === b.date) || a.time.localeCompare(b.time)); }
sortShows();

/* ---- Đơn hàng ---- */
const ORD_ST = { ok: ['Đã thanh toán', 'success'], wait: ['Chờ xác nhận', 'pending'], cancel: ['Đã hủy', 'muted'] };
const TK_ST = { valid: ['Chưa sử dụng', 'pending'], used: ['Đã sử dụng', 'success'], wait: ['Chờ xác nhận', 'pending'], cancel: ['Đã hủy', 'muted'] };
const seatList = o => String(o.seats).split(',').map(s => s.trim()).filter(Boolean);
const dayKey = d => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
const ORIG = { 'CNV-8849': ['ds', 'v', 'c1'], 'CNV-8848': ['dn', 'l', 'c2'], 'CNV-8847': ['kf', 'a', 'c1'] };

DB.orders.forEach(o => {
  const origData = ORIG[o.id] || ['ds', 'v', 'c1'];
  const [mid, cid, cust] = origData;
  const room = DB.rooms.find(r => r.cin === cid) || DB.rooms[0];
  const n = seatList(o).length;
  Object.assign(o, { mid, cid, cust, date: DATES[0].k, room: room.n, key: `${mid}|${DATES[0].k}|${cid}|${o.time}`, startAt: parseShow(DATES[0].k, o.time) + 864e5 * 0, seatAmt: o.total, comboAmt: 0, disc: 0, items: [], promo: '', method: 'VNPay', src: 'online', at: Date.now() - n * 3600e3, used: [] });
});

(function seedHistory() {
  const R = rng(20260), pick = a => a[R() * a.length | 0], now = MOVIES.filter(m => m.st === 'now');
  if (!now.length) return;
  for (let i = 0; i < 46; i++) {
    const m = pick(now), c = pick(CINEMAS), at = new Date(); at.setDate(at.getDate() - (R() * 90 | 0)); at.setHours(9 + (R() * 13 | 0), R() * 60 | 0, 0, 0);
    const t = pick(TIMES), cu = pick(DB.customers), src = R() < .35 ? 'pos' : 'online', ids = [];
    for (let k = 1 + (R() * 4 | 0); k > 0; k--) { const r = ROWS[R() * 5 | 0], id = r + (1 + (R() * rowCount(r) | 0)); if (!ids.includes(id)) ids.push(id); }
    const seatAmt = ids.reduce((a, id) => a + PRICE[rowType(id[0])], 0), items = [];
    if (R() < .5) items.push({ n: COMBOS[0].n, q: 1, p: COMBOS[0].p }); if (R() < .5) items.push({ n: COMBOS[1].n, q: 1 + (R() * 2 | 0), p: COMBOS[1].p });
    const comboAmt = items.reduce((a, x) => a + x.p * x.q, 0), pct = tierOf(cu.tier).pct, promo = R() < .3 ? 'CINE2026' : '';
    const disc = Math.round((seatAmt + comboAmt) * pct / 100) + (promo ? Math.round((seatAmt + comboAmt) * .1) : 0), st = R() < .07 ? 'cancel' : 'ok', date = dayKey(at);
    const startAt = new Date(at); startAt.setHours(+t.slice(0, 2), +t.slice(3), 0, 0);
    const code = 'CNV-' + (8700 + i);
    DB.orders.push({ id: code, code: '#' + code, movie: m.t, mid: m.id, cin: c.n, cid: c.id, room: (DB.rooms.find(r => r.cin === c.id) || DB.rooms[0]).n, time: t, date, key: `${m.id}|${date}|${c.id}|${t}`, seats: ids.join(', '), seatAmt, comboAmt, disc, total: seatAmt + comboAmt - disc, items, promo, method: pick(['VNPay', 'MoMo', 'Thẻ', 'Tiền mặt']), src, cust: cu.id, staff: src === 'pos' ? 'Nguyễn Văn A' : null, st, at: +at, startAt: +startAt, used: st === 'ok' && +startAt < Date.now() ? ids.slice() : [] });
  }
  DB.orders.sort((a, b) => b.at - a.at);
})();

function syncSeats() {
  Object.keys(S.booked).forEach(k => delete S.booked[k]);
  DB.orders.forEach(o => { if (o.key && o.st !== 'cancel') (S.booked[o.key] ||= []).push(...seatList(o)); });
}

const canCancel = o => o.st !== 'cancel' && !(o.used || []).length && (o.startAt || 0) > Date.now();

function cancelOrder(o) {
  o.st = 'cancel';
  o.cancelAt = Date.now();
  syncSeats();
  if (o.id) {
    API.huyDon(o.id).catch(() => {});
  }
}

const custName = o => DB.customers.find(c => c.id === o.cust)?.n || o.guest?.name || 'Khách vãng lai';

function ordBadge(o) {
  if (o.st !== 'ok') return ORD_ST[o.st] || ORD_ST.wait;
  if (seatList(o).every(s => (o.used || []).includes(s))) return ['Đã sử dụng', 'success'];
  return (o.startAt || 0) < Date.now() ? ['Đã kết thúc', 'muted'] : ['Chưa sử dụng', 'pending'];
}

function ticketRows(q = '', st = 'all') {
  const k = norm(q.trim()), out = [];
  DB.orders.forEach(o => {
    const c = DB.customers.find(x => x.id === o.cust);
    seatList(o).forEach(seat => {
      const status = o.st === 'cancel' ? 'cancel' : o.st === 'wait' ? 'wait' : (o.used || []).includes(seat) ? 'used' : 'valid', code = `${o.id}-${seat}`;
      if (st !== 'all' && st !== status) return;
      if (k && !norm([code, o.movie, seat, c?.n, c?.phone, o.guest?.name, o.guest?.phone].join(' ')).includes(k)) return;
      out.push({ code, o, seat, status });
    });
  });
  return out;
}

function useTicket(o, seat, on = true) { o.used ||= []; const i = o.used.indexOf(seat); if (on && i < 0) o.used.push(seat); if (!on && i > -1) o.used.splice(i, 1); }

function orderLines(o) {
  const row = (a, b) => `<dt>${a}</dt><dd>${b}</dd>`, st = ordBadge(o), c = DB.customers.find(x => x.id === o.cust);
  return row('Mã đơn', esc(o.id)) + row('Phim', esc(o.movie)) + row('Suất chiếu', `${esc(o.time)} · ${esc(o.date || '')}`) + row('Rạp · Phòng', `${esc(o.cin)} · ${esc(o.room || '')}`) + row('Ghế', esc(o.seats))
    + row('Tiền vé', fmt(o.seatAmt ?? o.total)) + row('Combo', (o.items || []).map(i => `${i.q} × ${esc(i.n)}`).join(', ') + ((o.items || []).length ? ` (${fmt(o.comboAmt)})` : 'Không'))
    + row('Khuyến mãi', esc(o.promo || 'Không') + (o.disc ? ` · giảm ${fmt(o.disc)}` : '')) + row('Tổng thanh toán', `<b>${fmt(Number(o.total) || 0)}</b>`) + row('Phương thức', esc(o.method || '—'))
    + row('Kênh', o.src === 'pos' ? 'Quầy · ' + esc(o.staff || '') : 'Online') + row('Khách hàng', esc(custName(o)) + (c ? ` · ${esc(tierOf(c.tier).n)}` : '')) + row('Trạng thái', st[0]);
}

/* ---- Ghi đè hàm gốc: giảm giá theo loại khách, lưu đủ thông tin đơn ---- */
const _totals = totals;
totals = function (sel, combos, promo) {
  const t = _totals(sel, combos, promo), id = (CTX.inPos ? CTX.posTier : CTX.user?.tier) || 'regular', pct = Number(tierOf(id).pct) || 0;
  const gross = t.seat + t.combo, tierD = Math.round(gross * pct / 100), disc = Math.min(t.disc + tierD, gross);
  return { seat: t.seat, combo: t.combo, disc, promoD: t.disc, tierD, pct, tier: tierOf(id).n, total: gross - disc };
};

const _addOrder = addOrder;
addOrder = function (code, movie, cin, time, seats, total) {
  _addOrder(code, movie, cin, time, seats, total);
  const o = DB.orders[0], pos = CTX.src === 'pos', X = pos ? S.pos : S, sh = pos ? S.pos.show : S.show, t = totals(X.sel, X.combos, X.promo);
  const phone = pos ? $('#pos-phone')?.value || '' : '', cu = pos ? custByPhone(phone) : CTX.user;
  Object.assign(o, { mid: sh.m.id, cid: sh.cin.id, date: sh.date, room: showRoom(sh)?.n || sh.cin.room, key: showKey(sh), startAt: parseShow(sh.date, sh.time), seatAmt: t.seat, comboAmt: t.combo, disc: t.disc,
    items: COMBOS.filter(c => X.combos[c.id]).map(c => ({ n: c.n, q: X.combos[c.id], p: c.p })), promo: X.promo || '', method: pos ? CTX.method : $('input[name="pay"]:checked')?.value || '',
    src: pos ? 'pos' : 'online', cust: cu?.id || null, guest: pos && !cu ? { name: $('#pos-name')?.value.trim() || '', phone } : null, staff: pos ? CTX.staff?.n || null : null, at: Date.now(), used: [], st: 'ok' });

  // Gọi API tạo đơn và thanh toán trên Backend nếu người dùng đã đăng nhập hoặc mua quầy
  if (cu || pos) {
    API.taoDonDatVe(cu?.id || 'GUEST', pos ? CTX.staff?.id || 'STAFF' : null).then(res => {
      const maDon = res.maDon || res.id;
      if (maDon) {
        o.id = maDon;
        if (X.promo) API.apDungKhuyenMai(maDon, X.promo).catch(() => {});
        API.xacNhanDon(maDon).catch(() => {});
      }
    }).catch(err => console.warn('Lỗi ghi nhận đơn đặt vé lên hệ thống:', err.message));
  }
};

const _posTotals = posTotals;
posTotals = function () { CTX.inPos++; CTX.posTier = custByPhone($('#pos-phone')?.value)?.tier || 'regular'; try { _posTotals(); } finally { CTX.inPos--; } };

const _posPay = posPay;
posPay = function (m) {
  const P = S.pos, sold = soldFor(P.show), bad = P.sel.filter(s => sold.has(s.id));
  if (bad.length) { P.sel = P.sel.filter(s => !sold.has(s.id)); drawPos(); const st = $('#pos-status'); st.className = 'pos-status error'; st.textContent = `Ghế ${bad.map(s => s.id).join(', ')} vừa được bán. Vui lòng chọn ghế khác.`; return; }
  CTX.inPos++; CTX.posTier = custByPhone($('#pos-phone').value)?.tier || 'regular'; CTX.src = 'pos'; CTX.method = m;
  try { _posPay(m); } finally { CTX.src = 'online'; CTX.inPos--; }
};

const _drawPos = drawPos;
drawPos = function () { _drawPos(); const r = showRoom(S.pos.show); if (r) $('#pos-room').textContent = `· ${r.n}`; };

const _posRefund = posRefund;
posRefund = function () { const L = S.pos.last; _posRefund(); const o = L && DB.orders.find(x => x.id === L.code); if (o) { o.st = 'cancel'; syncSeats(); if (o.id) API.huyDon(o.id).catch(() => {}); } };

syncLayout(); syncSeats();
CINEMAS.forEach(c => c.rooms = DB.rooms.filter(r => r.cin === c.id).length);