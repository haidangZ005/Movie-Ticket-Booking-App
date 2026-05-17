USE [appDatvexemPhim];
GO

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM Movie WHERE MovieTitle = N'Bí Mật Rạp Đêm')
BEGIN
  INSERT INTO Movie (
    MovieTitle, MovieGenre, MovieLanguage, MovieRuntime, MovieReleaseDate,
    MovieActor, MovieDirector, MovieDescription, TrailerUrl, Rating,
    IsFeatured, FeaturedOrder, IsActive, MovieImage
  )
  VALUES (
    N'Bí Mật Rạp Đêm', N'Trinh Thám, Tâm Lý', N'Tiếng Việt', 112, '2026-06-05',
    N'Lan Phương, Quốc Huy, Minh Anh', N'Nguyễn Hoàng Nam',
    N'Một nhóm bạn phát hiện chuỗi manh mối kỳ lạ trong rạp phim cũ trước ngày khai trương.',
    NULL, 0, 0, 0, 1, N'https://picsum.photos/seed/bi-mat-rap-dem/500/750'
  );
END;

IF NOT EXISTS (SELECT 1 FROM Movie WHERE MovieTitle = N'Đường Đua Sao Băng')
BEGIN
  INSERT INTO Movie (
    MovieTitle, MovieGenre, MovieLanguage, MovieRuntime, MovieReleaseDate,
    MovieActor, MovieDirector, MovieDescription, TrailerUrl, Rating,
    IsFeatured, FeaturedOrder, IsActive, MovieImage
  )
  VALUES (
    N'Đường Đua Sao Băng', N'Hành Động, Phiêu Lưu', N'Tiếng Việt', 128, '2026-06-19',
    N'Anh Tú, Khánh Linh, Hữu Vi', N'Lê Minh Khang',
    N'Tay đua trẻ bước vào giải đấu xuyên thành phố để cứu đội đua gia đình khỏi tan rã.',
    NULL, 0, 0, 0, 1, N'https://picsum.photos/seed/duong-dua-sao-bang/500/750'
  );
END;

IF NOT EXISTS (SELECT 1 FROM Movie WHERE MovieTitle = N'Hành Tinh Lặng Im')
BEGIN
  INSERT INTO Movie (
    MovieTitle, MovieGenre, MovieLanguage, MovieRuntime, MovieReleaseDate,
    MovieActor, MovieDirector, MovieDescription, TrailerUrl, Rating,
    IsFeatured, FeaturedOrder, IsActive, MovieImage
  )
  VALUES (
    N'Hành Tinh Lặng Im', N'Khoa Học Viễn Tưởng', N'Tiếng Anh', 135, '2026-07-03',
    N'Eva Stone, Daniel Reed', N'Marcus Allen',
    N'Một phi hành đoàn tìm thấy tín hiệu sống cuối cùng trên hành tinh tưởng chừng đã chết.',
    NULL, 0, 0, 0, 1, N'https://picsum.photos/seed/hanh-tinh-lang-im/500/750'
  );
END;

IF NOT EXISTS (SELECT 1 FROM Movie WHERE MovieTitle = N'Mùa Hè Năm Ấy')
BEGIN
  INSERT INTO Movie (
    MovieTitle, MovieGenre, MovieLanguage, MovieRuntime, MovieReleaseDate,
    MovieActor, MovieDirector, MovieDescription, TrailerUrl, Rating,
    IsFeatured, FeaturedOrder, IsActive, MovieImage
  )
  VALUES (
    N'Mùa Hè Năm Ấy', N'Tình Cảm, Gia Đình', N'Tiếng Việt', 104, '2026-07-17',
    N'Bảo Hân, Thanh Sơn, Ngọc Lan', N'Phạm Thu Hà',
    N'Hai người bạn cũ gặp lại trong chuyến trở về quê và đối diện lời hứa còn dang dở.',
    NULL, 0, 0, 0, 1, N'https://picsum.photos/seed/mua-he-nam-ay/500/750'
  );
END;

IF NOT EXISTS (SELECT 1 FROM Movie WHERE MovieTitle = N'Chiến Binh Thành Cổ')
BEGIN
  INSERT INTO Movie (
    MovieTitle, MovieGenre, MovieLanguage, MovieRuntime, MovieReleaseDate,
    MovieActor, MovieDirector, MovieDescription, TrailerUrl, Rating,
    IsFeatured, FeaturedOrder, IsActive, MovieImage
  )
  VALUES (
    N'Chiến Binh Thành Cổ', N'Hành Động, Giả Tưởng', N'Tiếng Việt', 122, '2026-08-07',
    N'Quang Sự, Diễm My, Kiều Minh Tuấn', N'Trần Bảo Sơn',
    N'Người gác đền cuối cùng phải bảo vệ cổ vật trước thế lực đánh thức đội quân bị phong ấn.',
    NULL, 0, 0, 0, 1, N'https://picsum.photos/seed/chien-binh-thanh-co/500/750'
  );
END;

IF NOT EXISTS (SELECT 1 FROM Movie WHERE MovieTitle = N'Vệt Nắng Cuối Trời')
BEGIN
  INSERT INTO Movie (
    MovieTitle, MovieGenre, MovieLanguage, MovieRuntime, MovieReleaseDate,
    MovieActor, MovieDirector, MovieDescription, TrailerUrl, Rating,
    IsFeatured, FeaturedOrder, IsActive, MovieImage
  )
  VALUES (
    N'Vệt Nắng Cuối Trời', N'Hoạt Hình, Phiêu Lưu', N'Tiếng Việt', 96, '2026-08-21',
    N'Lồng tiếng bởi dàn diễn viên trẻ', N'Đỗ Minh An',
    N'Cô bé và người bạn robot đi tìm nguồn sáng cuối cùng cho thành phố trên mây.',
    NULL, 0, 0, 0, 1, N'https://picsum.photos/seed/vet-nang-cuoi-troi/500/750'
  );
END;

PRINT N'Seed upcoming movies completed.';
