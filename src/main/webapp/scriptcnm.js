'use strict';

/* ================= 1. KHỞI TẠO BIẾN & HÀM TIỆN ÍCH TOÀN CỤC ================= */
window.DB = window.DB || {
  movies: [],
  showtimes: [],
  cinemas: [],
  rooms: [],
  combos: [],
  promos: [],
  customers: [],
  orders: [],
  staff: []
};

window.S = window.S || { pos: { show: null, sel: [], paid: false } };
window.CTX = window.CTX || { cust: null, staff: null, user: null };

window.esc = window.esc || function(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

window.norm = window.norm || function(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
};

window.pad2 = window.pad2 || function(n) { return String(n).padStart(2, '0'); };
window.fmt = window.fmt || function(n) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0); };

window.$ = (s, r = document) => r.querySelector(s);
window.$$ = (s, r = document) => [...r.querySelectorAll(s)];

const $ = window.$;
const $$ = window.$$;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const img = (id, w = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/* ================= 2. DỮ LIỆU MẶC ĐỊNH SẴN CÓ ================= */
let MOVIES = [
  { id: 'ds', t: 'Demon Slayer', sub: 'Kimetsu no Yaiba: Chuyến Tàu Vô Tận', p: 'photo-1534447677768-be436bb09401', bd: 'photo-1536440136628-849c177e76a1', age: 'T16', r: 8.9, d: '2h 10m', g: 'Anime · Hành động', dir: 'Haruo Sotozaki', cast: 'Natsuki Hanae, Akari Kitō', fm: ['IMAX', '2D'], st: 'now', desc: 'Tanjirou và các đồng đội lên Chuyến tàu Vô Tận để điều tra vụ hơn 40 người mất tích bí ẩn.' },
  { id: 'dn', t: 'Dune: Hành Tinh Cát II', sub: 'Cuộc chiến giành Arrakis', p: 'photo-1518709268805-4e9042af9f23', bd: 'photo-1518709268805-4e9042af9f23', age: 'T13', r: 8.7, d: '2h 45m', g: 'Khoa học viễn tưởng', dir: 'Denis Villeneuve', cast: 'Timothée Chalamet, Zendaya', fm: ['IMAX', '3D'], st: 'now', desc: 'Paul Atreides hợp lực cùng người Fremen để trả thù những kẻ đã hủy hoại gia tộc mình.' },
  { id: 'kf', t: 'Kung Fu Panda 4', sub: 'Gấu Po trở lại', p: 'photo-1509198397868-475647b2a1e5', bd: 'photo-1509198397868-475647b2a1e5', age: 'P', r: 9.1, d: '1h 55m', g: 'Hoạt hình · Hài hước', dir: 'Mike Mitchell', cast: 'Jack Black, Awkwafina', fm: ['2D', '4DX'], st: 'now', desc: 'Po phải chọn người kế vị Chiến binh Rồng khi một phù thủy biến hình xuất hiện.' },
  { id: 'it', t: 'Interstellar (chiếu lại)', sub: 'Phiên bản IMAX', p: 'photo-1618005182384-a83a8bd57fbe', bd: 'photo-1618005182384-a83a8bd57fbe', age: 'T18', r: 9.3, d: '2h 49m', g: 'Viễn tưởng · Phiêu lưu', dir: 'Christopher Nolan', cast: 'Matthew McConaughey, Anne Hathaway', fm: ['IMAX'], st: 'now', desc: 'Một nhóm nhà thám hiểm băng qua hố sâu không gian để tìm ngôi nhà mới cho nhân loại.' },
  { id: 'mi', t: 'Mai', sub: 'Phim tâm lý tình cảm Việt', p: 'photo-1489599849927-2ee91cede3ba', bd: 'photo-1489599849927-2ee91cede3ba', age: 'T18', r: 8.2, d: '2h 11m', g: 'Tâm lý · Tình cảm', dir: 'Trấn Thành', cast: 'Phương Anh Đào, Tuấn Trần', fm: ['2D'], st: 'now', desc: 'Câu chuyện về người phụ nữ tên Mai và cơ hội thứ hai trong tình yêu.' },
  { id: 'gk', t: 'Godzilla x Kong', sub: 'Đế chế mới', p: 'photo-1478720568477-152d9b164e26', bd: 'photo-1478720568477-152d9b164e26', age: 'T13', r: 8.0, d: '1h 55m', g: 'Hành động · Quái vật', dir: 'Adam Wingard', cast: 'Rebecca Hall, Dan Stevens', fm: ['4DX', '3D'], st: 'soon', desc: 'Hai người khổng lồ phải liên minh trước một mối đe dọa ẩn sâu dưới lòng đất.' }
];
let LIVE_SHOWS = [];
let CINEMAS = [
  { id: 'v', n: 'Vincom Center Q1', a: '72 Lê Thánh Tôn, Quận 1', rooms: 8, fm: ['IMAX', '2D', '3D'], room: 'Phòng IMAX Laser' },
  { id: 'l', n: 'Landmark 81', a: '720A Điện Biên Phủ, Bình Thạnh', rooms: 6, fm: ['4DX', '2D'], room: 'Phòng 4DX' },
  { id: 'a', n: 'Aeon Tân Phú', a: '30 Bờ Bao Tân Thắng, Tân Phú', rooms: 7, fm: ['2D', '3D'], room: 'Phòng 3D' }
];
const TIMES = ['10:00', '13:30', '16:15', '19:30', '21:45'];
const COMBOS = [
  { id: 'duo', n: 'Combo Duo Supreme', d: '1 bắp lớn phô mai, 2 nước 32oz, 1 snack khoai tây', p: 109000, i: 'photo-1578849278619-e73505e9610f' },
  { id: 'solo', n: 'Combo Solo Cinema', d: '1 bắp lớn bơ rang, 1 nước 32oz chọn vị', p: 79000, i: 'photo-1585647347483-22b66260dfff' }
];
const PROMOS = {
  CINE2026: { t: 'Giảm 10% toàn bộ đơn', c: (s, c) => Math.round((s + c) * .1) },
  HSSV: { t: 'Giảm 20.000đ cho học sinh, sinh viên', c: (s, c) => Math.min(20000, s + c) },
  COMBO15: { t: 'Giảm 15% tiền bắp nước', c: (s, c) => Math.round(c * .15) }
};
const PRICE = { standard: 120000, vip: 150000, couple: 280000 };
const TYPE_NAME = { standard: 'Thường', vip: 'VIP', couple: 'Ghế đôi' };
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const rowType = r => window.DB.seatRows?.find(x => x.id === r)?.t || (r === 'F' ? 'couple' : 'CD'.includes(r) ? 'vip' : 'standard');
const rowCount = r => Number(window.DB.seatRows?.find(x => x.id === r)?.cnt) || (r === 'F' ? 5 : 10);

const today = new Date();
const DATES = [0, 1, 2].map(i => { const d = new Date(today); d.setDate(d.getDate() + i); const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'); return { k: `${dd}/${mm}`, l: (i ? ['', 'Ngày mai', 'Ngày kia'][i] : 'Hôm nay') + ` ${dd}/${mm}` }; });

const S = window.S;
Object.assign(S, {
  show: { m: MOVIES[0], date: DATES[0].k, cin: CINEMAS[0], time: '19:30' },
  sel: [], combos: Object.fromEntries(COMBOS.map(c => [c.id, 0])), promo: null, step: 1, ticker: 0, raf: 0,
  booked: {}, hold: { t: null, left: 600 },
  stDate: DATES[0].k, stCin: 'all', filter: 'all', q: '',
  pos: { show: null, sel: [], combos: Object.fromEntries(COMBOS.map(c => [c.id, 0])), promo: '' },
  apiSeatData: null, seatLoadToken: 0
});

/* ================= 3. CÁC HÀM XỬ LÝ DÙNG CHUNG ================= */
const showKey = s => `${s.m.id}|${s.date}|${s.cin.id}|${s.time}`;

function soldFor(s) {
  const key = showKey(s); let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const set = new Set(S.booked[key] || []);
  for (let i = 0; i < 9; i++) { h = (h * 1103515245 + 12345) >>> 0; const r = ROWS[h % ROWS.length], max = rowCount(r); set.add(r + (1 + (h >> 8) % max)); }
  return set;
}

function totals(sel, combos, promo) {
  const seat = sel.reduce((a, x) => a + x.price, 0);
  const combo = COMBOS.reduce((a, c) => a + c.p * (combos[c.id] || 0), 0);
  const disc = promo && PROMOS[promo] ? Math.min(PROMOS[promo].c(seat, combo), seat + combo) : 0;
  return { seat, combo, disc, total: seat + combo - disc };
}

function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

const poster = m => {
  const value = String(m.posterUrl || '').trim();
  const src = value && (/^https?:\/\//i.test(value) || value.startsWith('/')) ? value : img(m.p);
  return `<img src="${src}" alt="${m.t}" loading="lazy" onerror="this.classList.add('img-fail')">`;
};

// Gọi an toàn hàm openDetail từ window hoặc movies-ext.js
function safeOpenDetail(m, bookMode = false) {
  if (typeof window.openDetail === 'function') return window.openDetail(m, bookMode);
  if (typeof openDetail === 'function') return openDetail(m, bookMode);
  if (bookMode) openBooking(m);
  else toast(`Chi tiết phim: ${m.t}`);
}

/* ================= 4. KHỞI TẠO HỆ THỐNG ================= */
document.addEventListener('DOMContentLoaded', async () => {
  await loadPublicCatalog();
  initRoles(); initNav(); initHero(); initMovies(); initShowtimes(); initStatic();
  initModal();
});

async function loadPublicCatalog() {
  const fallbackMovies = MOVIES.slice();
  try {
    if (typeof API !== 'undefined') {
      const [movieRows, showRows] = await Promise.all([
        API.layDanhSachPhim().catch(() => null),
        API.layDanhSachSuatChieu().catch(() => null)
      ]);

      LIVE_SHOWS = Array.isArray(showRows) ? showRows : [];

      if (Array.isArray(movieRows) && movieRows.length) {
        MOVIES = movieRows.map((row, index) => {
          const title = String(row.tenPhim || '').trim();
          const existing = fallbackMovies.find(m => norm(m.t) === norm(title)) || fallbackMovies[index % fallbackMovies.length];
          const status = norm(String(row.trangThai || ''));
          const posterValue = String(row.poster || row.hinhAnh || '').trim();
          return {
            ...existing,
            id: String(row.maPhim || existing.id),
            t: title || existing.t,
            sub: row.theLoai || existing.sub,
            g: row.theLoai || existing.g,
            d: row.thoiLuong ? `${row.thoiLuong} phút` : existing.d,
            age: row.doTuoi ? (/^T/i.test(String(row.doTuoi)) ? String(row.doTuoi) : `T${row.doTuoi}`) : existing.age,
            desc: row.moTa || existing.desc,
            p: existing.p,
            posterUrl: posterValue,
            st: /sap|soon|coming/.test(status) ? 'soon' : /ngung|off|inactive/.test(status) ? 'off' : 'now'
          };
        });
      }
    }

    const firstMovie = MOVIES.find(m => m.st === 'now') || MOVIES[0];
    if (firstMovie) S.show.m = firstMovie;
    if (CINEMAS.length) S.show.cin = CINEMAS[0];
  } catch (error) {
    console.warn('Chuyển sang dữ liệu mẫu do chưa kết nối được danh mục:', error.message);
  }

  try {
    if (typeof API !== 'undefined') {
      const [comboResult, promoResult] = await Promise.allSettled([
        API.layDanhSachCombo(),
        API.layDanhSachKhuyenMai()
      ]);

      if (comboResult.status === 'fulfilled' && Array.isArray(comboResult.value) && comboResult.value.length) {
        const apiCombos = comboResult.value;
        const nextCombos = apiCombos.map((row, index) => {
          const existing = COMBOS.find(c => norm(c.n) === norm(String(row.tenCombo || '')))
            || COMBOS[index % Math.max(1, COMBOS.length)] || {};
          return {
            ...existing,
            id: String(row.maCombo || existing.id || `combo-${index}`),
            maCombo: String(row.maCombo || ''),
            n: String(row.tenCombo || existing.n || 'Combo'),
            d: String(row.moTa || existing.d || ''),
            p: Number(row.gia) || 0,
            i: existing.i || 'photo-1578849278619-e73505e9610f'
          };
        });
        COMBOS.splice(0, COMBOS.length, ...nextCombos);
        S.combos = Object.fromEntries(nextCombos.map(c => [c.id, 0]));
        S.pos.combos = Object.fromEntries(nextCombos.map(c => [c.id, 0]));
      }

      if (promoResult.status === 'fulfilled' && Array.isArray(promoResult.value)) {
        const localNow = new Date();
        const now = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
        const livePromos = promoResult.value.filter(p => {
          const status = norm(String(p.trangThai || ''));
          const start = String(p.ngayBatDau || '').slice(0, 10);
          const end = String(p.ngayKetThuc || '').slice(0, 10);
          return (!status || status === 'danghoatdong' || status === 'dang hoat dong')
            && (!start || start <= now) && (!end || end >= now)
            && Number(p.phanTramGiam) > 0;
        });
        for (const key of Object.keys(PROMOS)) delete PROMOS[key];
        livePromos.forEach(p => {
          const code = String(p.maKM || '').trim().toUpperCase();
          if (!code) return;
          const percent = Math.min(100, Math.max(0, Number(p.phanTramGiam) || 0));
          PROMOS[code] = {
            maKM: String(p.maKM),
            t: String(p.moTa || p.tenKM || `Giảm ${percent}% toàn đơn`),
            c: (seat, combo) => Math.round((seat + combo) * percent / 100)
          };
        });
        if (S.promo && !PROMOS[S.promo]) S.promo = null;
      }
    }
  } catch (error) {
    console.warn('Chưa tải được combo/khuyến mãi từ API:', error.message);
  }
}

function initRoles() {
  const demo = $('#demo'), tg = $('#demo-toggle'); if (tg) tg.onclick = () => { const o = demo.classList.toggle('open'); tg.setAttribute('aria-expanded', o); }; $$('.role-btn').forEach(b => b.onclick = () => {
    $$('.role-btn').forEach(x => x.classList.toggle('active', x === b));$$
('.role-view').forEach(v => v.classList.toggle('active', v.id === 'view-' + b.dataset.role));
    document.documentElement.className = 'theme-' + b.dataset.role;
    closeModal(); if (typeof closeDetail === 'function') closeDetail();
    if (demo) demo.classList.remove('open'); if (tg) tg.setAttribute('aria-expanded', false); scrollTo(0, 0);
  });
  document.addEventListener('click', e => { if (demo && !demo.contains(e.target)) demo.classList.remove('open'); });
}

function initNav() {
  const nav = $('.cinematic-nav'); const links =$$('.nav-link'), secs = links.map(l =>$(l.getAttribute('href')));
  const on = () => {
    if (nav) nav.classList.toggle('scrolled', scrollY > 40);
    let cur = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    links.forEach((l, i) => l.classList.toggle('active', i === cur));
  };
  addEventListener('scroll', on, { passive: true }); on();
}

const heroList = MOVIES.slice(0, 4);
let heroIdx = 0, heroToken = 0, heroTimer;
function initHero() {
  if ($('#hero-dots')) {
    $('#hero-dots').innerHTML = heroList.map((m, i) => `<button class="dot" aria-label="${m.t}" data-i="${i}"></button>`).join('');
    $('#hero-dots').onclick = e => { const d = e.target.closest('.dot'); if (d) { showHero(+d.dataset.i); startHero(); } };
  }
  if ($('#hero-book')) $('#hero-book').onclick = () => safeOpenDetail(heroList[heroIdx], true);
  if ($('#hero-detail')) $('#hero-detail').onclick = () => safeOpenDetail(heroList[heroIdx]);
  if ($('#hero-trailer')) $('#hero-trailer').onclick = () => typeof playTrailer === 'function' ? playTrailer(heroList[heroIdx]) : toast(`Xem trailer: ${heroList[heroIdx].t}`);
  if ($('#hero-backdrop')) $('#hero-backdrop').style.backgroundImage = `url('${img(heroList[0].bd, 1920)}')`;
  fillHero(0); startHero();
}
function startHero() { clearInterval(heroTimer); if (!reduce) heroTimer = setInterval(() => showHero((heroIdx + 1) % heroList.length), 7000); }
function fillHero(i) {
  const m = heroList[i]; heroIdx = i;
  if ($('#hero-title')) $('#hero-title').textContent = m.t;
  if ($('#hero-subtitle')) $('#hero-subtitle').textContent = m.sub;
  if ($('#hero-desc')) $('#hero-desc').textContent = m.desc;
  if ($('#hero-fmt')) $('#hero-fmt').textContent = m.fm.join(' · ');
  if ($('#hero-meta')) $('#hero-meta').innerHTML = `<span class="meta-rating">★ ${m.r}</span><span>${m.d}</span><span class="badge-age">${m.age}</span><span>${m.g}</span>`;
  $$('#hero-dots .dot').forEach((d, k) => d.classList.toggle('active', k === i));
}
function showHero(i) {
  if (i === heroIdx) return;
  const token = ++heroToken, bg = $('#hero-backdrop'), box = $('#hero-content');
  const pre = new Image(); pre.src = img(heroList[i].bd, 1920);
  const go = () => {
    if (token !== heroToken) return;
    if (box) box.classList.add('fading'); if (bg) bg.classList.add('fading');
    setTimeout(() => {
      if (token !== heroToken) return;
      if (bg) bg.style.backgroundImage = `url('${pre.src}')`; fillHero(i);
      if (box) box.classList.remove('fading'); if (bg) bg.classList.remove('fading');
    }, reduce ? 0 : 300);
  };
  pre.complete ? go() : (pre.onload = pre.onerror = go);
  $$('#hero-dots .dot').forEach((d, k) => d.classList.toggle('active', k === i));
}

function initMovies() {
  const grid = $('#movie-grid');
  if (!grid) return;
  grid.innerHTML = MOVIES.map(m => `
    <article class="cinema-poster-card" data-id="${m.id}" tabindex="0" role="button" aria-label="Đặt vé ${m.t}">
      <div class="poster-wrapper">${poster(m)}<div class="poster-overlay"></div>
        <div class="badge-corner">${m.age}</div>${m.st === 'soon' ? '<div class="badge-soon">Sắp chiếu</div>' : ''}
        <div class="poster-hover-actions"><button class="hv-btn" data-act="trailer">▶ Xem trailer</button><button class="hv-btn" data-act="detail">Xem chi tiết</button>${m.st === 'now' ? '<button class="hv-btn gold" data-act="book">Đặt vé</button>' : ''}</div></div>
      <div class="poster-info"><div class="meta-line"><span class="rating">★ ${m.r}</span><span>${m.d}</span><span>${m.fm.join(' / ')}</span></div>
        <h3 class="movie-name">${m.t}</h3><p class="genre">${m.g}</p></div>
    </article>`).join('');
  grid.onclick = e => {
    const c = e.target.closest('.cinema-poster-card'); if (!c) return;
    const m = MOVIES.find(x => x.id === c.dataset.id), a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'trailer') return typeof playTrailer === 'function' ? playTrailer(m) : toast(`Xem trailer: ${m.t}`);
    safeOpenDetail(m, a === 'book');
  };
  grid.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { const c = e.target.closest('.cinema-poster-card'); if (c) { e.preventDefault(); safeOpenDetail(MOVIES.find(x => x.id === c.dataset.id)); } } };
  if ($('#filters')) $('#filters').onclick = e => { const p = e.target.closest('.pill'); if (!p) return; S.filter = p.dataset.f; $$('#filters .pill').forEach(x => x.classList.toggle('active', x === p)); applyFilter(); };
  if ($('#search')) $('#search').oninput = e => { S.q = e.target.value; applyFilter(); if (S.q && $('#movies')) $('#movies').scrollIntoView({ behavior: 'smooth' }); };
  if ($('#clear-search')) $('#clear-search').onclick = () => { if ($('#search')) $('#search').value = ''; S.q = ''; S.filter = 'all'; $$('#filters .pill').forEach(x => x.classList.toggle('active', x.dataset.f === 'all')); applyFilter(); }; applyFilter(); }  function matches(m) { const f = S.filter, q = window.norm(S.q.trim()); const okF = f === 'all' \vert{}\vert{} m.st === f \vert{}\vert{} m.fm.includes(f); const okQ = !q \vert{}\vert{} window.norm([m.t, m.sub, m.dir, m.cast, m.g, m.fm.join(' '), m.st === 'now' ? 'dang chieu' : 'sap chieu'].join(' ')).includes(q); return m.st !== 'off' && okF && okQ; }  function applyFilter() { const cards = $$('.cinema-poster-card'); let n = 0;
  cards.forEach(c => {
    const m = MOVIES.find(x => x.id === c.dataset.id), ok = matches(m);
    if (ok) { n++; c.hidden = false; requestAnimationFrame(() => c.classList.remove('out')); }
    else { c.classList.add('out'); setTimeout(() => { if (c.classList.contains('out')) c.hidden = true; }, reduce ? 0 : 250); }
  });
  if ($('#empty-state')) $('#empty-state').hidden = n > 0;
  if ($('#movie-count')) $('#movie-count').textContent = n ? `${n} phim` : '';
}

function initShowtimes() {
  if ($('#st-dates')) $('#st-dates').innerHTML = DATES.map((d, i) => `<button class="pill${i ? '' : ' active'}" data-k="${d.k}">${d.l}</button>`).join('');
  if ($('#st-cinemas')) $('#st-cinemas').innerHTML = `<button class="pill active" data-c="all">Tất cả rạp</button>` + CINEMAS.map(c => `<button class="pill" data-c="${c.id}">${c.n}</button>`).join('');
  if ($('#st-dates')) $('#st-dates').onclick = e => { const p = e.target.closest('.pill'); if (!p) return; S.stDate = p.dataset.k; $$('#st-dates .pill').forEach(x => x.classList.toggle('active', x === p)); renderShowtimes(); };
  if ($('#st-cinemas')) $('#st-cinemas').onclick = e => { const p = e.target.closest('.pill'); if (!p) return; S.stCin = p.dataset.c; $$('#st-cinemas .pill').forEach(x => x.classList.toggle('active', x === p)); renderShowtimes(); };
  if ($('#st-list')) $('#st-list').onclick = e => {
    const b = e.target.closest('.time-chip'); if (!b || b.disabled) return;
    if (b.dataset.show) {
      const show = LIVE_SHOWS.find(x => String(x.maSuat) === b.dataset.show);
      if (!show) return toast('Suất chiếu không còn trong dữ liệu. Vui lòng tải lại trang.');
      const movie = MOVIES.find(m => String(m.id) === String(show.maPhim)) || MOVIES.find(m => norm(m.t) === norm(show.tenPhim));
      const cin = CINEMAS.find(c => String(c.id) === String(show.maRap)) || CINEMAS[0];
      if (!movie || !cin) return toast('Không ánh xạ được phim hoặc rạp của suất chiếu này.');
      openBooking(movie, { cin, time: String(show.gioBatDau || '').slice(0, 5), date: S.stDate, apiShow: show });
      return;
    }
    openBooking(MOVIES.find(m => m.id === b.dataset.m), { cin: CINEMAS.find(c => c.id === b.dataset.c), time: b.dataset.t, date: S.stDate });
  };
  renderShowtimes();
}

function renderShowtimes() {
  const list = $('#st-list'); if (!list) return;
  const now = new Date(), isToday = S.stDate === DATES[0].k, nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (LIVE_SHOWS.length) {
    const wantedDate = DATES.find(d => d.k === S.stDate);
    const dateToken = wantedDate ? wantedDate.k : S.stDate;
    const rows = LIVE_SHOWS.filter(show => {
      const movie = MOVIES.find(m => String(m.id) === String(show.maPhim)) || MOVIES.find(m => norm(m.t) === norm(show.tenPhim));
      const cin = CINEMAS.find(c => String(c.id) === String(show.maRap));
      const dateValue = String(show.ngayChieu || '').slice(0, 10);
      const dateDisplay = dateValue ? `${dateValue.slice(8,10)}/${dateValue.slice(5,7)}` : '';
      const status = norm(String(show.trangThai || ''));
      const time = String(show.gioBatDau || '').slice(0, 5);
      return movie && movie.st === 'now' && cin && dateDisplay === dateToken &&
        (S.stCin === 'all' || String(cin.id) === String(S.stCin)) &&
        !/huy|cancel|ngung|off/.test(status) && !(isToday && time < nowStr);
    });
    const byMovie = new Map();
    rows.forEach(show => {
      const movie = MOVIES.find(m => String(m.id) === String(show.maPhim)) || MOVIES.find(m => norm(m.t) === norm(show.tenPhim));
      const cin = CINEMAS.find(c => String(c.id) === String(show.maRap));
      if (!byMovie.has(movie.id)) byMovie.set(movie.id, { movie, cinemas: new Map() });
      const group = byMovie.get(movie.id);
      if (!group.cinemas.has(cin.id)) group.cinemas.set(cin.id, { cinema: cin, shows: [] });
      group.cinemas.get(cin.id).shows.push(show);
    });
    list.innerHTML = [...byMovie.values()].map(group => `<div class="st-row"><div class="st-movie">${poster(group.movie)}<div><h3>${group.movie.t}</h3><p>${group.movie.d} · ${group.movie.fm.join(' / ')} · ${group.movie.age}</p></div></div><div class="st-cins">${[...group.cinemas.values()].map(item => `<div class="st-cin"><span class="st-cin-name">${item.cinema.n}</span><div class="st-times">${item.shows.sort((a,b) => String(a.gioBatDau).localeCompare(String(b.gioBatDau))).map(show => `<button class="time-chip" data-show="${String(show.maSuat)}">${String(show.gioBatDau || '').slice(0,5)}</button>`).join('')}</div></div>`).join('')}</div></div>`).join('') || '<p class="muted">Không có suất chiếu từ database cho ngày/rạp đã chọn.</p>';
    return;
  }
  const cins = CINEMAS.filter(c => S.stCin === 'all' || c.id === S.stCin);
  list.innerHTML = MOVIES.filter(m => m.st === 'now').map(m => {
    const rows = cins.filter(c => c.fm.some(f => m.fm.includes(f))).map(c => {
      const times = TIMES.map((t, i) => ((i + c.id.charCodeAt(0)) % 5 === 4) ? '' : `<button class="time-chip" data-m="${m.id}" data-c="${c.id}" data-t="${t}" ${isToday && t < nowStr ? 'disabled' : ''}>${t}</button>`).join('');
      return `<div class="st-cin"><span class="st-cin-name">${c.n}</span><div class="st-times">${times}</div></div>`;
    }).join('');
    return `<div class="st-row"><div class="st-movie">${poster(m)}<div><h3>${m.t}</h3><p>${m.d} · ${m.fm.join(' / ')} · ${m.age}</p></div></div><div class="st-cins">${rows || '<p class="muted">Không có suất ở rạp này.</p>'}</div></div>`;
  }).join('');
}

function initStatic() {
  if ($('#cinema-grid')) {
    $('#cinema-grid').innerHTML = CINEMAS.map(c => `<article class="cinema-card"><h3>${c.n}</h3><p>${c.a}</p><div class="cin-meta"><span>${c.rooms} phòng chiếu</span>${c.fm.map(f => `<span class="tag">${f}</span>`).join('')}</div><button class="btn-glass" data-c="${c.id}">Xem lịch chiếu</button></article>`).join('');
    $('#cinema-grid').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; S.stCin = b.dataset.c; $$('#st-cinemas .pill').forEach(x => x.classList.toggle('active', x.dataset.c === S.stCin)); renderShowtimes(); if ($('#showtimes')) $('#showtimes').scrollIntoView({ behavior: 'smooth' }); };
  }
  if ($('#promo-grid')) {
    $('#promo-grid').innerHTML = Object.entries(PROMOS).map(([k, p]) => `<button class="promo-card" data-code="${k}"><strong>${k}</strong><span>${p.t}</span><em>Sao chép mã</em></button>`).join('');
    $('#promo-grid').onclick = e => { const b = e.target.closest('.promo-card'); if (!b) return; navigator.clipboard?.writeText(b.dataset.code).catch(() => {}); toast(`Đã sao chép mã ${b.dataset.code}`); };
  }
}

function drawSeats(el, sold, selected, onToggle, liveData = null) {
  if (!el) return;
  if (liveData) {
    const available = Array.isArray(liveData.available) ? liveData.available : (Array.isArray(liveData) ? liveData : []);
    const soldRows = Array.isArray(liveData.sold) ? liveData.sold : [];
    const all = [...available.map(seat => ({ ...seat, _sold: false })), ...soldRows.map(seat => ({ ...seat, _sold: true }))];
    if (!all.length) {
      el.innerHTML = '<p class="muted seat-empty">Không có dữ liệu ghế cho suất chiếu này. Vui lòng thử suất khác.</p>';
      return;
    }
    const groups = new Map();
    all.forEach(seat => {
      const label = String(seat.hangGhe || seat.soGhe || '').trim().match(/^[A-Za-z]+/)?.[0] || 'Ghế';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(seat);
    });
    const typeOf = seat => {
      const raw = String(seat.loaiGhe || '').toLowerCase();
      if (raw.includes('đôi') || raw.includes('doi') || raw.includes('couple')) return 'couple';
      if (raw.includes('vip')) return 'vip';
      return 'standard';
    };
    el.innerHTML = [...groups.entries()].sort((a,b) => a[0].localeCompare(b[0], 'vi', { numeric: true })).map(([row, seats]) => {
      const buttons = seats.sort((a,b) => String(a.soGhe || '').localeCompare(String(b.soGhe || ''), 'vi', { numeric: true })).map(seat => {
        const id = String(seat.soGhe || seat.maGhe || '').trim();
        const t = typeOf(seat), isSold = seat._sold || soldRows.some(x => String(x.maGhe) === String(seat.maGhe));
        const isSel = selected.some(x => String(x.id) === id);
        const price = Number(seat.gia) > 0 ? Number(seat.gia) : (Number(S.show?.apiShow?.giaSuat) > 0 ? Number(S.show.apiShow.giaSuat) : PRICE[t]);
        return `<button type="button" class="seat-node ${t}${isSold ? ' sold' : ''}${isSel ? ' selected' : ''}" data-id="${id.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-ghe="${String(seat.maGhe || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-price="${price}" data-t="${t}" data-tip="${id} · ${TYPE_NAME[t]} · ${fmt(price)}" aria-label="Ghế ${id}, ${TYPE_NAME[t]}, ${fmt(price)}${isSold ? ', đã bán' : ''}" aria-pressed="${isSel}" ${isSold ? 'disabled' : ''}>${t === 'couple' ? '<b>♥</b>' : id.replace(row, '')}</button>`;
      }).join('');
      return `<div class="seat-row"><span class="row-label">${row}</span>${buttons}<span class="row-label">${row}</span></div>`;
    }).join('');
  } else {
    el.innerHTML = ROWS.map(r => {
      const t = rowType(r), n = rowCount(r); let h = '';
      for (let i = 1; i <= n; i++) {
        const id = r + i, isSold = sold.has(id), isSel = selected.some(s => s.id === id);
        h += `<button type="button" class="seat-node ${t}${isSold ? ' sold' : ''}${isSel ? ' selected' : ''}${i === n / 2 | 0 && t !== 'couple' && i === 5 ? ' aisle' : ''}${t === 'couple' && i === 3 ? ' aisle' : ''}" data-id="${id}" data-t="${t}" data-price="${PRICE[t]}" data-tip="${id} · ${TYPE_NAME[t]} · ${fmt(PRICE[t])}" aria-label="Ghế ${id}, ${TYPE_NAME[t]}, ${fmt(PRICE[t])}${isSold ? ', đã bán' : ''}" aria-pressed="${isSel}" ${isSold ? 'disabled' : ''}>${t === 'couple' ? '<b>♥</b>' : ''}</button>`;
      }
      return `<div class="seat-row"><span class="row-label">${r}</span>${h}<span class="row-label">${r}</span></div>`;
    }).join('');
  }
  el.onclick = e => {
    const b = e.target.closest('.seat-node'); if (!b || b.disabled) return;
    const id = b.dataset.id, i = selected.findIndex(s => s.id === id);
    if (i > -1) { selected.splice(i, 1); b.classList.add('release'); }
    else {
      if (selected.length >= 8) return toast('Tối đa 8 ghế mỗi đơn');
      selected.push({ id, maGhe: b.dataset.ghe || null, price: Number(b.dataset.price) || PRICE[b.dataset.t] || PRICE.standard, t: b.dataset.t });
    }
    b.classList.toggle('selected', i === -1); b.setAttribute('aria-pressed', i === -1);
    if (i > -1) setTimeout(() => b.classList.remove('release'), 450);
    if (i === -1) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
    if (typeof onToggle === 'function') onToggle();
  };
}

function initModal() {
  if ($('#close-modal')) $('#close-modal').onclick = closeModal;
  if ($('#booking-modal')) $('#booking-modal').onmousedown = e => { if (e.target.id === 'booking-modal') closeModal(); };
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#adm-dialog') && !$('#adm-dialog').hidden) { if (typeof closeDlg === 'function') closeDlg(); }
    else if ($('#booking-modal') && $('#booking-modal').classList.contains('active')) closeModal();
    else if (typeof closeDetail === 'function') closeDetail();
  });
}

