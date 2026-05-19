IF COL_LENGTH('dbo.Product', 'ProductCategory') IS NULL
BEGIN
    ALTER TABLE dbo.Product
    ADD ProductCategory NVARCHAR(50) NOT NULL
        CONSTRAINT DF_Product_ProductCategory DEFAULT ('OTHER');
END;
GO

UPDATE dbo.Product
SET ProductCategory =
    CASE
        WHEN LOWER(ProductName) LIKE N'%combo%' THEN 'COMBO'
        WHEN LOWER(ProductName) LIKE N'%bap%' OR LOWER(ProductName) LIKE N'%bắp%' OR LOWER(ProductName) LIKE N'%popcorn%' THEN 'POPCORN'
        WHEN LOWER(ProductName) LIKE N'%nước%' OR LOWER(ProductName) LIKE N'%nuoc%' OR LOWER(ProductName) LIKE N'%cola%' OR LOWER(ProductName) LIKE N'%pepsi%' OR LOWER(ProductName) LIKE N'%sprite%' OR LOWER(ProductName) LIKE N'%trà%' OR LOWER(ProductName) LIKE N'%tra%' THEN 'DRINK'
        ELSE 'OTHER'
    END
WHERE ProductCategory IS NULL OR ProductCategory = 'OTHER';
GO
