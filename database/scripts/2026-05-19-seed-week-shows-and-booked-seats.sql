/*
  Seed weekly shows and booked seats for testing booking constraints.

  Current date assumption: Tuesday, 2026-05-19.
  Target week: 2026-05-19 to 2026-05-24.

  Live DB summary checked before writing this script:
  - Active movies:
      2: Avengers: Hoi ket, 181 min
      3: Spider Man: No Way Home, 148 min
      4: Man Of Steel, 143 min
      6: Dune: Hanh tinh cat, 155 min
      7: Morbius, 104 min, release date 2026-05-22
  - Halls with seat layouts:
      HallID 1: 25 bookable seats
      HallID 2: 42 bookable seats
      HallID 3: 64 bookable seats
      HallID 4: 81 bookable seats
  - Existing BookingSeat rows: none.

  What this script does:
  1. Inserts reasonable showtimes for active movies in the current week.
  2. Maps those showtimes to existing halls that already have seat layouts.
  3. Avoids exact duplicates and same-hall time overlap.
  4. Creates 3 BOOKED seats for each show in this week that does not already
     have HOLDING/BOOKED seats, so the mobile seat screen can test constraints.
*/

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @WeekStart DATE = '2026-05-19';
DECLARE @WeekEnd DATE = '2026-05-24';
DECLARE @CustomerID INT = 3;
DECLARE @SeatsPerShow INT = 3;

IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE CustomerID = @CustomerID)
BEGIN
    THROW 51001, 'Seed customer does not exist.', 1;
END;

DECLARE @SeedShows TABLE (
    MovieID INT NOT NULL,
    HallID INT NOT NULL,
    ShowDate DATE NOT NULL,
    ShowTime TIME NOT NULL,
    Format NVARCHAR(10) NOT NULL,
    BasePrice DECIMAL(10, 2) NOT NULL
);

INSERT INTO @SeedShows (MovieID, HallID, ShowDate, ShowTime, Format, BasePrice)
VALUES
    -- Tuesday 2026-05-19
    (2, 1, '2026-05-19', '09:00:00', N'2D',   75000),
    (3, 2, '2026-05-19', '13:30:00', N'3D',   90000),
    (6, 3, '2026-05-19', '10:00:00', N'IMAX', 150000),
    (4, 4, '2026-05-19', '18:30:00', N'2D',   75000),

    -- Wednesday 2026-05-20
    (4, 1, '2026-05-20', '09:30:00', N'2D',   75000),
    (2, 2, '2026-05-20', '13:45:00', N'3D',   90000),
    (3, 3, '2026-05-20', '18:30:00', N'IMAX', 120000),
    (6, 4, '2026-05-20', '20:00:00', N'IMAX', 150000),

    -- Thursday 2026-05-21
    (6, 1, '2026-05-21', '09:00:00', N'2D',   85000),
    (4, 2, '2026-05-21', '14:00:00', N'3D',   90000),
    (2, 3, '2026-05-21', '18:30:00', N'IMAX', 120000),
    (3, 4, '2026-05-21', '20:30:00', N'2D',   75000),

    -- Friday 2026-05-22, Morbius release date
    (7, 1, '2026-05-22', '09:00:00', N'2D',   75000),
    (3, 2, '2026-05-22', '13:30:00', N'3D',   90000),
    (6, 3, '2026-05-22', '18:45:00', N'IMAX', 150000),
    (2, 4, '2026-05-22', '20:00:00', N'IMAX', 120000),

    -- Saturday 2026-05-23
    (7, 1, '2026-05-23', '08:30:00', N'2D',   75000),
    (2, 2, '2026-05-23', '12:30:00', N'3D',   90000),
    (4, 3, '2026-05-23', '16:30:00', N'IMAX', 120000),
    (6, 4, '2026-05-23', '20:30:00', N'IMAX', 150000),

    -- Sunday 2026-05-24
    (3, 1, '2026-05-24', '09:00:00', N'2D',   75000),
    (7, 2, '2026-05-24', '13:00:00', N'3D',   90000),
    (2, 3, '2026-05-24', '17:00:00', N'IMAX', 120000),
    (6, 4, '2026-05-24', '20:30:00', N'IMAX', 150000);

DECLARE @InsertedShows TABLE (
    ShowID INT NOT NULL PRIMARY KEY,
    MovieID INT NOT NULL,
    HallID INT NOT NULL,
    ShowDate DATE NOT NULL,
    ShowTime TIME NOT NULL
);

;WITH PreparedShows AS (
    SELECT
        ss.MovieID,
        ss.HallID,
        ss.ShowDate,
        ss.ShowTime,
        CAST(DATEADD(MINUTE, m.MovieRuntime + 15, ss.ShowTime) AS TIME) AS EndTime,
        ss.Format,
        ss.BasePrice
    FROM @SeedShows ss
    INNER JOIN dbo.Movie m ON m.MovieID = ss.MovieID
    INNER JOIN dbo.CinemaHall h ON h.HallID = ss.HallID
    WHERE m.IsActive = 1
      AND ss.ShowDate BETWEEN @WeekStart AND @WeekEnd
      AND ss.ShowDate >= CAST(m.MovieReleaseDate AS DATE)
      AND EXISTS (
          SELECT 1
          FROM dbo.CinemaHallSeat seat
          WHERE seat.HallID = ss.HallID
            AND seat.SeatType <> N'EMPTY'
            AND ISNULL(seat.IsAisle, 0) = 0
      )
)
INSERT INTO dbo.[Show] (
    MovieID,
    HallID,
    ShowDate,
    ShowTime,
    EndTime,
    Format,
    BasePrice
)
OUTPUT
    inserted.ShowID,
    inserted.MovieID,
    inserted.HallID,
    inserted.ShowDate,
    inserted.ShowTime
