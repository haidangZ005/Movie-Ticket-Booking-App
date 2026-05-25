-- Tạo bảng MovieReview để lưu trữ cảm nhận và đánh giá của khách hàng
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MovieReview]') AND type in (N'U'))
BEGIN
    CREATE TABLE MovieReview (
        ReviewID INT IDENTITY(1,1) PRIMARY KEY,
        MovieID INT NOT NULL FOREIGN KEY REFERENCES Movie(MovieID) ON DELETE CASCADE,
        CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID) ON DELETE CASCADE,
        Rating DECIMAL(2,1) NOT NULL CHECK (Rating >= 1.0 AND Rating <= 5.0),
        Comment NVARCHAR(1000) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        -- Mỗi khách hàng chỉ được đánh giá một bộ phim một lần
        CONSTRAINT UQ_Customer_Movie_Review UNIQUE (CustomerID, MovieID)
    );

    -- Tạo chỉ mục tối ưu hiệu năng truy vấn theo phim
    CREATE INDEX IX_MovieReview_MovieID ON MovieReview(MovieID);
END
GO
