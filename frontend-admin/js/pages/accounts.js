/**
 * Accounts Management Logic
 * Handles user listing, status toggling, and filtering.
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

  const app = new AccountsManager();
  app.init();
});

// Mock Data
const mockUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'vana@gmail.com', role: 'ADMIN', rank: 'PLATINUM', joinedDate: '2020-01-15', status: 'ACTIVE' },
  { id: 2, name: 'Trần Thị B', email: 'thib@yahoo.com', role: 'STAFF', rank: 'GOLD', joinedDate: '2021-06-20', status: 'ACTIVE' },
  { id: 3, name: 'Lê Văn C', email: 'vanc@outlook.com', role: 'CUSTOMER', rank: 'BRONZE', joinedDate: '2023-11-02', status: 'BANNED' },
  { id: 4, name: 'Phạm Minh D', email: 'minhd@gmail.com', role: 'CUSTOMER', rank: 'SILVER', joinedDate: '2024-02-28', status: 'ACTIVE' },
  { id: 5, name: 'Hoàng Anh E', email: 'anhe@fpt.vn', role: 'CUSTOMER', rank: 'GOLD', joinedDate: '2024-03-05', status: 'ACTIVE' },
  { id: 6, name: 'Mai Linh F', email: 'linhf@gmail.com', role: 'STAFF', rank: 'SILVER', joinedDate: '2022-09-12', status: 'ACTIVE' },
  { id: 7, name: 'Vũ Quốc G', email: 'quocg@gmail.com', role: 'CUSTOMER', rank: 'PLATINUM', joinedDate: '2019-12-30', status: 'ACTIVE' }
];

class AccountsManager {
  constructor() {
    this.tableBody = document.getElementById('accounts-table-body');
    this.searchInput = document.getElementById('search-user');
    this.roleFilter = document.getElementById('filter-role');
    
    this.data = [...mockUsers];
  }

  init() {
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    this.searchInput.addEventListener('input', () => this.handleFilter());
    this.roleFilter.addEventListener('change', () => this.handleFilter());
  }

  handleFilter() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const roleTerm = this.roleFilter.value;

    this.data = mockUsers.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm);
      const matchRole = roleTerm === 'all' || u.role === roleTerm;
      return matchSearch && matchRole;
    });

    this.render();
  }

  toggleStatus(id) {
    const user = mockUsers.find(u => u.id === id);
    if (user) {
      user.status = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
      this.handleFilter(); // Re-render current view
    }
  }

  render() {
    if (!this.tableBody) return;

    this.tableBody.innerHTML = this.data.map(u => {
      const rankClass = `rank-${u.rank.toLowerCase()}`;
      const isActive = u.status === 'ACTIVE';
      
      return `
        <tr>
          <td>
            <div class="user-cell">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random" class="user-avatar" alt="${u.name}">
              <div class="user-name-wrapper">
                <span class="user-full-name">${u.name}</span>
                <span class="user-email">${u.email}</span>
              </div>
            </div>
          </td>
          <td>
             <span style="font-size:0.85rem; font-weight:500">${u.role}</span>
          </td>
          <td>
            <span class="rank-badge ${rankClass}">${u.rank}</span>
          </td>
          <td>${u.joinedDate}</td>
          <td>
            <div class="status-toggle">
              <span class="status-label" style="color: ${isActive ? 'var(--color-success)' : 'var(--color-danger)'}">
                ${isActive ? 'Hoạt động' : 'Đã khóa'}
              </span>
              <label class="switch">
                <input type="checkbox" ${isActive ? 'checked' : ''} onchange="window.accountsManager.toggleStatus(${u.id})">
                <span class="slider"></span>
              </label>
            </div>
          </td>
          <td>
            <div class="action-btns">
               <button class="btn-icon-sub" title="Chỉnh sửa"><i data-lucide="edit-3"></i></button>
               <button class="btn-icon-sub" title="Xem lịch sử đặt vé"><i data-lucide="history"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Global access for the onchange event
    window.accountsManager = this;

    if (window.lucide) lucide.createIcons();
  }
}
 Joseph
