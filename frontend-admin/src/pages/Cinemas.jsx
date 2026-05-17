import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const emptyForm = {
  cinemaName: '',
  address: '',
  district: '',
  cityId: '',
  cityName: '',
  latitude: '',
  longitude: '',
  isActive: true,
};

const Cinemas = () => {
  const [cinemas, setCinemas] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/cinemas?limit=100');
      setCinemas(res.data?.items || res.data || []);
    } catch (err) {
      setError(err.message || 'Khong tai duoc danh sach rap.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await apiClient.get('/cinemas/cities');
      setCities(res.data || []);
    } catch {
      setCities([]);
    }
  };

  useEffect(() => {
    fetchCinemas();
    fetchCities();
  }, []);

  const openAddModal = () => {
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
        cinemaName: formData.cinemaName.trim(),
        address: formData.address.trim() || null,
        district: formData.district.trim() || null,
        isActive: formData.isActive,
        latitude: formData.latitude === '' ? null : Number(formData.latitude),
        longitude: formData.longitude === '' ? null : Number(formData.longitude),
      };

      if (formData.cityId) {
        payload.cityId = Number(formData.cityId);
      } else {
        payload.cityName = formData.cityName.trim();
      }

      await apiClient.post('/admin/cinemas', payload);
      closeModal();
      await fetchCities();
      await fetchCinemas();
    } catch (err) {
      alert(err.message || 'Khong them duoc rap.');
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Cinemas & Showtimes</h2>
          <p className="mt-1 text-sm text-text-muted">Quan ly cum rap, phong chieu va lich chieu theo database.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-inverse-on-surface transition-colors hover:bg-accent-hover"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Cinema
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface shadow-sm xl:col-span-2">
          <div className="border-b border-border-default px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Cinema Complexes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-border-default bg-surface-container-low">
                <tr>
                  {['Cinema', 'Address', 'District', 'City', 'Coordinates', 'Status'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-[13px] font-bold uppercase text-text-secondary">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default text-[13px]">
                {loading ? (
                  <tr><td className="px-4 py-6 text-center text-text-muted" colSpan="6">Dang tai...</td></tr>
                ) : cinemas.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center text-text-muted" colSpan="6">Chua co rap nao. Bam Add Cinema de tao rap dau tien.</td></tr>
                ) : (
                  cinemas.map((cinema) => (
                    <tr key={cinema.CinemaID} className="transition-colors hover:bg-surface-container-low">
                      <td className="px-4 py-3 font-semibold text-text-primary">{cinema.CinemaName}</td>
                      <td className="px-4 py-3 text-text-secondary">{cinema.Address || '-'}</td>
                      <td className="px-4 py-3 text-text-secondary">{cinema.District || '-'}</td>
                      <td className="px-4 py-3 text-text-secondary">{cinema.CityName || cinema.CityID || '-'}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {cinema.Latitude && cinema.Longitude ? `${cinema.Latitude}, ${cinema.Longitude}` : '-'}
                      </td>
                      <td className="px-4 py-3"><span className={`badge ${cinema.IsActive ? 'success' : 'gray'}`}>{cinema.IsActive ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-surface p-card-padding shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">Cinema Setup</h3>
          <div className="space-y-3 text-sm text-text-secondary">
            <div className="rounded-lg border border-border-default bg-surface-container-low p-4">
              <div className="font-semibold text-text-primary">Cities</div>
              <div className="mt-1 text-text-muted">{cities.length} city records</div>
            </div>
            <div className="rounded-lg border border-border-default bg-surface-container-low p-4">
              <div className="font-semibold text-text-primary">Cinemas</div>
              <div className="mt-1 text-text-muted">{cinemas.length} active cinema records</div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-default bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Add Cinema</h3>
              <button onClick={closeModal} className="rounded-lg p-2 text-text-muted hover:bg-surface-container-low hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Cinema name</span>
                <input required name="cinemaName" value={formData.cinemaName} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Existing city</span>
                <select name="cityId" value={formData.cityId} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary">
                  <option value="">Create new city</option>
                  {cities.map((city) => (
                    <option key={city.CityID} value={city.CityID}>{city.CityName}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">New city name</span>
                <input required={!formData.cityId} disabled={!!formData.cityId} name="cityName" value={formData.cityName} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary disabled:opacity-50" placeholder="Ho Chi Minh" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">District</span>
                <input name="district" value={formData.district} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Address</span>
                <input name="address" value={formData.address} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Latitude</span>
                <input name="latitude" type="number" step="0.000001" value={formData.latitude} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Longitude</span>
                <input name="longitude" type="number" step="0.000001" value={formData.longitude} onChange={handleChange} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 outline-none focus:border-primary" />
              </label>

              <label className="flex items-center gap-2 text-sm text-text-secondary md:col-span-2">
                <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} />
                Active
              </label>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-border-default bg-surface-container-low px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-inverse-on-surface hover:bg-accent-hover">Save Cinema</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Cinemas;
