import React, { useEffect, useState } from 'react';
import apiClient, { API_ORIGIN } from '../services/api';

const resolvePosterUrl = (posterUrl) => {
  if (!posterUrl) return '';

  const normalizedUrl = String(posterUrl).trim().replace(/\\/g, '/');
  if (!normalizedUrl || ['null', 'undefined'].includes(normalizedUrl.toLowerCase())) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedUrl)) return normalizedUrl;
  if (normalizedUrl.startsWith('//')) return `${window.location.protocol}${normalizedUrl}`;

  let localPath = normalizedUrl.replace(/^public\//i, '');
  if (!localPath.startsWith('/')) {
    const hasPath = localPath.includes('/');
    localPath = hasPath ? `/${localPath}` : `/uploads/movies/${localPath}`;
  }

  if (localPath.startsWith('/movies/')) {
    localPath = `/uploads${localPath}`;
  }

  return `${API_ORIGIN}${localPath}`;
};

const getMoviePosterUrl = (movie) => (
  resolvePosterUrl(movie.PosterUrl || movie.MovieImage || movie.posterUrl || movie.movieImage)
);

const PosterPlaceholder = () => (
  <div style={{ width: '40px', height: '56px', background: 'var(--purpleBg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', lineHeight: '12px', color: 'var(--textSub)', textAlign: 'center', flexShrink: 0 }}>
    No image
  </div>
);

const MoviePoster = ({ movie }) => {
  const [failed, setFailed] = useState(false);
  const posterUrl = getMoviePosterUrl(movie);

  if (!posterUrl || failed) {
    return <PosterPlaceholder />;
  }

  return (
    <img
      src={posterUrl}
      alt={movie.MovieTitle || 'Movie poster'}
      onError={() => setFailed(true)}
      style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px', background: 'var(--surface-low)', flexShrink: 0, display: 'block' }}
    />
  );
};

const emptyForm = {
  title: '',
  genre: '',
  language: '',
  runtime: '',
  posterUrl: '',
  releaseDate: '',
  actor: '',
  director: '',
  description: '',
  isActive: true,
};

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [selectedPosterFile, setSelectedPosterFile] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/movies?limit=100');
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openAddModal = () => {
    setCurrentMovie(null);
    setSelectedPosterFile(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (movie) => {
    setCurrentMovie(movie);
    setSelectedPosterFile(null);
    setFormData({
      title: movie.MovieTitle || '',
      genre: movie.MovieGenre || '',
      language: movie.MovieLanguage || '',
      runtime: movie.MovieRuntime || '',
      releaseDate: movie.MovieReleaseDate ? movie.MovieReleaseDate.split('T')[0] : '',
      actor: movie.MovieActor || '',
      director: movie.MovieDirector || '',
      description: movie.MovieDescription || '',
      posterUrl: movie.PosterUrl || '',
      isActive: movie.IsActive !== false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMovie(null);
    setSelectedPosterFile(null);
  };

  const handlePosterFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedPosterFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let posterUrl = formData.posterUrl;

      if (selectedPosterFile) {
        const uploadForm = new FormData();
        uploadForm.append('poster', selectedPosterFile);
        const uploadRes = await apiClient.postForm('/admin/uploads/movie-poster', uploadForm);
        posterUrl = uploadRes.data?.posterUrl || posterUrl;
      }

      const payload = { ...formData, posterUrl, runtime: parseInt(formData.runtime, 10) || 0 };
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa phim này?')) return;
    try {
      await apiClient.delete(`/admin/movies/${id}`);
      fetchMovies();
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
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Quản lý phim</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Tìm kiếm phim..." style={{ height: '36px', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 12px' }} />
          <button onClick={openAddModal} style={{ background: 'var(--accent)', color: 'white', padding: '0 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
            Thêm phim
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
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Tên phim</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Thể loại</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Ngôn ngữ</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Ngày phát hành</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600' }}>Trạng thái</th>
              <th style={{ padding: '16px 20px', color: 'var(--textSub)', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.MovieID} style={{ borderBottom: '1px solid var(--borderLight)' }}>
                <td style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <MoviePoster movie={movie} />
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--textPrimary)' }}>{movie.MovieTitle}</div>
                    <div style={{ fontSize: '11px', color: 'var(--textSub)' }}>Thời lượng: {movie.MovieRuntime} min</div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>{movie.MovieGenre}</td>
                <td style={{ padding: '16px 20px' }}>{movie.MovieLanguage}</td>
                <td style={{ padding: '16px 20px' }}>{formatDate(movie.MovieReleaseDate)}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`badge ${movie.IsActive ? 'success' : 'gray'}`}>
                    {movie.IsActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px' }}>
                  <button onClick={() => openEditModal(movie)} style={{ cursor: 'pointer', marginRight: '8px', background: 'none', border: 'none', fontSize: '16px' }}>✏️</button>
                  <button onClick={() => handleDelete(movie.MovieID)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>🗑️</button>
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
              {currentMovie ? 'Sửa phim' : 'Thêm phim'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Tên phim</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Thể loại</label>
                <input required type="text" name="genre" value={formData.genre} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ngôn ngữ</label>
                <input required type="text" name="language" value={formData.language} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Thời lượng (phút)</label>
                <input required type="number" name="runtime" value={formData.runtime} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ngày phát hành</label>
                <input required type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Mô tả</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Đạo diễn</label>
                <input type="text" name="director" value={formData.director} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Diễn viên</label>
                <input type="text" name="actor" value={formData.actor} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Poster phim</label>
                <input type="file" accept="image/*" onChange={handlePosterFileChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
                {(selectedPosterFile || formData.posterUrl) && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={selectedPosterFile ? URL.createObjectURL(selectedPosterFile) : resolvePosterUrl(formData.posterUrl)}
                      alt="Movie poster preview"
                      style={{ width: '54px', height: '76px', objectFit: 'cover', borderRadius: '6px', background: 'var(--surface-low)' }}
                    />
                    <span style={{ color: 'var(--textSub)', fontSize: '12px' }}>
                      {selectedPosterFile ? selectedPosterFile.name : 'Poster hiện tại'}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="movieIsActive" />
                <label htmlFor="movieIsActive" style={{ fontSize: '14px', fontWeight: '500' }}>Hoạt động</label>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: 'var(--surface-low)', color: 'var(--textPrimary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Lưu phim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movies;
