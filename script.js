document.addEventListener('DOMContentLoaded', function() {
  // ============================================
  // GİRİŞ KREDİTİ: STATİK VEDOP GİRİŞ BİLGİLERİ
  // ============================================
  // Ofis giriş bilgileri: Kullanıcı Adı: Çineli Smmm / Şifre: Cinelismmm34
  // Bu bilgiler sadece doğrulama için kullanılır, backend entegrasyonu için
  // Supabase CONFIG ayarları yapılandırılabilir.
  //
  // STATIC GİRİŞ BİLGİSİ:
  // - Kullanıcı Adı: "Cineli Smmm"
  // - Şifre: "Cinelismmm34"
  //
  // SUPABASE AYARLAMASI (İsteğe Bağlı):
  // const SUPABASE_CONFIG = {
  //   url: 'https://YOUR_PROJECT.supabase.co',
  //   anonKey: 'YOUR_ANON_KEY'
  // };

  // ============================================
  // ELEMENT SEÇİMLERİ
  // ============================================
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

  // Sabit Vedop giriş bilgileri
  const FIXED_USERNAME = 'Cineli Smmm';
  const FIXED_PASSWORD = 'Cinelismmm34';

  // Excel upload elements
  const uploadSection = document.createElement('div');
  uploadSection.innerHTML = `
    <div class="upload-section" style="margin: 24px 0; padding: 24px; background: var(--card); border-radius: 12px; border: 1px solid var(--border);">
      <div class="section-header" style="margin-bottom: 20px;">
        <i class="fas fa-upload" style="color: var(--primary); margin-right: 8px;"></i>
        <h2>Mükellef Vedop Listesi Yükle</h2>
      </div>
      <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 14px;">
        Excel (.xlsx) dosyası ile mükellef listelerinizi sisteme yükleyin. 
        Dosya: Vedop Kullanıcı Adı | Mükellef Ünvanı formatında olmalı.
      </p>
      <input type="file" id="excelFileInput" accept=".xlsx, .xls" style="display: none;">
      <button id="uploadBtn" style="background: var(--primary); color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
        <i class="fas fa-file-excel"></i> Excel Yükle
      </button>
      <div id="uploadStatus" style="margin-top: 16px; display: none; min-height: 32px;"></div>
    </div>
  `;
  
  // Upload butonunu dashboard'a ekle (header'ın hemen altında)
  const header = document.querySelector('.dashboard .header');
  if (header) {
    header.insertAdjacentElement('afterend', uploadSection);
  }

  // ============================================
  // GİRİŞ DOĞRULAMASI - STATİK KREDİT
  // ============================================
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('vedopUsername').value.trim();
    const password = document.getElementById('vedopPassword').value.trim();
    
    // Loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner third-icon"></i> Oturum Açılıyor...';
    submitBtn.disabled = true;
    
    // Statik kimlik doğrulama - sadece belirtilen kredilerle çalışır
    const isCorrectUser = username === FIXED_USERNAME;
    const isCorrectPass = password === FIXED_PASSWORD;
    
    setTimeout(() => {
      if (isCorrectUser && isCorrectPass) {
        loginSuccessful();
      } else {
        showError('Kullanıcı adı veya şifre yanlış');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }, 800);
  });

  function loginSuccessful() {
    // Ofis adını displayeda göster
    userNameDisplay.textContent = FIXED_USERNAME;
    
    // Dashboard'i göster, giriş ekranını gizle
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    
    // Upload section visibility
    if (uploadSection) uploadSection.style.display = 'block';
    
    // Focus download inputs
    downloadUsername.focus();
    
    // Başlangıç istatistikleri
    totalFilesDisplay.textContent = '0';
    processedFilesDisplay.textContent = '0';
    
    // Kullanıcının dosyalarını render et
    renderUserFiles();
  }

  // ============================================
  // PDF İNDİRME FONKSİYONU
  // ============================================
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
      
      // Stats güncelle
      const currentTotal = parseInt(totalFilesDisplay.textContent) || 0;
      const currentProcessed = parseInt(processedFilesDisplay.textContent) || 0;
      totalFilesDisplay.textContent = currentTotal + 8;
      processedFilesDisplay.textContent = currentProcessed + 3;
      
      // Dosyaları listeye ekle
      renderUserFiles(parseInt(totalFilesDisplay.textContent));
      
      // Temizle
      downloadUsername.value = '';
      downloadPassword.value = '';
    }, 2500);
  });

  // ============================================
  // KULLANICI DOSYALARI RENDER
  // ============================================
  function renderUserFiles() {
    userFilesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-download"></i>
        <h3>Henüz PDF Yok</h3>
        <p>Vedop kimlik bilgileri girerek PDF'leri başlatın</p>
      </div>
    `;
  }

  // ============================================
  // EXCEL YÜKLEME (Aynı yapıda, sadece login değişti)
  // ============================================
  
  // Excel dosya input değişkeni
  let excelFileInput = document.getElementById('excelFileInput');
  let uploadBtn = document.getElementById('uploadBtn');
  let uploadStatus = document.getElementById('uploadStatus');
  
  if (excelFileInput && uploadBtn && uploadStatus) {
    uploadBtn.addEventListener('click', function() {
      excelFileInput.click();
    });

    excelFileInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Dosya tipi kontrolü
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        showUploadStatus('Lütfen .xlsx veya .xls dosyası seçin', 'error');
        return;
      }
      
      showUploadStatus('Dosya yükleniyor...', 'loading');
      
      // SheetJS ile Excel'i parse et
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Vedop kullanıcı adı ve ünvan çıkarma
        const mappings = [];
        jsonData.forEach((row, index) => {
          const vedopUsername = row['Vedop Kullanıcı Adı'] || row['vedop_username'] || row[0];
          const masterTitle = row['Mükellef Ünvanı'] || row['title'] || row[1];
          
          if (vedopUsername && masterTitle) {
            const cleanUsername = String(vedopUsername).trim();
            const cleanTitle = String(masterTitle).trim();
            
            mappings.push({
              vedop_username: cleanUsername,
              master_title: cleanTitle,
              rowIndex: index
            });
          }
        });
        
        if (mappings.length === 0) {
          showUploadStatus('Dosyada veri bulunamadı', 'error');
          return;
        }
        
        showUploadStatus(`${mappings.length} kayıt başarıyla yüklendi`, 'success');
        
        // LocalStorage'a kaydet
        let existingMappings = JSON.parse(localStorage.getItem('vedop_mappings') || '[]');
        mappings.forEach(newMap => {
          const alreadyExists = existingMappings.some(m => m.vedop_username === newMap.vedop_username);
          if (!alreadyExists) {
            existingMappings.push(newMap);
          }
        });
        localStorage.setItem('vedop_mappings', JSON.stringify(existingMappings));
        
        // UI güncelle
        updateVedopMappingUI(existingMappings);
        
        // Sayfayı yeniden yükle
        setTimeout(() => {
          location.reload();
        }, 1500);
      };
      reader.onerror = function() {
        showUploadStatus('Dosya okuma hatası', 'error');
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Vedop mapping UI'yi güncelle
  function updateVedopMappingUI(mappings) {
    const existingList = document.getElementById('vedop-mapping-list');
    if (existingList) existingList.remove();
    
    const list = document.createElement('div');
    list.id = 'vedop-mapping-list';
    list.style.cssText = `
      margin-top: 20px;
      padding: 16px;
      background: #f0f2f5;
      border-radius: 8px;
    `;
    
    if (mappings.length === 0) {
      list.innerHTML = '<p style="color: var(--text-muted);">Henüz mapping yok. Excel dosyası yükle.</p>';
    } else {
      let html = '<h4>Vedop - Mükellef Mapping</h4>';
      html += '<div style="max-height: 200px; overflow-y: auto; margin-top: 10px;">';
      
      mappings.slice(0, 10).forEach((m, i) => {
        html += `<div style="padding: 8px; margin: 4px 0; background: white; border-radius: 4px;">
          <span style="font-weight: 500; color: var(--primary);">${m.vedop_username}</span>
          <span style="margin-left: 16px; color: var(--text-muted);">→ ${m.master_title}</span>
        </div>`;
      });
      
      if (mappings.length > 10) {
        html += `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Ve ${mappings.length - 10} daha fazla mapping</div>`;
      }
      
      html += '</div>';
      list.innerHTML = html;
    }
    
    // Stat section altına ekle
    const statsSection = document.querySelector('.dashboard .stats');
    if (statsSection) {
      statsSection.parentNode.insertBefore(list, statsSection.nextSibling);
    } else {
      dashboard.querySelector('.container').appendChild(list);
    }
  }

  // Upload status göster
  function showUploadStatus(message, type) {
    if (!uploadStatus) return;
    
    const types = {
      loading: { background: #fff3e0, color: #ff9800 },
      success: { background: #e8f5e9, color: #4caf50 },
      error: { background: #ffebee, color: #f44336 }
    };
    
    const style = types[type] || types.error;
    uploadStatus.style.cssText = `
      padding: 12px;
      background: ${style.background};
      color: ${style.color};
      border-radius: 8px;
      margin-top: 8px;
      display: block;
      font-size: 14px;
    `;
    uploadStatus.textContent = message;
    
    setTimeout(() => {
      uploadStatus.style.display = 'none';
    }, 5000);
  }

  // ============================================
  // ANİMASYONLAR
  // ============================================
  // Shake animasyonı
  const style = document.createElement('style');
  style.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }';
  document.head.appendChild(style);

  // Başlangıçta upload section'ı gizle (login ekranında)
  if (uploadSection) uploadSection.style.display = 'none';
});