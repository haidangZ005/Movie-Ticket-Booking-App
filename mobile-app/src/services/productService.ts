import apiClient from '../api/apiClient';

export interface IProduct {
  ProductID: number;
  ProductName: string;
  ProductDescription?: string;
  ProductPrice: number;
  ImageProduct?: string;
  ProductCategory?: 'POPCORN' | 'DRINK' | 'COMBO' | 'SNACK' | 'OTHER';
  IsActive?: boolean;
}

export interface ProductsResponse {
  code: number;
  message: string;
  data: IProduct[];
}

const productService = {
  getProducts: async (): Promise<ProductsResponse> => {
    const response = await apiClient.get('/products');
    return response.data;
  },
};

export default productService;
