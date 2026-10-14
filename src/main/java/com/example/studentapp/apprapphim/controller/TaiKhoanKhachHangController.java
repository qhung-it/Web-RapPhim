package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.KhachHangService;
import com.example.studentapp.apprapphim.model.entity.DonDatVe;
import com.example.studentapp.apprapphim.model.entity.KhachHang;
import java.util.List;
import java.util.Objects;

/** Thông tin tài khoản và lịch sử đặt vé. */
public class TaiKhoanKhachHangController {
    private final KhachHangService service;
    public TaiKhoanKhachHangController(KhachHangService service) { this.service = Objects.requireNonNull(service); }
    public KhachHang layThongTin(String maKH) { return service.timTheoMa(maKH); }
    public List<DonDatVe> layLichSuDatVe(String maKH) { return service.xemLichSuDatVe(maKH); }
    public List<DonDatVe> layDonDatVe(String maKH) { return service.xemDonDatVe(maKH); }
}
