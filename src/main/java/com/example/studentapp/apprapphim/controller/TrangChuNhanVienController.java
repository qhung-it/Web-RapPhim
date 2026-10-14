package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.NhanVienService;
import com.example.studentapp.apprapphim.model.entity.NhanVien;
import java.util.Objects;

/** Thông tin nhân viên đăng nhập và điểm vào các chức năng theo quyền. */
public class TrangChuNhanVienController {
    private final NhanVienService service;
    private NhanVien nhanVienDangNhap;
    public TrangChuNhanVienController(NhanVienService service) { this.service = Objects.requireNonNull(service); }
    public NhanVien dangNhap(String email, String matKhau) {
        nhanVienDangNhap = service.dangNhap(email, matKhau);
        return nhanVienDangNhap;
    }
    public NhanVien getNhanVienDangNhap() { return nhanVienDangNhap; }
    public void dangXuat() { nhanVienDangNhap = null; }
}
