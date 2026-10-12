package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.GheService;
import com.example.studentapp.apprapphim.model.entity.Ghe;
import java.util.List;
import java.util.Objects;

public class QuanLyGheController {
    private final GheService service;
    public QuanLyGheController(GheService service) { this.service = Objects.requireNonNull(service); }
    public List<Ghe> layDanhSach(String maPhong) { return service.layDanhSachGhe(maPhong); }
    public Ghe timTheoMa(String ma) { return service.timTheoMa(ma); }
    public boolean them(Ghe x) { return service.themGhe(x); }
    public boolean capNhat(Ghe x) { return service.capNhatGhe(x); }
    public boolean xoa(String ma) { return service.xoaGhe(ma); }
}
