package com.example.studentapp.apprapphim.web;

import com.example.studentapp.apprapphim.controller.*;
import com.example.studentapp.apprapphim.model.Enum.PhuongThuc;
import com.example.studentapp.apprapphim.model.Enum.TrangThaiCombo;
import com.example.studentapp.apprapphim.model.Enum.TrangThaiPhim;
import com.example.studentapp.apprapphim.model.entity.*;
import com.google.gson.*;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "ApiServlet", urlPatterns = {"/api/*"})
public class ApiServlet extends HttpServlet {

    private PhimController phimController;
    private SuatChieuController suatChieuController;
    private GheController gheController;
    private DonDatVeController donDatVeController;
    private KhachHangController khachHangController;
    private NhanVienController nhanVienController;
    private ComboController comboController;
    private KhuyenMaiController khuyenMaiController;
    private ThanhToanController thanhToanController;
    private ThongKeDoanhThuController thongKeDoanhThuController;

    private Gson gson;

    @Override
    public void init() throws ServletException {
        this.phimController = new PhimController();
        this.suatChieuController = new SuatChieuController();
        this.gheController = new GheController();
        this.donDatVeController = new DonDatVeController();
        this.khachHangController = new KhachHangController();
        this.nhanVienController = new NhanVienController();
        this.comboController = new ComboController();
        this.khuyenMaiController = new KhuyenMaiController();
        this.thanhToanController = new ThanhToanController();
        this.thongKeDoanhThuController = new ThongKeDoanhThuController();

        this.gson = new GsonBuilder()
                .registerTypeAdapter(LocalDate.class, (JsonSerializer<LocalDate>) (src, typeOfSrc, context) ->
                        new JsonPrimitive(src.format(DateTimeFormatter.ISO_LOCAL_DATE)))
                .registerTypeAdapter(LocalDate.class, (JsonDeserializer<LocalDate>) (json, typeOfT, context) ->
                        LocalDate.parse(json.getAsString(), DateTimeFormatter.ISO_LOCAL_DATE))
                .registerTypeAdapter(LocalTime.class, (JsonSerializer<LocalTime>) (src, typeOfSrc, context) ->
                        new JsonPrimitive(src.format(DateTimeFormatter.ofPattern("HH:mm:ss"))))
                .registerTypeAdapter(LocalTime.class, (JsonDeserializer<LocalTime>) (json, typeOfT, context) ->
                        LocalTime.parse(json.getAsString(), DateTimeFormatter.ofPattern("HH:mm:ss")))
                .create();
    }

