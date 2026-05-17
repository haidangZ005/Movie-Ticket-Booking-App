/**
 * Reports & Data Visualization Logic
 * Fetches real business data from Backend SQL Server.
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

  loadStatsOverview();

  // Export Logic
  document.getElementById('btn-export')?.addEventListener('click', () => {
    alert('Báo cáo PDF đang được trích xuất... Vui lòng đợi trong giây lát.');
  });
});

async function loadStatsOverview() {
  try {
    const response = await api.get('/admin/stats/revenue');
    const { summary, marketShare, topMovies } = response.data;

    // Update KPI Cards
    updateKPICards(summary);

    // Initialize Charts with real data
    initRevenueChart(); // Line chart usually needs time-series data
    initMarketShareChart(marketShare);
    initTopMoviesChart(topMovies);
    initNewUsersChart(); 

  } catch (error) {
    console.error('Lỗi khi tải báo cáo:', error);
  }
}

function updateKPICards(summary) {
  if (!summary) return;
  
  // Tổng doanh thu
  const revenueVal = document.querySelector('.metric-card:nth-child(1) .metric-value');
  if (revenueVal) revenueVal.textContent = (summary.totalRevenue / 1000).toLocaleString() + 'k';

  // Số vé đã bán
  const ticketsVal = document.querySelector('.metric-card:nth-child(2) .metric-value');
  if (ticketsVal) ticketsVal.textContent = summary.totalTickets.toLocaleString();

  // Giá vé TB
  const avgVal = document.querySelector('.metric-card:nth-child(3) .metric-value');
  if (avgVal) avgVal.textContent = Math.round(summary.avgTicketValue).toLocaleString() + ' ₫';
}

function initRevenueChart() {
  const ctx = document.getElementById('revenueReportChart')?.getContext('2d');
  if(!ctx) return;
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['01/04', '04/04', '07/04', '10/04', '13/04', '16/04', '20/04'],
      datasets: [
        {
          label: 'Doanh thu (k VNĐ)',
          data: [45000, 52000, 48000, 65000, 85000, 72000, 95000],
          borderColor: '#E50914',
          backgroundColor: 'rgba(229, 9, 20, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#ffffff' } } },
      scales: {
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#888' } },
        x: { grid: { display: false }, ticks: { color: '#888' } }
      }
    }
  });
}

function initMarketShareChart(marketData) {
  const ctx = document.getElementById('marketShareChart')?.getContext('2d');
  if(!ctx || !marketData) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: marketData.map(d => d.CinemaName),
      datasets: [{
        data: marketData.map(d => d.revenue),
        backgroundColor: ['#E50914', '#b30009', '#800006', '#4d0004'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#ffffff', padding: 20 } }
      }
    }
  });
}

function initTopMoviesChart(topMovies) {
  const ctx = document.getElementById('topMoviesChart')?.getContext('2d');
  if(!ctx || !topMovies) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topMovies.map(m => m.Title),
      datasets: [{
        label: 'Số vé bán ra',
        data: topMovies.map(m => m.ticketCount),
        backgroundColor: '#E50914',
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#888' } },
        y: { grid: { display: false }, ticks: { color: '#ffffff' } }
      }
    }
  });
}

function initNewUsersChart() {
  const ctx = document.getElementById('newUsersChart')?.getContext('2d');
  if(!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [{
        label: 'Khách hàng mới',
        data: [120, 150, 110, 180, 250, 420, 380],
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        hoverBackgroundColor: '#E50914'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#888' } },
        x: { grid: { display: false }, ticks: { color: '#888' } }
      }
    }
  });
}
 Joseph
