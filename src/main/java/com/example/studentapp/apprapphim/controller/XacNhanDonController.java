package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.*;
import com.example.studentapp.apprapphim.controller.service.interf.*;
import com.example.studentapp.apprapphim.model.entity.*;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

@WebServlet("/xac-nhan-don")
public class XacNhanDonController extends HttpServlet {
    private final SuatChieuService suatChieuService = new SuatChieuServiceImpl();
    private final GheService gheService = new GheServiceImpl();
    private final ComboService comboService = new ComboServiceImpl();
    private final KhuyenMaiService khuyenMaiService = new KhuyenMaiServiceImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession();
        String maSuat = (String) session.getAttribute("booking_maSuat");
        String[] dsMaGhe = (String[]) session.getAttribute("booking_dsMaGhe");

        if (maSuat == null || dsMaGhe == null) {
            resp.sendRedirect(req.getContextPath() + "/trang-chu");
            return;
        }

        try {
            SuatChieu suatChieu = suatChieuService.timTheoMa(maSuat);
            List<Ghe> dsGhe = new ArrayList<>();
            BigDecimal tongTienVe = BigDecimal.ZERO;

            for (String maGhe : dsMaGhe) {
                Ghe g = gheService.timTheoMa(maGhe);
                if (g != null) {
                    dsGhe.add(g);
                    BigDecimal giaGhe = g.getGia() != null ? g.getGia() : suatChieu.getGiaSuat();
                    tongTienVe = tongTienVe.add(giaGhe);
                }
            }

            @SuppressWarnings("unchecked")
            Map<String, Integer> comboMap = (Map<String, Integer>) session.getAttribute("booking_comboMap");
            BigDecimal tongTienCombo = BigDecimal.ZERO;
            Map<Combo, Integer> dsComboChon = new HashMap<>();

            if (comboMap != null) {
                for (Map.Entry<String, Integer> entry : comboMap.entrySet()) {
                    Combo cb = comboService.timTheoMa(entry.getKey());
                    if (cb != null) {
                        dsComboChon.put(cb, entry.getValue());
                        tongTienCombo = tongTienCombo.add(cb.getGia().multiply(BigDecimal.valueOf(entry.getValue())));
                    }
                }
            }

            BigDecimal tongTien = tongTienVe.add(tongTienCombo);
            BigDecimal giamGia = BigDecimal.ZERO;

            String maKM = req.getParameter("maKM");
            if (maKM != null && !maKM.trim().isEmpty()) {
                KhuyenMai km = khuyenMaiService.timTheoMa(maKM.trim());
                if (km != null) {
                    giamGia = khuyenMaiService.tinhTienGiam(km, tongTien);
                    req.setAttribute("khuyenMai", km);
                    session.setAttribute("booking_maKM", km.getMaKM());
                } else {
                    req.setAttribute("kmError", "Mã khuyến mãi không hợp lệ!");
                }
            }

            BigDecimal thanhTien = tongTien.subtract(giamGia);

            req.setAttribute("suatChieu", suatChieu);
            req.setAttribute("dsGhe", dsGhe);
            req.setAttribute("dsComboChon", dsComboChon);
            req.setAttribute("tongTienVe", tongTienVe);
            req.setAttribute("tongTienCombo", tongTienCombo);
            req.setAttribute("giamGia", giamGia);
            req.setAttribute("thanhTien", thanhTien);

            req.getRequestDispatcher("/views/customer/xac-nhan-don.jsp").forward(req, resp);
        } catch (Exception e) {
            e.printStackTrace();
            resp.sendRedirect(req.getContextPath() + "/trang-chu");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String phuongThuc = req.getParameter("phuongThuc");
        HttpSession session = req.getSession();
        session.setAttribute("booking_phuongThuc", phuongThuc);
        resp.sendRedirect(req.getContextPath() + "/thanh-toan");
    }
}