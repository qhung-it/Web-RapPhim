/* API client dùng chung cho giao diện Web-RapPhim. */
'use strict';

const getApiBaseUrl = () => {
  const path = window.location.pathname;
  const dirPath = path.substring(0, path.lastIndexOf('/') + 1);
  return `${window.location.origin}${dirPath}api/`.replace(/([^:]\/)\/+/g, '$1');
};

const API = {
  base: getApiBaseUrl(),

  async request(path, options = {}) {
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

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (_) {
        if (!response.ok) {
          console.warn(`[API HTTP ${response.status}] Máy chủ không trả về JSON hợp lệ tại: ${url}`);
        }
        return null;
      }

      if (!response.ok || data.success === false) {
        console.warn(`[API] Yêu cầu tới ${url} thất bại:`, data.message || data.error || `HTTP ${response.status}`);
        return data && Object.keys(data).length > 0 ? data : null;
      }

      return data;
    } catch (e) {
      console.warn(`[API Network Error] Không thể kết nối tới ${url}:`, e.message);
      return null;
    }
  },

  get(path) { return this.request(path); },
  post(path, body = {}) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
  put(path, body = {}) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(path) { return this.request(path, { method: 'DELETE' }); },

  // CÁC HÀM GỌI URI KẾT NỐI TRỰC TIẾP VỚI APISERVLET

  // --- 1. QUẢN LÝ PHIM ---
  layDanhSachPhim() { return this.get('movies'); },
  layPhimDangChieu() { return this.get('movies/now-showing'); },
  layPhimSapChieu() { return this.get('movies/coming-soon'); },
  layChiTietPhim(maPhim) { return this.get(`movies/detail?maPhim=${encodeURIComponent(maPhim)}`); },
  laySuatChieuTheoPhim(maPhim) { return this.get(`movies/showtimes?maPhim=${encodeURIComponent(maPhim)}`); },
  themPhim(phimObj) { return this.post('movies/create', phimObj); },
  capNhatPhim(phimObj) { return this.put('movies/update', phimObj); },
  xoaPhim(maPhim) { return this.delete(`movies/delete?maPhim=${encodeURIComponent(maPhim)}`); },

  // --- 2. QUẢN LÝ SUẤT CHIẾU ---
  layDanhSachSuatChieu() { return this.get('showtimes'); },
  layChiTietSuatChieu(maSuat) { return this.get(`showtimes/detail?maSuat=${encodeURIComponent(maSuat)}`); },
  themSuatChieu(suatChieuObj) { return this.post('showtimes/create', suatChieuObj); },
  capNhatSuatChieu(suatChieuObj) { return this.put('showtimes/update', suatChieuObj); },
  xoaSuatChieu(maSuat) { return this.delete(`showtimes/delete?maSuat=${encodeURIComponent(maSuat)}`); },

  // --- 3. QUẢN LÝ GHẾ ---
  layGheTheoPhong(maPhong) { return this.get(`seats/by-room?maPhong=${encodeURIComponent(maPhong)}`); },
  layGheTrongTheoSuat(maSuat) { return this.get(`seats/available?maSuat=${encodeURIComponent(maSuat)}`); },

  // --- 4. TÀI KHOẢN KHÁCH HÀNG & XÁC THỰC (AUTH) ---
  dangKyKhachHang(khachHangObj) { return this.post('auth/register', khachHangObj); },
  dangNhapKhachHang(email, matKhau) { return this.post('auth/login', { email, matKhau }); },
  quenMatKhau(email) { return this.post('auth/forgot-password', { email }); },
  xacThucOTP(email, otp) { return this.post('auth/verify-otp', { email, otp }); },
  datLaiMatKhau(email, otp, matKhauMoi) { return this.post('auth/reset-password', { email, otp, matKhauMoi }); },

  // --- 5. TÀI KHOẢN NHÂN VIÊN ---
  dangNhapNhanVien(email, matKhau) { return this.post('staff/login', { email, matKhau }); },

  // --- 6. QUẢN LÝ ĐƠN ĐẶT VÉ ---
  layDanhSachDon() { return this.get('bookings'); },
  layChiTietDon(maDon) { return this.get(`bookings/detail?maDon=${encodeURIComponent(maDon)}`); },
  layDonTheoKhachHang(maKH) { return this.get(`bookings/by-customer?maKH=${encodeURIComponent(maKH)}`); },
  taoDonDatVe(maKH, maNV) { return this.post('bookings/create', { maKH, maNV }); },
  themComboVaoDon(maDon, maCombo, soLuong) { return this.post('bookings/add-combo', { maDon, maCombo, soLuong }); },
  apDungKhuyenMai(maDon, maKM) { return this.post('bookings/apply-promotion', { maDon, maKM }); },
  xacNhanDon(maDon) { return this.post('bookings/confirm', { maDon }); },
  huyDon(maDon) { return this.post('bookings/cancel', { maDon }); },

  // --- 7. COMBO & KHUYẾN MÃI ---
  layDanhSachCombo() { return this.get('combos'); },
  layDanhSachKhuyenMai() { return this.get('promotions'); },

  // --- 8. THANH TOÁN ---
  taoThanhToan(maDon, soTien, phuongThuc) { return this.post('payments/create', { maDon, soTien, phuongThuc }); },
  xulyThanhToan(maTT) { return this.post('payments/process', { maTT }); },

  // --- 9. THỐNG KÊ DOANH THU ---
  thongKeDoanhThuTheoNgay(ngayYMD) { return this.get(`statistics/revenue-date?ngay=${encodeURIComponent(ngayYMD)}`); }
};