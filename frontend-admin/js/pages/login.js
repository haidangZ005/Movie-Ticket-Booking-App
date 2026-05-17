/**
 * Login Logic
 * Handles Authentication with Backend
 */

document.addEventListener('DOMContentLoaded', () => {
  // Nếu đã đăng nhập rồi thì đá thẳng vào Dashboard
  const token = localStorage.getItem('admin_token');
  if (token) {
    window.location.href = 'index.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const errorAlert = document.getElementById('error-alert');
  const btnSubmit = document.getElementById('btn-submit');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Ngăn chặn load lại trang
    
    // Hide old errors
    errorAlert.style.display = 'none';
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      showError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    // Loading state
    btnSubmit.disabled = true;
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Đang đăng nhập...`;
    if(window.lucide) lucide.createIcons();

    try {
      // Gọi API Login
      const response = await api.post('/auth/login', { username, password });
      
      if (response.success && response.data.token) {
        // 1. Lưu token vào kho bộ nhớ cục bộ
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.user)); // Lưu info
        
        // 2. Chuyển hướng sang trang Dashboard
        window.location.href = 'index.html';
      } else {
        showError(response.message || 'Lỗi đăng nhập không xác định');
      }
    } catch (error) {
      showError(error.message || 'Máy chủ không phản hồi. Vui lòng thử lại sau.');
    } finally {
      // Reset button
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
      if(window.lucide) lucide.createIcons();
    }
  });

  function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.style.display = 'block';
  }
});
