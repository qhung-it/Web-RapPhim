package com.example.studentapp.apprapphim.web;

import com.example.studentapp.apprapphim.controller.service.impl.*;
import com.example.studentapp.apprapphim.controller.service.interf.*;
import com.example.studentapp.apprapphim.model.Enum.*;
import com.example.studentapp.apprapphim.model.entity.*;
import com.google.gson.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.TemporalAccessor;
import java.util.*;

@WebServlet(name = "ApiServlet", urlPatterns = "/api/*")
public class ApiServlet extends HttpServlet {
    private static final Gson GSON = new GsonBuilder()
            .registerTypeAdapter(LocalDate.class, (JsonSerializer<LocalDate>) (v,t,c) -> new JsonPrimitive(v.toString()))
            .registerTypeAdapter(LocalDate.class, (JsonDeserializer<LocalDate>) (j,t,c) -> LocalDate.parse(j.getAsString()))
            .registerTypeAdapter(LocalTime.class, (JsonSerializer<LocalTime>) (v,t,c) -> new JsonPrimitive(v.toString()))
            .registerTypeAdapter(LocalTime.class, (JsonDeserializer<LocalTime>) (j,t,c) -> LocalTime.parse(j.getAsString()))
            .registerTypeAdapter(LocalDateTime.class, (JsonSerializer<LocalDateTime>) (v,t,c) -> new JsonPrimitive(v.toString()))
            .registerTypeAdapter(LocalDateTime.class, (JsonDeserializer<LocalDateTime>) (j,t,c) -> LocalDateTime.parse(j.getAsString()))
            .disableHtmlEscaping().create();

    private final KhachHangService customers = new KhachHangServiceImpl();
    private final NhanVienService staff = new NhanVienServiceImpl();
    private final PhimService movies = new PhimServiceImpl();
    private final SuatChieuService shows = new SuatChieuServiceImpl();
    private final GheService seats = new GheServiceImpl();
    private final ComboService combos = new ComboServiceImpl();
    private final KhuyenMaiService promos = new KhuyenMaiServiceImpl();
    private final RapService cinemas = new RapServiceImpl();
    private final PhongChieuService rooms = new PhongChieuServiceImpl();
    private final DonDatVeService orders = new DonDatVeServiceImpl();
    private final ThanhToanService payments = new ThanhToanServiceImpl();
    private final LoaiKhachHangService tiers = new LoaiKhachHangServiceImpl();
    private final ThongKeDoanhThuService reports = new ThongKeDoanhThuServiceImpl();
    private final VeService tickets = new VeServiceImpl();

