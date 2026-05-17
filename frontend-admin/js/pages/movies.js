/**
 * Movies Logic - API backed table and admin actions.
 */

let movies = [];
let editingMovieId = null;

document.addEventListener('DOMContentLoaded', () => {
  new Sidebar('sidebar-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebarEl.classList.toggle('show'));
  }

  bindModalEvents();
  bindSearch();
  loadMovies();
});

const normalizeMovie = (movie) => {
  const releaseDate = movie.MovieReleaseDate ? new Date(movie.MovieReleaseDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (releaseDate) releaseDate.setHours(0, 0, 0, 0);

  return {
    id: movie.MovieID,
    title: movie.MovieTitle || 'Chưa có tên',
    genre: movie.MovieGenre || 'Đang cập nhật',
    language: movie.MovieLanguage || 'Đang cập nhật',
    duration: movie.MovieRuntime || 0,
    releaseDate: movie.MovieReleaseDate ? movie.MovieReleaseDate.slice(0, 10) : '',
    description: movie.MovieDescription || '',
    poster: movie.MovieImage || 'https://picsum.photos/seed/movie-placeholder/120/180',
    isFeatured: Boolean(movie.IsFeatured),
    isActive: Boolean(movie.IsActive),
    status: !movie.IsActive ? 'INACTIVE' : releaseDate && releaseDate > today ? 'UPCOMING' : 'ACTIVE'
  };
};

const getItems = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

async function loadMovies() {
  const tbody = document.getElementById('movie-table-body');
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-secondary">Đang tải dữ liệu phim...</td></tr>`;

  try {
    const response = await api.get('/movies?limit=100');
    movies = getItems(response).map(normalizeMovie);
    renderMoviesTable(movies);
  } catch (error) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-secondary">Không tải được phim: ${error.message}</td></tr>`;
  }
}

function bindSearch() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();
    const filtered = movies.filter((movie) =>
      movie.title.toLowerCase().includes(keyword) ||
      movie.genre.toLowerCase().includes(keyword)
    );
    renderMoviesTable(filtered);
  });
}

function getStatusBadge(status) {
  switch (status) {
    case 'ACTIVE': return `<span class="badge active">Đang chiếu</span>`;
    case 'UPCOMING': return `<span class="badge upcoming">Sắp chiếu</span>`;
    case 'INACTIVE': return `<span class="badge inactive">Ngừng chiếu</span>`;
    default: return `<span class="badge inactive">Chưa rõ</span>`;
  }
}

function renderMoviesTable(data) {
  const tbody = document.getElementById('movie-table-body');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-secondary">Không có phim phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(movie => `
    <tr>
      <td>
        <div class="movie-info">
          <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
          <div>
            <span class="movie-title">${movie.title}</span>
            <span class="movie-genre">${movie.genre}</span>
          </div>
        </div>
      </td>
      <td>${movie.language}</td>
      <td>${movie.duration} phút</td>
      <td>${getStatusBadge(movie.status)}</td>
      <td>
        <label class="switch">
          <input type="checkbox" onchange="toggleFeatured(${movie.id}, this)" ${movie.isFeatured ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-icon-sub" onclick="editMovie(${movie.id})" title="Sửa">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-icon-sub delete" onclick="deleteMovie(${movie.id})" title="Xóa">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function bindModalEvents() {
  const modalOverlay = document.getElementById('movie-modal-overlay');
  const btnAdd = document.getElementById('btn-add-movie');
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const btnSave = document.getElementById('btn-save-movie');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('movie-form');
  const controls = form ? form.querySelectorAll('.form-control') : [];

  const openModal = (title = 'Thêm Phim Mới') => {
    modalTitle.textContent = title;
    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    editingMovieId = null;
    form.reset();
  };

  if (btnAdd) btnAdd.addEventListener('click', () => openModal('Thêm Phim Mới'));
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  if (btnSave) {
    btnSave.addEventListener('click', async (event) => {
      event.preventDefault();
      const payload = {
        title: controls[0]?.value.trim(),
        genre: controls[1]?.value.trim(),
        runtime: Number(controls[2]?.value || 0),
        releaseDate: controls[3]?.value,
        isActive: controls[4]?.value !== 'INACTIVE',
        language: 'Tiếng Việt',
        description: controls[5]?.value.trim()
      };

      if (!payload.title || !payload.genre || !payload.runtime || !payload.releaseDate) {
        alert('Vui lòng nhập đầy đủ tên phim, thể loại, thời lượng và ngày khởi chiếu.');
        return;
      }

      try {
        if (editingMovieId) {
          await api.put(`/admin/movies/${editingMovieId}`, payload);
        } else {
          await api.post('/admin/movies', payload);
        }
        closeModal();
        await loadMovies();
      } catch (error) {
        alert(`Không lưu được phim: ${error.message}`);
      }
    });
  }
}

window.editMovie = (id) => {
  const movie = movies.find((item) => item.id === id);
  const modalOverlay = document.getElementById('movie-modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('movie-form');
  const controls = form ? form.querySelectorAll('.form-control') : [];
  if (!movie || !modalOverlay) return;

  editingMovieId = id;
  modalTitle.textContent = 'Chỉnh sửa Phim';
  controls[0].value = movie.title;
  controls[1].value = movie.genre;
  controls[2].value = movie.duration;
  controls[3].value = movie.releaseDate;
  controls[4].value = movie.status;
  controls[5].value = movie.description;
  modalOverlay.classList.add('active');
};

window.deleteMovie = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa bộ phim này không?')) return;
  try {
    await api.delete(`/admin/movies/${id}`);
    await loadMovies();
  } catch (error) {
    alert(`Không xóa được phim: ${error.message}`);
  }
};

window.toggleFeatured = async (id, checkboxInfo) => {
  const originalValue = checkboxInfo.checked;
  try {
    await api.put(`/admin/movies/${id}/featured`, {});
    await loadMovies();
  } catch (error) {
    checkboxInfo.checked = !originalValue;
    alert(`Không cập nhật nổi bật: ${error.message}`);
  }
};
