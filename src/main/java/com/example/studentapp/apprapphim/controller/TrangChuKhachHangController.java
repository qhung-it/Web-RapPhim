package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.PhimService;
import com.example.studentapp.apprapphim.model.Enum.TrangThaiPhim;
import com.example.studentapp.apprapphim.model.entity.Phim;
import com.example.studentapp.apprapphim.model.entity.SuatChieu;
import java.util.List;
import java.util.Objects;

/** Danh sách, tìm kiếm và lọc phim cho khách hàng. */
public class TrangChuKhachHangController {
    private final PhimService phimService;
    public TrangChuKhachHangController(PhimService phimService) {
        this.phimService = Objects.requireNonNull(phimService);
    }
    public List<Phim> layPhimDangChieu() { return phimService.layPhimDangChieu(); }
    public List<Phim> layPhimSapChieu() { return phimService.layPhimSapChieu(); }
    public List<Phim> timKiem(String ten, String theLoai, TrangThaiPhim trangThai, Integer doTuoi) {
        return phimService.timKiem(ten, theLoai, trangThai, doTuoi);
    }
    public List<SuatChieu> laySuatChieu(String maPhim) { return phimService.laySuatChieu(maPhim); }
}
