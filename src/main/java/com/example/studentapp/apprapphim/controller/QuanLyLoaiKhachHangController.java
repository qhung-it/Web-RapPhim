package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.LoaiKhachHangService;
import com.example.studentapp.apprapphim.model.entity.LoaiKhachHang;
import java.util.List;
import java.util.Objects;

public class QuanLyLoaiKhachHangController {
    private final LoaiKhachHangService service;
    public QuanLyLoaiKhachHangController(LoaiKhachHangService service) { this.service = Objects.requireNonNull(service); }
    public List<LoaiKhachHang> layDanhSach() { return service.layDanhSachLoaiKhachHang(); }
    public LoaiKhachHang timTheoMa(String ma) { return service.timTheoMa(ma); }
    public boolean them(LoaiKhachHang x) { return service.themLoaiKhachHang(x); }
    public boolean capNhat(LoaiKhachHang x) { return service.capNhatLoaiKhachHang(x); }
    public boolean xoa(String ma) { return service.xoaLoaiKhachHang(ma); }
}
