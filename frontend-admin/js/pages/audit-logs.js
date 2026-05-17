/**
 * Audit Logs Logic
 * Fetches real system activity logs from Backend SQL Server.
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

  loadAuditLogs();
});

let currentLogs = [];

async function loadAuditLogs() {
  const tableBody = document.getElementById('audit-logs-table-body');
  if (!tableBody) return;

  try {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Đang tải dữ liệu từ SQL Server...</td></tr>';
    
    // Gọi API thật từ Backend
    const response = await api.get('/admin/audit-logs');
    currentLogs = response.data;

    renderAuditLogs(currentLogs);
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--color-primary)">Lỗi: ${error.message}. Kiểm tra kết nối Backend!</td></tr>`;
  }
}

function renderAuditLogs(logs) {
  const tableBody = document.getElementById('audit-logs-table-body');
  if (!tableBody) return;

  const getTagClass = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': case 'INSERT': return 'tag-create';
      case 'UPDATE': return 'tag-update';
      case 'DELETE': return 'tag-delete';
      case 'AUTH': case 'LOGIN': return 'tag-auth';
      default: return '';
    }
  };

  const getActionLabel = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': case 'INSERT': return 'Thêm mới';
      case 'UPDATE': return 'Cập nhật';
      case 'DELETE': return 'Xóa';
      case 'AUTH': case 'LOGIN': return 'Đăng nhập';
      default: return action;
    }
  };

  tableBody.innerHTML = logs.map(log => {
    const date = new Date(log.CreatedAt).toLocaleString('vi-VN');
    
    return `
      <tr>
        <td style="font-size: 0.85rem; color: var(--text-secondary)">${date}</td>
        <td style="font-weight: 600">${log.AccountName || 'Unknown'}</td>
        <td>
          <span class="log-type-tag ${getTagClass(log.Action)}">${getActionLabel(log.Action)}</span>
        </td>
        <td><span class="text-secondary">${log.TableName || 'N/A'}</span></td>
        <td><span class="ip-address">${log.IPAddress || '0.0.0.0'}</span></td>
        <td>
          <span class="json-snapshot" onclick="viewSnapshot(${log.LogID})">
            <i data-lucide="eye" style="width:12px; margin-right:4px; vertical-align:middle"></i>
            Snapshot
          </span>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

window.viewSnapshot = (id) => {
  const log = currentLogs.find(l => l.LogID === id);
  if (log) {
    const detail = `
[SNAPSHOT DỮ LIỆU]
Admin: ${log.AccountName}
Thao tác trên bảng: ${log.TableName}
Bản ghi ID: ${log.RecordID || 'N/A'}

Dữ liệu cũ:
${log.OldValue || 'None'}

Dữ liệu mới:
${log.NewValue || 'None'}
    `;
    alert(detail);
  }
};
 Joseph
