package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.ThongKeDoanhThuService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

public class ThongKeDoanhThuController {
    private final ThongKeDoanhThuService service;
    public ThongKeDoanhThuController(ThongKeDoanhThuService service) { this.service = Objects.requireNonNull(service); }
    public BigDecimal theoNgay(LocalDate ngay) { return service.tinhDoanhThuTheoNgay(ngay); }
    public BigDecimal theoThang(int thang, int nam) { return service.tinhDoanhThuTheoThang(thang, nam); }
    public BigDecimal theoNam(int nam) { return service.tinhDoanhThuTheoNam(nam); }
    public BigDecimal doanhThuVeTheoNgay(LocalDate ngay) { return service.tinhDoanhThuVeTheoNgay(ngay); }
    public BigDecimal doanhThuComboTheoNgay(LocalDate ngay) { return service.tinhDoanhThuComboTheoNgay(ngay); }
    public long soVeBanTheoNgay(LocalDate ngay) { return service.demSoVeBanTheoNgay(ngay); }
}
