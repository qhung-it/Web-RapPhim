package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.DonDatVeServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.DonDatVeService;
import com.example.studentapp.apprapphim.model.entity.DonDatVe;
import com.example.studentapp.apprapphim.model.entity.KhuyenMai;
import com.example.studentapp.apprapphim.model.entity.Ve;

import java.math.BigDecimal;
import java.util.List;

public class DonDatVeController {

    private final DonDatVeService donDatVeService;

    public DonDatVeController() {
        this.donDatVeService = new DonDatVeServiceImpl();
    }

    public DonDatVe taoDon(String maKH, String maNV) {
        validateMa(maKH, "Mã khách hàng");
        return donDatVeService.taoDon(maKH, maNV);
    }

    public DonDatVe timTheoMa(String maDon) {
        validateMa(maDon, "Mã đơn");
        return donDatVeService.timTheoMa(maDon);
    }

    public List<DonDatVe> layDanhSachDon() {
        return donDatVeService.layDanhSachDon();
    }

    public List<DonDatVe> layDonTheoKhachHang(String maKH) {
        validateMa(maKH, "Mã khách hàng");
        return donDatVeService.layDonTheoKhachHang(maKH);
    }

    public boolean themVe(String maDon, Ve ve) {
        validateMa(maDon, "Mã đơn");
        if (ve == null) {
            throw new IllegalArgumentException("Thông tin vé không được null.");
        }
        return donDatVeService.themVe(maDon, ve);
    }

    public boolean themNhieuVe(String maDon, List<Ve> danhSachVe) {
        validateMa(maDon, "Mã đơn");
        if (danhSachVe == null || danhSachVe.isEmpty()) {
            throw new IllegalArgumentException("Danh sách vé chọn không được trống.");
        }
        return donDatVeService.themNhieuVe(maDon, danhSachVe);
    }

    public boolean xoaVe(String maDon, String maVe) {
        validateMa(maDon, "Mã đơn");
        validateMa(maVe, "Mã vé");
        return donDatVeService.xoaVe(maDon, maVe);
    }

    public boolean themCombo(String maDon, String maCombo, int soLuong) {
        validateMa(maDon, "Mã đơn");
        validateMa(maCombo, "Mã combo");
        if (soLuong <= 0) {
            throw new IllegalArgumentException("Số lượng combo phải lớn hơn 0.");
        }
        return donDatVeService.themCombo(maDon, maCombo, soLuong);
    }

    public boolean capNhatSoLuongCombo(String maDon, String maCombo, int soLuong) {
        validateMa(maDon, "Mã đơn");
        validateMa(maCombo, "Mã combo");
        if (soLuong < 0) {
            throw new IllegalArgumentException("Số lượng combo không hợp lệ.");
        }
        return donDatVeService.capNhatSoLuongCombo(maDon, maCombo, soLuong);
    }

    public boolean xoaCombo(String maDon, String maCombo) {
        validateMa(maDon, "Mã đơn");
        validateMa(maCombo, "Mã combo");
        return donDatVeService.xoaCombo(maDon, maCombo);
    }

    public BigDecimal tinhTongTien(String maDon) {
        validateMa(maDon, "Mã đơn");
        return donDatVeService.tinhTongTien(maDon);
    }

    public KhuyenMai xacDinhKhuyenMai(String maDon) {
        validateMa(maDon, "Mã đơn");
        return donDatVeService.xacDinhKhuyenMai(maDon);
    }

    public boolean apDungKhuyenMai(String maDon, String maKM) {
        validateMa(maDon, "Mã đơn");
        validateMa(maKM, "Mã khuyến mãi");
        return donDatVeService.apDungKhuyenMai(maDon, maKM);
    }

    public boolean huyDon(String maDon) {
        validateMa(maDon, "Mã đơn");
        return donDatVeService.huyDon(maDon);
    }

    public boolean xacNhanDon(String maDon) {
        validateMa(maDon, "Mã đơn");
        return donDatVeService.xacNhanDon(maDon);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}