package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.GheServiceImpl;
import com.example.studentapp.apprapphim.controller.service.impl.SuatChieuServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.GheService;
import com.example.studentapp.apprapphim.controller.service.interf.SuatChieuService;
import com.example.studentapp.apprapphim.model.entity.Ghe;
import com.example.studentapp.apprapphim.model.entity.SuatChieu;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;

@WebServlet("/chon-ghe")
public class ChonGheController extends HttpServlet {
    private final GheService gheService = new GheServiceImpl();
    private final SuatChieuService suatChieuService = new SuatChieuServiceImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String maSuat = req.getParameter("maSuat");
        if (maSuat == null || maSuat.trim().isEmpty()) {
            resp.sendRedirect(req.getContextPath() + "/trang-chu");
            return;
        }

        try {
            SuatChieu suatChieu = suatChieuService.timTheoMa(maSuat.trim());
            if (suatChieu == null) {
                resp.sendRedirect(req.getContextPath() + "/trang-chu");
                return;
            }

            String maPhong = suatChieu.getPhongChieu().getMaPhong();
            List<Ghe> dsGhe = gheService.layDanhSachGhe(maPhong);
            List<Ghe> dsGheDaBan = gheService.layGheDaBan(maSuat.trim());

            req.setAttribute("suatChieu", suatChieu);
            req.setAttribute("dsGhe", dsGhe);
            req.setAttribute("dsGheDaBan", dsGheDaBan);

            req.getRequestDispatcher("/views/customer/chon-ghe.jsp").forward(req, resp);
        } catch (Exception e) {
            e.printStackTrace();
            resp.sendRedirect(req.getContextPath() + "/trang-chu");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String maSuat = req.getParameter("maSuat");
        String[] dsMaGheChon = req.getParameterValues("maGhe");

        if (dsMaGheChon == null || dsMaGheChon.length == 0) {
            req.setAttribute("error", "Vui lòng chọn ít nhất 1 ghế!");
            doGet(req, resp);
            return;
        }

        HttpSession session = req.getSession();
        session.setAttribute("booking_maSuat", maSuat);
        session.setAttribute("booking_dsMaGhe", dsMaGheChon);

        resp.sendRedirect(req.getContextPath() + "/chon-combo");
    }
}