document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const dashboard = document.getElementById('dashboard');
  const loginScreen = document.querySelector('.login-screen');
  const userNameDisplay = document.getElementById('userName');
  const totalFilesDisplay = document.getElementById('totalFiles');
  const processedFilesDisplay = document.getElementById('processedFiles');
  const userFilesContainer = document.getElementById('userFiles');
  const startDownloadBtn = document.getElementById('startDownloadBtn');
  const downloadUsername = document.getElementById('downloadUsername');
  const downloadPassword = document.getElementById('downloadPassword');

  // Gerçek projede: /api/login endpoint'i ile Vedop API entegrasyonu
  // Demo modu: Geçerli Vedop kimlik bilgileri ile oturum açma simülasyonu
  const DEMO_USERNAMES = ['39605069', 'kullanici1', 'kullanici2', 'kullanici3', 'kullanici4', 'kullanici5'];

  // Login form handling - Vedop kimlik doğrulaması simülasyonu
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('vedopUsername').value.trim();
    const password = document.getElementById('vedopPassword').value.trim();
    
    // Demo modu: Vedop kullanıcı adı kontrolü
    // Gerçek projede bu /api/login POST isteği olur
    const isValidVedopUser = DEMO_USERNAMES.includes(username);
    
    setTimeout(() => {
      if (isValidVedopUser && password.length >= 4) {
        loginSuccessful(username);
      } else {
        showError('Kullanıcı adı veya şifre yanlış');
      }
    }, 800);
  });

  function loginSuccessful(username) {
    // Kullanıcı adını displayeda göster
    userNameDisplay.textContent = username;
    
    // Varsayılan istatistikler (gerçek veri backend'den gelir)
    totalFilesDisplay.textContent = '0';
    processedFilesDisplay.textContent = '0';
    
    // Dashboard'i göster, giriş ekranını gizle
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    
    // Download input'larına fokus
    downloadUsername.focus();
    
    // Kullanıcının dosyalarını render et (sadece kullanıcı adını göster)
    renderUserFiles(username, 0);
  }

  function renderUserFiles(username, fileCount) {
    if (fileCount === 0) {
      userFilesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-download"></i>
          <h3>Henüz PDF Yok</h3>
          <p>Vedop kimlik bilgileri girerek PDF'leri başlatın</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    // Kullanıcının Vedop IDine göre örnek dosya listesi
    const maxFiles = Math.min(fileCount || 0, 10);
    
    for (let i = 1; i <= maxFiles; i++) {
      html += `
        <div class="file-item">
          <div class="file-icon"><i class="fas fa-file-pdf"></i></div>
          <div class="file-info">
            <span class="file-name">E-Arşiv ${i} - ${username}</span>
            <span class="file-status">İşleniyor</span>
          </div>
          <div class="file-download">
            <a href="#" class="download-link" data-file="${i}" target="_blank">
              <i class="fas fa-download"></i> İndir
            </a>
            <span class="progress-bar">
              <div class="progress-fill" style="width: ${i * 10}%"></div>
            </span>
          </div>
        </div>
      `;
    }
    
    if (fileCount > 10) {
      html += `
        <div class="file-item">
          <div class="file-icon"></div>
          <div class="file-info">
            <span class="file-name">Ve ${fileCount - 10} daha fazla dosya</span>
            <span class="file-status">Bekliyor</span>
          </div>
        </div>
      `;
    }
    
    userFilesContainer.innerHTML = html;
    
    // Download link'lerine event listener ekle
    attachDownloadListeners();
  }

  function attachDownloadListeners() {
    const links = document.querySelectorAll('.download-link');
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const fileNum = this.getAttribute('data-file');
        downloadSingleFile(fileNum);
      });
    });
  }

  async function downloadSingleFile(fileNum) {
    showLoading('Dosya hazırlanıyor...');
    
    setTimeout(() => {
      hideLoading();
      alert(`${fileNum}. PDF başarıyla indirildi.`);
    }, 1500);
  }

  function showLoading(message) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="spinner"></div>
      <span>${message}</span>
    `;
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--card);
      border-radius: 16px;
      padding: 30px;
      text-align: center;
      color: var(--text);
      z-index: 1001;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function hideLoading(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background: #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 12px;
      border: 1px solid #fecaca;
      text-align: center;
      font-size: 14px;
      animation: shake 0.5s ease;
    `;
    errorDiv.textContent = message;
    
    const form = document.getElementById('loginForm');
    form.insertBefore(errorDiv, form.firstElementChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
  }

  // Animasyon shake
  const style = document.createElement('style');
  style.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }';
  document.head.appendChild(style);

  // Start download functionality
  startDownloadBtn.addEventListener('click', function() {
    const username = downloadUsername.value.trim();
    const password = downloadPassword.value.trim();
    
    if (!username || !password) {
      alert('Lüthem hem kullanıcı ad hem de şifreyi girin');
      return;
    }
    
    startDownloadBtn.disabled = true;
    startDownloadBtn.innerHTML = '<i class="fas fa-spinner third-icon"></i> İşleniyor...';
    
    setTimeout(() => {
      startDownloadBtn.disabled = false;
      startDownloadBtn.innerHTML = '<i class="fas fa-download"></i> Toplu PDF İndir';
      
      alert(`${username} için PDF'ler başarıyla işlendi. ${Math.floor(Math.random() * 100) + 1} dosya arşivlendi.`);
      
      const currentTotal = parseInt(totalFilesDisplay.textContent);
      const currentProcessed = parseInt(processedFilesDisplay.textContent);
      totalFilesDisplay.textContent = (currentTotal || 0) + 8;
      processedFilesDisplay.textContent = (currentProcessed || 0) + 3;
      
      renderUserFiles(username, parseInt(totalFilesDisplay.textContent));
      
      downloadUsername.value = '';
      downloadPassword.value = '';
    }, 2500);
  });
});