    // 1. XỬ LÝ REQUEST GET (LẤY DỮ LIỆU)
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setupCorsAndHeaders(resp);
        String pathInfo = req.getPathInfo();
        PrintWriter out = resp.getWriter();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson("Endpoint không hợp lệ."));
                return;
            }

            switch (pathInfo) {
                // Phim Endpoints
                case "/movies":
                    sendResponse(resp, out, 200, gson.toJson(phimController.layDanhSachPhim()));
                    break;
                case "/movies/now-showing":
                    sendResponse(resp, out, 200, gson.toJson(phimController.layPhimDangChieu()));
                    break;
                case "/movies/coming-soon":
                    sendResponse(resp, out, 200, gson.toJson(phimController.layPhimSapChieu()));
                    break;
                case "/movies/detail":
                    String maPhim = req.getParameter("maPhim");
                    sendResponse(resp, out, 200, gson.toJson(phimController.timTheoMa(maPhim)));
                    break;
                case "/movies/showtimes":
                    String maPhimSC = req.getParameter("maPhim");
                    sendResponse(resp, out, 200, gson.toJson(phimController.laySuatChieu(maPhimSC)));
                    break;

                // Suất Chiếu Endpoints
                case "/showtimes":
                    sendResponse(resp, out, 200, gson.toJson(suatChieuController.layDanhSachSuatChieu()));
                    break;
                case "/showtimes/detail":
                    String maSuat = req.getParameter("maSuat");
                    sendResponse(resp, out, 200, gson.toJson(suatChieuController.timTheoMa(maSuat)));
                    break;

                // Ghế Endpoints
                case "/seats/by-room":
                    String maPhong = req.getParameter("maPhong");
                    sendResponse(resp, out, 200, gson.toJson(gheController.layDanhSachGhe(maPhong)));
                    break;
                case "/seats/available":
                    String maSuatTrong = req.getParameter("maSuat");
                    sendResponse(resp, out, 200, gson.toJson(gheController.layGheTrong(maSuatTrong)));
                    break;

                // Đơn Đặt Vé & Khách Hàng Endpoints
                case "/bookings":
                    sendResponse(resp, out, 200, gson.toJson(donDatVeController.layDanhSachDon()));
                    break;
                case "/bookings/detail":
                    String maDon = req.getParameter("maDon");
                    sendResponse(resp, out, 200, gson.toJson(donDatVeController.timTheoMa(maDon)));
                    break;
                case "/bookings/by-customer":
                    String maKH = req.getParameter("maKH");
                    sendResponse(resp, out, 200, gson.toJson(donDatVeController.layDonTheoKhachHang(maKH)));
                    break;

                // Combo & Khuyến Mãi Endpoints
                case "/combos":
                    sendResponse(resp, out, 200, gson.toJson(comboController.layComboDangBan()));
                    break;
                case "/promotions":
                    sendResponse(resp, out, 200, gson.toJson(khuyenMaiController.layDanhSachKhuyenMai()));
                    break;

                // Thống Kê Endpoints
                case "/statistics/revenue-date":
                    String strNgay = req.getParameter("ngay");
                    LocalDate ngay = LocalDate.parse(strNgay);
                    BigDecimal doanhThu = thongKeDoanhThuController.tinhDoanhThuTheoNgay(ngay);
                    Map<String, Object> resMap = new HashMap<>();
                    resMap.put("ngay", strNgay);
                    resMap.put("doanhThu", doanhThu);
                    sendResponse(resp, out, 200, gson.toJson(resMap));
                    break;

                default:
                    sendResponse(resp, out, HttpServletResponse.SC_NOT_FOUND, createErrorJson("Endpoint GET không tồn tại."));
                    break;
            }
        } catch (IllegalArgumentException e) {
            sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(resp, out, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, createErrorJson("Lỗi hệ thống: " + e.getMessage()));
        }
    }

    // 2. XỬ LÝ REQUEST POST (TẠO MỚI / THỰC THI)
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setupCorsAndHeaders(resp);
        String pathInfo = req.getPathInfo();
        PrintWriter out = resp.getWriter();

        try {
            if (pathInfo == null) {
                sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson("Endpoint không hợp lệ."));
                return;
            }

            switch (pathInfo) {
                // Khách Hàng / Xác thực Auth Endpoints
                case "/auth/register":
                    KhachHang khReg = parseRequestBody(req, KhachHang.class);
                    boolean isReg = khachHangController.dangKy(khReg);
                    sendResponse(resp, out, 200, createSuccessJson("status", isReg));
                    break;

                case "/auth/login":
                    Map<String, String> loginData = parseRequestBody(req, Map.class);
                    KhachHang kh = khachHangController.dangNhap(loginData.get("email"), loginData.get("matKhau"));
                    if (kh != null) {
                        sendResponse(resp, out, 200, gson.toJson(kh));
                    } else {
                        sendResponse(resp, out, HttpServletResponse.SC_UNAUTHORIZED, createErrorJson("Email hoặc mật khẩu không chính xác."));
                    }
                    break;

                case "/auth/forgot-password":
                    Map<String, String> forgotData = parseRequestBody(req, Map.class);
                    boolean isOtpSent = khachHangController.quenMatKhau(forgotData.get("email"));
                    sendResponse(resp, out, 200, createSuccessJson("status", isOtpSent));
                    break;

                case "/auth/verify-otp":
                    Map<String, String> otpData = parseRequestBody(req, Map.class);
                    boolean isOtpValid = khachHangController.xacThucOTP(otpData.get("email"), otpData.get("otp"));
                    sendResponse(resp, out, 200, createSuccessJson("status", isOtpValid));
                    break;

                case "/auth/reset-password":
                    Map<String, String> resetData = parseRequestBody(req, Map.class);
                    boolean isReset = khachHangController.datLaiMatKhau(resetData.get("email"), resetData.get("otp"), resetData.get("matKhauMoi"));
                    sendResponse(resp, out, 200, createSuccessJson("status", isReset));
                    break;

                // Nhân Viên Auth
                case "/staff/login":
                    Map<String, String> staffLogin = parseRequestBody(req, Map.class);
                    NhanVien nv = nhanVienController.dangNhap(staffLogin.get("email"), staffLogin.get("matKhau"));
                    if (nv != null) {
                        sendResponse(resp, out, 200, gson.toJson(nv));
                    } else {
                        sendResponse(resp, out, HttpServletResponse.SC_UNAUTHORIZED, createErrorJson("Tài khoản nhân viên không chính xác."));
                    }
                    break;

                // Phim & Suất Chiếu
                case "/movies/create":
                    Phim phimNew = parseRequestBody(req, Phim.class);
                    boolean isMovieCreated = phimController.themPhim(phimNew);
                    sendResponse(resp, out, 200, createSuccessJson("status", isMovieCreated));
                    break;

                case "/showtimes/create":
                    SuatChieu scNew = parseRequestBody(req, SuatChieu.class);
                    boolean isScCreated = suatChieuController.taoSuatChieu(scNew);
                    sendResponse(resp, out, 200, createSuccessJson("status", isScCreated));
                    break;

                // Đơn Đặt Vé Endpoints
                case "/bookings/create":
                    Map<String, String> createDonReq = parseRequestBody(req, Map.class);
                    DonDatVe donTao = donDatVeController.taoDon(createDonReq.get("maKH"), createDonReq.get("maNV"));
                    sendResponse(resp, out, 200, gson.toJson(donTao));
                    break;

                case "/bookings/add-combo":
                    Map<String, Object> comboReq = parseRequestBody(req, Map.class);
                    String maDonCombo = (String) comboReq.get("maDon");
                    String maCombo = (String) comboReq.get("maCombo");
                    int soLuong = ((Double) comboReq.get("soLuong")).intValue();
                    boolean isComboAdded = donDatVeController.themCombo(maDonCombo, maCombo, soLuong);
                    sendResponse(resp, out, 200, createSuccessJson("status", isComboAdded));
                    break;

                case "/bookings/apply-promotion":
                    Map<String, String> kmReq = parseRequestBody(req, Map.class);
                    boolean isKmApplied = donDatVeController.apDungKhuyenMai(kmReq.get("maDon"), kmReq.get("maKM"));
                    sendResponse(resp, out, 200, createSuccessJson("status", isKmApplied));
                    break;

                case "/bookings/confirm":
                    Map<String, String> confirmReq = parseRequestBody(req, Map.class);
                    boolean isConfirmed = donDatVeController.xacNhanDon(confirmReq.get("maDon"));
                    sendResponse(resp, out, 200, createSuccessJson("status", isConfirmed));
                    break;

                case "/bookings/cancel":
                    Map<String, String> cancelReq = parseRequestBody(req, Map.class);
                    boolean isCanceled = donDatVeController.huyDon(cancelReq.get("maDon"));
                    sendResponse(resp, out, 200, createSuccessJson("status", isCanceled));
                    break;

                // Thanh Toán Endpoints
                case "/payments/create":
                    Map<String, Object> payReq = parseRequestBody(req, Map.class);
                    String maDonPay = (String) payReq.get("maDon");
                    BigDecimal soTien = new BigDecimal(payReq.get("soTien").toString());
                    PhuongThuc phuongThuc = PhuongThuc.valueOf((String) payReq.get("phuongThuc"));
                    ThanhToan tt = thanhToanController.taoThanhToan(maDonPay, soTien, phuongThuc);
                    sendResponse(resp, out, 200, gson.toJson(tt));
                    break;

                case "/payments/process":
                    Map<String, String> processPay = parseRequestBody(req, Map.class);
                    boolean isPaid = thanhToanController.thanhToan(processPay.get("maTT"));
                    sendResponse(resp, out, 200, createSuccessJson("status", isPaid));
                    break;

                default:
                    sendResponse(resp, out, HttpServletResponse.SC_NOT_FOUND, createErrorJson("Endpoint POST không tồn tại."));
                    break;
            }
        } catch (IllegalArgumentException e) {
            sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(resp, out, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, createErrorJson("Lỗi xử lý yêu cầu POST: " + e.getMessage()));
        }
    }

    // 3. XỬ LÝ REQUEST PUT (CẬP NHẬT)
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setupCorsAndHeaders(resp);
        String pathInfo = req.getPathInfo();
        PrintWriter out = resp.getWriter();

        try {
            if (pathInfo == null) {
                sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson("Endpoint không hợp lệ."));
                return;
            }

            switch (pathInfo) {
                case "/movies/update":
                    Phim phimUpdate = parseRequestBody(req, Phim.class);
                    boolean isMovieUpdated = phimController.capNhatPhim(phimUpdate);
                    sendResponse(resp, out, 200, createSuccessJson("status", isMovieUpdated));
                    break;

                case "/showtimes/update":
                    SuatChieu scUpdate = parseRequestBody(req, SuatChieu.class);
                    boolean isScUpdated = suatChieuController.capNhatSuatChieu(scUpdate);
                    sendResponse(resp, out, 200, createSuccessJson("status", isScUpdated));
                    break;

                default:
                    sendResponse(resp, out, HttpServletResponse.SC_NOT_FOUND, createErrorJson("Endpoint PUT không tồn tại."));
                    break;
            }
        } catch (IllegalArgumentException e) {
            sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(resp, out, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, createErrorJson("Lỗi cập nhật dữ liệu: " + e.getMessage()));
        }
    }

    // 4. XỬ LÝ REQUEST DELETE (XÓA DỮ LIỆU)
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setupCorsAndHeaders(resp);
        String pathInfo = req.getPathInfo();
        PrintWriter out = resp.getWriter();

        try {
            if (pathInfo == null) {
                sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson("Endpoint không hợp lệ."));
                return;
            }

            switch (pathInfo) {
                case "/movies/delete":
                    String maPhimDel = req.getParameter("maPhim");
                    boolean isMovieDeleted = phimController.xoaPhim(maPhimDel);
                    sendResponse(resp, out, 200, createSuccessJson("status", isMovieDeleted));
                    break;

                case "/showtimes/delete":
                    String maSuatDel = req.getParameter("maSuat");
                    boolean isScDeleted = suatChieuController.xoaSuatChieu(maSuatDel);
                    sendResponse(resp, out, 200, createSuccessJson("status", isScDeleted));
                    break;

                default:
                    sendResponse(resp, out, HttpServletResponse.SC_NOT_FOUND, createErrorJson("Endpoint DELETE không tồn tại."));
                    break;
            }
        } catch (IllegalArgumentException e) {
            sendResponse(resp, out, HttpServletResponse.SC_BAD_REQUEST, createErrorJson(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(resp, out, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, createErrorJson("Lỗi xóa dữ liệu: " + e.getMessage()));
        }
    }

    // 5. CẤU HÌNH HEADERS & HELPER METHODS
    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setupCorsAndHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    private void setupCorsAndHeaders(HttpServletResponse resp) {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private <T> T parseRequestBody(HttpServletRequest req, Class<T> clazz) throws IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = req.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return gson.fromJson(sb.toString(), clazz);
    }

    private void sendResponse(HttpServletResponse resp, PrintWriter out, int statusCode, String jsonResponse) {
        resp.setStatus(statusCode);
        out.print(jsonResponse);
        out.flush();
    }

    private String createErrorJson(String message) {
        Map<String, String> errMap = new HashMap<>();
        errMap.put("error", message);
        return gson.toJson(errMap);
    }

    private String createSuccessJson(String key, Object value) {
        Map<String, Object> successMap = new HashMap<>();
        successMap.put(key, value);
        return gson.toJson(successMap);
    }
}