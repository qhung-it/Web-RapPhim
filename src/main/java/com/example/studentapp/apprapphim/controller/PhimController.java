package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.PhimServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.PhimService;
import com.example.studentapp.apprapphim.model.Enum.TrangThaiPhim;
import com.example.studentapp.apprapphim.model.entity.Phim;
import com.example.studentapp.apprapphim.model.entity.SuatChieu;

import java.util.List;

public class PhimController {

    private final PhimService phimService;

    public PhimController() {
        this.phimService = new PhimServiceImpl();
    }

    public PhimController(PhimService phimService) {
        this.phimService = phimService;
    }

    public boolean themPhim(Phim phim) {
        validatePhim(phim);
        return phimService.themPhim(phim);
    }

    public boolean capNhatPhim(Phim phim) {
        if (phim == null) {
            throw new IllegalArgumentException("Dữ liệu phim không được để trống.");
        }
        validateMa(phim.getMaPhim(), "Mã phim");
        return phimService.capNhatPhim(phim);
    }

    public boolean xoaPhim(String maPhim) {
        validateMa(maPhim, "Mã phim");
        return phimService.xoaPhim(maPhim);
    }

    public Phim timTheoMa(String maPhim) {
        validateMa(maPhim, "Mã phim");
        return phimService.timTheoMa(maPhim);
    }

    public List<Phim> layDanhSachPhim() {
        return phimService.layDanhSachPhim();
    }

    public List<Phim> layPhimDangChieu() {
        return phimService.layPhimDangChieu();
    }

    public List<Phim> layPhimSapChieu() {
        return phimService.layPhimSapChieu();
    }

    public List<Phim> timKiem(String tenPhim, String theLoai, TrangThaiPhim trangThai, Integer doTuoi) {
        return phimService.timKiem(tenPhim, theLoai, trangThai, doTuoi);
    }

    public List<SuatChieu> laySuatChieu(String maPhim) {
        validateMa(maPhim, "Mã phim");
        return phimService.laySuatChieu(maPhim);
    }

    private void validatePhim(Phim phim) {
        if (phim == null) {
            throw new IllegalArgumentException("Phim không được null.");
        }
        validateMa(phim.getMaPhim(), "Mã phim");
        if (phim.getTenPhim() == null || phim.getTenPhim().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên phim không được để trống.");
        }
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}