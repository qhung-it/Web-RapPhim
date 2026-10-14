package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.VeService;
import com.example.studentapp.apprapphim.model.entity.Ve;
import java.util.Objects;

/** Tra cứu, kiểm tra và đánh dấu sử dụng vé. */
public class KiemTraVeController {
    private final VeService service;
    public KiemTraVeController(VeService service) { this.service = Objects.requireNonNull(service); }
    public Ve timVe(String maVe) { return service.timTheoMa(maVe); }
    public Ve timVeDienTu(String maVeDienTu) { return service.timTheoMaDienTu(maVeDienTu); }
    public boolean kiemTraVe(String maVe) { return service.kiemTraVe(maVe); }
    public boolean suDungVe(String maVe) { return service.suDungVe(maVe); }
}
