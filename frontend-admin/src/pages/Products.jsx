import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    ProductName: '',
    ProductDescription: '',
    ProductPrice: '',
    ImageProduct: '',
    IsActive: true
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/products');
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setCurrentProduct(null);
    setFormData({
      ProductName: '', ProductDescription: '', ProductPrice: '', ImageProduct: '', IsActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      ProductName: product.ProductName || '',
      ProductDescription: product.ProductDescription || '',
      ProductPrice: product.ProductPrice || '',
      ImageProduct: product.ImageProduct || '',
      IsActive: product.IsActive !== false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, ProductPrice: parseFloat(formData.ProductPrice) || 0 };
      if (currentProduct) {
        await apiClient.put(`/admin/products/${currentProduct.ProductID}`, payload);
      } else {
        await apiClient.post('/admin/products', payload);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await apiClient.delete(`/admin/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Products & Combos</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Search products..." style={{ height: '36px', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 12px' }} />
          <button onClick={openAddModal} style={{ background: 'var(--accent)', color: 'white', padding: '0 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : products.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--textSub)' }}>Chưa có sản phẩm nào.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-low)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>PRODUCT NAME</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>PRICE</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>STATUS</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.ProductID} style={{ borderBottom: '1px solid var(--borderLight)' }}>
                <td style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--purpleBg)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.ImageProduct ? <img src={p.ImageProduct} alt={p.ProductName} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : '🍿'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--textPrimary)' }}>{p.ProductName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--textSub)' }}>{p.ProductDescription?.substring(0, 50)}...</div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: '500' }}>{Number(p.ProductPrice).toLocaleString('vi-VN')} đ</td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`badge ${p.IsActive ? 'success' : 'gray'}`}>
                    {p.IsActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px' }}>
                  <button onClick={() => openEditModal(p)} style={{ cursor: 'pointer', marginRight: '8px', background: 'none', border: 'none', fontSize: '16px' }}>✏️</button>
                  <button onClick={() => handleDelete(p.ProductID)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', color: 'var(--textPrimary)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {currentProduct ? 'Edit Product' : 'Add Product'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Product Name</label>
                <input required type="text" name="ProductName" value={formData.ProductName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Price (VND)</label>
                <input required type="number" name="ProductPrice" value={formData.ProductPrice} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Description</label>
                <textarea name="ProductDescription" value={formData.ProductDescription} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Image URL</label>
                <input type="text" name="ImageProduct" value={formData.ImageProduct} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="IsActive" checked={formData.IsActive} onChange={handleInputChange} id="prodIsActive" />
                <label htmlFor="prodIsActive" style={{ fontSize: '14px', fontWeight: '500' }}>Active</label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: 'var(--surface-low)', color: 'var(--textPrimary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
