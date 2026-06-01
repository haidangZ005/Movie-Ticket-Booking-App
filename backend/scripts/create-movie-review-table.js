const path = require('path');
const dotenv = require('dotenv');
const sql = require('mssql');

const backendRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const config = {
  server: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'appDatvexemPhim',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
};

async function main() {
  const pool = await sql.connect(config);
  console.log('[Migration] Connected to SQL Server.');

  await pool.request().query(`
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
        PRINT 'Created MovieReview table.';
    END
  `);

  console.log('[Migration] MovieReview table check complete.');
  await pool.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
