import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const emptyForm = {
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
  IsActive: true,
};

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openAddModal = () => {
    setCurrentVoucher(null);
    setFormData(emptyForm);
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
      IsActive: voucher.IsActive !== false,
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
        UsageLimit: parseInt(formData.UsageLimit, 10) || 0,
        MinTicketQty: formData.MinTicketQty ? parseInt(formData.MinTicketQty, 10) : null,
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;
    try {
      await apiClient.delete(`/admin/vouchers/${id}`);
      fetchVouchers();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Quản lý voucher</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Tìm kiếm voucher..." style={{ height: '36px', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 12px' }} />
          <button onClick={openAddModal} style={{ background: 'var(--accent)', color: 'white', padding: '0 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
            Thêm voucher
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
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Mã</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Giảm giá</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Ngày hiệu lực</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Lượt dùng</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Trạng thái</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher) => (
              <tr key={voucher.VoucherID} style={{ borderBottom: '1px solid var(--borderLight)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 'bold', color: 'var(--accent)' }}>{voucher.Code}</td>
                <td style={{ padding: '16px 20px' }}>
                  {voucher.DiscountType === 'PERCENT' ? `${voucher.DiscountValue}%` : `${Number(voucher.DiscountValue).toLocaleString()}đ`}
                </td>
                <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                  {formatDate(voucher.StartDate)} - {formatDate(voucher.EndDate)}
                </td>
                <td style={{ padding: '16px 20px' }}>{voucher.UsageCount || 0} / {voucher.UsageLimit}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`badge ${voucher.IsActive ? 'success' : 'gray'}`}>
                    {voucher.IsActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px' }}>
                  <button onClick={() => openEditModal(voucher)} style={{ cursor: 'pointer', marginRight: '8px', background: 'none', border: 'none', fontSize: '16px' }}>✏️</button>
                  <button onClick={() => handleDelete(voucher.VoucherID)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', color: 'var(--textPrimary)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {currentVoucher ? 'Sửa voucher' : 'Thêm voucher'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Mã voucher</label>
                <input required type="text" name="Code" value={formData.Code} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Loại giảm</label>
                <select name="DiscountType" value={formData.DiscountType} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <option value="PERCENT">Phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (VND)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Giá trị giảm</label>
                <input required type="number" name="DiscountValue" value={formData.DiscountValue} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Giảm tối đa (VND)</label>
                <input type="number" name="MaxDiscount" value={formData.MaxDiscount} onChange={handleInputChange} placeholder="Để trống nếu không giới hạn" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ngày bắt đầu</label>
                <input required type="date" name="StartDate" value={formData.StartDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ngày kết thúc</label>
                <input required type="date" name="EndDate" value={formData.EndDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Giới hạn lượt dùng</label>
                <input required type="number" name="UsageLimit" value={formData.UsageLimit} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Đơn tối thiểu (VND)</label>
                <input type="number" name="MinOrderValue" value={formData.MinOrderValue} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="IsActive" checked={formData.IsActive} onChange={handleInputChange} id="voucherIsActive" />
                <label htmlFor="voucherIsActive" style={{ fontSize: '14px', fontWeight: '500' }}>Hoạt động</label>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: 'var(--surface-low)', color: 'var(--textPrimary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Lưu voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;
