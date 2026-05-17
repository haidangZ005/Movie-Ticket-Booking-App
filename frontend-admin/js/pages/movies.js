/**
 * Movies Logic - Handles table rendering, CRUD operations and Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Init Sidebar
  const sidebar = new Sidebar('sidebar-container');
  
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebarEl.classList.toggle('show');
    });
  }

  // Bind events
  bindModalEvents();
  
  // Render Data
  renderMoviesTable();
});

/**
 * Dữ liệu giả lập (Mock Data)
 */
const mockMovies = [
  {
    id: 1,
    title: 'Dune: Hành Tinh Cát - Phần 2',
    genre: 'Hành động, Viễn tưởng',
    duration: 166,
    format: '2D, IMAX',
    poster: 'https://image.tmdb.org/t/p/w200/8b8R8l88ILtNq3vjD1y3gJOKfA5.jpg',
    status: 'ACTIVE',
    isFeatured: true
  },
  {
    id: 2,
    title: 'Lật Mặt 7: Một Điều Ước',
    genre: 'Gia đình, Tâm lý',
    duration: 138,
    format: '2D',
    poster: 'https://image.tmdb.org/t/p/w200/xY3o4F3X2I2D3gC3Z69F0xO63W1.jpg',
    status: 'ACTIVE',
    isFeatured: true
  },
  {
    id: 3,
    title: 'Godzilla x Kong: Đế Chế Mới',
    genre: 'Hành động, Phiêu lưu',
    duration: 115,
    format: '2D, 3D',
    poster: 'https://image.tmdb.org/t/p/w200/w7rA11J1U3T4pZ6k5B6W5L4vEa.jpg',
    status: 'INACTIVE',
    isFeatured: false
  },
  {
    id: 4,
    title: 'Deadpool & Wolverine',
    genre: 'Hành động, Hài',
    duration: 127,
    format: '2D, IMAX',
    poster: 'https://image.tmdb.org/t/p/w200/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    status: 'UPCOMING',
    isFeatured: true
  }
];

/**
 * Render Movies Table
 */
function renderMoviesTable() {
  const tbody = document.getElementById('movie-table-body');
  if (!tbody) return;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'ACTIVE': return `<span class="badge active">Đang chiếu</span>`;
      case 'UPCOMING': return `<span class="badge upcoming">Sắp chiếu</span>`;
      case 'INACTIVE': return `<span class="badge inactive">Ngừng chiếu</span>`;
      default: return `<span class="badge inactive">Chưa rõ</span>`;
    }
  };

  const html = mockMovies.map(movie => `
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
      <td>${movie.format}</td>
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

  tbody.innerHTML = html;
  
  // Re-init lucide icons for newly added HTML
  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Events Cho Modal
 */
function bindModalEvents() {
  const modalOverlay = document.getElementById('movie-modal-overlay');
  const btnAdd = document.getElementById('btn-add-movie');
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const btnSave = document.getElementById('btn-save-movie');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('movie-form');

  const openModal = (title = 'Thêm Phim Mới') => {
    modalTitle.textContent = title;
    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    form.reset(); // Xóa data cũ đi
  };

  if (btnAdd) btnAdd.addEventListener('click', () => openModal('Thêm Phim Mới'));
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  
  if (btnSave) {
    btnSave.addEventListener('click', (e) => {
      e.preventDefault(); // Ngăn submit form reload trang
      alert('Chức năng lưu đã được kích hoạt! (Sẽ gọi HTTP API POST sau này)');
      closeModal();
    });
  }

  // Overlay click to close
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

/**
 * Xử lý click Sửa/Xóa/Nổi bật
 */
window.editMovie = (id) => {
  const modalOverlay = document.getElementById('movie-modal-overlay');
  if(!modalOverlay) return;
  
  const modalTitle = document.getElementById('modal-title');
  modalTitle.textContent = 'Chỉnh sửa Phim';
  modalOverlay.classList.add('active');
  // Thực tế sẽ fetch API để lấy data đổ vào form
};

window.deleteMovie = (id) => {
  if(confirm('Bạn có chắc chắn muốn xóa bộ phim này không? Mọi lịch chiếu liên quan cũng sẽ bị ảnh hưởng.')) {
    alert('Đã giả lập xóa thành công (Id: ' + id + ')');
  }
};

window.toggleFeatured = (id, checkboxInfo) => {
  const isChecked = checkboxInfo.checked;
  // Thực tế sẽ gọi API: PUT /api/admin/movies/:id/featured
  console.log(`Movie ${id} set featured to ${isChecked}`);
};
