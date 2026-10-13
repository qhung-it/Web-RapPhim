package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.ComboServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.ComboService;
import com.example.studentapp.apprapphim.model.Enum.TrangThaiCombo;
import com.example.studentapp.apprapphim.model.entity.Combo;

import java.util.List;

public class ComboController {

    private final ComboService comboService;

    public ComboController() {
        this.comboService = new ComboServiceImpl();
    }

    public boolean themCombo(Combo combo) {
        if (combo == null) {
            throw new IllegalArgumentException("Dữ liệu combo không được null.");
        }
        return comboService.themCombo(combo);
    }

    public boolean capNhatCombo(Combo combo) {
        if (combo == null || combo.getMaCombo() == null) {
            throw new IllegalArgumentException("Mã combo không hợp lệ khi cập nhật.");
        }
        return comboService.capNhatCombo(combo);
    }

    public boolean xoaCombo(String maCombo) {
        validateMa(maCombo, "Mã combo");
        return comboService.xoaCombo(maCombo);
    }

    public Combo timTheoMa(String maCombo) {
        validateMa(maCombo, "Mã combo");
        return comboService.timTheoMa(maCombo);
    }

    public List<Combo> layDanhSachCombo() {
        return comboService.layDanhSachCombo();
    }

    public List<Combo> layComboDangBan() {
        return comboService.layComboDangBan();
    }

    public boolean capNhatTrangThai(String maCombo, TrangThaiCombo trangThai) {
        validateMa(maCombo, "Mã combo");
        if (trangThai == null) {
            throw new IllegalArgumentException("Trạng thái combo không được null.");
        }
        return comboService.capNhatTrangThai(maCombo, trangThai);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}