import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';

const initialForm = {
  cinemaId: '',
  hallId: '',
  movieId: '',
  showDate: '',
  showTime: '',
  format: '2D',
  basePrice: '75000',
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
};

const formatTime = (value) => {
  if (!value) return '-';
  return String(value).slice(0, 5);
};

const formatCurrency = (value) => {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
};

const toInputDate = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

const Showtimes = () => {
  const [cinemas, setCinemas] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [filters, setFilters] = useState({
    cinemaId: '',
    hallId: '',
    movieId: '',
    date: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowId, setEditingShowId] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters.cinemaId) {
      fetchHalls(filters.cinemaId);
    } else {
      setHalls([]);
    }
  }, [filters.cinemaId]);

  useEffect(() => {
    fetchShows();
  }, [filters]);

  const selectedFormMovie = useMemo(() => {
    return movies.find((movie) => String(movie.MovieID) === String(form.movieId));
  }, [movies, form.movieId]);

  const estimatedEndTime = useMemo(() => {
    if (!form.showTime || !selectedFormMovie?.MovieRuntime) return '';
    const [hours, minutes] = form.showTime.split(':').map(Number);
    const date = new Date(1970, 0, 1, hours || 0, minutes || 0);
    date.setMinutes(date.getMinutes() + Number(selectedFormMovie.MovieRuntime) + 15);
    return date.toTimeString().slice(0, 5);
  }, [form.showTime, selectedFormMovie]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchInitialData = async () => {
    try {
      const [cinemaRes, movieRes] = await Promise.all([
        apiClient.get('/cinemas?limit=100'),
        apiClient.get('/movies?limit=200'),
      ]);

      setCinemas(cinemaRes.data?.items || cinemaRes.data || []);
      setMovies(movieRes.data?.items || movieRes.data || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể tải dữ liệu ban đầu');
    }
  };

  const fetchHalls = async (cinemaId) => {
    try {
      const res = await apiClient.get(`/cinemas/${cinemaId}`);
      setHalls(res.data?.halls || []);
    } catch (err) {
      console.error(err);
      setHalls([]);
    }
  };

  const fetchShows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const query = params.toString();
      const res = await apiClient.get(`/admin/shows${query ? `?${query}` : ''}`);
      setShows(res.data || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể tải suất chiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (show = null) => {
    if (show) {
      setEditingShowId(show.ShowID);
      const nextForm = {
        cinemaId: String(show.CinemaID || ''),
        hallId: String(show.HallID || ''),
        movieId: String(show.MovieID || ''),
        showDate: toInputDate(show.ShowDate),
        showTime: formatTime(show.ShowTime),
        format: show.Format || '2D',
        basePrice: String(show.BasePrice || 75000),
      };
      setForm(nextForm);
      if (show.CinemaID) await fetchHalls(show.CinemaID);
    } else {
      setEditingShowId(null);
      setForm({
        ...initialForm,
        cinemaId: filters.cinemaId || '',
        hallId: filters.hallId || '',
        movieId: filters.movieId || '',
        showDate: filters.date || new Date().toISOString().slice(0, 10),
      });
      if (filters.cinemaId) await fetchHalls(filters.cinemaId);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShowId(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.movieId || !form.hallId || !form.showDate || !form.showTime || !form.basePrice) {
      showToast('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        movieId: Number(form.movieId),
        hallId: Number(form.hallId),
        showDate: form.showDate,
        showTime: form.showTime,
        format: form.format,
        basePrice: Number(form.basePrice),
      };

      if (editingShowId) {
        await apiClient.put(`/admin/shows/${editingShowId}`, payload);
        showToast('Đã cập nhật suất chiếu');
      } else {
        await apiClient.post('/admin/shows', payload);
        showToast('Đã tạo suất chiếu');
      }

      handleCloseModal();
      fetchShows();
    } catch (err) {
      showToast(err.message || 'Không thể lưu suất chiếu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (showId) => {
    if (!window.confirm('Xóa suất chiếu này?')) return;

    try {
      await apiClient.delete(`/admin/shows/${showId}`);
      showToast('Đã xóa suất chiếu');
      fetchShows();
    } catch (err) {
      showToast(err.message || 'Không thể xóa suất chiếu');
    }
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'cinemaId' ? { hallId: '' } : {}),
    }));
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'cinemaId' ? { hallId: '' } : {}),
    }));

    if (field === 'cinemaId' && value) {
      fetchHalls(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Suất chiếu</h2>
          <p className="mt-1 text-sm text-text-muted">Tạo lịch chiếu để phục vụ đặt ghế.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-inverse-on-surface hover:bg-accent-hover"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm suất chiếu
        </button>
      </div>

      <div className="grid gap-3 rounded-xl border border-border-default bg-surface p-4 md:grid-cols-5">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">Rạp</span>
          <select value={filters.cinemaId} onChange={(e) => updateFilter('cinemaId', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">Tất cả rạp</option>
            {cinemas.map((cinema) => <option key={cinema.CinemaID} value={cinema.CinemaID}>{cinema.CinemaName}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">Phòng</span>
          <select value={filters.hallId} onChange={(e) => updateFilter('hallId', e.target.value)} disabled={!filters.cinemaId} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50">
            <option value="">Tất cả phòng</option>
            {halls.map((hall) => <option key={hall.HallID} value={hall.HallID}>{hall.HallName}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">Phim</span>
          <select value={filters.movieId} onChange={(e) => updateFilter('movieId', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">Tất cả phim</option>
            {movies.map((movie) => <option key={movie.MovieID} value={movie.MovieID}>{movie.MovieTitle}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">Ngày</span>
          <input type="date" value={filters.date} onChange={(e) => updateFilter('date', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>

        <div className="flex items-end">
          <button onClick={() => setFilters({ cinemaId: '', hallId: '', movieId: '', date: '' })} className="h-[38px] w-full rounded-lg border border-border-default bg-surface-container-low px-3 text-sm font-semibold text-text-primary hover:bg-surface-variant">
            Đặt lại
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border-default bg-surface-container-low text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-4 py-3">Phim</th>
              <th className="px-4 py-3">Rạp</th>
              <th className="px-4 py-3">Phòng</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Giờ</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Giá gốc</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {loading ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-text-muted">Đang tải suất chiếu...</td></tr>
            ) : shows.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-text-muted">Không tìm thấy suất chiếu.</td></tr>
            ) : shows.map((show) => (
              <tr key={show.ShowID} className="hover:bg-surface-container-low/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-text-primary">{show.MovieTitle}</div>
                  <div className="text-xs text-text-muted">{show.MovieRuntime || '-'} min</div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{show.CinemaName}</td>
                <td className="px-4 py-3 text-text-secondary">{show.HallName}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(show.ShowDate)}</td>
                <td className="px-4 py-3 text-text-primary">{formatTime(show.ShowTime)} - {formatTime(show.EndTime)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-bold text-primary">{show.Format}</span></td>
                <td className="px-4 py-3 text-text-secondary">{formatCurrency(show.BasePrice)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(show)} className="rounded-lg p-2 text-text-muted hover:bg-surface-variant hover:text-primary" title="Sửa">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(show.ShowID)} className="rounded-lg p-2 text-text-muted hover:bg-danger-bg hover:text-danger" title="Xóa">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border-default bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
              <h3 className="text-lg font-bold text-text-primary">{editingShowId ? 'Sửa suất chiếu' : 'Thêm suất chiếu'}</h3>
              <button onClick={handleCloseModal} className="rounded-lg p-2 text-text-muted hover:bg-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Rạp</span>
                <select value={form.cinemaId} onChange={(e) => updateForm('cinemaId', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">Chọn rạp</option>
                  {cinemas.map((cinema) => <option key={cinema.CinemaID} value={cinema.CinemaID}>{cinema.CinemaName}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Phòng</span>
                <select value={form.hallId} onChange={(e) => updateForm('hallId', e.target.value)} disabled={!form.cinemaId} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50">
                  <option value="">Chọn phòng</option>
                  {halls.map((hall) => <option key={hall.HallID} value={hall.HallID}>{hall.HallName}</option>)}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Phim</span>
                <select value={form.movieId} onChange={(e) => updateForm('movieId', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">Chọn phim</option>
                  {movies.map((movie) => <option key={movie.MovieID} value={movie.MovieID}>{movie.MovieTitle} ({movie.MovieRuntime || '-'} min)</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Ngày chiếu</span>
                <input type="date" value={form.showDate} onChange={(e) => updateForm('showDate', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Giờ chiếu</span>
                <input type="time" value={form.showTime} onChange={(e) => updateForm('showTime', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Format</span>
                <select value={form.format} onChange={(e) => updateForm('format', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-secondary">Giá gốc</span>
                <input type="number" min="0" value={form.basePrice} onChange={(e) => updateForm('basePrice', e.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>

              <div className="rounded-lg border border-border-default bg-surface-container-low p-3 text-sm text-text-secondary md:col-span-2">
                Giờ kết thúc dự kiến: <span className="font-semibold text-text-primary">{estimatedEndTime || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border-default px-5 py-4">
              <button onClick={handleCloseModal} className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-variant">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-inverse-on-surface hover:bg-accent-hover disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu suất chiếu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-inverse-surface px-4 py-2 text-sm text-inverse-on-surface shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Showtimes;
