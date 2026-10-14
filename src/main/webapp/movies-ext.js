'use strict';
/* movies-ext.js — Trailer, chi tiết phim, lịch chiếu và hình ảnh */

const $ = s => document.querySelector(s); const $$ = s => document.querySelectorAll(s);

function ytId(u) { return /(?:youtu\.be\/|v=|embed\/)([\w-]{11})/.exec(u || '')?.[1]; }

/* Hàm tạo HTML poster ảnh an toàn hỗ trợ cả Unsplash ID và Đường dẫn ảnh URL từ DB */
function poster(m) {
  if (!m) return '';
  const p = m.p || m.hinhAnh || m.poster || '';
  const src = p.startsWith('http') || p.startsWith('/') || p.startsWith('data:')
    ? p
    : `https://images.unsplash.com/${p.startsWith('photo-') ? p : 'photo-1536440136628-849c177e76a1'}?auto=format&fit=crop&w=400&q=80`;
  return `<img class="poster-img" src="${src}" alt="${typeof esc === 'function' ? esc(m.t || '') : (m.t || '')}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80'">`;
}

function playTrailer(m) {
  if (!m) return;
  const id = ytId(m.trailer);
  if (!id) {
    window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent((m.t || '') + ' trailer'), '_blank');
    if (typeof toast === 'function') toast('Đã mở trailer trên YouTube');
    return;
  }
  let el = $('#trailer-modal');
  if (!el) {
    el = document.createElement('div'); el.id = 'trailer-modal'; el.className = 'cx-backdrop';
    document.body.appendChild(el);
    el.onclick = e => { if (e.target === el || e.target.closest('[data-cx-close]')) { el.hidden = true; el.innerHTML = ''; } };
  }
  el.innerHTML = `<div class="cx-box wide"><button class="cx-x" data-cx-close>✕</button><h2>${m.t} · Trailer</h2><div class="trailer-frame"><iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div></div>`;
  el.hidden = false;
}

function openDetail(m) {
  if (!m) return;
  const detail = $('#detail');
  if (!detail) return;
  detail.innerHTML = `
    <div class="detail-box" role="dialog" aria-modal="true">
      <button class="detail-x" data-cx-close>✕</button>
      <div class="detail-body">
        <div class="detail-poster">${poster(m)}</div>
        <div class="detail-info">
          <div class="detail-tags"><span class="badge-gold">${m.age}</span><span class="badge-glass">${Array.isArray(m.fm) ? m.fm.join(' · ') : ''}</span></div>
          <h2>${m.t}</h2>
          <p class="detail-sub">${m.sub || ''}</p>
          <div class="detail-meta"><span>★ ${m.r}</span><span>${m.d}</span><span>${m.g}</span></div>
          <p class="detail-desc">${m.desc || ''}</p>
          <p class="detail-crew"><strong>Đạo diễn:</strong> ${m.dir || '—'}<br><strong>Diễn viên:</strong> ${m.cast || '—'}</p>
          <div class="detail-actions">
            ${m.st === 'now' ? `<button class="btn-primary-gold" id="detail-book-btn">Đặt vé ngay</button>` : ''}
            <button class="btn-glass" id="detail-trailer-btn">▶ Xem trailer</button>
          </div>
        </div>
      </div>
    </div>
  `;
  detail.hidden = false; document.body.classList.add('modal-open');

  const bookBtn = detail.querySelector('#detail-book-btn');
  if (bookBtn) bookBtn.onclick = () => { closeDetail(); if (typeof window.openBooking === 'function') window.openBooking(m); };
  const trailerBtn = detail.querySelector('#detail-trailer-btn');
  if (trailerBtn) trailerBtn.onclick = () => playTrailer(m);
}

function closeDetail() {
  const detail = $('#detail');
  if (detail) detail.hidden = true;
  document.body.classList.remove('modal-open');
}

function renderShowtimes() {
  const list = $('#st-list');
  if (!list) return;

  const movies = window.MOVIES || window.DB?.movies || [];
  if (typeof API !== 'undefined' && API.layDanhSachPhim) {
    API.layDanhSachPhim().then(apiMovies => {
      if (Array.isArray(apiMovies) && apiMovies.length) {
        window.MOVIES = apiMovies;
      }
    }).catch(() => {});
  }

  list.innerHTML = movies.filter(m => m.st === 'now' || !m.st).map(m => `
    <div class="st-row">
      <div class="st-movie">${poster(m)}<div><h3>${m.t}</h3><p>${m.d} · ${Array.isArray(m.fm) ? m.fm.join(' / ') : ''} · ${m.age}</p></div></div>
      <div class="st-cins"><p class="muted">Bấm vào phim để xem suất chiếu chi tiết.</p></div>
    </div>
  `).join('') || '<p class="muted">Chưa có danh sách phim.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  renderShowtimes();
  document.addEventListener('click', e => {
    if (e.target.closest('[data-cx-close]') && e.target.closest('#detail')) closeDetail();
  });
});

window.poster = poster;
window.ytId = ytId;
window.playTrailer = playTrailer;
window.openDetail = openDetail;
window.closeDetail = closeDetail;
window.renderShowtimes = renderShowtimes;