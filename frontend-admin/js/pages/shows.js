/**
 * Shows Management Logic
 * Handles Dual-view rendering (List/Grid) and time calculations.
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

  const app = new ShowsManager();
  app.init();
});

// Mock Data
const mockMovies = [
  { id: 1, title: 'Dune: Hành Tinh Cát - Phần 2', duration: 166 },
  { id: 2, title: 'Lật Mặt 7: Một Điều Ước', duration: 138 },
  { id: 3, title: 'Godzilla x Kong', duration: 115 },
  { id: 4, title: 'Deadpool & Wolverine', duration: 127 }
];

const mockCinemas = [
  { 
    id: 1, name: 'CineAdmin Metropolis', 
    halls: [
      { id: 101, name: 'Phòng 01 (IMAX)' },
      { id: 102, name: 'Phòng 02' },
      { id: 103, name: 'Phòng 03' }
    ]
  },
  { 
    id: 2, name: 'CineAdmin Landmark 81',
    halls: [
      { id: 201, name: 'Phòng Gold Class' },
      { id: 202, name: 'Phòng 02' }
    ]
  }
];

const mockShows = [
  { id: 1, movieId: 1, cinemaId: 1, hallId: 101, startTime: '2026-04-20T10:00', format: 'IMAX 2D', surcharge: 20000 },
  { id: 2, movieId: 1, cinemaId: 1, hallId: 101, startTime: '2026-04-20T14:00', format: 'IMAX 2D', surcharge: 20000 },
  { id: 3, movieId: 2, cinemaId: 1, hallId: 102, startTime: '2026-04-20T09:30', format: '2D', surcharge: 0 },
  { id: 4, movieId: 3, cinemaId: 1, hallId: 102, startTime: '2026-04-20T13:00', format: '2D', surcharge: 0 },
  { id: 5, movieId: 4, cinemaId: 1, hallId: 103, startTime: '2026-04-20T19:00', format: '2D', surcharge: 0 }
];

class ShowsManager {
  constructor() {
    this.currentView = 'list'; // 'list' or 'grid'
    this.currentCinemaId = 1;
    this.currentDate = '2026-04-20';
    
    // DOM Elements
    this.listBtn = document.getElementById('view-list-btn');
    this.gridBtn = document.getElementById('view-grid-btn');
    this.listViewEl = document.getElementById('shows-list-view');
    this.gridViewEl = document.getElementById('shows-grid-view');
    
    this.tableBody = document.getElementById('shows-table-body');
    this.timelineContainer = document.getElementById('timeline-container');
    
    this.movieSelect = document.getElementById('input-movie');
    this.hallSelect = document.getElementById('input-hall');
    this.startTimeInput = document.getElementById('input-start-time');
    this.displayDuration = document.getElementById('display-duration');
    this.displayEndTime = document.getElementById('display-end-time');
    
    this.btnSave = document.getElementById('btn-save-show');
  }

  init() {
    this.initFilters();
    this.initViewSwitcher();
    this.initModalLogic();
    this.render();
  }

  initFilters() {
    const cinemaFilter = document.getElementById('filter-cinema');
    const dateFilter = document.getElementById('filter-date');

    cinemaFilter.addEventListener('change', (e) => {
      this.currentCinemaId = parseInt(e.target.value);
      this.render();
    });

    dateFilter.addEventListener('change', (e) => {
      this.currentDate = e.target.value;
      this.render();
    });
  }

  initViewSwitcher() {
    this.listBtn.addEventListener('click', () => {
      this.currentView = 'list';
      this.listBtn.classList.add('active');
      this.gridBtn.classList.remove('active');
      this.listViewEl.style.display = 'block';
      this.gridViewEl.style.display = 'none';
      this.render();
    });

    this.gridBtn.addEventListener('click', () => {
      this.currentView = 'grid';
      this.gridBtn.classList.add('active');
      this.listBtn.classList.remove('active');
      this.listViewEl.style.display = 'none';
      this.gridViewEl.style.display = 'block';
      this.render();
    });
  }

  initModalLogic() {
    // Populate movies
    this.movieSelect.innerHTML = mockMovies.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
    
    // Show Modal
    const btnAdd = document.getElementById('btn-add-show');
    const modalOverlay = document.getElementById('show-modal-overlay');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const btnClose = document.getElementById('btn-close-modal');

    btnAdd.addEventListener('click', () => {
      // Update Halls for currently selected cinema in filter
      const cinema = mockCinemas.find(c => c.id === this.currentCinemaId);
      this.hallSelect.innerHTML = cinema.halls.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
      
      modalOverlay.classList.add('active');
    });

    [btnCancel, btnClose].forEach(btn => btn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    }));

    // Time calculation Logic
    const updateEndTime = () => {
      const movieId = parseInt(this.movieSelect.value);
      const movie = mockMovies.find(m => m.id === movieId);
      const startTimeVal = this.startTimeInput.value;

      if (movie && startTimeVal) {
        this.displayDuration.value = movie.duration + ' phút';
        
        const start = new Date(startTimeVal);
        // EndTime = StartTime + Duration + 15 mins cleanup
        const end = new Date(start.getTime() + (movie.duration + 15) * 60000);
        
        const hours = end.getHours().toString().padStart(2, '0');
        const mins = end.getMinutes().toString().padStart(2, '0');
        this.displayEndTime.textContent = `${hours}:${mins}`;
      }
    };

    this.movieSelect.addEventListener('change', updateEndTime);
    this.startTimeInput.addEventListener('change', updateEndTime);

    this.btnSave.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Đã kiểm tra xung đột: Lịch chiếu Hợp lệ! Đã lưu thành công (Mock).');
      modalOverlay.classList.remove('active');
    });
  }

  render() {
    const filteredShows = mockShows.filter(s => 
      s.cinemaId === this.currentCinemaId && 
      s.startTime.startsWith(this.currentDate)
    );

    if (this.currentView === 'list') {
      this.renderListView(filteredShows);
    } else {
      this.renderGridView(filteredShows);
    }
  }

  renderListView(shows) {
    if (!this.tableBody) return;

    this.tableBody.innerHTML = shows.map(s => {
      const movie = mockMovies.find(m => m.id === s.movieId);
      const cinema = mockCinemas.find(c => c.id === s.cinemaId);
      const hall = cinema.halls.find(h => h.id === s.hallId);
      
      const start = new Date(s.startTime);
      const end = new Date(start.getTime() + (movie.duration + 15) * 60000);
      
      const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

      return `
        <tr>
          <td>
            <div style="font-weight:600; color:var(--color-primary)">${timeStr}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary)">${this.currentDate}</div>
          </td>
          <td>
            <div style="font-weight:600">${movie.title}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary)">${s.format} | ${movie.duration}ph</div>
          </td>
          <td>${hall.name}</td>
          <td>+${s.surcharge.toLocaleString()} ₫</td>
          <td><span class="badge active">Sẵn sàng</span></td>
          <td>
            <div class="action-btns">
               <button class="btn-icon-sub"><i data-lucide="edit-3"></i></button>
               <button class="btn-icon-sub delete"><i data-lucide="trash-2"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  renderGridView(shows) {
    if (!this.timelineContainer) return;

    const cinema = mockCinemas.find(c => c.id === this.currentCinemaId);
    
    this.timelineContainer.innerHTML = cinema.halls.map(hall => {
      const hallShows = shows.filter(s => s.hallId === hall.id);
      
      const showsHtml = hallShows.map(s => {
        const movie = mockMovies.find(m => m.id === s.movieId);
        const start = new Date(s.startTime);
        
        // Calculate position (Basic percentage based on 24h)
        const startHour = start.getHours();
        const startMin = start.getMinutes();
        const startPercent = ((startHour * 60 + startMin) / (24 * 60)) * 100;
        
        const durationPercent = ((movie.duration + 15) / (24 * 60)) * 100;

        return `
          <div class="show-block" style="left: ${startPercent}%; width: ${durationPercent}%" title="${movie.title}">
            <div style="font-weight:bold">${startHour}:${startMin.toString().padStart(2, '0')}</div>
            <div style="font-size:0.6rem; opacity:0.8">${movie.title.substring(0, 15)}...</div>
          </div>
        `;
      }).join('');

      return `
        <div class="hall-timeline">
          <div class="hall-info-mini">
            <div style="font-weight:600">${hall.name}</div>
            <div class="text-secondary" style="font-size:0.8rem">${hallShows.length} suất chiếu</div>
          </div>
          <div class="timeline-row">
            ${showsHtml}
          </div>
          <div class="time-marker-container">
            <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>23:59</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }
}
