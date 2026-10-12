USE db_web_rapphim;
GO

DECLARE @maPhong VARCHAR(20) = 'P01'; -- Mã phòng cần sinh ghế
DECLARE @hang CHAR(1);
DECLARE @so INT;
DECLARE @loaiGhe VARCHAR(20);
DECLARE @gia DECIMAL(12,2);
DECLARE @maGhe VARCHAR(20);

DECLARE @i INT = 0;
WHILE @i < 5 -- Tạo 5 hàng: A, B, C, D, E
BEGIN
    SET @hang = CHAR(ASCII('A') + @i);
    SET @so = 1;

    WHILE @so <= 10 -- Mỗi hàng 10 ghế (từ 1 đến 10)
    BEGIN
        -- Tạo mã ghế dạng P01_A01, P01_A02...
        SET @maGhe = CONCAT(@maPhong, '_', @hang, RIGHT('0' + CAST(@so AS VARCHAR(2)), 2));

        -- Hàng A, B, C là ghế Thường (phụ thu 0đ); Hàng D, E là ghế VIP (phụ thu 20,000đ)
        IF @hang IN ('D', 'E')
        BEGIN
            SET @loaiGhe = 'Vip';
            SET @gia = 20000.00;
        END
        ELSE
        BEGIN
            SET @loaiGhe = 'Thuong';
            SET @gia = 0.00;
        END

        -- Chèn ghế vào bảng nếu chưa có
        IF NOT EXISTS (SELECT 1 FROM Ghe WHERE maGhe = @maGhe)
        BEGIN
            INSERT INTO Ghe (maGhe, hangGhe, soGhe, loaiGhe, gia, maPhong)
            VALUES (@maGhe, @hang, @so, @loaiGhe, @gia, @maPhong);
        END

        SET @so = @so + 1;
    END
    SET @i = @i + 1;
END
GO