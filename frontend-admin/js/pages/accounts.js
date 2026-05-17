/**
 * Accounts Management Logic - API backed.
 */

document.addEventListener('DOMContentLoaded', () => {
  new Sidebar('sidebar-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebarEl.classList.toggle('show'));
  }

  const app = new AccountsManager();
  app.init();
});

class AccountsManager {
  constructor() {
    this.tableBody = document.getElementById('accounts-table-body');
    this.searchInput = document.getElementById('search-user');
    this.roleFilter = document.getElementById('filter-role');
    this.allData = [];
    this.data = [];
  }

  async init() {
    this.bindEvents();
    await this.load();
    window.accountsManager = this;
  }

  bindEvents() {
    this.searchInput?.addEventListener('input', () => this.handleFilter());
    this.roleFilter?.addEventListener('change', () => this.handleFilter());
  }

  normalize(account) {
    return {
      id: account.AccountID,
      name: account.FullName || account.Email?.split('@')[0] || 'Người dùng',
      email: account.Email || '',
      role: account.AccountType || 'CUSTOMER',
      rank: Number(account.LoyaltyPoints || 0) >= 1000 ? 'GOLD' : 'STANDARD',
      joinedDate: account.CreatedAt ? account.CreatedAt.slice(0, 10) : 'Đang cập nhật',
      status: account.IsActive ? 'ACTIVE' : 'BANNED'
    };
  }

  async load() {
    if (this.tableBody) {
      this.tableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Đang tải tài khoản...</td></tr>`;
    }

    try {
      const response = await api.get('/admin/accounts');
      this.allData = Array.isArray(response.data) ? response.data.map(this.normalize) : [];
      this.data = [...this.allData];
      this.render();
    } catch (error) {
      if (this.tableBody) {
        this.tableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Không tải được tài khoản: ${error.message}</td></tr>`;
      }
    }
  }

  handleFilter() {
    const searchTerm = (this.searchInput?.value || '').toLowerCase();
    const roleTerm = this.roleFilter?.value || 'all';

    this.data = this.allData.filter(user => {
      const matchSearch = user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm);
      const matchRole = roleTerm === 'all' || user.role === roleTerm;
      return matchSearch && matchRole;
    });

    this.render();
  }

  async toggleStatus(id) {
    const user = this.allData.find(item => item.id === id);
    if (!user) return;

    const nextActive = user.status !== 'ACTIVE';
    try {
      await api.put(`/admin/accounts/${id}/status`, { isActive: nextActive });
      user.status = nextActive ? 'ACTIVE' : 'BANNED';
      this.handleFilter();
    } catch (error) {
      alert(`Không cập nhật được trạng thái: ${error.message}`);
      this.render();
    }
  }

  render() {
    if (!this.tableBody) return;

    if (!this.data.length) {
      this.tableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Không có tài khoản phù hợp.</td></tr>`;
      return;
    }

    this.tableBody.innerHTML = this.data.map(user => {
      const rankClass = `rank-${user.rank.toLowerCase()}`;
      const isActive = user.status === 'ACTIVE';

      return `
        <tr>
          <td>
            <div class="user-cell">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" class="user-avatar" alt="${user.name}">
              <div class="user-name-wrapper">
                <span class="user-full-name">${user.name}</span>
                <span class="user-email">${user.email}</span>
              </div>
            </div>
          </td>
          <td><span style="font-size:0.85rem; font-weight:500">${user.role}</span></td>
          <td><span class="rank-badge ${rankClass}">${user.rank}</span></td>
          <td>${user.joinedDate}</td>
          <td>
            <div class="status-toggle">
              <span class="status-label" style="color: ${isActive ? 'var(--color-success)' : 'var(--color-danger)'}">
                ${isActive ? 'Hoạt động' : 'Đã khóa'}
              </span>
              <label class="switch">
                <input type="checkbox" ${isActive ? 'checked' : ''} onchange="window.accountsManager.toggleStatus(${user.id})">
                <span class="slider"></span>
              </label>
            </div>
          </td>
          <td>
            <div class="action-btns">
              <button class="btn-icon-sub" title="Xem lịch sử đặt vé"><i data-lucide="history"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }
}