INTO @InsertedShows (ShowID, MovieID, HallID, ShowDate, ShowTime)
SELECT
    ps.MovieID,
    ps.HallID,
    ps.ShowDate,
    ps.ShowTime,
    ps.EndTime,
    ps.Format,
    ps.BasePrice
FROM PreparedShows ps
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.[Show] existing
    WHERE existing.MovieID = ps.MovieID
      AND existing.HallID = ps.HallID
      AND existing.ShowDate = ps.ShowDate
      AND existing.ShowTime = ps.ShowTime
)
AND NOT EXISTS (
    SELECT 1
    FROM dbo.[Show] existing
    WHERE existing.HallID = ps.HallID
      AND existing.ShowDate = ps.ShowDate
      AND existing.ShowTime < ps.EndTime
      AND existing.EndTime > ps.ShowTime
);

DECLARE @TargetShows TABLE (
    ShowID INT NOT NULL PRIMARY KEY,
    HallID INT NOT NULL,
    BasePrice DECIMAL(10, 2) NOT NULL
);

INSERT INTO @TargetShows (ShowID, HallID, BasePrice)
SELECT sh.ShowID, sh.HallID, sh.BasePrice
FROM dbo.[Show] sh
INNER JOIN dbo.Movie m ON m.MovieID = sh.MovieID
WHERE sh.ShowDate BETWEEN @WeekStart AND @WeekEnd
  AND m.IsActive = 1
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.BookingSeat bs
      WHERE bs.ShowID = sh.ShowID
        AND bs.Status IN (N'HOLDING', N'BOOKED')
  );

DECLARE @CurrentShowID INT;
DECLARE @CurrentHallID INT;
DECLARE @CurrentBasePrice DECIMAL(10, 2);
DECLARE @BookingID INT;
DECLARE @TotalSeats INT;
DECLARE @TotalAmount DECIMAL(10, 2);

DECLARE @PickedSeats TABLE (
    SeatID INT NOT NULL PRIMARY KEY,
    TicketPrice DECIMAL(10, 2) NOT NULL
);

DECLARE show_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT ShowID, HallID, BasePrice
    FROM @TargetShows
    ORDER BY ShowID;

OPEN show_cursor;
FETCH NEXT FROM show_cursor INTO @CurrentShowID, @CurrentHallID, @CurrentBasePrice;

WHILE @@FETCH_STATUS = 0
BEGIN
    DELETE FROM @PickedSeats;

    INSERT INTO @PickedSeats (SeatID, TicketPrice)
    SELECT TOP (@SeatsPerShow)
        seat.SeatID,
        @CurrentBasePrice + ISNULL(seat.SeatPrice, 0) AS TicketPrice
    FROM dbo.CinemaHallSeat seat
    WHERE seat.HallID = @CurrentHallID
      AND seat.SeatType <> N'EMPTY'
      AND ISNULL(seat.IsAisle, 0) = 0
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.BookingSeat bs
          WHERE bs.ShowID = @CurrentShowID
            AND bs.SeatID = seat.SeatID
            AND bs.Status IN (N'HOLDING', N'BOOKED')
      )
    ORDER BY seat.RowIndex, seat.ColIndex;

    SELECT
        @TotalSeats = COUNT(*),
        @TotalAmount = ISNULL(SUM(TicketPrice), 0)
    FROM @PickedSeats;

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
            @CurrentShowID,
            @TotalSeats,
            @TotalAmount,
            N'CONFIRMED',
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
            @CurrentShowID,
            SeatID,
            N'BOOKED',
            TicketPrice,
            NULL
        FROM @PickedSeats;
    END;

    FETCH NEXT FROM show_cursor INTO @CurrentShowID, @CurrentHallID, @CurrentBasePrice;
END;

CLOSE show_cursor;
DEALLOCATE show_cursor;

COMMIT TRANSACTION;

SELECT
    sh.ShowID,
    m.MovieTitle,
    ch.HallName,
    CONVERT(varchar(10), sh.ShowDate, 120) AS ShowDate,
    CONVERT(varchar(8), sh.ShowTime, 108) AS ShowTime,
    CONVERT(varchar(8), sh.EndTime, 108) AS EndTime,
    sh.Format,
    sh.BasePrice
FROM dbo.[Show] sh
INNER JOIN dbo.Movie m ON m.MovieID = sh.MovieID
INNER JOIN dbo.CinemaHall ch ON ch.HallID = sh.HallID
WHERE sh.ShowDate BETWEEN @WeekStart AND @WeekEnd
ORDER BY sh.ShowDate, ch.HallID, sh.ShowTime;

SELECT
    bs.ShowID,
    m.MovieTitle,
    seat.SeatNumber,
    bs.Status,
    bs.TicketPrice
FROM dbo.BookingSeat bs
INNER JOIN dbo.[Show] sh ON sh.ShowID = bs.ShowID
INNER JOIN dbo.Movie m ON m.MovieID = sh.MovieID
INNER JOIN dbo.CinemaHallSeat seat ON seat.SeatID = bs.SeatID
WHERE sh.ShowDate BETWEEN @WeekStart AND @WeekEnd
ORDER BY bs.ShowID, seat.RowIndex, seat.ColIndex;
