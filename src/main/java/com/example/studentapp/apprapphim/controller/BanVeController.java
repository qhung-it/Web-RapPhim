package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.DonDatVeService;
import com.example.studentapp.apprapphim.controller.service.interf.GheService;
import com.example.studentapp.apprapphim.controller.service.interf.ComboService;
import com.example.studentapp.apprapphim.controller.service.interf.ThanhToanService;
import com.example.studentapp.apprapphim.model.Enum.PhuongThuc;
import com.example.studentapp.apprapphim.model.entity.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/** Quy trình bán vé dùng chung cho nhân viên: tạo đơn, chọn vé/combo và thanh toán. */
public class BanVeController {
    private final DonDatVeService donService;
    private final GheService gheService;
    private final ComboService comboService;
    private final ThanhToanService thanhToanService;
    public BanVeController(DonDatVeService d, GheService g, ComboService c, ThanhToanService t) {
        donService = Objects.requireNonNull(d); gheService = Objects.requireNonNull(g);
        comboService = Objects.requireNonNull(c); thanhToanService = Objects.requireNonNull(t);
    }
    public DonDatVe taoDon(String maKH, String maNV) { return donService.taoDon(maKH, maNV); }
    public boolean themNhieuVe(String maDon, List<Ve> ve) { return donService.themNhieuVe(maDon, ve); }
    public List<Ghe> layGheTrong(String maSuat) { return gheService.layGheTrong(maSuat); }
    public List<Combo> layComboDangBan() { return comboService.layComboDangBan(); }
    public boolean themCombo(String maDon, String maCombo, int soLuong) {
        return donService.themCombo(maDon, maCombo, soLuong);
    }
    public BigDecimal tinhTongTien(String maDon) { return donService.tinhTongTien(maDon); }
    public ThanhToan taoThanhToan(String maDon, BigDecimal tien, PhuongThuc p) {
        return thanhToanService.taoThanhToan(maDon, tien, p);
    }
    public boolean thanhToan(String maTT) { return thanhToanService.thanhToan(maTT); }
}
