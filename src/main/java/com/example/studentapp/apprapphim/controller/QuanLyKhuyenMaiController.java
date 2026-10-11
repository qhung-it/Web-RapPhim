package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.KhuyenMaiService;
import com.example.studentapp.apprapphim.model.entity.KhuyenMai;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

public class QuanLyKhuyenMaiController {
    private final KhuyenMaiService service;
    public QuanLyKhuyenMaiController(KhuyenMaiService service) { this.service = Objects.requireNonNull(service); }
    public List<KhuyenMai> layDanhSach() { return service.layDanhSachKhuyenMai(); }
    public List<KhuyenMai> layDangApDung(LocalDate ngay) { return service.layKhuyenMaiDangApDung(ngay); }
    public KhuyenMai timTheoMa(String ma) { return service.timTheoMa(ma); }
    public boolean them(KhuyenMai x) { return service.themKhuyenMai(x); }
    public boolean capNhat(KhuyenMai x) { return service.capNhatKhuyenMai(x); }
    public boolean xoa(String ma) { return service.xoaKhuyenMai(ma); }
}
