package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.KhuyenMaiServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.KhuyenMaiService;
import com.example.studentapp.apprapphim.model.entity.DonDatVe;
import com.example.studentapp.apprapphim.model.entity.KhuyenMai;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class KhuyenMaiController {

    private final KhuyenMaiService khuyenMaiService;

    public KhuyenMaiController() {
        this.khuyenMaiService = new KhuyenMaiServiceImpl();
    }

    public boolean themKhuyenMai(KhuyenMai khuyenMai) {
        if (khuyenMai == null) {
            throw new IllegalArgumentException("Khuyến mãi không được rỗng.");
        }
        return khuyenMaiService.themKhuyenMai(khuyenMai);
    }

    public boolean capNhatKhuyenMai(KhuyenMai khuyenMai) {
        if (khuyenMai == null || khuyenMai.getMaKM() == null) {
            throw new IllegalArgumentException("Mã khuyến mãi không hợp lệ.");
        }
        return khuyenMaiService.capNhatKhuyenMai(khuyenMai);
    }

    public boolean xoaKhuyenMai(String maKM) {
        validateMa(maKM, "Mã khuyến mãi");
        return khuyenMaiService.xoaKhuyenMai(maKM);
    }

    public KhuyenMai timTheoMa(String maKM) {
        validateMa(maKM, "Mã khuyến mãi");
        return khuyenMaiService.timTheoMa(maKM);
    }

    public List<KhuyenMai> layDanhSachKhuyenMai() {
        return khuyenMaiService.layDanhSachKhuyenMai();
    }

    public List<KhuyenMai> layKhuyenMaiDangApDung(LocalDate ngayApDung) {
        if (ngayApDung == null) {
            throw new IllegalArgumentException("Ngày áp dụng không được trống.");
        }
        return khuyenMaiService.layKhuyenMaiDangApDung(ngayApDung);
    }

    public List<KhuyenMai> timKhuyenMaiPhuHop(DonDatVe donDatVe) {
        if (donDatVe == null) {
            throw new IllegalArgumentException("Đơn đặt vé không hợp lệ.");
        }
        return khuyenMaiService.timKhuyenMaiPhuHop(donDatVe);
    }

    public KhuyenMai xacDinhKhuyenMai(DonDatVe donDatVe) {
        if (donDatVe == null) {
            throw new IllegalArgumentException("Đơn đặt vé không hợp lệ.");
        }
        return khuyenMaiService.xacDinhKhuyenMai(donDatVe);
    }

    public BigDecimal tinhTienGiam(KhuyenMai khuyenMai, BigDecimal tongTien) {
        if (khuyenMai == null || tongTien == null) {
            throw new IllegalArgumentException("Dữ liệu tính tiền giảm không đầy đủ.");
        }
        return khuyenMaiService.tinhTienGiam(khuyenMai, tongTien);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}