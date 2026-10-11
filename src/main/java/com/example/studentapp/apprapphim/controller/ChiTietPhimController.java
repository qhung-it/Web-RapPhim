package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.PhimService;
import com.example.studentapp.apprapphim.model.entity.Phim;
import com.example.studentapp.apprapphim.model.entity.SuatChieu;
import java.util.List;
import java.util.Objects;

/** Chi tiết phim và danh sách suất chiếu. */
public class ChiTietPhimController {
    private final PhimService service;
    public ChiTietPhimController(PhimService service) { this.service = Objects.requireNonNull(service); }
    public Phim layChiTiet(String maPhim) { return service.timTheoMa(maPhim); }
    public List<SuatChieu> laySuatChieu(String maPhim) { return service.laySuatChieu(maPhim); }
}
