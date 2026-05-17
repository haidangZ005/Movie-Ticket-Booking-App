import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';

const emptyForm = {
  Email: '',
  Password: '',
  FullName: '',
  CustomerEmail: '',
  PhoneNumber: '',
  Gender: '',
  DateOfBirth: '',
  LoyaltyPoints: 0,
  IsActive: true,
  IsVerified: true,
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ limit: '100' });
      if (query.trim()) params.set('keyword', query.trim());
      if (status !== 'ALL') params.set('isActive', status === 'ACTIVE' ? 'true' : 'false');

      const res = await apiClient.get(`/admin/customers?${params.toString()}`);
      setCustomers(res.data?.items || res.data || []);
    } catch (err) {
      setError(err.message || 'Khong tai duoc danh sach khach hang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [status]);

  const filteredCustomers = useMemo(() => {
    const keyword = query.toLowerCase();
    if (!keyword) return customers;
    return customers.filter((customer) =>
      [customer.FullName, customer.CustomerEmail, customer.Email, customer.PhoneNumber].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      )
    );
  }, [customers, query]);

  const openAddModal = () => {
    setCurrentCustomer(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setCurrentCustomer(customer);
    setFormData({
      Email: customer.Email || '',
      Password: '',
      FullName: customer.FullName || '',
      CustomerEmail: customer.CustomerEmail || customer.Email || '',
      PhoneNumber: customer.PhoneNumber || '',
      Gender: customer.Gender || '',
      DateOfBirth: customer.DateOfBirth ? String(customer.DateOfBirth).split('T')[0] : '',
      LoyaltyPoints: customer.LoyaltyPoints || 0,
      IsActive: customer.IsActive !== false,
      IsVerified: customer.IsVerified !== false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
    setFormData(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        LoyaltyPoints: Number(formData.LoyaltyPoints) || 0,
        CustomerEmail: formData.CustomerEmail || formData.Email,
      };

      if (currentCustomer) {
        delete payload.Password;
        await apiClient.put(`/admin/customers/${currentCustomer.CustomerID}`, payload);
      } else {
        await apiClient.post('/admin/customers', payload);
      }

      closeModal();
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Khong luu duoc khach hang.');
    }
  };

  const toggleStatus = async (customer) => {
    try {
      await apiClient.put(`/admin/customers/${customer.CustomerID}/status`, {
        IsActive: !customer.IsActive,
      });
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Khong cap nhat duoc trang thai.');
    }
  };

  const deleteCustomer = async (customer) => {
    if (!window.confirm(`Khoa tai khoan ${customer.Email || customer.FullName}?`)) return;
    try {
      await apiClient.delete(`/admin/customers/${customer.CustomerID}`);
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Khong khoa duoc tai khoan.');
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Customers</h2>
          <p className="mt-1 text-sm text-text-muted">Quan ly ho so khach hang va trang thai Account.</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border-default bg-surface-container-low px-3 text-sm outline-none focus:border-primary">
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
          </select>
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && fetchCustomers()}
              className="h-10 w-full rounded-lg border border-border-default bg-surface-container-low pl-9 pr-4 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Search customers..."
            />
          </div>
          <button onClick={openAddModal} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-inverse-on-surface transition-colors hover:bg-accent-hover">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-border-default bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-border-default bg-surface-container-low">
              <tr>
                {['Customer', 'Account Email', 'Phone', 'Gender', 'Loyalty', 'Verified', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[13px] font-bold uppercase text-text-secondary">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-[13px]">
              {loading ? (
                <tr><td className="px-4 py-6 text-center text-text-muted" colSpan="8">Dang tai...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-text-muted" colSpan="8">Chua co khach hang nao.</td></tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.CustomerID} className="transition-colors hover:bg-surface-container-low">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{customer.FullName || `Customer #${customer.CustomerID}`}</div>
                      <div className="text-xs text-text-muted">{customer.CustomerEmail || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{customer.Email}</td>
                    <td className="px-4 py-3 text-text-secondary">{customer.PhoneNumber || '-'}</td>
                    <td className="px-4 py-3 text-text-secondary">{customer.Gender || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{Number(customer.LoyaltyPoints || 0).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3"><span className={`badge ${customer.IsVerified ? 'success' : 'gray'}`}>{customer.IsVerified ? 'Verified' : 'Pending'}</span></td>
                    <td className="px-4 py-3"><span className={`badge ${customer.IsActive ? 'success' : 'gray'}`}>{customer.IsActive ? 'Active' : 'Locked'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(customer)} className="rounded-lg border border-border-default p-2 text-text-secondary hover:text-primary" title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => toggleStatus(customer)} className="rounded-lg border border-border-default p-2 text-text-secondary hover:text-warning" title={customer.IsActive ? 'Lock' : 'Unlock'}>
                          <span className="material-symbols-outlined text-[18px]">{customer.IsActive ? 'lock' : 'lock_open'}</span>
                        </button>
                        <button onClick={() => deleteCustomer(customer)} className="rounded-lg border border-border-default p-2 text-text-secondary hover:text-danger" title="Soft delete">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-default bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">{currentCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={closeModal} className="rounded-lg p-2 text-text-muted hover:bg-surface-container-low hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Account email</span>
                <input required name="Email" type="email" value={formData.Email} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>
              {!currentCustomer && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-text-secondary">Password</span>
                  <input required name="Password" type="password" value={formData.Password} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Full name</span>
                <input name="FullName" value={formData.FullName} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Customer email</span>
                <input name="CustomerEmail" type="email" value={formData.CustomerEmail} onChange={handleChange} placeholder="Defaults to account email" className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Phone</span>
                <input name="PhoneNumber" value={formData.PhoneNumber} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Gender</span>
                <select name="Gender" value={formData.Gender} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary">
                  <option value="">Not set</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Date of birth</span>
                <input name="DateOfBirth" type="date" value={formData.DateOfBirth} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Loyalty points</span>
                <input name="LoyaltyPoints" type="number" min="0" value={formData.LoyaltyPoints} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input name="IsActive" type="checkbox" checked={formData.IsActive} onChange={handleChange} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input name="IsVerified" type="checkbox" checked={formData.IsVerified} onChange={handleChange} />
                  Verified
                </label>
              </div>
              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-border-default bg-surface-container-low px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-inverse-on-surface hover:bg-accent-hover">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Customers;
