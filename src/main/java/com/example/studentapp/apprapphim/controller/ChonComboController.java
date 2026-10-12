package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.ComboServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.ComboService;
import com.example.studentapp.apprapphim.model.entity.Combo;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/chon-combo")
public class ChonComboController extends HttpServlet {
    private final ComboService comboService = new ComboServiceImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession();
        if (session.getAttribute("booking_maSuat") == null) {
            resp.sendRedirect(req.getContextPath() + "/trang-chu");
            return;
        }

        List<Combo> dsCombo = comboService.layComboDangBan();
        req.setAttribute("dsCombo", dsCombo);
        req.getRequestDispatcher("/views/customer/chon-combo.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession();
        List<Combo> dsCombo = comboService.layComboDangBan();
        Map<String, Integer> comboChonMap = new HashMap<>();

        for (Combo combo : dsCombo) {
            String qtyRaw = req.getParameter("combo_" + combo.getMaCombo());
            if (qtyRaw != null) {
                try {
                    int qty = Integer.parseInt(qtyRaw);
                    if (qty > 0) {
                        comboChonMap.put(combo.getMaCombo(), qty);
                    }
                } catch (NumberFormatException ignored) {}
            }
        }

        session.setAttribute("booking_comboMap", comboChonMap);
        resp.sendRedirect(req.getContextPath() + "/xac-nhan-don");
    }
}