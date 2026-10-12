package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.*;
import com.example.studentapp.apprapphim.controller.service.interf.*;
import com.example.studentapp.apprapphim.model.Enum.PhuongThuc;
import com.example.studentapp.apprapphim.model.entity.*;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

@WebServlet("/thanh-toan")
public class ThanhToanController extends HttpServlet {
    private final DonDatVeService donDatVeService = new DonDatVeServiceImpl();
    private final ThanhToanService thanhToanService = new ThanhToanServiceImpl();
    private final SuatChieuService suatChieuService = new SuatChieuServiceImpl();
    private final GheService gheService = new GheServiceImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession();
        String customerId = (String) session.getAttribute("customerId");

        if (customerId == null) {
            resp.sendRedirect(req.getContextPath() + "/dang-nhap");
            return;
        }

        String maSuat = (String) session.getAttribute("booking_maSuat");
        String[] dsMaGhe = (String[]) session.getAttribute("booking_dsMaGhe");
        @SuppressWarnings("unchecked")
        Map<String, Integer> comboMap = (Map<String, Integer>) session.getAttribute("booking_comboMap");
        String phuongThucStr = (String) session.getAttribute("booking_phuongThuc");
        String maKM = (String) session.getAttribute("booking_maKM");

        try {
            // 1. Tạo đơn vị đặt vé
            DonDatVe don = donDatVeService.taoDon(customerId, null);
            if (don == null) {
                resp.sendRedirect(req.getContextPath() + "/trang-chu");
                return;
            }

            // 2. Thêm ghế/vé vào đơn
            SuatChieu suat = suatChieuService.timTheoMa(maSuat);
            if (dsMaGhe != null) {
                for (String maGhe : dsMaGhe) {
                    Ghe ghe = gheService.timTheoMa(maGhe);
                    Ve ve = new Ve();
                    ve.setSuatChieu(suat);
                    ve.setGhe(ghe);
                    ve.setGiaVeCoBan(ghe.getGia() != null ? ghe.getGia() : suat.getGiaSuat());
                    donDatVeService.themVe(don.getMaDon(), ve);
                }
            }

            // 3. Thêm combo vào đơn
            if (comboMap != null) {
                for (Map.Entry<String, Integer> entry : comboMap.entrySet()) {
                    donDatVeService.themCombo(don.getMaDon(), entry.getKey(), entry.getValue());
                }
            }

            // 4. Áp dụng Khuyến mãi (nếu có)
            if (maKM != null) {
                donDatVeService.apDungKhuyenMai(don.getMaDon(), maKM);
            }

            // 5. Tính tổng tiền & Thực hiện thanh toán
            BigDecimal tongTien = donDatVeService.tinhTongTien(don.getMaDon());
            PhuongThuc pt = PhuongThuc.valueOf(phuongThucStr != null ? phuongThucStr : "TIEN_MAT");

            ThanhToan thanhToan = thanhToanService.taoThanhToan(don.getMaDon(), tongTien, pt);
            boolean thanhToanOK = thanhToanService.thanhToan(thanhToan.getMaTT());

            if (thanhToanOK) {
                donDatVeService.xacNhanDon(don.getMaDon());

                // Xóa session đặt vé
                session.removeAttribute("booking_maSuat");
                session.removeAttribute("booking_dsMaGhe");
                session.removeAttribute("booking_comboMap");
                session.removeAttribute("booking_phuongThuc");
                session.removeAttribute("booking_maKM");

                req.setAttribute("donDatVe", don);
                req.getRequestDispatcher("/views/customer/thanh-toan-thanh-cong.jsp").forward(req, resp);
            } else {
                req.setAttribute("error", "Thanh toán không thành công.");
                req.getRequestDispatcher("/views/customer/thanh-toan-that-bai.jsp").forward(req, resp);
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.sendRedirect(req.getContextPath() + "/trang-chu");
        }
    }
}