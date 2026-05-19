IF COL_LENGTH('dbo.Movie', 'PosterUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Movie
    ADD PosterUrl NVARCHAR(500) NULL;
END
GO

IF COL_LENGTH('dbo.Movie', 'MovieImage') IS NOT NULL
BEGIN
    EXEC('UPDATE dbo.Movie SET PosterUrl = MovieImage WHERE PosterUrl IS NULL AND MovieImage IS NOT NULL');
    ALTER TABLE dbo.Movie DROP COLUMN MovieImage;
END
GO
