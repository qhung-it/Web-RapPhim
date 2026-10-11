package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.ComboService;
import com.example.studentapp.apprapphim.model.Enum.TrangThaiCombo;
import com.example.studentapp.apprapphim.model.entity.Combo;
import java.util.List;
import java.util.Objects;

public class QuanLyComboController {
    private final ComboService service;
    public QuanLyComboController(ComboService service) { this.service = Objects.requireNonNull(service); }
    public List<Combo> layDanhSach() { return service.layDanhSachCombo(); }
    public Combo timTheoMa(String ma) { return service.timTheoMa(ma); }
    public boolean them(Combo x) { return service.themCombo(x); }
    public boolean capNhat(Combo x) { return service.capNhatCombo(x); }
    public boolean xoa(String ma) { return service.xoaCombo(ma); }
    public boolean capNhatTrangThai(String ma, TrangThaiCombo tt) { return service.capNhatTrangThai(ma, tt); }
}
