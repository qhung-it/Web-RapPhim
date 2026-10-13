'use strict';
/* api-integration.js
 * Các hàm tích hợp dùng chung cho những module còn lại.
 * Dữ liệu trả về giữ nguyên DTO của ApiServlet; không giả lập lưu thành công.
 */

const RapPhimAPI = Object.freeze({
  // Tài khoản khách hàng
  loginCustomer: (email, password) => API.post('auth/login', { email, password }),
  registerCustomer: payload => API.post('auth/register', payload),
  currentCustomer: () => API.get('auth/me'),
  logoutCustomer: () => API.post('auth/logout'),
  updateProfile: payload => API.put('customers/profile', payload),
  changePassword: (matKhauCu, matKhauMoi) => API.put('customers/password', { matKhauCu, matKhauMoi }),
  customerHistory: () => API.get('customers/history'),
  tiers: () => API.get('tiers'),

  // Đặt vé / thanh toán
  createOrder: maKH => API.post('orders/create', maKH ? { maKH } : {}),
  orders: () => API.get('orders'),
  order: maDon => API.get(`orders/${encodeURIComponent(maDon)}`),
  addSeat: (maDon, maSuat, maGhe) => API.post(`orders/${encodeURIComponent(maDon)}/add-seat`, { maSuat, maGhe }),
  addCombo: (maDon, maCombo, soLuong = 1) => API.post(`orders/${encodeURIComponent(maDon)}/add-combo`, { maCombo, soLuong }),
  applyPromotion: (maDon, maKM) => API.post(`orders/${encodeURIComponent(maDon)}/promotion`, { maKM }),
  cancelOrder: maDon => API.post(`orders/${encodeURIComponent(maDon)}/cancel`),
  confirmOrder: maDon => API.post(`orders/${encodeURIComponent(maDon)}/confirm`),
  createPayment: (maDon, soTien, phuongThuc) => API.post('payments/create', { maDon, soTien, phuongThuc }),
  pay: maTT => API.post(`payments/${encodeURIComponent(maTT)}/pay`),
  cancelPayment: maTT => API.post(`payments/${encodeURIComponent(maTT)}/cancel`),
  payment: maTT => API.get(`payments/${encodeURIComponent(maTT)}`),

  // Nhân viên, rạp, phòng, ghế và báo cáo
  staff: () => API.get('staff'),
  seatsForRoom: maPhong => API.get(`seats?room=${encodeURIComponent(maPhong)}`),
  seatsForShow: maSuat => API.get(`seats/show/${encodeURIComponent(maSuat)}`),
  tickets: () => API.get('tickets'),
  ticket: maVe => API.get(`tickets/${encodeURIComponent(maVe)}`),
  validateTicket: maVe => API.post(`tickets/${encodeURIComponent(maVe)}/validate`),
  useTicket: maVe => API.post(`tickets/${encodeURIComponent(maVe)}/use`),
  reportDay: date => API.get(`reports?type=day&date=${encodeURIComponent(date)}`),
  reportMonth: (month, year) => API.get(`reports?type=month&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`),
  reportYear: year => API.get(`reports?type=year&year=${encodeURIComponent(year)}`),

  // Luồng đặt vé: chỉ chạy với mã suất/ghế/combo đã được xác định từ API.
  async checkout({ maKhachHang, maSuat, maGhes, combos = [], maKM = null, phuongThuc = 'ChuyenKhoan' }) {
    if (!maSuat || !Array.isArray(maGhes) || maGhes.length === 0) {
      throw new Error('Cần mã suất chiếu và ít nhất một mã ghế hợp lệ.');
    }
    const orderResponse = await this.createOrder(maKhachHang);
    const order = orderResponse.order || orderResponse;
    const maDon = order.maDon;
    if (!maDon) throw new Error('API không trả về mã đơn đặt vé.');

    try {
      // 1. Thêm danh sách ghế
      for (const maGhe of maGhes) {
        await this.addSeat(maDon, maSuat, maGhe);
      }
      // 2. Thêm combo bắp nước nếu có
      for (const item of combos) {
        if (!item.maCombo || !Number.isInteger(Number(item.soLuong)) || Number(item.soLuong) < 1) {
          throw new Error('Thông tin combo không hợp lệ.');
        }
        await this.addCombo(maDon, item.maCombo, Number(item.soLuong));
      }
      // 3. Áp dụng mã giảm giá nếu có
      if (maKM) await this.applyPromotion(maDon, maKM);

      // 4. Luôn lấy tổng tiền đã tính ở server (bao gồm giảm giá), không tin số tiền từ giao diện.
      const currentOrderResponse = await this.order(maDon);
      const currentOrder = currentOrderResponse.order || currentOrderResponse;
      const gross = Number(currentOrder.tongTien);
      const discount = Number(currentOrder.tienGiam || 0);
      const amountDue = gross - discount;

      if (!Number.isFinite(amountDue) || amountDue < 0) {
        throw new Error('Backend trả về tổng tiền đơn hàng không hợp lệ.');
      }

      // 5. Tạo giao dịch thanh toán
      const paymentResponse = await this.createPayment(maDon, amountDue, phuongThuc);
      const payment = paymentResponse.payment || paymentResponse;
      if (!payment.maTT) throw new Error('API không trả về mã thanh toán.');

      // 6. Xử lý thanh toán
      await this.pay(payment.maTT);

      return {
        order: await this.order(maDon),
        payment: await this.payment(payment.maTT)
      };
    } catch (error) {
      // Cố gắng hủy đơn nếu bất kỳ bước nào thất bại (rollback); giữ lỗi gốc để giao diện hiển thị.
      try { await this.cancelOrder(maDon); } catch (_) {}
      throw error;
    }
  }
});