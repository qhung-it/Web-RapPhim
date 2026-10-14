package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.KhachHangService;
import com.example.studentapp.apprapphim.model.entity.KhachHang;
import java.util.Objects;

/** Logic cho đăng nhập, đăng ký, quên/đổi mật khẩu. */
public class KhachHangController {
    private final KhachHangService service;
    private KhachHang khachHangDangNhap;

    public KhachHangController(KhachHangService service) {
        this.service = Objects.requireNonNull(service);
    }
    public KhachHang dangNhap(String email, String matKhau) {
        khachHangDangNhap = service.dangNhap(email, matKhau);
        return khachHangDangNhap;
    }
    public boolean dangKy(KhachHang khachHang) { return service.dangKy(khachHang); }
    public boolean doiMatKhau(String maKH, String cu, String moi) {
        return service.doiMatKhau(maKH, cu, moi);
    }
    public boolean quenMatKhau(String email) { return service.quenMatKhau(email); }
    public boolean xacThucOTP(String email, String otp) { return service.xacThucOTP(email, otp); }
    public boolean datLaiMatKhau(String email, String otp, String moi) {
        return service.datLaiMatKhau(email, otp, moi);
    }
    public KhachHang getKhachHangDangNhap() { return khachHangDangNhap; }
    public void dangXuat() { khachHangDangNhap = null; }
}
