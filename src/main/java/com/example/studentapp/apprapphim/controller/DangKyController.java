package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.KhachHangService;
import com.example.studentapp.apprapphim.model.entity.KhachHang;
import java.util.Objects;

public class DangKyController {
    private final KhachHangService service;
    public DangKyController(KhachHangService service) { this.service = Objects.requireNonNull(service); }
    public boolean dangKy(KhachHang khachHang) { return service.dangKy(khachHang); }
}
