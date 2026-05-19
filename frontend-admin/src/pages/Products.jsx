import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Helper to resolve image URL
const resolveImageUrl = (url) => {
  if (!url) return null;
  const normalized = url.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  const origin = API_BASE_URL.replace('/api', '');
  if (normalized.startsWith('/uploads') || normalized.startsWith('uploads')) {
    const cleanUrl = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${origin}${cleanUrl}`;
  }
  return `${origin}/uploads/products/${normalized}`;
};

const emptyForm = {
  ProductName: '',
  ProductDescription: '',
  ProductPrice: '',
  ImageProduct: '',
  ProductCategory: 'OTHER',
  IsActive: true,
};

const PRODUCT_CATEGORIES = [
  { value: 'POPCORN', label: 'Bap rang' },
  { value: 'DRINK', label: 'Nuoc uong' },
  { value: 'COMBO', label: 'Combo' },
  { value: 'SNACK', label: 'Snack' },
  { value: 'OTHER', label: 'Khac' },
];

const getCategoryLabel = (value) => (
  PRODUCT_CATEGORIES.find((item) => item.value === value)?.label || 'Khac'
);

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/admin/products');
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message || 'Khong tai duoc danh sach san pham.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedImageFile(file);
  };

  const openAddModal = () => {
    setCurrentProduct(null);
    setSelectedImageFile(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setSelectedImageFile(null);
    setFormData({
      ProductName: product.ProductName || '',
      ProductDescription: product.ProductDescription || '',
      ProductPrice: product.ProductPrice || '',
      ImageProduct: product.ImageProduct || '',
      ProductCategory: product.ProductCategory || 'OTHER',
      IsActive: product.IsActive !== false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
    setSelectedImageFile(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      let ImageProduct = formData.ImageProduct;

      if (selectedImageFile) {
        const uploadForm = new FormData();
        uploadForm.append('image', selectedImageFile);
        const uploadRes = await apiClient.postForm('/admin/uploads/product-image', uploadForm);
        ImageProduct = uploadRes.data?.imageUrl || ImageProduct;
      }

      const payload = {
        ...formData,
        ImageProduct,
        ProductPrice: parseFloat(formData.ProductPrice) || 0,
      };

      if (currentProduct) {
        await apiClient.put(`/admin/products/${currentProduct.ProductID}`, payload);
      } else {
        await apiClient.post('/admin/products', payload);
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Khong luu duoc san pham.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ban co chac chan muon xoa san pham nay?')) return;
    try {
      await apiClient.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Khong xoa duoc san pham.');
    }
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Sản phẩm và combo</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Tìm kiếm sản phẩm..." style={{ height: '36px', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 12px' }} />
          <button onClick={openAddModal} style={{ background: 'var(--accent)', color: 'white', padding: '0 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Dang tai...</div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : products.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--textSub)' }}>Chua co san pham nao.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-low)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Tên sản phẩm</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Lọai</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Giá</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Trạng thái</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const imageUrl = resolveImageUrl(product.ImageProduct);
              return (
                <tr key={product.ProductID} style={{ borderBottom: '1px solid var(--borderLight)' }}>
                  <td style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--purpleBg)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.ProductName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--textSub)' }}>No IMG</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--textPrimary)' }}>{product.ProductName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--textSub)' }}>{product.ProductDescription?.substring(0, 50)}{product.ProductDescription?.length > 50 ? '...' : ''}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '500' }}>{getCategoryLabel(product.ProductCategory)}</td>
                  <td style={{ padding: '16px 20px', fontWeight: '500' }}>{Number(product.ProductPrice).toLocaleString('vi-VN')} d</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${product.IsActive ? 'success' : 'gray'}`}>
                      {product.IsActive ? 'Hoat dong' : 'Ngung hoat dong'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px' }}>
                    <button onClick={() => openEditModal(product)} style={{ cursor: 'pointer', marginRight: '8px', background: 'none', border: 'none', fontSize: '14px', color: 'var(--textPrimary)' }}>Sửa</button>
                    <button onClick={() => handleDelete(product.ProductID)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '14px', color: 'var(--danger)' }}>Xóa</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', color: 'var(--textPrimary)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {currentProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Tên sản phẩm</span>
                <input required type="text" name="ProductName" value={formData.ProductName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Giá (VND)</span>
                <input required type="number" name="ProductPrice" value={formData.ProductPrice} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Loại sản phẩm</span>
                <select required name="ProductCategory" value={formData.ProductCategory} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Mô tả</span>
                <textarea name="ProductDescription" value={formData.ProductDescription} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ảnh sản phẩm</span>
                <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
                {(selectedImageFile || formData.ImageProduct) && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : resolveImageUrl(formData.ImageProduct)}
                      alt="Product preview"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', background: 'var(--surface-low)' }}
                    />
                    <span style={{ color: 'var(--textSub)', fontSize: '12px' }}>
                      {selectedImageFile ? selectedImageFile.name : 'Ảnh hiện tại'}
                    </span>
                  </div>
                )}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="IsActive" checked={formData.IsActive} onChange={handleInputChange} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Hoạt động</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: 'var(--surface-low)', color: 'var(--textPrimary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Lưu sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
