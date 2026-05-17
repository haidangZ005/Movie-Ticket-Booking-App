/**
 * Vouchers Logic.
 * Backend voucher endpoints are not implemented yet, so this page deliberately
 * shows an unavailable state instead of fake campaign data.
 */

document.addEventListener('DOMContentLoaded', () => {
  new Sidebar('sidebar-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar-container');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebarEl.classList.toggle('show'));
  }

  bindVoucherEvents();
  renderUnavailableState();
});

function renderUnavailableState() {
  const container = document.getElementById('vouchers-grid-container');
  if (!container) return;

  container.innerHTML = `
    <div class="voucher-card" style="grid-column: 1 / -1;">
      <div class="voucher-right">
        <div class="voucher-header">
          <span class="voucher-code">API REQUIRED</span>
          <span class="status-badge draft">Chưa triển khai</span>
        </div>
        <h3 class="voucher-title">Chưa có API khuyến mãi</h3>
        <p class="voucher-desc">
          Trang này đã bỏ dữ liệu mock. Cần backend routes như GET/POST /api/admin/vouchers
          trước khi quản trị voucher thật.
        </p>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
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
    btnSave.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Chưa thể lưu voucher vì backend /api/admin/vouchers chưa được triển khai.');
      closeModal();
    });
  }

  modalOverlay?.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });
}
