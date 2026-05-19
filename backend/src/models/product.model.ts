import * as sql from 'mssql';
import { connectDB } from '../config/database';

export interface IProduct {
  ProductID?: number;
  ProductName: string;
  ProductDescription?: string;
  ProductPrice: number;
  ImageProduct?: string;
  ProductCategory?: string;
  IsActive?: boolean;
}

export class ProductModel {
  static async getAll() {
    const pool = await connectDB();
    const result = await pool.request()
      .query(`
        SELECT * FROM Product 
        ORDER BY ProductID DESC
      `);
    return result.recordset;
  }

  static async getById(id: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Product WHERE ProductID = @id');
    return result.recordset[0];
  }

  static async create(product: IProduct) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar(200), product.ProductName)
      .input('desc', sql.NVarChar(500), product.ProductDescription || '')
      .input('price', sql.Decimal(10, 2), product.ProductPrice)
      .input('image', sql.NVarChar(500), product.ImageProduct || '')
      .input('category', sql.NVarChar(50), product.ProductCategory || 'OTHER')
      .input('isActive', sql.Bit, product.IsActive ?? true)
      .query(`
        INSERT INTO Product (ProductName, ProductDescription, ProductPrice, ImageProduct, ProductCategory, IsActive)
        OUTPUT inserted.*
        VALUES (@name, @desc, @price, @image, @category, @isActive)
      `);
    return result.recordset[0];
  }

  static async update(id: number, product: Partial<IProduct>) {
    const pool = await connectDB();
    const request = pool.request().input('id', sql.Int, id);

    let query = 'UPDATE Product SET ';
    const updates: string[] = [];

    if (product.ProductName !== undefined) {
      request.input('name', sql.NVarChar(200), product.ProductName);
      updates.push('ProductName = @name');
    }
    if (product.ProductDescription !== undefined) {
      request.input('desc', sql.NVarChar(500), product.ProductDescription);
      updates.push('ProductDescription = @desc');
    }
    if (product.ProductPrice !== undefined) {
      request.input('price', sql.Decimal(10, 2), product.ProductPrice);
      updates.push('ProductPrice = @price');
    }
    if (product.ImageProduct !== undefined) {
      request.input('image', sql.NVarChar(500), product.ImageProduct);
      updates.push('ImageProduct = @image');
    }
    if (product.ProductCategory !== undefined) {
      request.input('category', sql.NVarChar(50), product.ProductCategory || 'OTHER');
      updates.push('ProductCategory = @category');
    }
    if (product.IsActive !== undefined) {
      request.input('isActive', sql.Bit, product.IsActive);
      updates.push('IsActive = @isActive');
    }

    if (updates.length === 0) return this.getById(id);

    query += updates.join(', ') + ' OUTPUT inserted.* WHERE ProductID = @id';
    
    const result = await request.query(query);
    return result.recordset[0];
  }

  static async delete(id: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Product SET IsActive = 0 
        OUTPUT inserted.*
        WHERE ProductID = @id
      `);
    return result.recordset[0];
  }
}
