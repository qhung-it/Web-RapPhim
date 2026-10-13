package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.ThongKeDoanhThuServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.ThongKeDoanhThuService;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ThongKeDoanhThuController {

    private final ThongKeDoanhThuService thongKeDoanhThuService;

    public ThongKeDoanhThuController() {
        this.thongKeDoanhThuService = new ThongKeDoanhThuServiceImpl();
    }

    public BigDecimal tinhDoanhThuTheoNgay(LocalDate ngay) {
        validateDate(ngay);
        return thongKeDoanhThuService.tinhDoanhThuTheoNgay(ngay);
    }

    public BigDecimal tinhDoanhThuTheoThang(int thang, int nam) {
        if (thang < 1 || thang > 12 || nam < 2000) {
            throw new IllegalArgumentException("Tháng/Năm không hợp lệ.");
        }
        return thongKeDoanhThuService.tinhDoanhThuTheoThang(thang, nam);
    }

    public BigDecimal tinhDoanhThuTheoNam(int nam) {
        if (nam < 2000) {
            throw new IllegalArgumentException("Năm thống kê không hợp lệ.");
        }
        return thongKeDoanhThuService.tinhDoanhThuTheoNam(nam);
    }

    public BigDecimal tinhDoanhThuVeTheoNgay(LocalDate ngay) {
        validateDate(ngay);
        return thongKeDoanhThuService.tinhDoanhThuVeTheoNgay(ngay);
    }

    public BigDecimal tinhDoanhThuComboTheoNgay(LocalDate ngay) {
        validateDate(ngay);
        return thongKeDoanhThuService.tinhDoanhThuComboTheoNgay(ngay);
    }

    public BigDecimal tinhDoanhThuTheoPhim(String maPhim) {
        validateMa(maPhim, "Mã phim");
        return thongKeDoanhThuService.tinhDoanhThuTheoPhim(maPhim);
    }

    public BigDecimal tinhDoanhThuTheoRap(String maRap) {
        validateMa(maRap, "Mã rạp");
        return thongKeDoanhThuService.tinhDoanhThuTheoRap(maRap);
    }

    public BigDecimal tinhDoanhThuTheoPhong(String maPhong) {
        validateMa(maPhong, "Mã phòng");
        return thongKeDoanhThuService.tinhDoanhThuTheoPhong(maPhong);
    }

    public long demSoVeBanTheoNgay(LocalDate ngay) {
        validateDate(ngay);
        return thongKeDoanhThuService.demSoVeBanTheoNgay(ngay);
    }

    private void validateDate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException("Ngày thống kê không được null.");
        }
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}