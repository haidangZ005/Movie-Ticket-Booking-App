/**
 * Cinemas & Halls Logic backed by real API.
 */

let cinemas = [];

document.addEventListener('DOMContentLoaded', () => {
  new Sidebar('sidebar-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebarEl.classList.toggle('show'));
  }

  initCinemasView();
});

const getItems = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeCinema = (cinema) => ({
  id: cinema.CinemaID,
  name: cinema.CinemaName || 'Chưa có tên rạp',
  address: cinema.Address || 'Đang cập nhật địa chỉ',
  district: cinema.District || '',
  city: cinema.CityName || '',
  halls: []
});

async function initCinemasView() {
  const cinemaListContainer = document.getElementById('cinema-list-container');
  if (!cinemaListContainer) return;

  cinemaListContainer.innerHTML = `<div class="text-secondary" style="padding:1rem">Đang tải danh sách rạp...</div>`;

  try {
    const response = await api.get('/cinemas?limit=100');
    cinemas = getItems(response).map(normalizeCinema);
    renderCinemaList();
  } catch (error) {
    cinemaListContainer.innerHTML = `<div class="text-secondary" style="padding:1rem">Không tải được rạp: ${error.message}</div>`;
  }
}

function renderCinemaList() {
  const cinemaListContainer = document.getElementById('cinema-list-container');
  if (!cinemaListContainer) return;

  if (!cinemas.length) {
    cinemaListContainer.innerHTML = `<div class="text-secondary" style="padding:1rem">Chưa có cụm rạp nào.</div>`;
    return;
  }

  cinemaListContainer.innerHTML = cinemas.map(cinema => `
    <div class="cinema-card" data-id="${cinema.id}" onclick="selectCinema(${cinema.id}, this)">
      <div class="cinema-name">${cinema.name}</div>
      <div class="cinema-address">${[cinema.district, cinema.city].filter(Boolean).join(', ') || cinema.address}</div>
      <div class="cinema-stats">
        <span><i data-lucide="monitor-play" style="width:12px"></i> Xem phòng chiếu</span>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

window.selectCinema = async (id, element) => {
  document.querySelectorAll('.cinema-card').forEach(el => el.classList.remove('active'));
  element.classList.add('active');

  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('detail-view').style.display = 'flex';
  document.getElementById('selected-cinema-name').textContent = 'Đang tải...';
  document.getElementById('selected-cinema-address').textContent = '';
  document.getElementById('halls-count').textContent = '0';
  document.getElementById('halls-grid-container').innerHTML = `<div class="text-secondary">Đang tải phòng chiếu...</div>`;

  try {
    const response = await api.get(`/cinemas/${id}`);
    const payload = response.data || {};
    const cinema = payload.cinema || payload;
    const halls = payload.halls || [];

    document.getElementById('selected-cinema-name').textContent = cinema.CinemaName || 'Chưa có tên rạp';
    document.getElementById('selected-cinema-address').innerHTML = `<i data-lucide="map-pin" style="width:14px; display:inline-block; vertical-align:middle;"></i> ${cinema.Address || 'Đang cập nhật địa chỉ'}`;
    document.getElementById('halls-count').textContent = halls.length;

    const hallsGrid = document.getElementById('halls-grid-container');
    if (halls.length === 0) {
      hallsGrid.innerHTML = `<div class="text-secondary" style="grid-column: 1 / -1; padding: 2rem; text-align: center; background: var(--bg-dark); border-radius: 8px; border: 1px dashed var(--border-color)">Cụm rạp này chưa có phòng chiếu nào.</div>`;
    } else {
      hallsGrid.innerHTML = halls.map(hall => `
        <div class="hall-card">
          <div class="hall-name">${hall.HallName}</div>
          <div class="hall-format">${hall.TotalRows} hàng x ${hall.TotalCols} cột</div>
          <div class="hall-capacity">
            <i data-lucide="users" style="width:16px; color:var(--text-secondary)"></i>
            Sức chứa: ${hall.TotalSeats} ghế
          </div>
          <div class="hall-actions">
            <a href="seat-layout.html?hallId=${hall.HallID}" class="btn-icon-sub" title="Thiết lập sơ đồ ghế">
              <i data-lucide="layout-grid"></i>
            </a>
          </div>
        </div>
      `).join('');
    }

    if (window.lucide) lucide.createIcons();
  } catch (error) {
    document.getElementById('halls-grid-container').innerHTML = `<div class="text-secondary">Không tải được chi tiết rạp: ${error.message}</div>`;
  }
};