function openBooking(movie, o = {}) {
  const key0 = showKey(S.show);
  const next = { m: movie, date: o.date || S.stDate, cin: o.cin || CINEMAS.find(c => c.fm.some(f => movie.fm.includes(f))) || CINEMAS[0], time: o.time || '19:30', apiShow: o.apiShow || null };
  if (showKey(next) !== key0 || !S.sel.length) { S.sel = []; }
  S.show = next; S.step = 1;
  if ($('#pay-form')) $('#pay-form').hidden = false;
  if ($('#pay-processing')) $('#pay-processing').hidden = true;
  if ($('#pay-success')) { $('#pay-success').hidden = true; $('#pay-success').innerHTML = ''; }
  if ($('#sum-poster')) $('#sum-poster').src = img(movie.p, 200);
  if ($('#sum-title')) $('#sum-title').textContent = movie.t;
  if ($('#sum-info')) $('#sum-info').textContent = `${next.cin.n} · ${next.cin.room}`;
  if ($('#sum-time')) $('#sum-time').textContent = `${next.time} · ${next.date}`;
  if ($('#screen-name')) $('#screen-name').textContent = 'MÀN HÌNH ' + next.cin.room.replace('Phòng ', '').toUpperCase();
  const loadToken = ++S.seatLoadToken;
  S.apiSeatData = null;
  if ($('#booking-modal')) $('#booking-modal').classList.add('active');
  document.body.classList.add('modal-open');

  if (next.apiShow && typeof API !== 'undefined') {
    if ($('#seat-matrix')) $('#seat-matrix').innerHTML = '<p class="muted seat-empty">Đang tải sơ đồ ghế từ hệ thống…</p>';
    API.layGheTrongTheoSuat(next.apiShow.maSuat).then(data => {
      if (loadToken !== S.seatLoadToken || S.show !== next) return;
      S.apiSeatData = data && typeof data === 'object' ? data : { available: [], sold: [] };
      const all = [...(S.apiSeatData.available || (Array.isArray(S.apiSeatData) ? S.apiSeatData : [])), ...(S.apiSeatData.sold || [])];
      S.sel = S.sel.filter(sel => all.some(seat => String(seat.soGhe) === String(sel.id)) && !(S.apiSeatData.sold || []).some(seat => String(seat.soGhe) === String(sel.id)));
      drawSeats($('#seat-matrix'), new Set(), S.sel, typeof update === 'function' ? update : null, S.apiSeatData);
      if (typeof update === 'function') update();
    }).catch(error => {
      if (loadToken !== S.seatLoadToken || S.show !== next) return;
      S.apiSeatData = { available: [], sold: [] };
      if ($('#seat-matrix')) $('#seat-matrix').innerHTML = `<p class="muted seat-empty">Không tải được sơ đồ ghế: ${String(error.message || error).replace(/</g, '&lt;')}</p>`;
      toast('Không tải được ghế từ hệ thống. Vui lòng thử lại.');
    });
  } else {
    drawSeats($('#seat-matrix'), soldFor(next), S.sel, typeof update === 'function' ? update : null);
  }
}

function closeModal() {
  if ($('#booking-modal')) $('#booking-modal').classList.remove('active');
  if ($('#detail') && $('#detail').hidden) document.body.classList.remove('modal-open');
}

/* ================= 5. GẮN TẤT CẢ CÁC HÀM CỐT LÕI VÀO WINDOW ================= */
window.MOVIES = MOVIES;
window.CINEMAS = CINEMAS;
window.TIMES = TIMES;
window.COMBOS = COMBOS;
window.PROMOS = PROMOS;
window.PRICE = PRICE;
window.TYPE_NAME = TYPE_NAME;
window.ROWS = ROWS;
window.DATES = DATES;
window.rowType = rowType;
window.rowCount = rowCount;

window.toast = toast;
window.poster = poster;
window.soldFor = soldFor;
window.showKey = showKey;
window.totals = totals;
window.drawSeats = drawSeats;
window.openBooking = openBooking;
window.closeModal = closeModal;
window.applyFilter = applyFilter;
window.renderShowtimes = renderShowtimes;
window.safeOpenDetail = safeOpenDetail;