package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.PhongChieuService;
import com.example.studentapp.apprapphim.model.entity.PhongChieu;
import java.util.List;
import java.util.Objects;

public class QuanLyPhongChieuController {
    private final PhongChieuService service;
    public QuanLyPhongChieuController(PhongChieuService service) { this.service = Objects.requireNonNull(service); }
    public PhongChieu timTheoMa(String ma) { return service.timTheoMa(ma); }
    public List<PhongChieu> layDanhSachCuaRap(String maRap) { return service.layDanhSachPhongCuaRap(maRap); }
    public boolean them(PhongChieu x) { return service.themPhongChieu(x); }
    public boolean capNhat(PhongChieu x) { return service.capNhatPhongChieu(x); }
    public boolean xoa(String ma) { return service.xoaPhongChieu(ma); }
}
