/**
 * Dashboard Logic - real Backend data.
 */

document.addEventListener('DOMContentLoaded', () => {
  new Sidebar('sidebar-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebarEl.classList.toggle('show'));
  }

  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const response = await api.get('/admin/stats/revenue');
    const { summary, marketShare, topMovies } = response.data || {};

    renderStatsCards(summary);
    initRevenueChart(topMovies || []);
    initOccupancyChart(marketShare || []);
  } catch (error) {
    console.error('Lỗi tải Dashboard:', error);
    renderStatsCards(null);
    initRevenueChart([]);
    initOccupancyChart([]);
  }
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' ₫';
}

function renderStatsCards(summary) {
  const statsContainer = document.getElementById('stats-container');
  if (!statsContainer) return;

  const data = summary || { totalRevenue: 0, totalTickets: 0, avgTicketValue: 0, totalAccounts: 0 };

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(data.totalRevenue),
      icon: 'dollar-sign',
      colorClass: 'primary',
      change: 'Từ booking đã xác nhận',
      isUp: true
    },
    {
      title: 'Vé bán ra',
      value: Number(data.totalTickets || 0).toLocaleString('vi-VN'),
      icon: 'ticket',
      colorClass: 'success',
      change: `${Number(data.totalBookings || 0).toLocaleString('vi-VN')} đơn`,
      isUp: true
    },
    {
      title: 'Giá trị đơn TB',
      value: formatCurrency(data.avgTicketValue),
      icon: 'activity',
      colorClass: 'info',
      change: 'Theo booking',
      isUp: true
    },
    {
      title: 'Tài khoản hoạt động',
      value: Number(data.totalAccounts || 0).toLocaleString('vi-VN'),
      icon: 'users',
      colorClass: 'warning',
      change: `${Number(data.activeMovies || 0)} phim`,
      isUp: true
    }
  ];

  statsContainer.innerHTML = stats.map(stat => `
    <div class="stat-card">
      <div class="stat-header">
        <div>
          <h3 class="stat-title">${stat.title}</h3>
          <div class="stat-value">${stat.value}</div>
        </div>
        <div class="stat-icon ${stat.colorClass}">
          <i data-lucide="${stat.icon}"></i>
        </div>
      </div>
      <div class="stat-change ${stat.isUp ? 'up' : 'down'}">
        <i data-lucide="${stat.isUp ? 'trending-up' : 'trending-down'}"></i>
        <span>${stat.change}</span>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function initRevenueChart(topMovies) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const labels = topMovies.length ? topMovies.map(item => item.MovieTitle) : ['Chưa có dữ liệu'];
  const data = topMovies.length ? topMovies.map(item => item.ticketCount) : [0];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Vé đã bán',
        data,
        backgroundColor: '#E50914',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#333333' }, beginAtZero: true },
        x: { grid: { display: false } }
      }
    }
  });
}

function initOccupancyChart(marketShare) {
  const ctx = document.getElementById('occupancyChart');
  if (!ctx) return;

  const labels = marketShare.length ? marketShare.map(item => item.CinemaName) : ['Chưa có dữ liệu'];
  const data = marketShare.length ? marketShare.map(item => Number(item.revenue || 0)) : [1];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#E50914', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: { legend: { position: 'bottom' } }
    }
  });
}
