import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    language: '',
    runtime: '',
    releaseDate: '',
    actor: '',
    director: '',
    description: '',
    isActive: true
  });

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/movies?limit=100');
      // res.data.items chứa danh sách phim
      setMovies(res.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setCurrentMovie(null);
    setFormData({
      title: '', genre: '', language: '', runtime: '', releaseDate: '',
      actor: '', director: '', description: '', isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (movie) => {
    setCurrentMovie(movie);
    setFormData({
      title: movie.MovieTitle || '',
      genre: movie.MovieGenre || '',
      language: movie.MovieLanguage || '',
      runtime: movie.MovieRuntime || '',
      releaseDate: movie.MovieReleaseDate ? movie.MovieReleaseDate.split('T')[0] : '',
      actor: movie.MovieActor || '',
      director: movie.MovieDirector || '',
      description: movie.MovieDescription || '',
      isActive: movie.IsActive !== false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMovie(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, runtime: parseInt(formData.runtime) || 0 };
      if (currentMovie) {
        await apiClient.put(`/admin/movies/${currentMovie.MovieID}`, payload);
      } else {
        await apiClient.post('/admin/movies', payload);
      }
      closeModal();
      fetchMovies();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phim này?')) {
      try {
        await apiClient.delete(`/admin/movies/${id}`);
        fetchMovies();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Movies Management</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Search movies..." style={{ height: '36px', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 12px' }} />
          <button onClick={openAddModal} style={{ background: 'var(--accent)', color: 'white', padding: '0 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
            Add Movie
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : movies.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--textSub)' }}>Chưa có phim nào.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-low)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>MOVIE TITLE</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>GENRE</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>LANGUAGE</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>RELEASE DATE</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>STATUS</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(m => (
              <tr key={m.MovieID} style={{ borderBottom: '1px solid var(--borderLight)' }}>
                <td style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '56px', background: 'var(--purpleBg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎬</div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--textPrimary)' }}>{m.MovieTitle}</div>
                    <div style={{ fontSize: '11px', color: 'var(--textSub)' }}>Runtime: {m.MovieRuntime} min</div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>{m.MovieGenre}</td>
                <td style={{ padding: '16px 20px' }}>{m.MovieLanguage}</td>
                <td style={{ padding: '16px 20px' }}>{formatDate(m.MovieReleaseDate)}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`badge ${m.IsActive ? 'success' : 'gray'}`}>
                    {m.IsActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px' }}>
                  <button onClick={() => openEditModal(m)} style={{ cursor: 'pointer', marginRight: '8px', background: 'none', border: 'none', fontSize: '16px' }}>✏️</button>
                  <button onClick={() => handleDelete(m.MovieID)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>🗑️</button>
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
              {currentMovie ? 'Edit Movie' : 'Add Movie'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Movie Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Genre</label>
                <input required type="text" name="genre" value={formData.genre} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Language</label>
                <input required type="text" name="language" value={formData.language} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Runtime (mins)</label>
                <input required type="number" name="runtime" value={formData.runtime} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Release Date</label>
                <input required type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Director</label>
                <input type="text" name="director" value={formData.director} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Actor</label>
                <input type="text" name="actor" value={formData.actor} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="isActive" />
                <label htmlFor="isActive" style={{ fontSize: '14px', fontWeight: '500' }}>Active (Show in app)</label>
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: 'var(--surface-low)', color: 'var(--textPrimary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save Movie</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movies;
