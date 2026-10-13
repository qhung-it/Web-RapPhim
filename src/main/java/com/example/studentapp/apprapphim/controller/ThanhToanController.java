package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.ThanhToanServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.ThanhToanService;
import com.example.studentapp.apprapphim.model.Enum.PhuongThuc;
import com.example.studentapp.apprapphim.model.entity.ThanhToan;

import java.math.BigDecimal;

public class ThanhToanController {

    private final ThanhToanService thanhToanService;

    public ThanhToanController() {
        this.thanhToanService = new ThanhToanServiceImpl();
    }

    public ThanhToan taoThanhToan(String maDon, BigDecimal soTien, PhuongThuc phuongThuc) {
        validateMa(maDon, "Mã đơn");
        if (soTien == null || soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0.");
        }
        if (phuongThuc == null) {
            throw new IllegalArgumentException("Phương thức thanh toán không được rỗng.");
        }
        return thanhToanService.taoThanhToan(maDon, soTien, phuongThuc);
    }

    public boolean thanhToan(String maTT) {
        validateMa(maTT, "Mã thanh toán");
        return thanhToanService.thanhToan(maTT);
    }

    public boolean huyThanhToan(String maTT) {
        validateMa(maTT, "Mã thanh toán");
        return thanhToanService.huyThanhToan(maTT);
    }

    public boolean kiemTraThanhToan(String maTT) {
        validateMa(maTT, "Mã thanh toán");
        return thanhToanService.kiemTraThanhToan(maTT);
    }

    public ThanhToan timTheoMa(String maTT) {
        validateMa(maTT, "Mã thanh toán");
        return thanhToanService.timTheoMa(maTT);
    }

    public ThanhToan timTheoDon(String maDon) {
        validateMa(maDon, "Mã đơn");
        return thanhToanService.timTheoDon(maDon);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}