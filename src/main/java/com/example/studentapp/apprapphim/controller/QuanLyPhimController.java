package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.PhimService;
import com.example.studentapp.apprapphim.model.entity.Phim;
import java.util.List;
import java.util.Objects;

/** CRUD phim. */
public class QuanLyPhimController {
    private final PhimService service;
    public QuanLyPhimController(PhimService service) { this.service = Objects.requireNonNull(service); }
    public List<Phim> layDanhSach() { return service.layDanhSachPhim(); }
    public Phim timTheoMa(String ma) { return service.timTheoMa(ma); }
    public boolean them(Phim p) { return service.themPhim(p); }
    public boolean capNhat(Phim p) { return service.capNhatPhim(p); }
    public boolean xoa(String ma) { return service.xoaPhim(ma); }
}
