package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.KhachHangServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.KhachHangService;
import com.example.studentapp.apprapphim.model.entity.DonDatVe;
import com.example.studentapp.apprapphim.model.entity.KhachHang;

import java.time.LocalDate;
import java.util.List;

public class KhachHangController {

    private final KhachHangService khachHangService;

    public KhachHangController() {
        this.khachHangService = new KhachHangServiceImpl();
    }

    public boolean dangKy(KhachHang khachHang) {
        if (khachHang == null) {
            throw new IllegalArgumentException("Thông tin đăng ký không được để trống.");
        }
        if (khachHang.getEmail() == null || !khachHang.getEmail().contains("@")) {
            throw new IllegalArgumentException("Email không hợp lệ.");
        }
        return khachHangService.dangKy(khachHang);
    }

    public KhachHang dangNhap(String email, String matKhau) {
        if (email == null || matKhau == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email và mật khẩu không được rỗng.");
        }
        return khachHangService.dangNhap(email.trim(), matKhau);
    }

    public boolean doiMatKhau(String maKH, String matKhauCu, String matKhauMoi) {
        validateMa(maKH, "Mã khách hàng");
        if (matKhauCu == null || matKhauMoi == null) {
            throw new IllegalArgumentException("Mật khẩu không được để trống.");
        }
        return khachHangService.doiMatKhau(maKH, matKhauCu, matKhauMoi);
    }

    public boolean capNhatThongTin(String maKH, String hoTen, String email, String soDienThoai, LocalDate ngaySinh) {
        validateMa(maKH, "Mã khách hàng");
        return khachHangService.capNhatThongTin(maKH, hoTen, email, soDienThoai, ngaySinh);
    }

    public boolean quenMatKhau(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Email không đúng định dạng.");
        }
        return khachHangService.quenMatKhau(email);
    }

    public boolean xacThucOTP(String email, String otp) {
        if (email == null || otp == null) {
            throw new IllegalArgumentException("Email và OTP không được để trống.");
        }
        return khachHangService.xacThucOTP(email, otp);
    }

    public boolean datLaiMatKhau(String email, String otp, String matKhauMoi) {
        if (email == null || otp == null || matKhauMoi == null) {
            throw new IllegalArgumentException("Vui lòng điền đầy đủ thông tin đặt lại mật khẩu.");
        }
        return khachHangService.datLaiMatKhau(email, otp, matKhauMoi);
    }

    public KhachHang timTheoMa(String maKH) {
        validateMa(maKH, "Mã khách hàng");
        return khachHangService.timTheoMa(maKH);
    }

    public KhachHang timTheoEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được trống.");
        }
        return khachHangService.timTheoEmail(email);
    }

    public List<DonDatVe> xemLichSuDatVe(String maKH) {
        validateMa(maKH, "Mã khách hàng");
        return khachHangService.xemLichSuDatVe(maKH);
    }

    public List<DonDatVe> xemDonDatVe(String maKH) {
        validateMa(maKH, "Mã khách hàng");
        return khachHangService.xemDonDatVe(maKH);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}