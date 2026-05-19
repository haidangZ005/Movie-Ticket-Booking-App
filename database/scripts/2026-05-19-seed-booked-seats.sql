/*
  Seed booked seats for testing seat display in mobile app.

  Current live DB checked on 2026-05-19:
  - Tables: dbo.[Show], dbo.CinemaHallSeat, dbo.Booking, dbo.BookingSeat
  - dbo.BookingSeat is currently empty.
  - Sample show used here:
      ShowID 9, MovieID 6, MovieTitle "Dune: Hanh tinh cat",
      HallID 3, ShowDate 2026-05-19, ShowTime 19:50:00,
      BasePrice 150000

  Run this script in SQL Server Management Studio against database:
    appDatvexemPhim

  After running, GET /api/shows/9/seats will return A1, A2, B1, B2
  with Status = BOOKED, so the mobile seat screen will show them as booked.
*/

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @ShowID INT = 9;
DECLARE @CustomerID INT = 3;
DECLARE @SeatStatus NVARCHAR(20) = N'BOOKED';
DECLARE @BookingStatus NVARCHAR(20) = N'CONFIRMED';
DECLARE @BookingID INT;
DECLARE @TotalSeats INT;
DECLARE @TotalAmount DECIMAL(10, 2);

DECLARE @RequestedSeats TABLE (
    SeatNumber NVARCHAR(20) NOT NULL PRIMARY KEY
);

INSERT INTO @RequestedSeats (SeatNumber)
VALUES
    (N'A1'),
    (N'A2'),
    (N'B1'),
    (N'B2');

IF NOT EXISTS (SELECT 1 FROM dbo.[Show] WHERE ShowID = @ShowID)
BEGIN
    THROW 50001, 'ShowID does not exist.', 1;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE CustomerID = @CustomerID)
BEGIN
    THROW 50002, 'CustomerID does not exist.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM @RequestedSeats rs
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.[Show] sh
        INNER JOIN dbo.CinemaHallSeat seat ON seat.HallID = sh.HallID
        WHERE sh.ShowID = @ShowID
          AND seat.SeatNumber = rs.SeatNumber
          AND ISNULL(seat.IsAisle, 0) = 0
          AND seat.SeatType <> N'EMPTY'
    )
)
BEGIN
    THROW 50003, 'One or more requested seats do not exist in this show hall.', 1;
END;

DECLARE @SeatsToInsert TABLE (
    SeatID INT NOT NULL PRIMARY KEY,
    SeatNumber NVARCHAR(20) NOT NULL,
    TicketPrice DECIMAL(10, 2) NOT NULL
);

INSERT INTO @SeatsToInsert (SeatID, SeatNumber, TicketPrice)
SELECT
    seat.SeatID,
    seat.SeatNumber,
    sh.BasePrice + ISNULL(seat.SeatPrice, 0) AS TicketPrice
FROM dbo.[Show] sh
INNER JOIN dbo.CinemaHallSeat seat ON seat.HallID = sh.HallID
INNER JOIN @RequestedSeats rs ON rs.SeatNumber = seat.SeatNumber
WHERE sh.ShowID = @ShowID
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.BookingSeat bs
      WHERE bs.ShowID = @ShowID
        AND bs.SeatID = seat.SeatID
        AND bs.Status IN (N'HOLDING', N'BOOKED')
  );

SELECT
    @TotalSeats = COUNT(*),
    @TotalAmount = ISNULL(SUM(TicketPrice), 0)
FROM @SeatsToInsert;

IF @TotalSeats > 0
BEGIN
    INSERT INTO dbo.Booking (
        CustomerID,
        ShowID,
        TotalSeats,
        TotalAmount,
        Status,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        @CustomerID,
        @ShowID,
        @TotalSeats,
        @TotalAmount,
        @BookingStatus,
        GETDATE(),
        GETDATE()
    );

    SET @BookingID = SCOPE_IDENTITY();

    INSERT INTO dbo.BookingSeat (
        BookingID,
        ShowID,
        SeatID,
        Status,
        TicketPrice,
        HoldUntil
    )
    SELECT
        @BookingID,
        @ShowID,
        SeatID,
        @SeatStatus,
        TicketPrice,
        NULL
    FROM @SeatsToInsert;
END;

COMMIT TRANSACTION;

SELECT
    bs.BookingSeatID,
    bs.BookingID,
    bs.ShowID,
    m.MovieTitle,
    ch.HallName,
    seat.SeatID,
    seat.SeatNumber,
    bs.Status,
    bs.TicketPrice
FROM dbo.BookingSeat bs
INNER JOIN dbo.[Show] sh ON sh.ShowID = bs.ShowID
INNER JOIN dbo.Movie m ON m.MovieID = sh.MovieID
INNER JOIN dbo.CinemaHall ch ON ch.HallID = sh.HallID
INNER JOIN dbo.CinemaHallSeat seat ON seat.SeatID = bs.SeatID
WHERE bs.ShowID = @ShowID
ORDER BY seat.RowIndex, seat.ColIndex;
