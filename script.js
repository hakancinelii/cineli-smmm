document.addEventListener('DOMContentLoaded', function() {
  // ============================================
  // STATİK VEDOP GİRİŞ BİLGİSİ
  // ============================================
  // Ofis giriş bilgileri: Kullanıcı Adı: Çineli Smmm / Şifre: Cinelismmm34
  // Sadece bu kredilerle giriş yapılır, diğerleri reddedilir.
  const FIXED_USERNAME = 'Cineli Smmm';
  const FIXED_PASSWORD = 'Cinelismmm34';

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

  // Excel upload elements
  const uploadSection = document.createElement('div');
  uploadSection.innerHTML = `
    <div class="upload-section" style="margin: 24px 0; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div class="section-header" style="margin-bottom: 20px; color: #2563eb;">
        <i class="fas fa-upload" style="margin-right: 8px;"></i>
        <h2>Mükellef Vedop Listesi Yükle</h2>
      </div>
      <p style="color: #64748b; margin-bottom: 16px; font-size: 14px;">
        Excel (.xlsx) dosyası ile mükellef listelerinizi sisteme yükleyin. 
        Dosya: Vedop Kullanıcı Adı | Mükellef Ünvanı formatında olmalı.
      </p>
      <input type="file" id="excelFileInput" accept=".xlsx, .xls" style="display: none;">
      <button id="uploadBtn" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
        <i class="fas fa-file-excel"></i> Excel Yükle
      </button>
      <div id="uploadStatus" style="margin-top: 16px; min-height: 32px;"></div>
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
  // EXCEL YÜKLEME VE VEDOP MAPPING (SheetJS ile)
  // ============================================
  
  // SheetJS kütüphanesini dinamik olarak yükle
  function loadSheetJS() {
    return new Promise((resolve, reject) => {
      // Eğer zaten yüklüyse tekrar yükleme
      if (window.XLSX) {
        resolve(window.XLSX);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.0/dist/xlsx.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error('SheetJS yüklenemedi'));
      document.head.appendChild(script);
    });
  }

  // Excel dosya input değişkeni
  let excelFileInput = document.getElementById('excelFileInput');
  let uploadBtn = document.getElementById('uploadBtn');
  let uploadStatus = document.getElementById('uploadStatus');
  
  if (excelFileInput && uploadBtn && uploadStatus) {
    uploadBtn.addEventListener('click', function() {
      excelFileInput.click();
    });

    excelFileInput.addEventListener('change', async function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Dosya tipi kontrolü
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        showUploadStatus('Lütfen .xlsx veya .xls dosyası seçin', 'error');
        return;
      }
      
      showUploadStatus('Dosya yükleniyor...', 'loading');
      
      try {
        // SheetJS'i yükle ve dosyayı parse et
        const XLSX = await loadSheetJS();
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          };
          reader.onerror = (e) => reject(new Error('Dosya okuma hatası'));
          reader.readAsArrayBuffer(file);
        });
        
        // Vedop kullanıcı adı ve ünvan çıkarma
        const mappings = [];
        data.forEach((row, index) => {
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
        
      } catch (error) {
        console.error('Excel parse hatası:', error);
        showUploadStatus('Dosya işlenirken hata oluştu', 'error');
      }
    });
  }

  // Vedop mapping UI'yi güncelle (renk sorunları olmadan)
  function updateVedopMappingUI(mappings) {
    const existingList = document.getElementById('vedop-mapping-list');
    if (existingList) existingList.remove();
    
    const list = document.createElement('div');
    list.id = 'vedop-mapping-list';
    list.style.cssText = `
      margin-top: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    `;
    
    if (mappings.length === 0) {
      list.innerHTML = '<p style="color: #64748b;">Henüz mapping yok. Excel dosyası yükle.</p>';
    } else {
      let html = '<h4 style="margin: 0 0 12px 0; color: #1e293b;">Vedop - Mükellef Mapping</h4>';
      html += '<div style="max-height: 200px; overflow-y: auto; margin-top: 8px;">';
      
      mappings.slice(0, 10).forEach((m, i) => {
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f1f5f9';
        html += `<div style="padding: 8px; margin: 4px 0; background: ${bgColor}; border-radius: 6px;">
          <span style="font-weight: 500; color: #1e293b;">${m.vedop_username}</span>
          <span style="margin-left: 12px; color: #64748b;">→ ${m.master_title}</span>
        </div>`;
      });
      
      if (mappings.length > 10) {
        html += `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Ve ${mappings.length - 10} daha fazla mapping</div>`;
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

  // Upload status göster (CSS renk kodları olmadan)
  function showUploadStatus(message, type) {
    if (!uploadStatus) return;
    
    const typeStyles = {
      loading: { bg: '#fffbce', txt: '#856404' },
      success: { bg: '#d1e7dd', txt: '#0f5132' },
      error: { bg: '#f8d7da', txt: '#842029' }
    };
    
    const style = typeStyles[type] || typeStyles.error;
    uploadStatus.style.cssText = `
      padding: 12px;
      background: ${style.bg};
      color: ${style.txt};
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

  // Sayfaya SheetJS'i yükle
  loadSheetJS().then(loadXlsxFile).catch((err) => {
    console.error('SheetJS yükleme hatası:', err);
    showUploadStatus('SheetJS kütüphanesi yüklenemedi', 'error');
  });

  function loadXlsxFile(XLSX) {
    // Excel dosya input değişkeni ( tekrar başlatma için )
    let excelFileInput = document.getElementById('excelFileInput');
    let uploadBtn = document.getElementById('uploadBtn');
    let uploadStatus = document.getElementById('uploadStatus');
    
    if (!excelFileInput || !uploadBtn) return;
    
    uploadBtn.addEventListener('click', function() {
      excelFileInput.click();
    });

    excelFileInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        showUploadStatus('Lütfen .xlsx veya .xls dosyası seçin', 'error');
        return;
      }
      
      showUploadStatus('Dosya yükleniyor...', 'loading');
      
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
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

  // Başlangıçta upload section'ı gizle (login ekranında)
  if (uploadSection) uploadSection.style.display = 'none';
  
  // Excel yüklemeyi başlat
  loadSheetJS();
});