package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.interf.ComboService;
import com.example.studentapp.apprapphim.model.entity.Combo;
import java.util.List;
import java.util.Objects;

/** Chọn combo đang được bán. */
public class ChonComboController {
    private final ComboService service;
    public ChonComboController(ComboService service) { this.service = Objects.requireNonNull(service); }
    public List<Combo> layComboDangBan() { return service.layComboDangBan(); }
}
