/*
    Web-RapPhim - SQL Server database bootstrap
    Database: db_web_rapphim
    Compatible with entity/table names in the supplied project.

    HOW TO USE:
      1. Open this file in SQL Server Management Studio (SSMS).
      2. Connect to the intended SQL Server instance using Windows Authentication.
      3. Execute the whole script.

    This script does NOT drop an existing database or existing tables.
    It creates missing tables and inserts sample rows only when their keys do not exist.
    Sample account passwords below are for local/demo testing only; replace them before deployment.
*/

USE master;
GO
IF DB_ID(N'db_web_rapphim') IS NULL
BEGIN
    CREATE DATABASE db_web_rapphim;
END;
GO
USE db_web_rapphim;
GO

/* 1. Lookup/master tables */
IF OBJECT_ID(N'dbo.LoaiKhachHang', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LoaiKhachHang (
        maLoai       VARCHAR(20) NOT NULL CONSTRAINT PK_LoaiKhachHang PRIMARY KEY,
        tenLoai      NVARCHAR(100) NOT NULL,
        moTa         NVARCHAR(255) NULL,
        mucUuDai     DECIMAL(12,2) NULL CONSTRAINT DF_LoaiKhachHang_mucUuDai DEFAULT (0)
    );
END;
GO

IF OBJECT_ID(N'dbo.Rap', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Rap (
        maRap        VARCHAR(20) NOT NULL CONSTRAINT PK_Rap PRIMARY KEY,
        tenRap       NVARCHAR(150) NOT NULL,
        diaChi       NVARCHAR(255) NULL,
        soDienThoai  VARCHAR(20) NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.Phim', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Phim (
        maPhim       VARCHAR(20) NOT NULL CONSTRAINT PK_Phim PRIMARY KEY,
        tenPhim      NVARCHAR(200) NOT NULL,
        theLoai      NVARCHAR(100) NULL,
        thoiLuong    INT NOT NULL CONSTRAINT DF_Phim_thoiLuong DEFAULT (0),
        doTuoi       INT NOT NULL CONSTRAINT DF_Phim_doTuoi DEFAULT (0),
        moTa         NVARCHAR(MAX) NULL,
        poster       VARCHAR(500) NULL,
        trailer      VARCHAR(500) NULL,
        trangThai    VARCHAR(30) NOT NULL CONSTRAINT DF_Phim_trangThai DEFAULT ('DangChieu'),
        CONSTRAINT CK_Phim_trangThai CHECK (trangThai IN ('DangChieu','SapChieu','NgungChieu'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Combo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Combo (
        maCombo      VARCHAR(20) NOT NULL CONSTRAINT PK_Combo PRIMARY KEY,
        tenCombo     NVARCHAR(100) NOT NULL,
        moTa         NVARCHAR(255) NULL,
        gia          DECIMAL(12,2) NOT NULL,
        trangThai    VARCHAR(30) NOT NULL CONSTRAINT DF_Combo_trangThai DEFAULT ('DangBan'),
        CONSTRAINT CK_Combo_gia CHECK (gia >= 0),
        CONSTRAINT CK_Combo_trangThai CHECK (trangThai IN ('DangBan','NgungBan'))
    );
END;
GO

IF OBJECT_ID(N'dbo.KhuyenMai', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.KhuyenMai (
        maKM          VARCHAR(20) NOT NULL CONSTRAINT PK_KhuyenMai PRIMARY KEY,
        tenKM         NVARCHAR(150) NOT NULL,
        moTa          NVARCHAR(255) NULL,
        phanTramGiam  DECIMAL(12,2) NOT NULL,
        ngayBatDau    DATE NOT NULL,
        ngayKetThuc   DATE NOT NULL,
        trangThai     VARCHAR(30) NOT NULL CONSTRAINT DF_KhuyenMai_trangThai DEFAULT ('DangHoatDong'),
        CONSTRAINT CK_KhuyenMai_phanTram CHECK (phanTramGiam >= 0 AND phanTramGiam <= 100),
        CONSTRAINT CK_KhuyenMai_ngay CHECK (ngayKetThuc >= ngayBatDau),
        CONSTRAINT CK_KhuyenMai_trangThai CHECK (trangThai IN ('DangHoatDong','HetHan','NgungHoatDong'))
    );
END;
GO

IF OBJECT_ID(N'dbo.NhanVien', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NhanVien (
        maNV          VARCHAR(20) NOT NULL CONSTRAINT PK_NhanVien PRIMARY KEY,
        hoTen         NVARCHAR(100) NOT NULL,
        email         VARCHAR(150) NULL,
        matKhau       NVARCHAR(255) NOT NULL,
        soDienThoai   VARCHAR(20) NULL,
        chucVu        VARCHAR(30) NOT NULL CONSTRAINT DF_NhanVien_chucVu DEFAULT ('NhanVienBanVe'),
        CONSTRAINT CK_NhanVien_chucVu CHECK (chucVu IN ('NhanVienBanVe','NhanVienKiemVe','QuanLy','Admin'))
    );
    CREATE UNIQUE INDEX UX_NhanVien_email ON dbo.NhanVien(email) WHERE email IS NOT NULL;
END;
GO

/* 2. Rooms, seats, customers and showtimes */
IF OBJECT_ID(N'dbo.PhongChieu', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PhongChieu (
        maPhong       VARCHAR(20) NOT NULL CONSTRAINT PK_PhongChieu PRIMARY KEY,
        tenPhong      NVARCHAR(100) NOT NULL,
        loaiPhong     VARCHAR(50) NOT NULL CONSTRAINT DF_PhongChieu_loaiPhong DEFAULT ('THUONG'),
        soLuongGhe    INT NOT NULL,
        trangThai     VARCHAR(30) NOT NULL CONSTRAINT DF_PhongChieu_trangThai DEFAULT ('HoatDong'),
        maRap         VARCHAR(20) NOT NULL,
        CONSTRAINT FK_PhongChieu_Rap FOREIGN KEY (maRap) REFERENCES dbo.Rap(maRap),
        CONSTRAINT CK_PhongChieu_soLuongGhe CHECK (soLuongGhe >= 0),
        CONSTRAINT CK_PhongChieu_loaiPhong CHECK (loaiPhong IN ('THUONG','VIP','THREE_D','FOUR_D')),
        CONSTRAINT CK_PhongChieu_trangThai CHECK (trangThai IN ('HoatDong','BaoTri','NgungHoatDong'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Ghe', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Ghe (
        maGhe         VARCHAR(20) NOT NULL CONSTRAINT PK_Ghe PRIMARY KEY,
        soGhe         INT NOT NULL,
        hangGhe       VARCHAR(10) NOT NULL,
        loaiGhe       VARCHAR(20) NOT NULL CONSTRAINT DF_Ghe_loaiGhe DEFAULT ('Thuong'),
        gia           DECIMAL(12,2) NOT NULL CONSTRAINT DF_Ghe_gia DEFAULT (0),
        maPhong       VARCHAR(20) NOT NULL,
        CONSTRAINT FK_Ghe_PhongChieu FOREIGN KEY (maPhong) REFERENCES dbo.PhongChieu(maPhong),
        CONSTRAINT CK_Ghe_soGhe CHECK (soGhe > 0),
        CONSTRAINT CK_Ghe_gia CHECK (gia >= 0),
        CONSTRAINT CK_Ghe_loaiGhe CHECK (loaiGhe IN ('Thuong','Vip','Couple')),
        CONSTRAINT UQ_Ghe_Phong_Hang_So UNIQUE (maPhong, hangGhe, soGhe)
    );
END;
GO

IF OBJECT_ID(N'dbo.KhachHang', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.KhachHang (
        maKH          VARCHAR(20) NOT NULL CONSTRAINT PK_KhachHang PRIMARY KEY,
        hoTen         NVARCHAR(100) NOT NULL,
        email         VARCHAR(150) NOT NULL,
        matKhau       NVARCHAR(255) NOT NULL,
        soDienThoai   VARCHAR(20) NULL,
        ngaySinh      DATE NULL,
        maLoai        VARCHAR(20) NOT NULL,
        CONSTRAINT FK_KhachHang_LoaiKhachHang FOREIGN KEY (maLoai) REFERENCES dbo.LoaiKhachHang(maLoai)
    );
    CREATE UNIQUE INDEX UX_KhachHang_email ON dbo.KhachHang(email);
END;
GO

IF OBJECT_ID(N'dbo.SuatChieu', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SuatChieu (
        maSuat        VARCHAR(20) NOT NULL CONSTRAINT PK_SuatChieu PRIMARY KEY,
        ngayChieu     DATE NOT NULL,
        gioBatDau     TIME(0) NOT NULL,
        gioKetThuc    TIME(0) NOT NULL,
        giaSuat       DECIMAL(12,2) NOT NULL,
        trangThai     VARCHAR(30) NOT NULL CONSTRAINT DF_SuatChieu_trangThai DEFAULT ('SapChieu'),
        maPhim        VARCHAR(20) NOT NULL,
        maPhong       VARCHAR(20) NOT NULL,
        CONSTRAINT FK_SuatChieu_Phim FOREIGN KEY (maPhim) REFERENCES dbo.Phim(maPhim),
        CONSTRAINT FK_SuatChieu_PhongChieu FOREIGN KEY (maPhong) REFERENCES dbo.PhongChieu(maPhong),
        CONSTRAINT CK_SuatChieu_gia CHECK (giaSuat >= 0),
        CONSTRAINT CK_SuatChieu_gio CHECK (gioKetThuc > gioBatDau),
        CONSTRAINT CK_SuatChieu_trangThai CHECK (trangThai IN ('SapChieu','DangChieu','DaKetThuc','Huy'))
    );
    CREATE INDEX IX_SuatChieu_Ngay_Phim ON dbo.SuatChieu(ngayChieu, maPhim);
END;
GO

/* 3. Payment is created before DonDatVe to avoid a circular FK */
IF OBJECT_ID(N'dbo.ThanhToan', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ThanhToan (
        maTT          VARCHAR(20) NOT NULL CONSTRAINT PK_ThanhToan PRIMARY KEY,
        thoiGian      DATETIME2(0) NOT NULL,
        soTien        DECIMAL(12,2) NOT NULL,
        phuongThuc    VARCHAR(30) NOT NULL CONSTRAINT DF_ThanhToan_phuongThuc DEFAULT ('TienMat'),
        trangThai     VARCHAR(30) NOT NULL CONSTRAINT DF_ThanhToan_trangThai DEFAULT ('DangXuLy'),
        CONSTRAINT CK_ThanhToan_soTien CHECK (soTien >= 0),
        CONSTRAINT CK_ThanhToan_phuongThuc CHECK (phuongThuc IN ('TienMat','ChuyenKhoan','The')),
        CONSTRAINT CK_ThanhToan_trangThai CHECK (trangThai IN ('DangXuLy','ThanhCong','ThatBai'))
    );
END;
GO

IF OBJECT_ID(N'dbo.DonDatVe', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DonDatVe (
        maDon         VARCHAR(20) NOT NULL CONSTRAINT PK_DonDatVe PRIMARY KEY,
        ngayDat       DATETIME2(0) NOT NULL,
        tongTien      DECIMAL(12,2) NOT NULL CONSTRAINT DF_DonDatVe_tongTien DEFAULT (0),
        tienGiam      DECIMAL(12,2) NOT NULL CONSTRAINT DF_DonDatVe_tienGiam DEFAULT (0),
        trangThai     VARCHAR(30) NOT NULL CONSTRAINT DF_DonDatVe_trangThai DEFAULT ('ChoThanhToan'),
        maKH          VARCHAR(20) NOT NULL,
        maNV          VARCHAR(20) NULL,
        maKM          VARCHAR(20) NULL,
        maTT          VARCHAR(20) NULL,
        CONSTRAINT FK_DonDatVe_KhachHang FOREIGN KEY (maKH) REFERENCES dbo.KhachHang(maKH),
        CONSTRAINT FK_DonDatVe_NhanVien FOREIGN KEY (maNV) REFERENCES dbo.NhanVien(maNV),
        CONSTRAINT FK_DonDatVe_KhuyenMai FOREIGN KEY (maKM) REFERENCES dbo.KhuyenMai(maKM),
        CONSTRAINT FK_DonDatVe_ThanhToan FOREIGN KEY (maTT) REFERENCES dbo.ThanhToan(maTT),
        CONSTRAINT UQ_DonDatVe_maTT UNIQUE (maTT),
        CONSTRAINT CK_DonDatVe_tien CHECK (tongTien >= 0 AND tienGiam >= 0),
        CONSTRAINT CK_DonDatVe_trangThai CHECK (trangThai IN ('ChoThanhToan','DaThanhToan','DaHuy'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Ve', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Ve (
        maVe          VARCHAR(20) NOT NULL CONSTRAINT PK_Ve PRIMARY KEY,
        maVeDienTu    VARCHAR(100) NULL,
        giaVe         DECIMAL(12,2) NOT NULL,
        trangThai     VARCHAR(30) NOT NULL CONSTRAINT DF_Ve_trangThai DEFAULT ('ChuaSuDung'),
        maDon         VARCHAR(20) NOT NULL,
        maSuat        VARCHAR(20) NOT NULL,
        maGhe         VARCHAR(20) NOT NULL,
        CONSTRAINT FK_Ve_DonDatVe FOREIGN KEY (maDon) REFERENCES dbo.DonDatVe(maDon),
        CONSTRAINT FK_Ve_SuatChieu FOREIGN KEY (maSuat) REFERENCES dbo.SuatChieu(maSuat),
        CONSTRAINT FK_Ve_Ghe FOREIGN KEY (maGhe) REFERENCES dbo.Ghe(maGhe),
        CONSTRAINT UQ_Ve_SuatChieu_Ghe UNIQUE (maSuat, maGhe),
        CONSTRAINT UQ_Ve_maVeDienTu UNIQUE (maVeDienTu),
        CONSTRAINT CK_Ve_giaVe CHECK (giaVe >= 0),
        CONSTRAINT CK_Ve_trangThai CHECK (trangThai IN ('ChuaSuDung','DaSuDung','DaHuy'))
    );
END;
GO

IF OBJECT_ID(N'dbo.ChiTietCombo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChiTietCombo (
        id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ChiTietCombo PRIMARY KEY,
        soLuong       INT NOT NULL,
        donGia        DECIMAL(12,2) NOT NULL,
        thanhTien     DECIMAL(12,2) NOT NULL,
        maDon         VARCHAR(20) NOT NULL,
        maCombo       VARCHAR(20) NOT NULL,
        CONSTRAINT FK_ChiTietCombo_DonDatVe FOREIGN KEY (maDon) REFERENCES dbo.DonDatVe(maDon),
        CONSTRAINT FK_ChiTietCombo_Combo FOREIGN KEY (maCombo) REFERENCES dbo.Combo(maCombo),
        CONSTRAINT CK_ChiTietCombo_soLuong CHECK (soLuong > 0),
        CONSTRAINT CK_ChiTietCombo_tien CHECK (donGia >= 0 AND thanhTien >= 0)
    );
END;
GO

/* 4. Demo seed data. These inserts are safe to re-run. */
IF NOT EXISTS (SELECT 1 FROM dbo.LoaiKhachHang WHERE maLoai='LKH01')
    INSERT dbo.LoaiKhachHang(maLoai,tenLoai,moTa,mucUuDai) VALUES
    ('LKH01',N'Đồng',N'Hạng mặc định',0),
    ('LKH02',N'Bạc',N'Thành viên Bạc',5),
    ('LKH03',N'Vàng',N'Thành viên Vàng',10);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE maNV='NV01')
    INSERT dbo.NhanVien(maNV,hoTen,email,matKhau,soDienThoai,chucVu) VALUES
    ('NV01',N'Quản trị viên','admin@rapphim.com',N'admin123','0911111111','Admin'),
    ('NV02',N'Nhân viên bán vé','nv1@rapphim.com',N'123456','0922222222','NhanVienBanVe'),
    ('NV03',N'Nhân viên soát vé','nv2@rapphim.com',N'123456','0933333333','NhanVienKiemVe'),
    ('NV04',N'Quản lý rạp','manager@rapphim.com',N'123456','0944444444','QuanLy');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE maKH='KH01')
    INSERT dbo.KhachHang(maKH,hoTen,email,matKhau,soDienThoai,ngaySinh,maLoai) VALUES
    ('KH01',N'Nguyễn Văn A','khach1@gmail.com',N'123456','0901234567','1995-05-15','LKH01'),
    ('KH02',N'Trần Thị B','khach2@gmail.com',N'123456','0907654321','1998-08-20','LKH02');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Rap WHERE maRap='RAP01')
    INSERT dbo.Rap(maRap,tenRap,diaChi,soDienThoai) VALUES
    ('RAP01',N'Cinema Center Quận 1',N'123 Nguyễn Huệ, Quận 1, TP.HCM','0281234567'),
    ('RAP02',N'Cinema Grand Cầu Giấy',N'456 Cầu Giấy, Hà Nội','0247654321');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.PhongChieu WHERE maPhong='P01')
    INSERT dbo.PhongChieu(maPhong,tenPhong,loaiPhong,soLuongGhe,trangThai,maRap) VALUES
    ('P01',N'Phòng 01 - 2D','THUONG',50,'HoatDong','RAP01'),
    ('P02',N'Phòng 02 - VIP','VIP',50,'HoatDong','RAP01'),
    ('P03',N'Phòng 01 - 2D','THUONG',50,'HoatDong','RAP02');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Phim WHERE maPhim='P_MAI')
    INSERT dbo.Phim(maPhim,tenPhim,theLoai,thoiLuong,doTuoi,moTa,poster,trailer,trangThai) VALUES
    ('P_MAI',N'Mai',N'Tâm lý, Tình cảm',131,18,N'Dữ liệu phim mẫu để kiểm thử ứng dụng.','poster_mai.jpg','https://youtube.com','DangChieu'),
    ('P_DUNE2',N'Dune: Hành Tinh Cát II',N'Hành động, Viễn tưởng',166,16,N'Dữ liệu phim mẫu để kiểm thử ứng dụng.','poster_dune.jpg','https://youtube.com','DangChieu');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.SuatChieu WHERE maSuat='SC01')
    INSERT dbo.SuatChieu(maSuat,ngayChieu,gioBatDau,gioKetThuc,giaSuat,trangThai,maPhim,maPhong) VALUES
    ('SC01','2026-10-15','18:00','20:15',90000,'SapChieu','P_MAI','P01'),
    ('SC02','2026-10-15','20:30','23:15',110000,'SapChieu','P_DUNE2','P01');
GO

/* Generate 50 seats in P01 and P02 if missing. */
DECLARE @room VARCHAR(20), @row INT, @seat INT, @rowChar VARCHAR(10), @seatId VARCHAR(20), @seatType VARCHAR(20), @seatPrice DECIMAL(12,2);
DECLARE room_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT maPhong FROM dbo.PhongChieu WHERE maPhong IN ('P01','P02');
OPEN room_cursor;
FETCH NEXT FROM room_cursor INTO @room;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @row = 0;
    WHILE @row < 5
    BEGIN
        SET @rowChar = CHAR(ASCII('A') + @row);
        SET @seat = 1;
        WHILE @seat <= 10
        BEGIN
            SET @seatId = CONCAT(@room, '_', @rowChar, RIGHT(CONCAT('0', CONVERT(VARCHAR(2),@seat)),2));
            IF @row >= 3 BEGIN SET @seatType='Vip'; SET @seatPrice=20000; END
            ELSE BEGIN SET @seatType='Thuong'; SET @seatPrice=0; END;
            IF NOT EXISTS (SELECT 1 FROM dbo.Ghe WHERE maGhe=@seatId)
                INSERT dbo.Ghe(maGhe,soGhe,hangGhe,loaiGhe,gia,maPhong) VALUES(@seatId,@seat,@rowChar,@seatType,@seatPrice,@room);
            SET @seat = @seat + 1;
        END;
        SET @row = @row + 1;
    END;
    FETCH NEXT FROM room_cursor INTO @room;
END;
CLOSE room_cursor;
DEALLOCATE room_cursor;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Combo WHERE maCombo='CB01')
    INSERT dbo.Combo(maCombo,tenCombo,moTa,gia,trangThai) VALUES
    ('CB01',N'Combo Bắp Nước Đơn',N'1 bắp ngọt + 1 nước ngọt',75000,'DangBan'),
    ('CB02',N'Combo Bắp Nước Đôi',N'1 bắp lớn + 2 nước ngọt',115000,'DangBan');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.KhuyenMai WHERE maKM='KM10')
    INSERT dbo.KhuyenMai(maKM,tenKM,moTa,phanTramGiam,ngayBatDau,ngayKetThuc,trangThai) VALUES
    ('KM10',N'Giảm 10%',N'Mã khuyến mãi mẫu',10,'2026-01-01','2026-12-31','DangHoatDong');
GO

/* Quick validation */
SELECT N'LoaiKhachHang' AS Bang, COUNT_BIG(*) AS SoDong FROM dbo.LoaiKhachHang
UNION ALL SELECT N'KhachHang', COUNT_BIG(*) FROM dbo.KhachHang
UNION ALL SELECT N'NhanVien', COUNT_BIG(*) FROM dbo.NhanVien
UNION ALL SELECT N'Rap', COUNT_BIG(*) FROM dbo.Rap
UNION ALL SELECT N'PhongChieu', COUNT_BIG(*) FROM dbo.PhongChieu
UNION ALL SELECT N'Ghe', COUNT_BIG(*) FROM dbo.Ghe
UNION ALL SELECT N'Phim', COUNT_BIG(*) FROM dbo.Phim
UNION ALL SELECT N'SuatChieu', COUNT_BIG(*) FROM dbo.SuatChieu
UNION ALL SELECT N'Combo', COUNT_BIG(*) FROM dbo.Combo
UNION ALL SELECT N'KhuyenMai', COUNT_BIG(*) FROM dbo.KhuyenMai;
GO
