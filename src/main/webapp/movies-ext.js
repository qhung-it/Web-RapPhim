'use strict';
/* movies-ext.js — Trailer, lọc theo thể loại/độ tuổi, lịch chiếu lấy từ dữ liệu suất chiếu (API / DB.showtimes) */

/* ---- Trailer ---- */
function ytId(u) { return /(?:youtu\.be\/|v=|embed\/)([\w-]{11})/.exec(u || '')?.[1]; }

function playTrailer(m) {
  const id = ytId(m.trailer);
  if (!id) {
    window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(m.t + ' trailer'), '_blank', 'noopener');
    return toast('Đã mở trailer trên YouTube');
  }
  let el = $('#trailer-modal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'trailer-modal';
    el.className = 'cx-backdrop';
    document.body.appendChild(el);
    el.onclick = e => { if (e.target === el || e.target.closest('[data-cx-close]')) { el.hidden = true; el.innerHTML = ''; } };
  }
  el.innerHTML = `<div class="cx-box wide"><button class="cx-x" data-cx-close aria-label="Đóng">✕</button><h2>${esc(m.t)} · Trailer</h2><div class="trailer-frame"><iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="Trailer ${esc(m.t)}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div></div>`;
  el.hidden = false;
}

/* ---- Lọc theo thể loại, độ tuổi ---- */
S.g = ''; S.a = '';
const genresOf = m => (m.g || '').split(/\s*·\s*/).filter(Boolean);

function fillExtraFilters() {
  const gs = [...new Set(MOVIES.filter(m => m.st !== 'off').flatMap(genresOf))].sort((a, b) => a.localeCompare(b, 'vi')), sel = $('#f-genre');
  if (!sel) return;
  sel.innerHTML = '<option value="">Mọi thể loại</option>' + gs.map(g => `<option>${esc(g)}</option>`).join('');
  sel.value = gs.includes(S.g) ? S.g : (S.g = '');
}

const _matches = matches;
matches = m => _matches(m) && (!S.g || genresOf(m).includes(S.g)) && (!S.a || m.age === S.a);

const _clearBtn = () => {
  S.g = ''; S.a = '';
  if ($('#f-genre')) $('#f-genre').value = '';
  if ($('#f-age')) $('#f-age').value = '';
  applyFilter();
};

/* ---- Lịch chiếu theo suất chiếu thật từ API / DB ---- */
function renderShowtimes() {
  const now = new Date(), isToday = S.stDate === DATES[0].k, nowStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const cins = CINEMAS.filter(c => S.stCin === 'all' || String(c.id) === String(S.stCin));

  // 1. Ưu tiên dữ liệu suất chiếu thực tế từ API (LIVE_SHOWS)
  if (typeof LIVE_SHOWS !== 'undefined' && LIVE_SHOWS.length) {
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

    $('#st-list').innerHTML = [...byMovie.values()].map(group => `
      <div class="st-row">
        <div class="st-movie">${poster(group.movie)}<div><h3>${group.movie.t}</h3><p>${group.movie.d} · ${group.movie.fm.join(' / ')} · ${group.movie.age}</p></div></div>
        <div class="st-cins">
          ${[...group.cinemas.values()].map(item => `
            <div class="st-cin">
              <span class="st-cin-name">${item.cinema.n}</span>
              <div class="st-times">
                ${item.shows.sort((a,b) => String(a.gioBatDau).localeCompare(String(b.gioBatDau))).map(show =>
                  `<button class="time-chip" data-show="${String(show.maSuat)}">${String(show.gioBatDau || '').slice(0,5)}</button>`
                ).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('') || '<p class="muted">Chưa có suất chiếu từ hệ thống cho ngày/rạp đã chọn.</p>';
    return;
  }

  // 2. Dự phòng: hiển thị dữ liệu showtimes local (DB.showtimes)
  $('#st-list').innerHTML = MOVIES.filter(m => m.st === 'now').map(m => {
    const rows = cins.map(c => ({ c, l: typeof timesFor === 'function' ? timesFor(m, c, S.stDate) : [] })).filter(x => x.l.length).map(({ c, l }) =>
      `<div class="st-cin"><span class="st-cin-name">${c.n}</span><div class="st-times">${l.map(s => `<button class="time-chip" data-m="${m.id}" data-c="${c.id}" data-t="${s.time}" title="${esc(typeof roomById === 'function' && roomById(s.r) ? roomById(s.r).n : '')} · kết thúc ${endTime(s.time, m)}" ${isToday && s.time < nowStr ? 'disabled' : ''}>${s.time}</button>`).join('')}</div></div>`).join('');
    return `<div class="st-row"><div class="st-movie">${poster(m)}<div><h3>${m.t}</h3><p>${m.d} · ${m.fm.join(' / ')} · ${m.age}</p></div></div><div class="st-cins">${rows || '<p class="muted">Chưa có suất chiếu.</p>'}</div></div>`;
  }).join('') || '<p class="muted">Chưa có phim đang chiếu.</p>';
}

if (typeof D !== 'undefined') {
  showTimes = c => typeof timesFor === 'function' ? timesFor(D.m, c, D.date).map(s => s.time) : [];
}

function renderHeroNext(m) {
  if (!m) return;
  const n = new Date(), now = `${pad2(n.getHours())}:${pad2(n.getMinutes())}`;
  for (const cin of CINEMAS) {
    let list = typeof timesFor === 'function' ? timesFor(m, cin, DATES[0].k).filter(s => s.time >= now).map(s => ({ t: s.time, d: DATES[0] })) : [];
    if (typeof timesFor === 'function') {
      list = list.concat(timesFor(m, cin, DATES[1].k).map(s => ({ t: s.time, d: DATES[1] }))).slice(0, 3);
    }
    if (!list.length) continue;
    const container = $('#hero-next');
    if (container) {
      container.innerHTML = `<span class="hero-next-label">Suất gần nhất · ${cin.n}</span>` + list.map(x => `<button class="time-chip" data-t="${x.t}" data-d="${x.d.k}">${x.t}${x.d === DATES[1] ? ' ngày mai' : ''}</button>`).join('');
      container.onclick = e => {
        const b = e.target.closest('.time-chip');
        if (b) openBooking(heroList[heroIdx], { cin, time: b.dataset.t, date: b.dataset.d });
      };
    }
    return;
  }
  if ($('#hero-next')) $('#hero-next').innerHTML = '';
}

const _openBooking = openBooking;
openBooking = function (m, o = {}) {
  _openBooking(m, o);
  if (typeof showRoom === 'function') {
    const r = showRoom(S.show);
    if (r) {
      S.show = { ...S.show, cin: { ...S.show.cin, room: r.n } };
      if ($('#sum-info')) $('#sum-info').textContent = `${S.show.cin.n} · ${r.n}`;
      if ($('#screen-name')) $('#screen-name').textContent = 'MÀN HÌNH ' + r.n.replace('Phòng ', '').toUpperCase();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fillExtraFilters();
  if ($('#f-genre')) $('#f-genre').onchange = e => { S.g = e.target.value; applyFilter(); };
  if ($('#f-age')) $('#f-age').onchange = e => { S.a = e.target.value; applyFilter(); };
  if ($('#clear-search')) $('#clear-search').addEventListener('click', _clearBtn);
  renderShowtimes();
  if (typeof heroList !== 'undefined' && typeof heroIdx !== 'undefined' && heroList[heroIdx]) {
    renderHeroNext(heroList[heroIdx]);
  }
});