package com.example.studentapp.apprapphim.controller;

import com.example.studentapp.apprapphim.controller.service.impl.NhanVienServiceImpl;
import com.example.studentapp.apprapphim.controller.service.interf.NhanVienService;
import com.example.studentapp.apprapphim.model.Enum.ChucVu;
import com.example.studentapp.apprapphim.model.entity.NhanVien;

import java.util.List;

public class NhanVienController {

    private final NhanVienService nhanVienService;

    public NhanVienController() {
        this.nhanVienService = new NhanVienServiceImpl();
    }

    public NhanVien dangNhap(String email, String matKhau) {
        if (email == null || matKhau == null) {
            throw new IllegalArgumentException("Thông tin đăng nhập không được rỗng.");
        }
        return nhanVienService.dangNhap(email, matKhau);
    }

    public boolean themNhanVien(NhanVien nhanVien) {
        if (nhanVien == null) {
            throw new IllegalArgumentException("Thông tin nhân viên không được rỗng.");
        }
        return nhanVienService.themNhanVien(nhanVien);
    }

    public boolean capNhatNhanVien(NhanVien nhanVien) {
        if (nhanVien == null || nhanVien.getMaNV() == null) {
            throw new IllegalArgumentException("Mã nhân viên không hợp lệ.");
        }
        return nhanVienService.capNhatNhanVien(nhanVien);
    }

    public boolean xoaNhanVien(String maNV) {
        validateMa(maNV, "Mã nhân viên");
        return nhanVienService.xoaNhanVien(maNV);
    }

    public NhanVien timTheoMa(String maNV) {
        validateMa(maNV, "Mã nhân viên");
        return nhanVienService.timTheoMa(maNV);
    }

    public List<NhanVien> layDanhSachNhanVien() {
        return nhanVienService.layDanhSachNhanVien();
    }

    public boolean phanQuyen(String maNV, ChucVu chucVu) {
        validateMa(maNV, "Mã nhân viên");
        if (chucVu == null) {
            throw new IllegalArgumentException("Chức vụ phân quyền không được rỗng.");
        }
        return nhanVienService.phanQuyen(maNV, chucVu);
    }

    private void validateMa(String ma, String tenTruong) {
        if (ma == null || ma.trim().isEmpty()) {
            throw new IllegalArgumentException(tenTruong + " không được để trống.");
        }
    }
}