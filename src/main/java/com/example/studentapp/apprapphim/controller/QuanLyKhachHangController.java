package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.KhachHangService;
import com.example.studentapp.apprapphim.model.entity.KhachHang;
import java.util.Objects;

/** Tra cứu khách hàng và xử lý loại khách hàng qua thông tin hồ sơ. */
public class QuanLyKhachHangController {
    private final KhachHangService service;
    public QuanLyKhachHangController(KhachHangService service) { this.service = Objects.requireNonNull(service); }
    public KhachHang timTheoMa(String ma) { return service.timTheoMa(ma); }
    public KhachHang timTheoEmail(String email) { return service.timTheoEmail(email); }
}
