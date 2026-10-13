package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.GheServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.GheService;
import com.example.studentapp.apprapphim.model.entity.Ghe;

import java.util.List;

public class GheController {

    private final GheService gheService;

    public GheController() {
        this.gheService = new GheServiceImpl();
    }

    public boolean themGhe(Ghe ghe) {
        if (ghe == null) {
            throw new IllegalArgumentException("Thông tin ghế không được rỗng.");
        }
        return gheService.themGhe(ghe);
    }

    public boolean capNhatGhe(Ghe ghe) {
        if (ghe == null || ghe.getMaGhe() == null) {
            throw new IllegalArgumentException("Mã ghế không hợp lệ.");
        }
        return gheService.capNhatGhe(ghe);
    }

    public boolean xoaGhe(String maGhe) {
        validateMa(maGhe, "Mã ghế");
        return gheService.xoaGhe(maGhe);
    }

    public Ghe timTheoMa(String maGhe) {
        validateMa(maGhe, "Mã ghế");
        return gheService.timTheoMa(maGhe);
    }

    public List<Ghe> layDanhSachGhe(String maPhong) {
        validateMa(maPhong, "Mã phòng");
        return gheService.layDanhSachGhe(maPhong);
    }

    public List<Ghe> layGheTrong(String maSuat) {
        validateMa(maSuat, "Mã suất chiếu");
        return gheService.layGheTrong(maSuat);
    }

    public List<Ghe> layGheDaBan(String maSuat) {
        validateMa(maSuat, "Mã suất chiếu");
        return gheService.layGheDaBan(maSuat);
    }

    public boolean kiemTraGheTrong(String maSuat, String maGhe) {
        validateMa(maSuat, "Mã suất chiếu");
        validateMa(maGhe, "Mã ghế");
        return gheService.kiemTraGheTrong(maSuat, maGhe);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}