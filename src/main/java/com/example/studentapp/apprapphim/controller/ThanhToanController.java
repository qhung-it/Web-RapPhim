package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.ThanhToanService;
import com.example.studentapp.apprapphim.model.Enum.PhuongThuc;
import com.example.studentapp.apprapphim.model.entity.ThanhToan;
import java.math.BigDecimal;
import java.util.Objects;

/** Tạo và xử lý thanh toán. */
public class ThanhToanController {
    private final ThanhToanService service;
    public ThanhToanController(ThanhToanService service) { this.service = Objects.requireNonNull(service); }
    public ThanhToan taoThanhToan(String maDon, BigDecimal soTien, PhuongThuc phuongThuc) {
        return service.taoThanhToan(maDon, soTien, phuongThuc);
    }
    public boolean thanhToan(String maTT) { return service.thanhToan(maTT); }
    public boolean huyThanhToan(String maTT) { return service.huyThanhToan(maTT); }
    public ThanhToan timTheoDon(String maDon) { return service.timTheoDon(maDon); }
}
