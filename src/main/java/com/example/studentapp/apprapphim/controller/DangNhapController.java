package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.KhachHangService;
import com.example.studentapp.apprapphim.model.entity.KhachHang;
import java.util.Objects;

public class DangNhapController {
    private final KhachHangService service;
    public DangNhapController(KhachHangService service) { this.service = Objects.requireNonNull(service); }
    public KhachHang dangNhap(String email, String matKhau) { return service.dangNhap(email, matKhau); }
}
