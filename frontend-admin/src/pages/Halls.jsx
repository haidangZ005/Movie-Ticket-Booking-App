import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const emptyForm = {
  hallName: '',
  totalRows: '',
  totalCols: '',
};

const Halls = () => {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [halls, setHalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHallId, setEditingHallId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  const fetchCinemas = async () => {
    try {
      const res = await apiClient.get('/cinemas?limit=100');
      setCinemas(res.data?.items || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHalls = async (cinemaId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/cinemas/${cinemaId}`);
      setHalls(res.data?.halls || []);
    } catch (err) {
      console.error(err);
      setHalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    if (selectedCinemaId) fetchHalls(selectedCinemaId);
    else setHalls([]);
  }, [selectedCinemaId]);

  const filteredHalls = useMemo(() => {
    return halls.filter((hall) => {
      const matchSearch = String(hall.HallName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const hasLayout = Number(hall.TotalSeats || 0) > 0;
      if (statusFilter === 'CONFIGURED' && !hasLayout) return false;
      if (statusFilter === 'EMPTY' && hasLayout) return false;
      return matchSearch;
    });
  }, [halls, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    const total = halls.length;
    const seats = halls.reduce((sum, hall) => sum + Number(hall.TotalSeats || 0), 0);
    const withoutLayout = halls.filter((hall) => !Number(hall.TotalSeats || 0)).length;
    const largest = halls.reduce((max, hall) => (Number(hall.TotalSeats || 0) > Number(max.TotalSeats || 0) ? hall : max), halls[0] || {});
    return {
      total,
      seats,
      withoutLayout,
      largest: Number(largest?.TotalSeats || 0) > 0 ? `${largest.HallName} (${largest.TotalSeats})` : 'N/A',
      avgSeats: total ? Math.round(seats / total) : 0,
    };
  }, [halls]);

  const openModal = (hall = null) => {
    if (hall) {
      setEditingHallId(hall.HallID);
      setFormData({
        hallName: hall.HallName || '',
        totalRows: hall.TotalRows || '',
        totalCols: hall.TotalCols || '',
      });
    } else {
      setEditingHallId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHallId(null);
    setFormData(emptyForm);
  };

  const saveHall = async () => {
    const totalRows = Number(formData.totalRows);
    const totalCols = Number(formData.totalCols);
    if (!formData.hallName.trim() || totalRows < 1 || totalCols < 1) {
      alert('Vui lòng nhập tên phòng, số hàng và số cột hợp lệ.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        hallName: formData.hallName.trim(),
        totalRows,
        totalCols,
        cinemaId: Number(selectedCinemaId),
      };

      if (editingHallId) {
        await apiClient.put(`/admin/halls/${editingHallId}`, payload);
        showToast('Đã cập nhật phòng.');
      } else {
        await apiClient.post(`/admin/cinemas/${selectedCinemaId}/halls`, payload);
        showToast('Đã tạo phòng.');
      }

      closeModal();
      fetchHalls(selectedCinemaId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không lưu được phòng.');
    } finally {
      setSaving(false);
    }
  };

  const deleteHall = async (hallId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      await apiClient.delete(`/admin/halls/${hallId}`);
      showToast('Đã xóa phòng.');
      fetchHalls(selectedCinemaId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không xóa được phòng.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Quản lý phòng chiếu</h2>
          <p className="mt-1 text-sm text-text-muted">Quản lý phòng chiếu và cấu hình sơ đồ ghế.</p>
        </div>
        <button onClick={() => openModal()} disabled={!selectedCinemaId} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-inverse-on-surface transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm phòng
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border-default bg-surface p-4 shadow-sm">
        <label className="block w-64">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Chọn rạp</span>
          <select value={selectedCinemaId} onChange={(event) => setSelectedCinemaId(event.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">-- Chọn rạp --</option>
            {cinemas.map((cinema) => <option key={cinema.CinemaID} value={cinema.CinemaID}>{cinema.CinemaName}</option>)}
          </select>
        </label>
        <label className="block w-64">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Tìm phòng</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} disabled={!selectedCinemaId} placeholder="Tìm theo tên..." className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" />
        </label>
        <label className="block w-48">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={!selectedCinemaId} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50">
            <option value="ALL">Tất cả</option>
            <option value="CONFIGURED">Đã cấu hình</option>
            <option value="EMPTY">Chưa có sơ đồ</option>
          </select>
        </label>
        <button onClick={() => selectedCinemaId && fetchHalls(selectedCinemaId)} disabled={!selectedCinemaId} className="ml-auto inline-flex h-[38px] items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-container-low px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-variant disabled:opacity-50">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </div>

      {selectedCinemaId && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-xl border border-border-default bg-surface p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Tổng phòng</p><p className="mt-2 text-2xl font-bold text-text-primary">{summary.total}</p></div>
          <div className="rounded-xl border border-border-default bg-surface p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Tổng ghế</p><p className="mt-2 text-2xl font-bold text-text-primary">{summary.seats}</p></div>
          <div className="rounded-xl border border-border-default bg-surface p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Phòng lớn nhất</p><p className="mt-2 truncate text-lg font-bold text-text-primary">{summary.largest}</p></div>
          <div className="rounded-xl border border-border-default bg-surface p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Chưa có sơ đồ</p><p className={`mt-2 text-2xl font-bold ${summary.withoutLayout > 0 ? 'text-warning' : 'text-text-primary'}`}>{summary.withoutLayout}</p></div>
          <div className="hidden rounded-xl border border-border-default bg-surface p-4 shadow-sm lg:block"><p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Ghế TB/phòng</p><p className="mt-2 text-2xl font-bold text-text-primary">{summary.avgSeats}</p></div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border-default bg-surface shadow-sm">
        {!selectedCinemaId ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <span className="material-symbols-outlined mb-3 text-5xl opacity-50">business</span>
            <p>Chọn rạp để quản lý phòng chiếu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="border-b border-border-default bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tên phòng</th>
                  <th className="px-4 py-3 font-semibold">Số hàng</th>
                  <th className="px-4 py-3 font-semibold">Số cột</th>
                  <th className="px-4 py-3 font-semibold">Tổng ghế</th>
                  <th className="px-4 py-3 font-semibold">Sơ đồ</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  <tr><td colSpan="6" className="py-8 text-center text-text-muted">Đang tải...</td></tr>
                ) : filteredHalls.length === 0 ? (
                  <tr><td colSpan="6" className="py-8 text-center text-text-muted">Không có phòng phù hợp.</td></tr>
                ) : (
                  filteredHalls.map((hall) => {
                    const hasLayout = Number(hall.TotalSeats || 0) > 0;
                    return (
                      <tr key={hall.HallID} className="transition-colors hover:bg-surface-variant/30">
                        <td className="px-4 py-3 font-medium">{hall.HallName}</td>
                        <td className="px-4 py-3 text-text-secondary">{hall.TotalRows || 0}</td>
                        <td className="px-4 py-3 text-text-secondary">{hall.TotalCols || 0}</td>
                        <td className="px-4 py-3 font-semibold">{hall.TotalSeats || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${hasLayout ? 'border-primary/20 bg-primary-soft text-primary' : 'border-warning/20 bg-warning/10 text-warning'}`}>
                            {hasLayout ? 'Đã cấu hình' : 'Chưa có sơ đồ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openModal(hall)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-secondary transition-colors hover:bg-surface-variant hover:text-text-primary" title="Sửa">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => navigate('/seat-layout', { state: { cinemaId: selectedCinemaId, hallId: hall.HallID } })} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/50 text-primary transition-colors hover:bg-primary-soft" title="Cấu hình ghế">
                              <span className="material-symbols-outlined text-[18px]">grid_view</span>
                            </button>
                            <button onClick={() => deleteHall(hall.HallID)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error/50 text-error transition-colors hover:bg-error/10" title="Xóa">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-border-default bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default bg-surface-container-low px-6 py-4">
              <h3 className="text-lg font-bold text-text-primary">{editingHallId ? 'Sửa phòng' : 'Thêm phòng mới'}</h3>
              <button onClick={closeModal} className="text-text-muted transition-colors hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Tên phòng</span>
                <input value={formData.hallName} onChange={(event) => setFormData({ ...formData, hallName: event.target.value })} placeholder="VD: Cinema 1, IMAX..." className="w-full rounded-lg border border-border-default bg-page-bg px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Số hàng</span>
                  <input type="number" min="1" value={formData.totalRows} onChange={(event) => setFormData({ ...formData, totalRows: event.target.value })} className="w-full rounded-lg border border-border-default bg-page-bg px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Số cột</span>
                  <input type="number" min="1" value={formData.totalCols} onChange={(event) => setFormData({ ...formData, totalCols: event.target.value })} className="w-full rounded-lg border border-border-default bg-page-bg px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </label>
              </div>
              {Number(formData.totalRows) > 0 && Number(formData.totalCols) > 0 && (
                <p className="text-xs italic text-text-muted">Phòng có tối đa <strong className="text-text-primary">{Number(formData.totalRows) * Number(formData.totalCols)}</strong> vị trí ghế.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-border-default bg-surface-container-low px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-variant">Hủy</button>
              <button onClick={saveHall} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-inverse-on-surface transition-colors hover:bg-accent-hover disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu phòng'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-inverse-surface px-4 py-2 text-sm text-inverse-on-surface shadow-lg">{toast}</div>}
    </div>
  );
};

export default Halls;
