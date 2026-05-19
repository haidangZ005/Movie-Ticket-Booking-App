import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const emptyForm = {
  ProductName: '',
  ProductDescription: '',
  ProductPrice: '',
  ImageProduct: '',
  IsActive: true,
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

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

  const openAddModal = () => {
    setCurrentProduct(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      ProductName: product.ProductName || '',
      ProductDescription: product.ProductDescription || '',
      ProductPrice: product.ProductPrice || '',
      ImageProduct: product.ImageProduct || '',
      IsActive: product.IsActive !== false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
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
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>San pham va combo</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Tim kiem san pham..." style={{ height: '36px', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 12px' }} />
          <button onClick={openAddModal} style={{ background: 'var(--accent)', color: 'white', padding: '0 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
            Them san pham
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
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Ten san pham</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Gia</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Trang thai</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600', textAlign: 'right' }}>Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.ProductID} style={{ borderBottom: '1px solid var(--borderLight)' }}>
                <td style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--purpleBg)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {product.ImageProduct ? <img src={product.ImageProduct} alt={product.ProductName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'IMG'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--textPrimary)' }}>{product.ProductName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--textSub)' }}>{product.ProductDescription?.substring(0, 50)}...</div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: '500' }}>{Number(product.ProductPrice).toLocaleString('vi-VN')} d</td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`badge ${product.IsActive ? 'success' : 'gray'}`}>
                    {product.IsActive ? 'Hoat dong' : 'Ngung hoat dong'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px' }}>
                  <button onClick={() => openEditModal(product)} style={{ cursor: 'pointer', marginRight: '8px', background: 'none', border: 'none', fontSize: '14px', color: 'var(--textPrimary)' }}>Sua</button>
                  <button onClick={() => handleDelete(product.ProductID)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '14px', color: 'var(--danger)' }}>Xoa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', color: 'var(--textPrimary)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {currentProduct ? 'Sua san pham' : 'Them san pham'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ten san pham</span>
                <input required type="text" name="ProductName" value={formData.ProductName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Gia (VND)</span>
                <input required type="number" name="ProductPrice" value={formData.ProductPrice} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Mo ta</span>
                <textarea name="ProductDescription" value={formData.ProductDescription} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </label>
              <label>
                <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Image URL</span>
                <input type="text" name="ImageProduct" value={formData.ImageProduct} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="IsActive" checked={formData.IsActive} onChange={handleInputChange} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Hoat dong</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: 'var(--surface-low)', color: 'var(--textPrimary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Huy</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Luu san pham</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
