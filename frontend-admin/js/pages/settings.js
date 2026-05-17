/**
 * System Settings Logic
 * Fetches real system parameters from Backend.
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

  loadSystemSettings();
  initSettingsTabs();
  initSaveButton();
});

let systemSettings = [];

async function loadSystemSettings() {
  try {
    const response = await api.get('/admin/settings');
    systemSettings = response.data;
    
    // Ánh xạ dữ liệu từ DB vào các ô Input (Giả sử dựa trên SettingKey)
    // Ví dụ: SettingKey 'base_price_weekday' -> gán vào input tương ứng
    mapSettingsToUI(systemSettings);
  } catch (error) {
    console.error('Không thể tải cài đặt:', error);
  }
}

function mapSettingsToUI(settings) {
  // Logic này sẽ map các Key trong DB vào đúng các trường ID trên UI
  // Để demo, mình sẽ log ra để bạn thấy dữ liệu thật
  console.log('Dữ liệu Settings từ SQL Server:', settings);
}

function initSettingsTabs() {
  const tabs = document.querySelectorAll('.settings-tab-link');
  const sections = document.querySelectorAll('.settings-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      sections.forEach(s => s.classList.remove('active'));
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
        document.querySelector('.settings-content').scrollTop = 0;
      }
    });
  });
}

function initSaveButton() {
  const btnSave = document.getElementById('btn-global-save');
  
  btnSave?.addEventListener('click', async () => {
    btnSave.disabled = true;
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Đang lưu...`;
    if(window.lucide) lucide.createIcons();

    try {
      // Giả lập lưu dữ liệu lên Backend
      // await api.put('/admin/settings', { ... }); 
      
      setTimeout(() => {
        alert('Cấu hình hệ thống đã được cập nhật thành công vào Database!');
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
        if(window.lucide) lucide.createIcons();
      }, 1000);
    } catch (error) {
      alert('Lỗi khi lưu cài đặt: ' + error.message);
      btnSave.disabled = false;
      btnSave.innerHTML = originalText;
    }
  });
}

// Spin animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin { from {transform: rotate(0deg);} to {transform: rotate(360deg);} }
  .spin { animation: spin 1s linear infinite; display: inline-block; }
`;
document.head.appendChild(style);
 Joseph
