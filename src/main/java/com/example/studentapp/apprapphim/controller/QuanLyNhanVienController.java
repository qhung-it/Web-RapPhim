package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.NhanVienService;
import com.example.studentapp.apprapphim.model.Enum.ChucVu;
import com.example.studentapp.apprapphim.model.entity.NhanVien;
import java.util.List;
import java.util.Objects;

public class QuanLyNhanVienController {
    private final NhanVienService service;
    public QuanLyNhanVienController(NhanVienService service) { this.service = Objects.requireNonNull(service); }
    public List<NhanVien> layDanhSach() { return service.layDanhSachNhanVien(); }
    public NhanVien timTheoMa(String ma) { return service.timTheoMa(ma); }
    public boolean them(NhanVien x) { return service.themNhanVien(x); }
    public boolean capNhat(NhanVien x) { return service.capNhatNhanVien(x); }
    public boolean xoa(String ma) { return service.xoaNhanVien(ma); }
    public boolean phanQuyen(String ma, ChucVu cv) { return service.phanQuyen(ma, cv); }
}
