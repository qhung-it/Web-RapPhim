package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.RapService;
import com.example.studentapp.apprapphim.model.entity.Rap;
import java.util.List;
import java.util.Objects;

public class QuanLyRapController {
    private final RapService service;
    public QuanLyRapController(RapService service) { this.service = Objects.requireNonNull(service); }
    public List<Rap> layDanhSach() { return service.layDanhSachRap(); }
    public Rap timTheoMa(String ma) { return service.timTheoMa(ma); }
    public boolean them(Rap x) { return service.themRap(x); }
    public boolean capNhat(Rap x) { return service.capNhatRap(x); }
    public boolean xoa(String ma) { return service.xoaRap(ma); }
}
