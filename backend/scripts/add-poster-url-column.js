const sql = require('mssql');

const config = {
  server: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'appDatvexemPhim',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function main() {
  const pool = await sql.connect(config);
  await pool.request().query(`
    IF COL_LENGTH('dbo.Movie', 'PosterUrl') IS NULL
    BEGIN
      ALTER TABLE dbo.Movie ADD PosterUrl NVARCHAR(500) NULL;
    END

    IF COL_LENGTH('dbo.Movie', 'MovieImage') IS NOT NULL
    BEGIN
      EXEC('UPDATE dbo.Movie SET PosterUrl = MovieImage WHERE PosterUrl IS NULL AND MovieImage IS NOT NULL');
      ALTER TABLE dbo.Movie DROP COLUMN MovieImage;
    END
  `);

  const result = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME = 'Movie'
      AND COLUMN_NAME = 'PosterUrl';
  `);

  console.log(result.recordset);
  await pool.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
