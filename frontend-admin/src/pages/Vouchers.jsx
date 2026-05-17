import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [formData, setFormData] = useState({
    Code: '',
    DiscountType: 'PERCENT',
    DiscountValue: '',
    MaxDiscount: '',
    StartDate: '',
    EndDate: '',
    UsageLimit: '',
    MinTicketQty: '',
    MinOrderValue: '',
    ApplicableFormat: 'ALL',
    IsActive: true
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/vouchers');
      setVouchers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setCurrentVoucher(null);
    setFormData({
      Code: '', DiscountType: 'PERCENT', DiscountValue: '', MaxDiscount: '',
      StartDate: '', EndDate: '', UsageLimit: '', MinTicketQty: '', MinOrderValue: '', ApplicableFormat: 'ALL', IsActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (voucher) => {
    setCurrentVoucher(voucher);
    setFormData({
      Code: voucher.Code || '',
      DiscountType: voucher.DiscountType || 'PERCENT',
      DiscountValue: voucher.DiscountValue || '',
      MaxDiscount: voucher.MaxDiscount || '',
      StartDate: voucher.StartDate ? voucher.StartDate.split('T')[0] : '',
      EndDate: voucher.EndDate ? voucher.EndDate.split('T')[0] : '',
      UsageLimit: voucher.UsageLimit || '',
      MinTicketQty: voucher.MinTicketQty || '',
      MinOrderValue: voucher.MinOrderValue || '',
      ApplicableFormat: voucher.ApplicableFormat || 'ALL',
      IsActive: voucher.IsActive !== false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentVoucher(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        DiscountValue: parseFloat(formData.DiscountValue) || 0,
        MaxDiscount: formData.MaxDiscount ? parseFloat(formData.MaxDiscount) : null,
        UsageLimit: parseInt(formData.UsageLimit) || 0,
        MinTicketQty: formData.MinTicketQty ? parseInt(formData.MinTicketQty) : null,
        MinOrderValue: formData.MinOrderValue ? parseFloat(formData.MinOrderValue) : null,
      };
      
      if (currentVoucher) {
        await apiClient.put(`/admin/vouchers/${currentVoucher.VoucherID}`, payload);
      } else {
        await apiClient.post('/admin/vouchers', payload);
      }
      closeModal();
      fetchVouchers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
      try {
        await apiClient.delete(`/admin/vouchers/${id}`);
        fetchVouchers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Vouchers Management</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Search vouchers..." style={{ height: '36px', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 12px' }} />
          <button onClick={openAddModal} style={{ background: 'var(--accent)', color: 'white', padding: '0 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
            Add Voucher
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : vouchers.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--textSub)' }}>Chưa có mã giảm giá nào.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-low)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>CODE</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>DISCOUNT</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>VALID DATES</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>USAGE</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>STATUS</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v.VoucherID} style={{ borderBottom: '1px solid var(--borderLight)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 'bold', color: 'var(--accent)' }}>{v.Code}</td>
                <td style={{ padding: '16px 20px' }}>
                  {v.DiscountType === 'PERCENT' ? `${v.DiscountValue}%` : `${Number(v.DiscountValue).toLocaleString()}đ`}
                </td>
                <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                  {formatDate(v.StartDate)} - {formatDate(v.EndDate)}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {v.UsageCount || 0} / {v.UsageLimit}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`badge ${v.IsActive ? 'success' : 'gray'}`}>
                    {v.IsActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px' }}>
                  <button onClick={() => openEditModal(v)} style={{ cursor: 'pointer', marginRight: '8px', background: 'none', border: 'none', fontSize: '16px' }}>✏️</button>
                  <button onClick={() => handleDelete(v.VoucherID)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', color: 'var(--textPrimary)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {currentVoucher ? 'Edit Voucher' : 'Add Voucher'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Voucher Code</label>
                <input required type="text" name="Code" value={formData.Code} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Discount Type</label>
                <select name="DiscountType" value={formData.DiscountType} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (VND)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Discount Value</label>
                <input required type="number" name="DiscountValue" value={formData.DiscountValue} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Max Discount (VND)</label>
                <input type="number" name="MaxDiscount" value={formData.MaxDiscount} onChange={handleInputChange} placeholder="Leave empty for no limit" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Start Date</label>
                <input required type="date" name="StartDate" value={formData.StartDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>End Date</label>
                <input required type="date" name="EndDate" value={formData.EndDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Usage Limit</label>
                <input required type="number" name="UsageLimit" value={formData.UsageLimit} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Min Order Value (VND)</label>
                <input type="number" name="MinOrderValue" value={formData.MinOrderValue} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="IsActive" checked={formData.IsActive} onChange={handleInputChange} id="vouIsActive" />
                <label htmlFor="vouIsActive" style={{ fontSize: '14px', fontWeight: '500' }}>Active</label>
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: 'var(--surface-low)', color: 'var(--textPrimary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;
