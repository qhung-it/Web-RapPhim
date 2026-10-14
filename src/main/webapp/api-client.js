'use strict';
/* api-client.js — API Client kết nối Backend ApiServlet */

const getApiBaseUrl = () => {
  const path = window.location.pathname;
  const dirPath = path.substring(0, path.lastIndexOf('/') + 1);
  return `${window.location.origin}${dirPath}api/`.replace(/([^:]\/)\/+/g, '$1');
};

/* Bộ chuyển đổi dữ liệu DTO từ Backend Java sang Model Frontend */
const mapPhimDto = p => {
  if (!p) return null;
  return {
    id: String(p.maPhim || p.id || ''),
    t: p.tenPhim || p.t || 'Chưa có tên',
    sub: p.tenGoc || p.sub || '',
    d: p.thoiLuong ? `${p.thoiLuong} phút` : (p.d || '120 phút'),
    g: p.theLoai || p.g || 'Hành động',
    age: p.gioiHanTuoi || p.rated || p.age || 'P',
    r: Number(p.danhGia || p.r || 4.8),
    p: p.hinhAnh || p.poster || p.p || 'photo-1536440136628-849c177e76a1',
    trailer: p.trailer || '',
    fm: Array.isArray(p.dinhDang) ? p.dinhDang : (p.fm || ['2D', 'Vietsub']),
    st: p.trangThai === 'SAP_CHIEU' ? 'soon' : (p.st || 'now'),
    desc: p.moTa || p.desc || '',
    dir: p.daoDien || p.dir || '',
    cast: p.dienVien || p.cast || ''
  };
};

const API = {
  base: getApiBaseUrl(),

  async request(path, options = {}, silentError = false) {
    const cleanPath = String(path).replace(/^\/+/, '');
    const url = `${this.base}${cleanPath}`;

    try {
      const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        }
      });

      if (response.status === 401 || response.status === 404) {
        return null; // Trả về null êm ái khi chưa đăng nhập hoặc không tìm thấy API
      }

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (_) {
        return null;
      }

      if (!response.ok || data.success === false) {
        if (!silentError) {
          console.warn(`[API] ${url}:`, data.message || `HTTP ${response.status}`);
        }
        return null;
      }

      return data;
    } catch (e) {
      if (!silentError) {
        console.warn(`[API Network Error] ${url}:`, e.message);
      }
      return null;
    }
  },

  get(path, silent = false) { return this.request(path, {}, silent); },
  post(path, body = {}) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
  put(path, body = {}) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(path) { return this.request(path, { method: 'DELETE' }); },

  /* CÁC HÀM API CHÍNH */
  async layDanhSachPhim() {
    const data = await this.get('movies');
    if (Array.isArray(data)) return data.map(mapPhimDto);
    if (data && Array.isArray(data.movies)) return data.movies.map(mapPhimDto);
    return null;
  },

  layPhimDangChieu() { return this.get('movies/now-showing'); },
  layPhimSapChieu() { return this.get('movies/coming-soon'); },
  layChiTietPhim(maPhim) { return this.get(`movies/detail?maPhim=${encodeURIComponent(maPhim)}`); },
  laySuatChieuTheoPhim(maPhim) { return this.get(`movies/showtimes?maPhim=${encodeURIComponent(maPhim)}`); },
  themPhim(phimObj) { return this.post('movies/create', phimObj); },
  capNhatPhim(phimObj) { return this.put('movies/update', phimObj); },
  xoaPhim(maPhim) { return this.delete(`movies/delete?maPhim=${encodeURIComponent(maPhim)}`); },

  layDanhSachSuatChieu() { return this.get('showtimes'); },
  layGheTheoPhong(maPhong) { return this.get(`seats/by-room?maPhong=${encodeURIComponent(maPhong)}`); },

  dangKyKhachHang(khachHangObj) { return this.post('auth/register', khachHangObj); },
  dangNhapKhachHang(email, matKhau) { return this.post('auth/login', { email, matKhau }); },
  quenMatKhau(email) { return this.post('auth/forgot-password', { email }); },
  xacThucOTP(email, otp) { return this.post('auth/verify-otp', { email, otp }); },
  datLaiMatKhau(email, otp, matKhauMoi) { return this.post('auth/reset-password', { email, otp, matKhauMoi }); },

  dangNhapNhanVien(email, matKhau) { return this.post('staff/login', { email, matKhau }); },

  layDanhSachDon() { return this.get('bookings'); },
  layChiTietDon(maDon) { return this.get(`bookings/detail?maDon=${encodeURIComponent(maDon)}`); },
  layDonTheoKhachHang(maKH) { return this.get(`bookings/by-customer?maKH=${encodeURIComponent(maKH)}`); },
  taoDonDatVe(maKH, maNV) { return this.post('bookings/create', { maKH, maNV }); },
  apDungKhuyenMai(maDon, maKM) { return this.post('bookings/apply-promotion', { maDon, maKM }); },
  xacNhanDon(maDon) { return this.post('bookings/confirm', { maDon }); },
  huyDon(maDon) { return this.post('bookings/cancel', { maDon }); },

  layDanhSachCombo() { return this.get('combos'); },
  layDanhSachKhuyenMai() { return this.get('promotions'); },
  taoThanhToan(maDon, soTien, phuongThuc) { return this.post('payments/create', { maDon, soTien, phuongThuc }); },
  xulyThanhToan(maTT) { return this.post('payments/process', { maTT }); }
};

window.API = API;
window.mapPhimDto = mapPhimDto;