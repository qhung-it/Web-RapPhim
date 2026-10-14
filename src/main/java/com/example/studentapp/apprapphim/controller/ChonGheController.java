package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.GheService;
import com.example.studentapp.apprapphim.model.entity.Ghe;
import java.util.List;
import java.util.Objects;

/** Sơ đồ ghế và kiểm tra ghế còn trống theo suất. */
public class ChonGheController {
    private final GheService service;
    public ChonGheController(GheService service) { this.service = Objects.requireNonNull(service); }
    public List<Ghe> layGheTrong(String maSuat) { return service.layGheTrong(maSuat); }
    public List<Ghe> layGheDaBan(String maSuat) { return service.layGheDaBan(maSuat); }
    public boolean kiemTraGheTrong(String maSuat, String maGhe) {
        return service.kiemTraGheTrong(maSuat, maGhe);
    }
}
