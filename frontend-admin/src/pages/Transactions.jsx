import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';

const fallbackPayments = [
  { PaymentID: 9001, BookingID: 501, Amount: 245000, DiscountAmount: 25000, PaymentMethod: 'VNPAY', PaymentDate: '2026-05-16T19:30:00', Status: 'SUCCESS', RefundAmount: 0 },
  { PaymentID: 9002, BookingID: 502, Amount: 180000, DiscountAmount: 0, PaymentMethod: 'MOMO', PaymentDate: '2026-05-16T20:15:00', Status: 'PENDING', RefundAmount: 0 },
  { PaymentID: 9003, BookingID: 503, Amount: 320000, DiscountAmount: 50000, PaymentMethod: 'CARD', PaymentDate: '2026-05-15T21:05:00', Status: 'REFUNDED', RefundAmount: 270000 },
];

const statusClass = {
  SUCCESS: 'success',
  CONFIRMED: 'success',
  PENDING: 'gray',
  PROCESSING: 'gray',
  FAILED: 'gray',
  REFUNDED: 'gray',
};

const Transactions = () => {
  const [payments, setPayments] = useState(fallbackPayments);
  const [status, setStatus] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/payments')
      .then((res) => setPayments(res.data?.items || res.data || fallbackPayments))
      .catch(() => setError('Backend chua co endpoint /admin/payments, dang hien thi du lieu mau theo schema Payment.'));
  }, []);

  const filteredPayments = useMemo(() => (
    status === 'ALL' ? payments : payments.filter((payment) => payment.Status === status)
  ), [payments, status]);

  const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Transactions</h2>
          <p className="mt-1 text-sm text-text-muted">Theo doi thanh toan, giam gia, hoan tien va trang thai gateway.</p>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border-default bg-surface-container-low px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
          <option value="ALL">Tất cả trạng thái</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Chờ xác minh</option>
          <option value="REFUNDED">Refunded</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-border-default bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-border-default bg-surface-container-low">
              <tr>
                {['Payment ID', 'Booking', 'Method', 'Date', 'Amount', 'Discount', 'Refund', 'Status'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[13px] font-bold uppercase text-text-secondary">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-[13px]">
              {filteredPayments.map((payment) => (
                <tr key={payment.PaymentID} className="transition-colors hover:bg-surface-container-low">
                  <td className="px-4 py-3 font-semibold text-text-primary">#{payment.PaymentID}</td>
                  <td className="px-4 py-3 text-text-secondary">#{payment.BookingID}</td>
                  <td className="px-4 py-3 text-text-secondary">{payment.PaymentMethod || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary">{payment.PaymentDate ? new Date(payment.PaymentDate).toLocaleString('vi-VN') : '-'}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(payment.Amount)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatCurrency(payment.DiscountAmount)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatCurrency(payment.RefundAmount)}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusClass[payment.Status] || 'gray'}`}>{payment.Status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Transactions;