    @Override protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("Cache-Control", "no-store");
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) { resp.setStatus(204); return; }
        try {
            Object result = dispatch(req, resp);
            if (resp.isCommitted()) return;
            if (result == null) result = Map.of("success", true);
            resp.getWriter().write(GSON.toJson(result));
        } catch (IllegalArgumentException e) {
            resp.setStatus(400); resp.getWriter().write(GSON.toJson(error(e.getMessage())));
        } catch (SecurityException e) {
            resp.setStatus(401); resp.getWriter().write(GSON.toJson(error("Vui lòng đăng nhập để thực hiện thao tác này.")));
        } catch (ForbiddenException e) {
            resp.setStatus(403); resp.getWriter().write(GSON.toJson(error("Tài khoản không có quyền thực hiện thao tác này.")));
        } catch (Exception e) {
            getServletContext().log("API request failed: " + req.getMethod() + " " + req.getRequestURI(), e);
            resp.setStatus(500); resp.getWriter().write(GSON.toJson(error("Có lỗi phía máy chủ. Kiểm tra cấu hình database và log ứng dụng.")));
        }
    }

    private Object dispatch(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String path = Optional.ofNullable(req.getPathInfo()).orElse("/");
        String[] seg = Arrays.stream(path.split("/")).filter(x -> !x.isBlank()).toArray(String[]::new);
        String root = seg.length > 0 ? seg[0].toLowerCase(Locale.ROOT) : "";
        String id = seg.length > 1 ? seg[1] : null;
        String method = req.getMethod().toUpperCase(Locale.ROOT);
        JsonObject body = readBody(req);

        if ("health".equals(root)) return Map.of("success", true, "application", "App-RapPhim", "time", LocalDateTime.now().toString());
        if ("auth".equals(root)) return auth(req, resp, seg, method, body);
        if ("movies".equals(root)) {
            if ("GET".equals(method)) {
                if (id != null) return dto(movies.timTheoMa(id));
                String q=req.getParameter("q"), status=req.getParameter("status"), genre=req.getParameter("genre"), age=req.getParameter("age");
                if (q!=null || status!=null || genre!=null || age!=null) {
                    TrangThaiPhim st=status==null||status.isBlank()?null:enumValue(TrangThaiPhim.class,status);
                    Integer ageValue=age==null||age.isBlank()?null:Integer.valueOf(age);
                    return movies.timKiem(q,genre,st,ageValue).stream().map(this::movieDto).toList();
                }
                return movies.layDanhSachPhim().stream().map(this::movieDto).toList();
            }
            if (!"GET".equals(method)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if ("POST".equals(method)) return result(movies.themPhim(read(body, Phim.class)), "Thêm phim thành công.");
            if ("PUT".equals(method)) { Phim p=read(body, Phim.class); if (p.getMaPhim()==null) p.setMaPhim(id); return result(movies.capNhatPhim(p), "Cập nhật phim thành công."); }
            if ("DELETE".equals(method)) return result(movies.xoaPhim(id), "Xóa phim thành công.");
        }
        if ("shows".equals(root)) {
            if ("GET".equals(method)) {
                if (id != null) return dto(shows.timTheoMa(id));
                String movie=req.getParameter("movie"), date=req.getParameter("date"), room=req.getParameter("room");
                if (movie!=null || date!=null || room!=null) return shows.timSuatChieu(movie, date==null?null:LocalDate.parse(date), room).stream().map(this::showDto).toList();
                return shows.layDanhSachSuatChieu().stream().map(this::showDto).toList();
            }
            if (!"GET".equals(method)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if ("POST".equals(method)) return result(shows.taoSuatChieu(readShow(body)), "Tạo suất chiếu thành công.");
            if ("PUT".equals(method)) { SuatChieu x=readShow(body); if(x.getMaSuat()==null)x.setMaSuat(id); return result(shows.capNhatSuatChieu(x), "Cập nhật suất chiếu thành công."); }
            if ("DELETE".equals(method)) return result(shows.xoaSuatChieu(id), "Xóa suất chiếu thành công.");
        }
        if ("seats".equals(root)) {
            if ("GET".equals(method)) {
                if ("show".equals(id) && seg.length>2) return Map.of("available", seats.layGheTrong(seg[2]).stream().map(this::seatDto).toList(), "sold", seats.layGheDaBan(seg[2]).stream().map(this::seatDto).toList());
                if (id!=null) return dto(seats.timTheoMa(id));
                String room=req.getParameter("room"); if(room==null) throw new IllegalArgumentException("Thiếu query room.");
                return seats.layDanhSachGhe(room).stream().map(this::seatDto).toList();
            }
            if (!"GET".equals(method)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if ("POST".equals(method)) return result(seats.themGhe(read(body,Ghe.class)), "Thêm ghế thành công.");
            if ("PUT".equals(method)) { Ghe g=read(body,Ghe.class); if(g.getMaGhe()==null)g.setMaGhe(id); return result(seats.capNhatGhe(g), "Cập nhật ghế thành công."); }
            if ("DELETE".equals(method)) return result(seats.xoaGhe(id), "Xóa ghế thành công.");
        }
        if ("combos".equals(root)) {
            if("GET".equals(method)) return (id==null?combos.layDanhSachCombo():Collections.singletonList(combos.timTheoMa(id))).stream().filter(Objects::nonNull).map(this::comboDto).toList();
            if(!"GET".equals(method)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if("POST".equals(method)) return result(combos.themCombo(read(body,Combo.class)),"Thêm combo thành công.");
            if("PUT".equals(method)) { Combo c=read(body,Combo.class); if(c.getMaCombo()==null)c.setMaCombo(id); return result(combos.capNhatCombo(c),"Cập nhật combo thành công."); }
            if("DELETE".equals(method)) return result(combos.xoaCombo(id),"Xóa combo thành công.");
        }
        if ("promotions".equals(root)) {
            if("GET".equals(method)) return (id==null?promos.layDanhSachKhuyenMai():Collections.singletonList(promos.timTheoMa(id))).stream().filter(Objects::nonNull).map(this::promoDto).toList();
            if(!"GET".equals(method)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if("POST".equals(method)) return result(promos.themKhuyenMai(read(body,KhuyenMai.class)),"Thêm khuyến mãi thành công.");
            if("PUT".equals(method)) { KhuyenMai p=read(body,KhuyenMai.class); if(p.getMaKM()==null)p.setMaKM(id); return result(promos.capNhatKhuyenMai(p),"Cập nhật khuyến mãi thành công."); }
            if("DELETE".equals(method)) return result(promos.xoaKhuyenMai(id),"Xóa khuyến mãi thành công.");
        }
        if ("cinemas".equals(root)) {
            if("GET".equals(method)) return (id==null?cinemas.layDanhSachRap():Collections.singletonList(cinemas.timTheoMa(id))).stream().filter(Objects::nonNull).map(this::cinemaDto).toList();
            if(!"GET".equals(method)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if("POST".equals(method)) return result(cinemas.themRap(read(body,Rap.class)),"Thêm rạp thành công.");
            if("PUT".equals(method)) { Rap r=read(body,Rap.class); if(r.getMaRap()==null)r.setMaRap(id); return result(cinemas.capNhatRap(r),"Cập nhật rạp thành công."); }
            if("DELETE".equals(method)) return result(cinemas.xoaRap(id),"Xóa rạp thành công.");
        }
        if ("rooms".equals(root)) {
            if("GET".equals(method)) { String cinema=req.getParameter("cinema"); if(id!=null) return dto(rooms.timTheoMa(id)); if(cinema==null) throw new IllegalArgumentException("Thiếu query cinema."); return rooms.layDanhSachPhongCuaRap(cinema).stream().map(this::roomDto).toList(); }
            if(!"GET".equals(method)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if("POST".equals(method)) return result(rooms.themPhongChieu(readRoom(body)),"Thêm phòng thành công.");
            if("PUT".equals(method)) { PhongChieu r=readRoom(body); if(r.getMaPhong()==null)r.setMaPhong(id); return result(rooms.capNhatPhongChieu(r),"Cập nhật phòng thành công."); }
            if("DELETE".equals(method)) return result(rooms.xoaPhongChieu(id),"Xóa phòng thành công.");
        }
        if ("customers".equals(root)) {
            if ("PUT".equals(method) && "profile".equals(id)) {
                HttpSession session=req.getSession(false);
                if(session==null || session.getAttribute("customerId")==null) throw new SecurityException();
                String customerId=(String)session.getAttribute("customerId");
                String dob=str(body,"ngaySinh");
                LocalDate birthDate=(dob==null || dob.isBlank())?null:LocalDate.parse(dob);
                boolean ok=customers.capNhatThongTin(customerId,str(body,"hoTen"),str(body,"email"),str(body,"soDienThoai"),birthDate);
                if(!ok) throw new IllegalArgumentException("Không thể cập nhật hồ sơ. Kiểm tra họ tên, email có thể bị trùng.");
                return Map.of("success",true,"message","Cập nhật hồ sơ thành công.","user",customerDto(customers.timTheoMa(customerId)));
            }
            if("PUT".equals(method) && "password".equals(id)) { HttpSession s=req.getSession(false); if(s==null || s.getAttribute("customerId")==null) throw new SecurityException(); return result(customers.doiMatKhau((String)s.getAttribute("customerId"),str(body,"matKhauCu"),str(body,"matKhauMoi")),"Đổi mật khẩu thành công."); }
            if ("GET".equals(method) && "history".equals(id)) { HttpSession s=req.getSession(false); if(s==null || s.getAttribute("customerId")==null) throw new SecurityException(); String customerId=(String)s.getAttribute("customerId"); return customers.xemLichSuDatVe(customerId).stream().map(this::orderDto).toList(); }
            requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe);
            if("GET".equals(method)) { if(id==null) throw new IllegalArgumentException("Hãy truyền mã khách hàng: /api/customers/{maKH}."); return customerDto(customers.timTheoMa(id)); }
        }
        if ("tickets".equals(root)) {
            requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienKiemVe);
            if ("GET".equals(method)) {
                String code=req.getParameter("code");
                if (code!=null && !code.isBlank()) { Ve v=tickets.timTheoMaDienTu(code); if(v==null)v=tickets.timTheoMa(code); return ticketDto(v); }
                if (id!=null) { Ve v=tickets.timTheoMa(id); if(v==null)v=tickets.timTheoMaDienTu(id); return ticketDto(v); }
                return tickets.layDanhSachVe().stream().map(this::ticketDto).toList();
            }
            if ("POST".equals(method) && id!=null && seg.length>2) {
                boolean ok=switch(seg[2]) { case "validate" -> tickets.kiemTraVe(id); case "use" -> tickets.suDungVe(id); default -> throw new IllegalArgumentException("Thao tác vé không hợp lệ."); };
                return result(ok, "Đã xử lý vé.");
            }
        }
        if ("staff".equals(root)) {
            if("POST".equals(method) && "login".equals(id)) { NhanVien n=staff.dangNhap(str(body,"email"),str(body,"password")); if(n==null) throw new SecurityException(); HttpSession old=req.getSession(false); if(old!=null)old.invalidate(); HttpSession fresh=req.getSession(true); fresh.setMaxInactiveInterval(30*60); fresh.setAttribute("staffId",n.getMaNV()); fresh.setAttribute("staffRole",n.getChucVu()==null?null:n.getChucVu().name()); return Map.of("success",true,"staff",staffDto(n)); }
            if("POST".equals(method) && "logout".equals(id)) { HttpSession session=req.getSession(false); if(session!=null)session.invalidate(); return Map.of("success",true,"message","Đã đăng xuất."); }
            if("GET".equals(method) && "me".equals(id)) { HttpSession session=req.getSession(false); if(session==null||session.getAttribute("staffId")==null)throw new SecurityException(); return Map.of("success",true,"staff",staffDto(staff.timTheoMa((String)session.getAttribute("staffId")))); }
            requireRole(req, ChucVu.Admin);
            if("GET".equals(method)) return (id==null?staff.layDanhSachNhanVien():Collections.singletonList(staff.timTheoMa(id))).stream().filter(Objects::nonNull).map(this::staffDto).toList();
            if("POST".equals(method)) return result(staff.themNhanVien(read(body,NhanVien.class)),"Thêm nhân viên thành công.");
            if("PUT".equals(method)) { NhanVien n=read(body,NhanVien.class); if(n.getMaNV()==null)n.setMaNV(id); return result(staff.capNhatNhanVien(n),"Cập nhật nhân viên thành công."); }
            if("DELETE".equals(method)) return result(staff.xoaNhanVien(id),"Xóa nhân viên thành công.");
        }
        if ("orders".equals(root)) {
            if("GET".equals(method)) {
                HttpSession session=req.getSession(false); String customerId=session==null?null:(String)session.getAttribute("customerId");
                if(id!=null) {
                    DonDatVe o=orders.timTheoMa(id);
                    if(o==null)return null;
                    if(session==null || (!isStaff(session) && (customerId==null || o.getKhachHang()==null || !customerId.equals(o.getKhachHang().getMaKH())))) throw new SecurityException();
                    if(isStaff(session)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe);
                    return orderDto(o);
                }
                if(customerId!=null && !isStaff(session)) return customers.xemDonDatVe(customerId).stream().map(this::orderDto).toList();
                requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe); return orders.layDanhSachDon().stream().map(this::orderDto).toList();
            }
            if("POST".equals(method) && "create".equals(id)) {
                HttpSession s=req.getSession(false);
                String customerId;
                String staffId=null;
                if(s!=null && s.getAttribute("staffId")!=null) { requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe); customerId=str(body,"maKH"); staffId=(String)s.getAttribute("staffId"); }
                else { if(s==null || s.getAttribute("customerId")==null)throw new SecurityException(); customerId=(String)s.getAttribute("customerId"); }
                if(customerId==null || customerId.isBlank()) throw new IllegalArgumentException("Thiếu mã khách hàng maKH.");
                DonDatVe o=orders.taoDon(customerId,staffId); if(o==null)throw new IllegalArgumentException("Không tìm thấy khách hàng."); return orderDto(o);
            }
            if("POST".equals(method) && id!=null && seg.length>2) {
                String action=seg[2];
                if ("add-seat".equals(action)) {
                    HttpSession session=req.getSession(false); DonDatVe order=orders.timTheoMa(id);
                    if(order==null)throw new IllegalArgumentException("Không tìm thấy đơn hàng.");
                    if(session==null || (session.getAttribute("staffId")==null && !Objects.equals(session.getAttribute("customerId"), safe(()->order.getKhachHang().getMaKH())))) throw new SecurityException();
                    if(isStaff(session)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe);
                    String showId=str(body,"maSuat"), seatId=str(body,"maGhe"); SuatChieu show=shows.timTheoMa(showId); Ghe seat=seats.timTheoMa(seatId);
                    if(show==null || seat==null)throw new IllegalArgumentException("Mã suất chiếu hoặc mã ghế không hợp lệ.");
                    String showRoom=safe(()->show.getPhongChieu().getMaPhong());
                    String seatRoom=safe(()->seat.getPhongChieu().getMaPhong());
                    if(showRoom==null || !Objects.equals(showRoom,seatRoom))
                        throw new IllegalArgumentException("Ghế không thuộc phòng chiếu của suất chiếu đã chọn.");
                    Ve ticket=new Ve(); ticket.setSuatChieu(show); ticket.setGhe(seat);
                    return result(orders.themVe(id,ticket),"Đã thêm ghế vào đơn hàng.");
                }
                if ("add-combo".equals(action)) {
                    HttpSession session=req.getSession(false); DonDatVe order=orders.timTheoMa(id);
                    if(order==null)throw new IllegalArgumentException("Không tìm thấy đơn hàng.");
                    if(session==null || (session.getAttribute("staffId")==null && !Objects.equals(session.getAttribute("customerId"), safe(()->order.getKhachHang().getMaKH())))) throw new SecurityException();
                    if(isStaff(session)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe);
                    return result(orders.themCombo(id,str(body,"maCombo"),body.has("soLuong")?body.get("soLuong").getAsInt():1),"Đã thêm combo vào đơn hàng.");
                }
                if ("promotion".equals(action)) {
                    HttpSession session=req.getSession(false); DonDatVe order=orders.timTheoMa(id);
                    if(order==null)throw new IllegalArgumentException("Không tìm thấy đơn hàng.");
                    if(session==null || (session.getAttribute("staffId")==null && !Objects.equals(session.getAttribute("customerId"), safe(()->order.getKhachHang().getMaKH())))) throw new SecurityException();
                    if(isStaff(session)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe);
                    String maKM=str(body,"maKM");
                    if(maKM==null || maKM.isBlank()) throw new IllegalArgumentException("Vui lòng chọn mã khuyến mãi.");
                    if(!orders.apDungKhuyenMai(id,maKM)) throw new IllegalArgumentException("Mã khuyến mãi không hợp lệ, chưa đến hạn, đã hết hạn hoặc đơn hàng không còn chờ thanh toán.");
                    return orderDto(orders.timTheoMa(id));
                }
                boolean ok=switch(action){
                    case "cancel" -> {
                        HttpSession session=req.getSession(false); DonDatVe order=orders.timTheoMa(id);
                        if(order==null)throw new IllegalArgumentException("Không tìm thấy đơn hàng.");
                        if(session==null || (session.getAttribute("staffId")==null && !Objects.equals(session.getAttribute("customerId"), safe(()->order.getKhachHang().getMaKH())))) throw new SecurityException();
                        if(isStaff(session)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
                        yield orders.huyDon(id);
                    }
                    case "confirm" -> {requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe); yield orders.xacNhanDon(id);}
                    default -> throw new IllegalArgumentException("Thao tác đơn hàng không hợp lệ.");
                };
                return result(ok,"Đã cập nhật đơn hàng.");
            }
        }
        if ("payments".equals(root)) {
            if("POST".equals(method) && "create".equals(id)) { HttpSession session=req.getSession(false); if(session==null || (session.getAttribute("customerId")==null && session.getAttribute("staffId")==null)) throw new SecurityException(); String orderId=str(body,"maDon"); DonDatVe order=orders.timTheoMa(orderId); if(order==null) throw new IllegalArgumentException("Không tìm thấy đơn hàng."); if(!isStaff(session) && !Objects.equals(session.getAttribute("customerId"), order.getKhachHang()==null?null:order.getKhachHang().getMaKH())) throw new SecurityException(); if(isStaff(session)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe); BigDecimal amount=decimal(body,"soTien"); BigDecimal expected=order.tinhTongTienSauGiam(); if(expected==null || amount.compareTo(expected)!=0) throw new IllegalArgumentException("Số tiền thanh toán không khớp tổng tiền đơn hàng."); PhuongThuc way=enumValue(PhuongThuc.class,str(body,"phuongThuc")); ThanhToan p=payments.taoThanhToan(orderId,amount,way); return paymentDto(p); }
            if(("POST".equals(method) && id!=null && seg.length>2) || ("GET".equals(method) && id!=null)) {
                HttpSession session=req.getSession(false);
                ThanhToan payment=payments.timTheoMa(id);
                if(payment==null) throw new IllegalArgumentException("Không tìm thấy thanh toán.");
                DonDatVe linkedOrder=safe(payment::getDonDatVe);
                if(session==null || (!isStaff(session) && (session.getAttribute("customerId")==null || linkedOrder==null || !Objects.equals(session.getAttribute("customerId"), safe(()->linkedOrder.getKhachHang().getMaKH()))))) throw new SecurityException();
                if(isStaff(session)) requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe);
                if("GET".equals(method)) return paymentDto(payment);
                boolean ok=switch(seg[2]) { case "pay" -> payments.thanhToan(id); case "cancel" -> payments.huyThanhToan(id); default -> throw new IllegalArgumentException("Thao tác thanh toán không hợp lệ."); };
                return result(ok,"Đã cập nhật thanh toán.");
            }
        }
        if ("tiers".equals(root)) {
            if ("GET".equals(method)) {
                if (id != null) return tierDto(tiers.timTheoMa(id));
                return tiers.layDanhSachLoaiKhachHang().stream().map(this::tierDto).toList();
            }
            requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy);
            if ("POST".equals(method)) return result(tiers.themLoaiKhachHang(read(body, LoaiKhachHang.class)), "Thêm loại khách hàng thành công.");
            if ("PUT".equals(method)) {
                LoaiKhachHang tier = read(body, LoaiKhachHang.class);
                if (tier.getMaLoai() == null) tier.setMaLoai(id);
                return result(tiers.capNhatLoaiKhachHang(tier), "Cập nhật loại khách hàng thành công.");
            }
            if ("DELETE".equals(method)) return result(tiers.xoaLoaiKhachHang(id), "Xóa loại khách hàng thành công.");
        }
        if ("reports".equals(root) && "GET".equals(method)) {
            requireAnyRole(req, ChucVu.Admin, ChucVu.QuanLy); String type=Optional.ofNullable(req.getParameter("type")).orElse("day");
            return switch(type) { case "day" -> Map.of("revenue",reports.tinhDoanhThuTheoNgay(LocalDate.parse(required(req,"date"))),"tickets",reports.demSoVeBanTheoNgay(LocalDate.parse(required(req,"date")))); case "month" -> Map.of("revenue",reports.tinhDoanhThuTheoThang(Integer.parseInt(required(req,"month")),Integer.parseInt(required(req,"year")))); case "year" -> Map.of("revenue",reports.tinhDoanhThuTheoNam(Integer.parseInt(required(req,"year")))); default -> throw new IllegalArgumentException("type chỉ nhận day, month hoặc year."); };
        }
        resp.setStatus(404); return error("Không tìm thấy API: /api/"+String.join("/",seg));
    }

    private Object auth(HttpServletRequest req,HttpServletResponse resp,String[] seg,String method,JsonObject b) {
        String action=seg.length>1?seg[1]:"";
        switch(action) {
            case "login" -> { if(!"POST".equals(method)) throw new IllegalArgumentException("Dùng POST để đăng nhập."); String email=first(b,"email","ident"), password=first(b,"password","matKhau"); KhachHang c=customers.dangNhap(email,password); if(c==null) throw new SecurityException(); HttpSession old=req.getSession(false); if(old!=null)old.invalidate(); HttpSession s=req.getSession(true); s.setAttribute("customerId",c.getMaKH()); s.setMaxInactiveInterval(30*60); return Map.of("success",true,"user",customerDto(c)); }
            case "register" -> { if(!"POST".equals(method)) throw new IllegalArgumentException("Dùng POST để đăng ký."); KhachHang c=new KhachHang(); c.setMaKH(first(b,"maKH","id")!=null?first(b,"maKH","id"):"KH"+System.currentTimeMillis()); c.setHoTen(str(b,"hoTen")); c.setEmail(str(b,"email")); c.setMatKhau(str(b,"matKhau")); c.setSoDienThoai(str(b,"soDienThoai")); String dob=str(b,"ngaySinh"); if(dob!=null&&!dob.isBlank())c.setNgaySinh(LocalDate.parse(dob)); String tierId=str(b,"maLoai"); List<LoaiKhachHang> all=tiers.layDanhSachLoaiKhachHang(); LoaiKhachHang tier=all.stream().filter(t->Objects.equals(t.getMaLoai(),tierId)).findFirst().orElseGet(()->all.stream().findFirst().orElse(null)); if(tier==null)throw new IllegalArgumentException("Database chưa có loại khách hàng để đăng ký."); c.setLoaiKhachHang(tier); if(!customers.dangKy(c)) throw new IllegalArgumentException("Email hoặc mã khách hàng đã tồn tại, hoặc dữ liệu chưa hợp lệ."); HttpSession old=req.getSession(false); if(old!=null)old.invalidate(); HttpSession s=req.getSession(true); s.setMaxInactiveInterval(30*60); s.setAttribute("customerId",c.getMaKH()); return Map.of("success",true,"user",customerDto(c)); }
            case "forgot" -> { return result(customers.quenMatKhau(str(b,"email")),"Nếu email tồn tại và cấu hình email hợp lệ, mã OTP sẽ được gửi."); }
            case "verify-otp" -> { return result(customers.xacThucOTP(str(b,"email"),str(b,"otp")),"Xác thực OTP thành công."); }
            case "reset-password" -> { return result(customers.datLaiMatKhau(str(b,"email"),str(b,"otp"),str(b,"matKhauMoi")),"Đặt lại mật khẩu thành công."); }
            case "logout" -> { HttpSession s=req.getSession(false); if(s!=null)s.invalidate(); return Map.of("success",true); }
            case "me" -> { HttpSession s=req.getSession(false); if(s==null||s.getAttribute("customerId")==null)throw new SecurityException(); return Map.of("success",true,"user",customerDto(customers.timTheoMa((String)s.getAttribute("customerId")))); }
            default -> throw new IllegalArgumentException("API xác thực không hợp lệ.");
        }
    }

    private JsonObject readBody(HttpServletRequest req) throws IOException { String raw=req.getReader().lines().reduce("",(a,b)->a+b); if(raw.isBlank())return new JsonObject(); JsonElement e=JsonParser.parseString(raw); if(!e.isJsonObject())throw new IllegalArgumentException("Body phải là JSON object."); return e.getAsJsonObject(); }
    private <T> T read(JsonObject o,Class<T> type){return GSON.fromJson(o,type);} private String str(JsonObject o,String k){return o.has(k)&&!o.get(k).isJsonNull()?o.get(k).getAsString():null;} private String first(JsonObject o,String a,String b){String x=str(o,a);return x==null?str(o,b):x;} private BigDecimal decimal(JsonObject o,String k){String x=str(o,k);return x==null?BigDecimal.ZERO:new BigDecimal(x);} private String required(HttpServletRequest r,String k){String x=r.getParameter(k);if(x==null||x.isBlank())throw new IllegalArgumentException("Thiếu query "+k+".");return x;}
    private <E extends Enum<E>> E enumValue(Class<E> c,String v){if(v==null)throw new IllegalArgumentException("Thiếu giá trị enum "+c.getSimpleName()+".");try{return Enum.valueOf(c,v);}catch(Exception e){throw new IllegalArgumentException("Giá trị không hợp lệ: "+v);}}
    private SuatChieu readShow(JsonObject b){SuatChieu x=read(b,SuatChieu.class); String mp=str(b,"maPhim"),mr=str(b,"maPhong"); if(mp!=null)x.setPhim(movies.timTheoMa(mp)); if(mr!=null)x.setPhongChieu(rooms.timTheoMa(mr)); if(x.getPhim()==null||x.getPhongChieu()==null)throw new IllegalArgumentException("Cần maPhim và maPhong hợp lệ."); return x;}
    private PhongChieu readRoom(JsonObject b){PhongChieu x=read(b,PhongChieu.class);String mr=str(b,"maRap");if(mr!=null)x.setRap(cinemas.timTheoMa(mr));if(x.getRap()==null)throw new IllegalArgumentException("Cần maRap hợp lệ.");return x;}
    private void requireStaff(HttpServletRequest r){requireAnyRole(r, ChucVu.Admin, ChucVu.QuanLy, ChucVu.NhanVienBanVe, ChucVu.NhanVienKiemVe);}
    private void requireRole(HttpServletRequest r, ChucVu expected){requireAnyRole(r, expected);}
    private void requireAnyRole(HttpServletRequest r, ChucVu... allowed){
        HttpSession session=r.getSession(false);
        if(session==null || session.getAttribute("staffId")==null) throw new SecurityException();
        String role=(String)session.getAttribute("staffRole");
        if(role==null || role.isBlank()) {
            NhanVien current=staff.timTheoMa((String)session.getAttribute("staffId"));
            role=current==null||current.getChucVu()==null?null:current.getChucVu().name();
            if(role!=null) session.setAttribute("staffRole",role);
        }
        for(ChucVu candidate:allowed) if(candidate.name().equals(role)) return;
        throw new ForbiddenException();
    }
    private boolean isStaff(HttpSession s){return s!=null&&s.getAttribute("staffId")!=null;}
    private static final class ForbiddenException extends RuntimeException { private static final long serialVersionUID=1L; }
    private Map<String,Object> error(String message){return Map.of("success",false,"message",message==null?"Yêu cầu không hợp lệ.":message);}
    private Map<String,Object> result(boolean ok,String message){return Map.of("success",ok,"message",ok?message:"Thao tác không thành công. Kiểm tra dữ liệu và ràng buộc database.");}
    private Map<String,Object> dto(Object o){if(o==null)return null; if(o instanceof Phim x)return movieDto(x); if(o instanceof SuatChieu x)return showDto(x); if(o instanceof Ghe x)return seatDto(x); if(o instanceof Combo x)return comboDto(x); if(o instanceof KhuyenMai x)return promoDto(x); if(o instanceof Rap x)return cinemaDto(x); if(o instanceof PhongChieu x)return roomDto(x); if(o instanceof KhachHang x)return customerDto(x); if(o instanceof NhanVien x)return staffDto(x); if(o instanceof DonDatVe x)return orderDto(x); if(o instanceof ThanhToan x)return paymentDto(x); return Map.of("value",String.valueOf(o));}
    private Map<String,Object> movieDto(Phim x){if(x==null)return null;return map("maPhim",x.getMaPhim(),"tenPhim",x.getTenPhim(),"theLoai",x.getTheLoai(),"thoiLuong",x.getThoiLuong(),"doTuoi",x.getDoTuoi(),"moTa",x.getMoTa(),"poster",x.getPoster(),"trailer",x.getTrailer(),"trangThai",x.getTrangThai());}
    private Map<String,Object> showDto(SuatChieu x){if(x==null)return null;return map("maSuat",x.getMaSuat(),"ngayChieu",x.getNgayChieu(),"gioBatDau",x.getGioBatDau(),"gioKetThuc",x.getGioKetThuc(),"giaSuat",x.getGiaSuat(),"trangThai",x.getTrangThai(),"maPhim",safe(()->x.getPhim().getMaPhim()),"tenPhim",safe(()->x.getPhim().getTenPhim()),"maPhong",safe(()->x.getPhongChieu().getMaPhong()),"tenPhong",safe(()->x.getPhongChieu().getTenPhong()),"maRap",safe(()->x.getPhongChieu().getRap().getMaRap()));}
    private Map<String,Object> seatDto(Ghe x){if(x==null)return null;return map("maGhe",x.getMaGhe(),"soGhe",x.getSoGhe(),"hangGhe",x.getHangGhe(),"loaiGhe",x.getLoaiGhe(),"gia",x.getGia(),"maPhong",x.getPhongChieu()==null?null:x.getPhongChieu().getMaPhong());}
    private Map<String,Object> comboDto(Combo x){if(x==null)return null;return map("maCombo",x.getMaCombo(),"tenCombo",x.getTenCombo(),"moTa",x.getMoTa(),"gia",x.getGia(),"trangThai",x.getTrangThai());}
    private Map<String,Object> promoDto(KhuyenMai x){if(x==null)return null;return map("maKM",x.getMaKM(),"tenKM",x.getTenKM(),"moTa",x.getMoTa(),"phanTramGiam",x.getPhanTramGiam(),"ngayBatDau",x.getNgayBatDau(),"ngayKetThuc",x.getNgayKetThuc(),"trangThai",x.getTrangThai());}
    private Map<String,Object> cinemaDto(Rap x){if(x==null)return null;return map("maRap",x.getMaRap(),"tenRap",x.getTenRap(),"diaChi",x.getDiaChi(),"soDienThoai",x.getSoDienThoai());}
    private Map<String,Object> roomDto(PhongChieu x){if(x==null)return null;return map("maPhong",x.getMaPhong(),"tenPhong",x.getTenPhong(),"loaiPhong",x.getLoaiPhong(),"soLuongGhe",x.getSoLuongGhe(),"trangThai",x.getTrangThai(),"maRap",safe(()->x.getRap().getMaRap()));}
    private Map<String,Object> customerDto(KhachHang x){if(x==null)return null;String tier=safe(()->x.getLoaiKhachHang().getMaLoai());return map("maKH",x.getMaKH(),"id",x.getMaKH(),"hoTen",x.getHoTen(),"n",x.getHoTen(),"email",x.getEmail(),"soDienThoai",x.getSoDienThoai(),"phone",x.getSoDienThoai(),"ngaySinh",x.getNgaySinh(),"dob",x.getNgaySinh(),"maLoai",tier,"tier",tier==null?"regular":tier,"st","on");}
    private Map<String,Object> staffDto(NhanVien x){if(x==null)return null;return map("maNV",x.getMaNV(),"hoTen",x.getHoTen(),"email",x.getEmail(),"soDienThoai",x.getSoDienThoai(),"chucVu",x.getChucVu());}
    private Map<String,Object> orderDto(DonDatVe x){
        if(x==null)return null;
        Ve first=safe(()->x.getDanhSachVe().isEmpty()?null:x.getDanhSachVe().get(0));
        SuatChieu show=first==null?null:safe(first::getSuatChieu);
        PhongChieu room=show==null?null:safe(show::getPhongChieu);
        List<String> seatNumbers = safe(() -> x.getDanhSachVe().stream().map(v -> safe(() -> String.valueOf(v.getGhe().getSoGhe()))).filter(Objects::nonNull).toList());
        return map("maDon",x.getMaDon(),"id",x.getMaDon(),"ngayDat",x.getNgayDat(),"tongTien",x.getTongTien(),"tienGiam",x.getTienGiam(),"trangThai",x.getTrangThai(),"maKH",safe(()->x.getKhachHang().getMaKH()),"maNV",safe(()->x.getNhanVien().getMaNV()),"maKM",safe(()->x.getKhuyenMai().getMaKM()),"soVe",safe(()->x.getDanhSachVe().size()),"tenPhim",show==null?null:safe(()->show.getPhim().getTenPhim()),"maSuat",show==null?null:show.getMaSuat(),"ngayChieu",show==null?null:show.getNgayChieu(),"gioBatDau",show==null?null:show.getGioBatDau(),"tenPhong",room==null?null:room.getTenPhong(),"tenRap",room==null?null:safe(()->room.getRap().getTenRap()),"ghe",seatNumbers,"phuongThuc",safe(()->x.getThanhToan().getPhuongThuc()),"trangThaiThanhToan",safe(()->x.getThanhToan().getTrangThai()));
    }
    private Map<String,Object> paymentDto(ThanhToan x){if(x==null)return null;return map("maTT",x.getMaTT(),"thoiGian",x.getThoiGian(),"soTien",x.getSoTien(),"phuongThuc",x.getPhuongThuc(),"trangThai",x.getTrangThai(),"maDon",safe(()->x.getDonDatVe().getMaDon()));}
    private Map<String,Object> ticketDto(Ve x){if(x==null)return null;return map("maVe",x.getMaVe(),"maVeDienTu",x.getMaVeDienTu(),"giaVeCoBan",x.getGiaVeCoBan(),"trangThai",x.getTrangThai(),"maDon",safe(()->x.getDonDatVe().getMaDon()),"maSuat",safe(()->x.getSuatChieu().getMaSuat()),"maGhe",safe(()->x.getGhe().getMaGhe()),"soGhe",safe(()->x.getGhe().getSoGhe()),"tenPhim",safe(()->x.getSuatChieu().getPhim().getTenPhim()));}
    private Map<String,Object> tierDto(LoaiKhachHang x){return map("maLoai",x.getMaLoai(),"tenLoai",x.getTenLoai(),"moTa",x.getMoTa(),"mucUuDai",x.getMucUuDai());}
    private <T> T safe(java.util.function.Supplier<T> supplier){try{return supplier.get();}catch(RuntimeException ex){return null;}}
    private Map<String,Object> map(Object... kv){Map<String,Object> m=new LinkedHashMap<>();for(int i=0;i+1<kv.length;i+=2)if(kv[i+1]!=null)m.put(String.valueOf(kv[i]),kv[i+1] instanceof Enum<?> e?e.name():kv[i+1] instanceof TemporalAccessor?kv[i+1].toString():kv[i+1]);return m;}
}