package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.KhachHangService;
import java.util.Objects;

public class QuenMatKhauController {
    private final KhachHangService service;
    public QuenMatKhauController(KhachHangService service) { this.service = Objects.requireNonNull(service); }
    public boolean guiYeuCau(String email) { return service.quenMatKhau(email); }
    public boolean xacThucOTP(String email, String otp) { return service.xacThucOTP(email, otp); }
    public boolean datLaiMatKhau(String email, String otp, String matKhauMoi) {
        return service.datLaiMatKhau(email, otp, matKhauMoi);
    }
}
