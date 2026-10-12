package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.SuatChieuService;
import com.example.studentapp.apprapphim.model.entity.SuatChieu;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

public class QuanLySuatChieuController {
    private final SuatChieuService service;
    public QuanLySuatChieuController(SuatChieuService service) { this.service = Objects.requireNonNull(service); }
    public List<SuatChieu> layDanhSach() { return service.layDanhSachSuatChieu(); }
    public List<SuatChieu> timKiem(String maPhim, LocalDate ngay, String maPhong) {
        return service.timSuatChieu(maPhim, ngay, maPhong);
    }
    public boolean them(SuatChieu x) { return service.taoSuatChieu(x); }
    public boolean capNhat(SuatChieu x) { return service.capNhatSuatChieu(x); }
    public boolean xoa(String ma) { return service.xoaSuatChieu(ma); }
}
