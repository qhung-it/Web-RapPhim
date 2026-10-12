package com.example.studentapp.apprapphim;

import com.example.studentapp.apprapphim.model.util.JpaUtil;
import jakarta.persistence.EntityManagerFactory;

public class TestDatabase {
    public static void main(String[] args) {
        System.out.println("Kiểm tra kết nối SQL Server...");
        try {
            EntityManagerFactory emf = JpaUtil.getEntityManagerFactory();
            System.out.println("-> KẾT NỐI DATABASE THÀNH CÔNG (EntityManagerFactory đã sẵn sàng)!");
            emf.close();
        } catch (Exception e) {
            System.err.println("-> LỖI KẾT NỐI DATABASE:");
            e.printStackTrace();
        }
    }
}