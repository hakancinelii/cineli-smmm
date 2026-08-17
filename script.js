document.addEventListener('DOMContentLoaded', function() {
  // ============================================
  // SUPABASE BACKEND ENTEGRASYONU
  // ============================================
  // BU BÖLÜM SUPABASE PROJE İLE İNTEGRASYON AÇISINDAN HAZIRLANDI
  // 
  // GEREKLİ AYARLAMALAR:
  // 1. Supabase proje oluştur: https://supabase.com
  // 2. Proje API anahtarlarını alın (ANON_KEY)
  // 3. Aşağıdaki CONFIG objesini doldurun
  // 4. SQL sorguları ile tabloları oluşturun (tablo sonrası)
  //
  // Gerekli Tablolar:
  // - profiles (id, full_name, vedop_username, title, created_at)
  // - vedop_mapping (vedop_username, master_title, created_at)
  // - download_history (id, user_id, files_processed, created_at)
  //
  // Sample SQL:
  // CREATE TABLE profiles (
  //   id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  //   full_name TEXT NOT NULL,
  //   vedop_username TEXT UNIQUE,
  //   title TEXT,
  //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  // );
  //
  // CREATE TABLE vedop_mapping (
  //   vedop_username TEXT PRIMARY KEY,
  //   master_title TEXT NOT NULL,
  //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  // );
  //
  // CREATE TABLE download_history (
  //   id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  //   files_processed INTEGER DEFAULT 0,
  //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  // );
  //
  // --------------------------------------------

  const SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_ANON_KEY'
  };

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
  // SUPABASE İNİTİALİZASYONU
  // ============================================
  let supabase = null;
  
  // Demo mod: Supabase başlatılamadıysa çalışır
  let demoMode = true;

  // ============================================
  // KULLANICI YÖNETİMİ VE GİRİŞ
  // ============================================
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('vedopUsername').value.trim();
    const password = document.getElementById('vedopPassword').value.trim();
    
    // Loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner third-icon"></i> Oturum Açılıyor...';
    submitBtn.disabled = true;
    
    setTimeout(async () => {
      // Demo mod kontrolü
      if (demoMode) {
        // Demo kullanıcı doğrulama
        const demoUsernames = ['39605069', 'kullanici1', 'kullanici2', 'kullanici3', 'kullanici4', 'kullanici5'];
        if (demoUsernames.includes(username) && password.length >= 4) {
          loginSuccessful(username);
        } else {
          showError('Kullanıcı adı veya şifre yanlış');
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      } else {
        // Gerçek Supabase auth
        // const { data, error } = await supabase.auth.signInWithPassword({
        //   email: '', 
        //   password: password
        // });
        // if (error) { showError('Kimlik doğrulama başarısız'); /*...*/ }
        // else { loginSuccessful(username); }
        loginSuccessful(username); // Demo için
      }
      
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }, 800);
  });

  function loginSuccessful(username) {
    // Kullanıcı adını displayeda göster
    userNameDisplay.textContent = username;
    
    // Kullanıcı bilgilerini Supabase'den çek (demo modunda statik)
    fetchUserInfo(username);
    
    // Dashboard'i göster, giriş ekranını gizle
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    
    // Upload section visibility
    if (uploadSection) uploadSection.style.display = 'block';
    
    // Focus download inputs
    downloadUsername.focus();
    
    // Kullanıcının dosyalarını render et
    renderUserFiles(username, 0);
  }

  // Vedop username'dan master title çekme (Supabase'den veya demo veriden)
  async function fetchUserInfo(username) {
    if (!supabase && demoMode) {
      // Demo veriler - gerçek projede Supabase query olur
      const demoUsers = {
        '39605069': { name: 'Yeni Mükellef', title: 'Mükellef - 39605069' },
        'kullanici1': { name: 'Ahmet Yılmaz', title: 'Mükellef - Ahmet Yılmaz' },
        'kullanici2': { name: 'Mehmet K.', title: 'Mükellef - Mehmet K.' },
        'kullanici3': { name: 'Ayşe D.', title: 'Mükellef - Ayşe D.' },
        'kullanici4': { name: 'Fatma S.', title: 'Mükellef - Fatma S.' },
        'kullanici5': { name: 'Ali V.', title: 'Mükellef - Ali V.' }
      };
      
      const user = demoUsers[username];
      if (user) {
        userNameDisplay.textContent = `${user.name} (${username})`;
      }
      return;
    }
    
    // Gerçek Supabase query
    // const { data, error } = await supabase
    //   .from('profiles')
    //   .select('full_name, title')
    //   .eq('vedop_username', username)
    //   .single();
    // if (data) { /* update UI */ }
  }

  // ============================================
  // EXCEL YÜKLEME VE VEDOP MAPPING
  // ============================================
  
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
        // SheetJS ile Excel'i parse et
        const data = await readXlsxFile(file);
        
        // Structured data extraction
        // Beklenen format: Vedop Kullanıcı Adı | Mükellef Ünvanı | ... diğer sütunlar
        const mappings = parseExcelData(data);
        
        if (mappings.length === 0) {
          showUploadStatus('Dosyada veri bulunamadı', 'error');
          return;
        }
        
        // Supabase'ye kaydet (demo modunda göster)
        if (demoMode) {
          await saveMappingsToDemo(mappings);
        } else {
          // Gerçek Supabase kaydet
          // await saveMappingsToSupabase(mappings);
        }
        
        showUploadStatus(`${mappings.length} kayıt başarıyla yüklendi`, 'success');
        
        // Listeleri yenile
        setTimeout(() => {
          location.reload();
        }, 1500);
        
      } catch (error) {
        console.error('Excel parse hatası:', error);
        showUploadStatus('Dosya işlenirken hata oluştu', 'error');
      }
    });
  }

  // Excel verisini parse et - SheetJS kullanarak
  function readXlsxFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Tüm veriyi JSON'a dönüştür
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      };
      reader.onerror = (e) => reject(new Error('Dosya okuma hatası'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Excel verisini işle - Vedop kullanıcı adı ve ünvan çıkarma
  function parseExcelData(data) {
    const mappings = [];
    
    data.forEach((row, index) => {
      // Demo: Satırdaki verileri Vedop kullanıcı adı ve ünvan olarak ayıkla
    // Gerçek projede: Satır başı boşlukları temizle ve mapping oluştur
      const vedopUsername = row['Vedop Kullanıcı Adı'] || row['vedop_username'] || row[0];
      const masterTitle = row['Mükellef Ünvanı'] || row['title'] || row[1];
      
      if (vedopUsername && masterTitle) {
        // Temizle ve kaydet
        const cleanUsername = String(vedopUsername).trim();
        const cleanTitle = String(masterTitle).trim();
        
        mappings.push({
          vedop_username: cleanUsername,
          master_title: cleanTitle,
          rowIndex: index
        });
      }
    });
    
    return mappings;
  }

  // Demo modda mappings'i kaydet
  async function saveMappingsToDemo(mappings) {
    // LocalStorage'a kaydet veya console.log
    console.log('Kaydedilen Vedop Mappings:', mappings);
    
    // LocalStorage'dan mevcut mapping'leri al
    let existingMappings = JSON.parse(localStorage.getItem('vedop_mappings') || '[]');
    
    // Yeni mapping'leri ekle (duplicate kontrolü)
    mappings.forEach(newMap => {
      const alreadyExists = existingMappings.some(m => m.vedop_username === newMap.vedop_username);
      if (!alreadyExists) {
        existingMappings.push(newMap);
      }
    });
    
    // Kaydet
    localStorage.setItem('vedop_mappings', JSON.stringify(existingMappings));
    
    // UI güncelle - mapping'leri göster
    updateVedopMappingUI(existingMappings);
  }

  // Vedop mapping UI'yi güncelle
  function updateVedopMappingUI(mappings) {
    // Mapping'leri bir tablo veya liste olarak dashboard'da göster
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
      let html = '<h4>Vedop - Mükellef Mapping' + (mappings.length > 5 ? ` (${mappings.length} toplam)` '') + '</h4>';
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
    
    // 5 saniye sonra gizle
    setTimeout(() => {
      uploadStyle.display = 'none';
    }, 5000);
  }

  // ============================================
  // PDF İNDİRME FONKSİYONU (Güncellenmiş)
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
      renderUserFiles(username, parseInt(totalFilesDisplay.textContent));
      
      // Temizle
      downloadUsername.value = '';
      downloadPassword.value = '';
      
      // Vedop mapping'ten title çekilip display update
      fetchUserInfo(username);
      
    }, 2500);
  });

  // ============================================
  // KULLANICI DOSYALARI RENDER (Güncellenmiş)
  // ============================================
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
    const showAll = fileCount <= 15;
    
    for (let i = 1; i <= (showAll ? fileCount : 15); i++) {
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
    
    if (fileCount > 15) {
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
    
    // Mapping'den username için title güncelle
    fetchUserInfo(username);
  }

  // Download link event listenerları
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

  // Başlangıçta upload section'ı gizle (login ekranında)
  if (uploadSection) uploadSection.style.display = 'none';
});