USE db_web_rapphim;
GO

-- 1. Nạp Loại Khách Hàng
INSERT INTO LoaiKhachHang (maLoai, tenLoai, moTa, mucUuDai) VALUES
('LKH01', N'Đồng', N'Hạng mặc định', 0.00),
('LKH02', N'Bạc', N'Thành viên Bạc', 5.00),
('LKH03', N'Vàng', N'Thành viên Vàng', 10.00);

-- 2. Nạp Khách Hàng (Mật khẩu: 123456)
INSERT INTO KhachHang (maKH, hoTen, email, matKhau, soDienThoai, ngaySinh, maLoai) VALUES
('KH01', N'Nguyễn Văn A', 'khach1@gmail.com', '123456', '0901234567', '1995-05-15', 'LKH01'),
('KH02', N'Trần Thị B', 'khach2@gmail.com', '123456', '0907654321', '1998-08-20', 'LKH02');

-- 3. Nạp Nhân Viên
INSERT INTO NhanVien (maNV, hoTen, email, matKhau, soDienThoai, chucVu) VALUES
('NV01', N'Quản Lý Phim', 'admin@rapphim.com', 'admin123', '0911111111', 'Admin'),
('NV02', N'Lê Văn C', 'nv1@rapphim.com', '123456', '0922222222', 'NhanVienBanVe');

-- 4. Nạp Rạp Phim
INSERT INTO Rap (maRap, tenRap, diaChi, soDienThoai) VALUES
('RAP01', N'Cinema Center Quận 1', N'123 Nguyễn Huệ, Q.1, TP.HCM', '0281234567'),
('RAP02', N'Cinema Grand Cầu Giấy', N'456 Cầu Giấy, Hà Nội', '0247654321');

-- 5. Nạp Phòng Chiếu (Loại phòng: THUONG, VIP, THREE_D, FOUR_D)
INSERT INTO PhongChieu (maPhong, tenPhong, loaiPhong, soLuongGhe, trangThai, maRap) VALUES
('P01', N'Phòng 01 - 2D', 'THUONG', 50, 'HoatDong', 'RAP01'),
('P02', N'Phòng 02 - IMAX', 'VIP', 50, 'HoatDong', 'RAP01');

-- 6. Nạp Phim (Trạng thái: DangChieu, SapChieu, NgungChieu)
INSERT INTO Phim (maPhim, tenPhim, theLoai, thoiLuong, doTuoi, moTa, poster, trailer, trangThai) VALUES
('P_MAI', N'Mai', N'Tâm lý, Tình cảm', 131, 18, N'Phim chiếu rạp hot', 'poster_mai.jpg', 'https://youtube.com', 'DangChieu'),
('P_DUNE2', N'Dune: Hành Tinh Cát II', N'Hành động, Viễn tưởng', 166, 16, N'Bom tấn viễn tưởng', 'poster_dune.jpg', 'https://youtube.com', 'DangChieu');

-- 7. Nạp Suất Chiếu (Trạng thái: SapChieu, DangChieu, DaKetThuc, Huy)
INSERT INTO SuatChieu (maSuat, ngayChieu, gioBatDau, gioKetThuc, giaSuat, trangThai, maPhim, maPhong) VALUES
('SC01', '2026-10-15', '18:00:00', '20:15:00', 90000.00, 'SapChieu', 'P_MAI', 'P01'),
('SC02', '2026-10-15', '20:30:00', '23:15:00', 110000.00, 'SapChieu', 'P_DUNE2', 'P01');

-- 8. Nạp Ghế mẫu cho Phòng P01 (Loại ghế: Thuong, Vip, Couple)
INSERT INTO Ghe (maGhe, soGhe, hangGhe, loaiGhe, gia, maPhong) VALUES
('G01', 1, 'A', 'Thuong', 0.00, 'P01'),
('G02', 2, 'A', 'Thuong', 0.00, 'P01'),
('G03', 3, 'A', 'Thuong', 0.00, 'P01'),
('G04', 4, 'A', 'Thuong', 0.00, 'P01'),
('G05', 5, 'B', 'Vip', 20000.00, 'P01'),
('G06', 6, 'B', 'Vip', 20000.00, 'P01');

-- 9. Nạp Combo bắp nước
INSERT INTO Combo (maCombo, tenCombo, moTa, gia, trangThai) VALUES
('CB01', N'Combo Bắp Nước Đơn', N'1 Bắp ngọt + 1 Nước ngọt', 75000.00, 'DangBan'),
('CB02', N'Combo Bắp Nước Đôi', N'1 Bắp ngọt lớn + 2 Nước ngọt', 115000.00, 'DangBan');

-- 10. Nạp Mã Khuyến Mãi
INSERT INTO KhuyenMai (maKM, tenKM, moTa, phanTramGiam, ngayBatDau, ngayKetThuc, trangThai) VALUES
('KM10', N'Giảm 10%', N'Khuyến mãi chào mừng', 10.00, '2026-01-01', '2026-12-31', 'DangHoatDong');
GO