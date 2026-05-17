/**
 * Cinemas & Halls Logic
 * Handles the 2-pane Master-Detail view for theaters.
 */

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = new Sidebar('sidebar-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebarEl.classList.toggle('show');
    });
  }

  // Khởi tạo tính năng Rạp
  initCinemasView();
});

// Mock Data
const mockCinemas = [
  {
    id: 1,
    name: 'CineAdmin Metropolis',
    address: '29 Liễu Giai, Ngọc Khánh, Ba Đình, Hà Nội',
    halls: [
      { id: 101, name: 'Phòng 01 (IMAX)', format: 'IMAX 2D/3D', capacity: 250 },
      { id: 102, name: 'Phòng 02', format: 'Standard 2D', capacity: 120 },
      { id: 103, name: 'Phòng 03 (Couple)', format: 'Sweetbox 2D', capacity: 80 },
    ]
  },
  {
    id: 2,
    name: 'CineAdmin Landmark 81',
    address: 'B1, Vincom Center Landmark 81, 720A Đ. Điện Biên Phủ, TP.HCM',
    halls: [
      { id: 201, name: 'Phòng Gold Class', format: 'VIP 2D', capacity: 50 },
      { id: 202, name: 'Phòng 02', format: 'Standard 2D', capacity: 150 },
    ]
  },
  {
    id: 3,
    name: 'CineAdmin CGV Vincom',
    address: 'Tầng 5, Vincom Center, 191 Bà Triệu, Hà Nội',
    halls: [] // Rạp trống chưa setup phòng chiếu
  }
];

function initCinemasView() {
  const cinemaListContainer = document.getElementById('cinema-list-container');
  if (!cinemaListContainer) return;

  // 1. Render danh sách Cụm rạp (Left Pane)
  const html = mockCinemas.map(cinema => `
    <div class="cinema-card" data-id="${cinema.id}" onclick="selectCinema(${cinema.id}, this)">
      <div class="cinema-name">${cinema.name}</div>
      <div class="cinema-address">${cinema.address}</div>
      <div class="cinema-stats">
        <span><i data-lucide="monitor-play" style="width:12px"></i> ${cinema.halls.length} Phòng</span>
      </div>
    </div>
  `).join('');

  cinemaListContainer.innerHTML = html;
  if(window.lucide) lucide.createIcons();
}

/**
 * Xử lý khi Select 1 Cụm rạp ở Pane Trái
 */
window.selectCinema = (id, element) => {
  // Highlight active
  document.querySelectorAll('.cinema-card').forEach(el => el.classList.remove('active'));
  element.classList.add('active');

  // Tìm data
  const cinema = mockCinemas.find(c => c.id === id);
  if(!cinema) return;

  // Chuyển view
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('detail-view').style.display = 'flex';

  // Render detail (Right Pane)
  document.getElementById('selected-cinema-name').textContent = cinema.name;
  document.getElementById('selected-cinema-address').innerHTML = `<i data-lucide="map-pin" style="width:14px; display:inline-block; vertical-align:middle;"></i> ${cinema.address}`;
  document.getElementById('halls-count').textContent = cinema.halls.length;

  // Render Halls Grid
  const hallsGrid = document.getElementById('halls-grid-container');
  if (cinema.halls.length === 0) {
    hallsGrid.innerHTML = `<div class="text-secondary" style="grid-column: 1 / -1; padding: 2rem; text-align: center; background: var(--bg-dark); border-radius: 8px; border: 1px dashed var(--border-color)">Cụm rạp này chưa có phòng chiếu nào. Hãy thêm ngay!</div>`;
  } else {
    hallsGrid.innerHTML = cinema.halls.map(hall => `
      <div class="hall-card">
        <div class="hall-name">${hall.name}</div>
        <div class="hall-format">${hall.format}</div>
        <div class="hall-capacity">
          <i data-lucide="users" style="width:16px; color:var(--text-secondary)"></i> 
          Sức chứa: ${hall.capacity} ghế
        </div>
        
        <div class="hall-actions">
          <!-- Chuyển hướng sang trang thiết kế sơ đồ ghế -->
          <a href="seat-layout.html?hallId=${hall.id}" class="btn-icon-sub" title="Thiết lập sơ đồ ghế">
            <i data-lucide="layout-grid"></i>
          </a>
          <button class="btn-icon-sub" title="Sửa thông tin phòng">
            <i data-lucide="edit-3"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  if(window.lucide) lucide.createIcons();
};
