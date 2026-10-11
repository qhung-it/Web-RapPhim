package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.DonDatVeService;
import com.example.studentapp.apprapphim.model.entity.DonDatVe;
import com.example.studentapp.apprapphim.model.entity.KhuyenMai;
import java.math.BigDecimal;
import java.util.Objects;

/** Kiểm tra tổng tiền, khuyến mãi và xác nhận đơn. */
public class XacNhanDonController {
    private final DonDatVeService service;
    public XacNhanDonController(DonDatVeService service) { this.service = Objects.requireNonNull(service); }
    public DonDatVe layDon(String maDon) { return service.timTheoMa(maDon); }
    public BigDecimal tinhTongTien(String maDon) { return service.tinhTongTien(maDon); }
    public KhuyenMai xacDinhKhuyenMai(String maDon) { return service.xacDinhKhuyenMai(maDon); }
    public boolean apDungKhuyenMai(String maDon, String maKM) { return service.apDungKhuyenMai(maDon, maKM); }
    public boolean xacNhanDon(String maDon) { return service.xacNhanDon(maDon); }
    public boolean huyDon(String maDon) { return service.huyDon(maDon); }
}
