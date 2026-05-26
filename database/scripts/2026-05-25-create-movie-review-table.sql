-- Create MovieReview table for customer movie ratings and comments.
-- Users can leave multiple comments over time; old comments are not overwritten.
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MovieReview]') AND type in (N'U'))
BEGIN
    CREATE TABLE MovieReview (
        ReviewID INT IDENTITY(1,1) PRIMARY KEY,
        MovieID INT NOT NULL FOREIGN KEY REFERENCES Movie(MovieID) ON DELETE CASCADE,
        CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID) ON DELETE CASCADE,
        Rating DECIMAL(2,1) NOT NULL CHECK (Rating >= 1.0 AND Rating <= 5.0),
        Comment NVARCHAR(1000) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX IX_MovieReview_MovieID ON MovieReview(MovieID);
END
GO

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UQ_Customer_Movie_Review')
BEGIN
    ALTER TABLE MovieReview DROP CONSTRAINT UQ_Customer_Movie_Review;
END
GO
