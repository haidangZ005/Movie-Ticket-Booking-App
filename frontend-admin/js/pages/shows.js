/**
 * Shows Management Logic - API backed.
 */

document.addEventListener('DOMContentLoaded', () => {
  new Sidebar('sidebar-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebarEl.classList.toggle('show'));
  }

  const app = new ShowsManager();
  app.init();
});

class ShowsManager {
  constructor() {
    this.currentView = 'list';
    this.currentCinemaId = null;
    this.currentDate = document.getElementById('filter-date')?.value || new Date().toISOString().slice(0, 10);
    this.movies = [];
    this.cinemas = [];
    this.halls = [];
    this.shows = [];

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

  async init() {
    this.bindEvents();
    await this.loadBootstrapData();
    await this.loadShows();
  }

  getItems(payload) {
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  bindEvents() {
    document.getElementById('filter-cinema')?.addEventListener('change', async (event) => {
      this.currentCinemaId = Number(event.target.value);
      await this.loadCinemaDetail();
      await this.loadShows();
    });

    document.getElementById('filter-date')?.addEventListener('change', async (event) => {
      this.currentDate = event.target.value;
      await this.loadShows();
    });

    document.getElementById('filter-hall')?.addEventListener('change', () => this.render());

    document.getElementById('btn-reset-filters')?.addEventListener('click', async () => {
      document.getElementById('filter-date').value = '';
      this.currentDate = '';
      await this.loadShows();
    });

    this.listBtn?.addEventListener('click', () => {
      this.currentView = 'list';
      this.listBtn.classList.add('active');
      this.gridBtn.classList.remove('active');
      this.listViewEl.style.display = 'block';
      this.gridViewEl.style.display = 'none';
      this.render();
    });

    this.gridBtn?.addEventListener('click', () => {
      this.currentView = 'grid';
      this.gridBtn.classList.add('active');
      this.listBtn.classList.remove('active');
      this.listViewEl.style.display = 'none';
      this.gridViewEl.style.display = 'block';
      this.render();
    });

    this.bindModal();
  }

  async loadBootstrapData() {
    const [moviesResponse, cinemasResponse] = await Promise.all([
      api.get('/movies?limit=100'),
      api.get('/cinemas?limit=100')
    ]);

    this.movies = this.getItems(moviesResponse);
    this.cinemas = this.getItems(cinemasResponse);

    const cinemaFilter = document.getElementById('filter-cinema');
    cinemaFilter.innerHTML = this.cinemas.map(cinema =>
      `<option value="${cinema.CinemaID}">${cinema.CinemaName}</option>`
    ).join('');

    this.movieSelect.innerHTML = this.movies.map(movie =>
      `<option value="${movie.MovieID}">${movie.MovieTitle}</option>`
    ).join('');

    this.currentCinemaId = Number(cinemaFilter.value || this.cinemas[0]?.CinemaID);
    await this.loadCinemaDetail();
  }

  async loadCinemaDetail() {
    if (!this.currentCinemaId) return;
    const response = await api.get(`/cinemas/${this.currentCinemaId}`);
    this.halls = response.data?.halls || [];
    document.getElementById('filter-hall').innerHTML = [
      `<option value="all">Tất cả phòng</option>`,
      ...this.halls.map(hall => `<option value="${hall.HallID}">${hall.HallName}</option>`)
    ].join('');
    this.hallSelect.innerHTML = this.halls.map(hall =>
      `<option value="${hall.HallID}">${hall.HallName}</option>`
    ).join('');
  }

  async loadShows() {
    if (!this.currentCinemaId) return;
    this.tableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Đang tải suất chiếu...</td></tr>`;
    const query = this.currentDate ? `?showDate=${this.currentDate}` : '';
    try {
      const response = await api.get(`/cinemas/${this.currentCinemaId}/shows${query}`);
      this.shows = Array.isArray(response.data) ? response.data : [];
      this.render();
    } catch (error) {
      this.tableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Không tải được suất chiếu: ${error.message}</td></tr>`;
    }
  }

  bindModal() {
    const btnAdd = document.getElementById('btn-add-show');
    const modalOverlay = document.getElementById('show-modal-overlay');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const btnClose = document.getElementById('btn-close-modal');

    btnAdd?.addEventListener('click', () => modalOverlay.classList.add('active'));
    [btnCancel, btnClose].forEach(btn => btn?.addEventListener('click', () => modalOverlay.classList.remove('active')));

    const updateEndTime = () => {
      const movie = this.movies.find(item => item.MovieID === Number(this.movieSelect.value));
      const startTimeVal = this.startTimeInput.value;
      if (!movie || !startTimeVal) return;

      this.displayDuration.value = `${movie.MovieRuntime} phút`;
      const end = new Date(new Date(startTimeVal).getTime() + (Number(movie.MovieRuntime || 0) + 15) * 60000);
      this.displayEndTime.textContent = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    };

    this.movieSelect?.addEventListener('change', updateEndTime);
    this.startTimeInput?.addEventListener('change', updateEndTime);

    this.btnSave?.addEventListener('click', async (event) => {
      event.preventDefault();
      const start = this.startTimeInput.value ? new Date(this.startTimeInput.value) : null;
      if (!start || !this.movieSelect.value || !this.hallSelect.value) {
        alert('Vui lòng chọn phim, phòng chiếu và giờ bắt đầu.');
        return;
      }

      const payload = {
        movieId: Number(this.movieSelect.value),
        hallId: Number(this.hallSelect.value),
        showDate: this.startTimeInput.value.slice(0, 10),
        showTime: this.startTimeInput.value.slice(11, 16),
        format: '2D',
        basePrice: 75000 + Number(document.getElementById('input-surcharge')?.value || 0)
      };

      try {
        await api.post('/admin/shows', payload);
        modalOverlay.classList.remove('active');
        await this.loadShows();
      } catch (error) {
        alert(`Không lưu được suất chiếu: ${error.message}`);
      }
    });
  }

  formatTime(value) {
    if (!value) return '--:--';
    const date = new Date(value);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  render() {
    const hallFilter = document.getElementById('filter-hall')?.value || 'all';
    const shows = hallFilter === 'all'
      ? this.shows
      : this.shows.filter(show => String(show.HallID) === hallFilter);

    if (this.currentView === 'list') {
      this.renderListView(shows);
    } else {
      this.renderGridView(shows);
    }
  }

  renderListView(shows) {
    if (!this.tableBody) return;
    if (!shows.length) {
      this.tableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Không có suất chiếu phù hợp.</td></tr>`;
      return;
    }

    this.tableBody.innerHTML = shows.map(show => `
      <tr>
        <td>
          <div style="font-weight:600; color:var(--color-primary)">${this.formatTime(show.ShowTime)} - ${this.formatTime(show.EndTime)}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary)">${show.ShowDate?.slice(0, 10)}</div>
        </td>
        <td>
          <div style="font-weight:600">${show.MovieTitle}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary)">${show.Format} | ${show.MovieRuntime}ph</div>
        </td>
        <td>${show.HallName}</td>
        <td>${Number(show.BasePrice || 0).toLocaleString('vi-VN')} ₫</td>
        <td><span class="badge active">Sẵn sàng</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon-sub"><i data-lucide="edit-3"></i></button>
            <button class="btn-icon-sub delete"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  renderGridView(shows) {
    if (!this.timelineContainer) return;
    this.timelineContainer.innerHTML = this.halls.map(hall => {
      const hallShows = shows.filter(show => show.HallID === hall.HallID);
      const showsHtml = hallShows.map(show => {
        const start = new Date(show.ShowTime);
        const startPercent = ((start.getHours() * 60 + start.getMinutes()) / 1440) * 100;
        const durationPercent = ((Number(show.MovieRuntime || 120) + 15) / 1440) * 100;
        return `
          <div class="show-block" style="left: ${startPercent}%; width: ${durationPercent}%" title="${show.MovieTitle}">
            <div style="font-weight:bold">${this.formatTime(show.ShowTime)}</div>
            <div style="font-size:0.6rem; opacity:0.8">${show.MovieTitle.substring(0, 15)}...</div>
          </div>
        `;
      }).join('');

      return `
        <div class="hall-timeline">
          <div class="hall-info-mini">
            <div style="font-weight:600">${hall.HallName}</div>
            <div class="text-secondary" style="font-size:0.8rem">${hallShows.length} suất chiếu</div>
          </div>
          <div class="timeline-row">${showsHtml}</div>
          <div class="time-marker-container">
            <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>23:59</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }
}
