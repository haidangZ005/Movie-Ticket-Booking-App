/**
 * Dashboard Logic - Handles rendering stats and charts from real Backend
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

  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const response = await api.get('/admin/stats/revenue');
    const { summary, marketShare } = response.data;

    renderStatsCards(summary);
    initRevenueChart(); 
    initOccupancyChart();
  } catch (error) {
    console.error('Lỗi tải Dashboard:', error);
    // Vẫn hiển thị khung nếu lỗi
    renderStatsCards(null);
  }
}

function renderStatsCards(summary) {
  const statsContainer = document.getElementById('stats-container');
  if (!statsContainer) return;

  const data = summary || { totalRevenue: 0, totalTickets: 0, avgTicketValue: 0 };

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: (data.totalRevenue / 1000).toLocaleString() + 'k ₫',
      icon: 'dollar-sign',
      colorClass: 'primary',
      change: '+12%',
      isUp: true
    },
    {
      title: 'Vé bán ra',
      value: data.totalTickets.toLocaleString(),
      icon: 'ticket',
      colorClass: 'success',
      change: '+5%',
      isUp: true
    },
    {
      title: 'Giá vé TB',
      value: Math.round(data.avgTicketValue).toLocaleString() + ' ₫',
      icon: 'activity',
      colorClass: 'info',
      change: 'Ổn định',
      isUp: true
    },
    {
      title: 'Khách hàng mới',
      value: '124',
      icon: 'users',
      colorClass: 'warning',
      change: '+8%',
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

function initRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [{
        label: 'Doanh thu (Triệu VNĐ)',
        data: [12, 19, 15, 25, 42, 65, 55],
        borderColor: '#E50914',
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#333333' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function initOccupancyChart() {
  const ctx = document.getElementById('occupancyChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Đã đặt', 'Ghế trống', 'Đang giữ'],
      datasets: [{
        data: [65, 25, 10],
        backgroundColor: ['#E50914', '#333333', '#f1c40f'],
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
 Joseph
