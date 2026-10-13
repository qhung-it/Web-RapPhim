package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.SuatChieuServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.SuatChieuService;
import com.example.studentapp.apprapphim.model.entity.Ghe;
import com.example.studentapp.apprapphim.model.entity.SuatChieu;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class SuatChieuController {

    private final SuatChieuService suatChieuService;

    public SuatChieuController() {
        this.suatChieuService = new SuatChieuServiceImpl();
    }

    public boolean taoSuatChieu(SuatChieu suatChieu) {
        if (suatChieu == null) {
            throw new IllegalArgumentException("Thông tin suất chiếu không được trống.");
        }
        return suatChieuService.taoSuatChieu(suatChieu);
    }

    public boolean capNhatSuatChieu(SuatChieu suatChieu) {
        if (suatChieu == null || suatChieu.getMaSuat() == null) {
            throw new IllegalArgumentException("Mã suất chiếu không hợp lệ khi cập nhật.");
        }
        return suatChieuService.capNhatSuatChieu(suatChieu);
    }

    public boolean xoaSuatChieu(String maSuat) {
        validateMa(maSuat, "Mã suất chiếu");
        return suatChieuService.xoaSuatChieu(maSuat);
    }

    public SuatChieu timTheoMa(String maSuat) {
        validateMa(maSuat, "Mã suất chiếu");
        return suatChieuService.timTheoMa(maSuat);
    }

    public List<SuatChieu> layDanhSachSuatChieu() {
        return suatChieuService.layDanhSachSuatChieu();
    }

    public List<SuatChieu> timSuatChieu(String maPhim, LocalDate ngayChieu, String maPhong) {
        return suatChieuService.timSuatChieu(maPhim, ngayChieu, maPhong);
    }

    public List<SuatChieu> laySuatChieuTheoPhim(String maPhim) {
        validateMa(maPhim, "Mã phim");
        return suatChieuService.laySuatChieuTheoPhim(maPhim);
    }

    public List<SuatChieu> laySuatChieuTheoNgay(LocalDate ngayChieu) {
        if (ngayChieu == null) {
            throw new IllegalArgumentException("Ngày chiếu không được null.");
        }
        return suatChieuService.laySuatChieuTheoNgay(ngayChieu);
    }

    public List<Ghe> layGheTrong(String maSuat) {
        validateMa(maSuat, "Mã suất chiếu");
        return suatChieuService.layGheTrong(maSuat);
    }

    public boolean kiemTraGheTrong(String maSuat, List<String> danhSachMaGhe) {
        validateMa(maSuat, "Mã suất chiếu");
        if (danhSachMaGhe == null || danhSachMaGhe.isEmpty()) {
            throw new IllegalArgumentException("Danh sách ghế không được trống.");
        }
        return suatChieuService.kiemTraGheTrong(maSuat, danhSachMaGhe);
    }

    public boolean kiemTraTrungLich(String maPhong, LocalDate ngayChieu, LocalTime gioBatDau, LocalTime gioKetThuc, String maSuatLoaiTru) {
        validateMa(maPhong, "Mã phòng");
        if (ngayChieu == null || gioBatDau == null || gioKetThuc == null) {
            throw new IllegalArgumentException("Thời gian không được thiếu.");
        }
        return suatChieuService.kiemTraTrungLich(maPhong, ngayChieu, gioBatDau, gioKetThuc, maSuatLoaiTru);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}