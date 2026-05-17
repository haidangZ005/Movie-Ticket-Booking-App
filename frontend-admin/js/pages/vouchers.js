/**
 * Vouchers Logic - Handles Grid Rendering & UI state.
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

  bindVoucherEvents();
  renderVouchers();
});

const mockVouchers = [
  {
    id: 1,
    code: 'WELCOME2026',
    title: 'Mừng Bạn Mới Tới CineAdmin',
    description: 'Giảm 50% tối đa 50k cho đơn vé đầu tiên của tài khoản mới',
    discountType: 'PERCENT',
    discountValue: 50,
    validUntil: '31/12/2026',
    status: 'ACTIVE'
  },
  {
    id: 2,
    code: 'DEADPIC50K',
    title: 'Giảm giá Deadpool 3',
    description: 'Giảm trực tiếp 50K khi mua từ 2 vé Deadpool & Wolverine',
    discountType: 'FIXED',
    discountValue: 50000,
    validUntil: '15/05/2026',
    status: 'ACTIVE'
  },
  {
    id: 3,
    code: 'QUOCTEPHUNU',
    title: 'Happy Women Day 8/3',
    description: 'Cơ hội tặng free 1 vé cho khách hàng nữ',
    discountType: 'PERCENT',
    discountValue: 100,
    validUntil: '10/03/2026',
    status: 'EXPIRED'
  },
  {
    id: 4,
    code: 'SUMMERVIBE',
    title: 'Đón Hè Cực Cháy (Bản nháp)',
    description: 'Kịch bản giảm 20% cho thành viên Member (chờ duyệt)',
    discountType: 'PERCENT',
    discountValue: 20,
    validUntil: '30/08/2026',
    status: 'DRAFT'
  }
];

function renderVouchers() {
  const container = document.getElementById('vouchers-grid-container');
  if (!container) return;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'ACTIVE': return `<span class="status-badge active">Đang áp dụng</span>`;
      case 'EXPIRED': return `<span class="status-badge expired">Đã hết hạn</span>`;
      case 'DRAFT': return `<span class="status-badge draft">Bản nháp</span>`;
      default: return `<span class="status-badge draft">Chưa rõ</span>`;
    }
  };

  const formatDiscountInfo = (type, value) => {
    if(type === 'PERCENT') return `<div class="voucher-discount-value">${value}%</div><div class="voucher-discount-type">Giảm</div>`;
    return `<div class="voucher-discount-value">${(value/1000)}k</div><div class="voucher-discount-type">Giảm</div>`;
  };

  const html = mockVouchers.map(v => `
    <div class="voucher-card">
      
      <div class="voucher-left">
        ${formatDiscountInfo(v.discountType, v.discountValue)}
      </div>
      
      <div class="voucher-right">
        <!-- Nút Quick Actions ẩn hiện khi hover -->
        <div class="voucher-actions">
          <button title="Sửa Voucher" onclick="alert('Mở form sửa Voucher')"><i data-lucide="edit-3"></i></button>
          <button title="Xóa" class="delete" onclick="alert('Đã xóa')"><i data-lucide="trash-2"></i></button>
        </div>

        <div class="voucher-header">
          <span class="voucher-code">${v.code}</span>
          ${getStatusBadge(v.status)}
        </div>
        <h3 class="voucher-title">${v.title}</h3>
        <p class="voucher-desc">${v.description}</p>
        
        <div class="voucher-footer">
          <span><i data-lucide="clock" style="width:12px; margin-right:4px;"></i> HSD: ${v.validUntil}</span>
          <span><i data-lucide="users" style="width:12px; margin-right:4px;"></i> FEFO System</span>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
  
  if (window.lucide) {
    lucide.createIcons();
  }
}

function bindVoucherEvents() {
  const modalOverlay = document.getElementById('voucher-modal-overlay');
  const btnAdd = document.getElementById('btn-add-voucher');
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const btnSave = document.getElementById('btn-save-voucher');
  const form = document.getElementById('voucher-form');

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    form.reset(); 
  };

  if (btnAdd) btnAdd.addEventListener('click', () => modalOverlay.classList.add('active'));
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  
  if (btnSave) {
    btnSave.addEventListener('click', (e) => {
      e.preventDefault(); 
      alert('Mock: Lưu voucher thành công! (Sẽ gọi POST /admin/vouchers)');
      closeModal();
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}
