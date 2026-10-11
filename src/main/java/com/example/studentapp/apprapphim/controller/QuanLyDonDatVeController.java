package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.DonDatVeService;
import com.example.studentapp.apprapphim.model.entity.DonDatVe;
import java.util.List;
import java.util.Objects;

public class QuanLyDonDatVeController {
    private final DonDatVeService service;
    public QuanLyDonDatVeController(DonDatVeService service) { this.service = Objects.requireNonNull(service); }
    public List<DonDatVe> layDanhSach() { return service.layDanhSachDon(); }
    public DonDatVe timTheoMa(String ma) { return service.timTheoMa(ma); }
    public List<DonDatVe> layTheoKhachHang(String maKH) { return service.layDonTheoKhachHang(maKH); }
    public boolean huyDon(String ma) { return service.huyDon(ma); }
    public boolean xacNhanDon(String ma) { return service.xacNhanDon(ma); }
}
