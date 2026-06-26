
  // FIREBASE CONFIG
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
  import { getFirestore, doc, getDoc, collection, getDocs, setDoc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
  import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDPz8rchqOD7mHbrLtnuU5m9uAMEJgf59U",
    authDomain: "decor-25587.firebaseapp.com",
    projectId: "decor-25587",
    storageBucket: "decor-25587.firebasestorage.app",
    messagingSenderId: "857089585477",
    appId: "1:857089585477:web:14348a7e77b6b4931f8e2c"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  let currentUser = null;
  let currentRole = 'viewer';

  // UI ELEMENTS
  const loader = document.getElementById('global-loader');
  const authView = document.getElementById('auth-view');
  const appView = document.getElementById('app-view');
  const authErr = document.getElementById('auth-err');
  const loginBtn = document.getElementById('login-btn');

  // TOAST SYSTEM
  window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size:1.2rem">${type==='success'?'✅':'❌'}</span><div style="font-weight:600; font-size:0.9rem; color:var(--dark)">${msg}</div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  };

  // ROUTING LOGIC
  const navLinks = document.querySelectorAll('.nav-link[data-target]');
  const views = document.querySelectorAll('.view-container');
  const titleEl = document.getElementById('view-title');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      
      // Update Active Nav
      navLinks.forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      // Update Title
      titleEl.textContent = e.currentTarget.textContent.trim();
      
      // Show View
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${target}`).classList.add('active');
      
      // Close sidebar on mobile
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  // AUTH STATE LISTENER
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      try {
        // Fetch role from Firestore users collection
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          currentRole = userDoc.data().role || 'viewer';
        } else {
          // Auto-create superadmin if first user
          if(user.email === 'admin@shreeballoons.in' || user.email === 'admin@admin.com') {
             await setDoc(doc(db, "users", user.uid), { email: user.email, role: 'superadmin', createdAt: new Date() });
             currentRole = 'superadmin';
          }
        }
        
        // Update UI
        document.getElementById('ui-name').textContent = user.email.split('@')[0];
        document.getElementById('ui-av').textContent = user.email.charAt(0).toUpperCase();
        document.getElementById('ui-role').textContent = currentRole;
        
        if (currentRole === 'superadmin') {
          document.getElementById('nav-users').classList.remove('hidden');
        }

        // Show App
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
        loader.classList.remove('active');
        
        // Load initial dashboard stats
        window.loadDashboardStats();
        
      } catch(e) {
        console.error("Role fetch error", e);
        showToast("Error verifying permissions", "error");
        auth.signOut();
      }
    } else {
      currentUser = null;
      appView.classList.add('hidden');
      authView.classList.remove('hidden');
      loader.classList.remove('active');
    }
  });

  // LOGIN LOGIC
  window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    authErr.style.display = 'none';
    loginBtn.textContent = 'Authenticating...';
    loginBtn.disabled = true;
    
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showToast("Login successful!");
    } catch (error) {
      let msg = "Invalid email or password.";
      if(error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') msg = "Invalid credentials.";
      if(error.code === 'auth/too-many-requests') msg = "Too many attempts. Try again later.";
      authErr.textContent = msg;
      authErr.style.display = 'block';
      showToast(msg, 'error');
    } finally {
      loginBtn.textContent = 'Sign In to Dashboard';
      loginBtn.disabled = false;
    }
  };

  // LOGOUT LOGIC
  window.handleLogout = async () => {
    loader.classList.add('active');
    try {
      await signOut(auth);
      showToast("Logged out successfully");
    } catch(e) {
      loader.classList.remove('active');
    }
  };

  // DASHBOARD DATA
  window.loadDashboardStats = async () => {
    // Placeholder fetching logic, will be expanded
    try {
      const svcSnap = await getDocs(collection(db, "services"));
      document.getElementById('st-svc').textContent = svcSnap.size;
      // In a real scenario, we'd count documents in other collections
    } catch(e) {
      console.log("Could not load stats yet");
    }
  }

  // ======================================
  // HOME MANAGER (Hero & Services)
  // ======================================
  
  // Hero Logic
  window.loadHeroImages = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "homepage"));
      if(snap.exists()) {
        const d = snap.data();
        document.getElementById('hm-img1').value = d.img1 || '';
        document.getElementById('hm-t1').value = d.t1 || '';
        document.getElementById('hm-s1').value = d.s1 || '';
        document.getElementById('hm-b1').value = d.b1 || '';
        document.getElementById('hm-img2').value = d.img2 || '';
        document.getElementById('hm-t2').value = d.t2 || '';
        document.getElementById('hm-s2').value = d.s2 || '';
        document.getElementById('hm-b2').value = d.b2 || '';
        document.getElementById('hm-img3').value = d.img3 || '';
        document.getElementById('hm-t3').value = d.t3 || '';
        document.getElementById('hm-s3').value = d.s3 || '';
        document.getElementById('hm-b3').value = d.b3 || '';
        
        let html = '';
        [d.img1, d.img2, d.img3].forEach((img) => {
          if(img) html += `<div style="flex:1;"><img src="${img}" style="width:100%; height:120px; object-fit:cover; border-radius:12px; box-shadow:var(--shadow-sm);"></div>`;
        });
        document.getElementById('hero-list').innerHTML = html || '<div style="color:var(--muted)">No hero banners set.</div>';
      }
    } catch(e) { console.error(e); }
  };

  window.saveHeroImages = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    const btn = document.querySelector('#hero-modal .btn-primary');
    btn.textContent = 'Saving...';
    try {
      await setDoc(doc(db, "config", "homepage"), {
        img1: document.getElementById('hm-img1').value.trim(),
        t1: document.getElementById('hm-t1').value.trim(),
        s1: document.getElementById('hm-s1').value.trim(),
        b1: document.getElementById('hm-b1').value.trim(),
        img2: document.getElementById('hm-img2').value.trim(),
        t2: document.getElementById('hm-t2').value.trim(),
        s2: document.getElementById('hm-s2').value.trim(),
        b2: document.getElementById('hm-b2').value.trim(),
        img3: document.getElementById('hm-img3').value.trim(),
        t3: document.getElementById('hm-t3').value.trim(),
        s3: document.getElementById('hm-s3').value.trim(),
        b3: document.getElementById('hm-b3').value.trim()
      }, {merge: true});
      showToast('Hero banners saved!');
      document.getElementById('hero-modal').classList.remove('active');
      window.loadHeroImages();
    } catch(e) {
      showToast('Failed to save hero banners', 'error');
    }
    btn.textContent = 'Save Hero Banners';
  };

  window.loadGlobalStats = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "stats"));
      if(snap.exists()) {
        const d = snap.data();
        document.getElementById('hs-stat-1').value = d.s1 || '';
        document.getElementById('hs-stat-2').value = d.s2 || '';
        document.getElementById('hs-stat-3').value = d.s3 || '';
        document.getElementById('hs-stat-4').value = d.s4 || '';
      }
    } catch(e) { console.error(e); }
  };

  window.saveGlobalStats = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    const btn = document.getElementById('hs-stats-btn'); btn.textContent = 'Saving...';
    try {
      await setDoc(doc(db, "config", "stats"), {
        s1: document.getElementById('hs-stat-1').value.trim(),
        s2: document.getElementById('hs-stat-2').value.trim(),
        s3: document.getElementById('hs-stat-3').value.trim(),
        s4: document.getElementById('hs-stat-4').value.trim()
      });
      showToast('Global Stats saved!');
    } catch(e) { showToast('Error saving stats', 'error'); }
    btn.textContent = 'Save Stats';
  };

  // Services Logic
  let allServices = [];
  
  window.loadServices = async () => {
    try {
      const snap = await getDocs(collection(db, "services"));
      allServices = [];
      snap.forEach(d => allServices.push({ id: d.id, ...d.data() }));
      renderServicesAdmin();
    } catch(e) { console.error(e); }
  };

  window.renderServicesAdmin = () => {
    const list = document.getElementById('services-list');
    if(allServices.length === 0) {
      list.innerHTML = `<div class="glass-panel" style="padding:40px; text-align:center; color:var(--muted);">No services added yet.</div>`;
      return;
    }
    list.innerHTML = allServices.map(s => `
      <div class="m-card">
        <img src="${s.img || 'https://via.placeholder.com/150'}" class="m-img">
        <div class="m-info">
          <div class="m-title">${s.icon || ''} ${s.title}</div>
          <div class="m-desc">${s.description || ''}</div>
          <div class="m-actions">
            <button class="btn btn-outline" style="padding: 6px 12px; font-size:0.8rem;" onclick="editService('${s.id}')">Edit</button>
            <button class="btn btn-danger" style="padding: 6px 12px; font-size:0.8rem;" onclick="deleteService('${s.id}')">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  };

  window.openServiceModal = () => {
    document.getElementById('sm-id').value = '';
    document.getElementById('sm-t').value = '';
    document.getElementById('sm-d').value = '';
    document.getElementById('sm-img').value = '';
    document.getElementById('sm-ico').value = '🎀';
    document.getElementById('sm-title').textContent = 'Add Service';
    document.getElementById('sm-btn').textContent = 'Save Service';
    document.getElementById('svc-modal').classList.add('active');
  };

  window.editService = (id) => {
    const s = allServices.find(x => x.id === id);
    if(!s) return;
    document.getElementById('sm-id').value = s.id;
    document.getElementById('sm-t').value = s.title || '';
    document.getElementById('sm-d').value = s.description || '';
    document.getElementById('sm-img').value = s.img || '';
    document.getElementById('sm-ico').value = s.icon || '🎀';
    document.getElementById('sm-title').textContent = 'Edit Service';
    document.getElementById('sm-btn').textContent = 'Update Service';
    document.getElementById('svc-modal').classList.add('active');
  };

  window.saveService = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    
    const id = document.getElementById('sm-id').value;
    const data = {
      title: document.getElementById('sm-t').value.trim(),
      description: document.getElementById('sm-d').value.trim(),
      img: document.getElementById('sm-img').value.trim(),
      icon: document.getElementById('sm-ico').value.trim()
    };
    if(!data.title) return showToast('Title is required', 'error');

    const btn = document.getElementById('sm-btn');
    btn.textContent = 'Saving...';
    try {
      if(id) {
        await updateDoc(doc(db, "services", id), data);
        showToast('Service updated!');
      } else {
        await addDoc(collection(db, "services"), data);
        showToast('Service added!');
      }
      document.getElementById('svc-modal').classList.remove('active');
      window.loadServices();
      window.loadDashboardStats(); // Refresh count
    } catch(e) {
      showToast('Error saving service', 'error');
    }
    btn.textContent = id ? 'Update Service' : 'Save Service';
  };

  window.deleteService = async (id) => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    if(!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteDoc(doc(db, "services", id));
      showToast('Service deleted');
      window.loadServices();
      window.loadDashboardStats(); // Refresh count
    } catch(e) {
      showToast('Error deleting service', 'error');
    }
  };

  // ======================================
  // GALLERY MANAGER
  // ======================================
  let allGallery = [];

  window.loadGallery = async () => {
    try {
      const snap = await getDocs(collection(db, "gallery"));
      allGallery = [];
      snap.forEach(d => allGallery.push({ id: d.id, ...d.data() }));
      allGallery.sort((a,b) => (b.ts || 0) - (a.ts || 0));
      renderGalleryAdmin();
      document.getElementById('st-gallery').textContent = allGallery.length;
    } catch(e) { console.error(e); }
  };

  window.renderGalleryAdmin = () => {
    const grid = document.getElementById('gal-grid');
    if(allGallery.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:40px;">No images in gallery. Upload some above!</div>`;
      return;
    }
    grid.innerHTML = allGallery.map(g => `
      <div class="gal-card">
        <img src="${g.img}" alt="${g.title}" loading="lazy">
        <div class="gal-actions">
          <button class="gal-btn" onclick="editGallery('${g.id}')">✏️</button>
          <button class="gal-btn del" onclick="deleteGallery('${g.id}', '${g.img}')">🗑️</button>
        </div>
        <div class="gal-meta">
          <div class="gal-cat">${g.category}</div>
          <div class="gal-lbl">${g.title || 'Untitled'}</div>
        </div>
      </div>
    `).join('');
  };

  window.editGallery = (id) => {
    const g = allGallery.find(x => x.id === id);
    if(!g) return;
    document.getElementById('gm-id').value = g.id;
    document.getElementById('gm-lbl').value = g.title || '';
    document.getElementById('gm-cat').value = g.category || 'Birthday';
    document.getElementById('gm-img-pre').src = g.img;
    document.getElementById('gal-modal').classList.add('active');
  };

  window.saveGalleryMeta = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    const id = document.getElementById('gm-id').value;
    const btn = document.getElementById('gm-btn');
    btn.textContent = 'Saving...';
    try {
      await updateDoc(doc(db, "gallery", id), {
        title: document.getElementById('gm-lbl').value.trim(),
        category: document.getElementById('gm-cat').value
      });
      showToast('Image updated');
      document.getElementById('gal-modal').classList.remove('active');
      window.loadGallery();
    } catch(e) { showToast('Error saving changes', 'error'); }
    btn.textContent = 'Save Changes';
  };

  window.deleteGallery = async (id, url) => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    if(!confirm("Are you sure you want to delete this image?")) return;
    try {
      await deleteDoc(doc(db, "gallery", id));
      try {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      } catch(se) { console.log('Storage obj err', se); }
      showToast('Image deleted');
      window.loadGallery();
    } catch(e) { showToast('Error deleting image', 'error'); }
  };

  // Upload Logic with Canvas Compression
  const upZone = document.getElementById('up-zone');
  const upFile = document.getElementById('up-file');
  const upProg = document.getElementById('up-prog');
  const upFill = document.getElementById('up-fill');

  if(upZone) {
    upZone.addEventListener('click', () => upFile.click());
    upZone.addEventListener('dragover', (e) => { e.preventDefault(); upZone.classList.add('dragover'); });
    upZone.addEventListener('dragleave', () => upZone.classList.remove('dragover'));
    upZone.addEventListener('drop', (e) => { e.preventDefault(); upZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
    upFile.addEventListener('change', (e) => handleFiles(e.target.files));
  }

  async function handleFiles(files) {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    if(!files || files.length === 0) return;
    
    upProg.style.display = 'block';
    upFill.style.width = '0%';
    let successCount = 0;
    
    for(let i=0; i<files.length; i++) {
      const file = files[i];
      if(!file.type.startsWith('image/')) continue;
      
      try {
        const compressedBlob = await compressImage(file);
        const filename = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
        const storageRef = ref(storage, filename);
        const uploadTask = await uploadBytesResumable(storageRef, compressedBlob);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        
        await addDoc(collection(db, "gallery"), {
          img: downloadURL,
          title: file.name.split('.')[0].replace(/[-_]/g, ' '),
          category: 'Birthday',
          ts: Date.now()
        });
        
        successCount++;
        upFill.style.width = Math.round(((i+1)/files.length)*100) + '%';
      } catch(e) {
        console.error("Upload error", e);
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }
    
    setTimeout(() => { upProg.style.display = 'none'; }, 1000);
    if(successCount > 0) {
      showToast(`Successfully uploaded ${successCount} image(s)`);
      window.loadGallery();
    }
  }

  window.uploadSingleImage = async (fileInput, targetInputId) => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    const file = fileInput.files[0];
    if(!file) return;
    
    const targetInput = document.getElementById(targetInputId);
    const originalValue = targetInput.value;
    targetInput.value = 'Uploading...';
    targetInput.disabled = true;
    
    try {
      const compressedBlob = await compressImage(file);
      const filename = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const storageRef = ref(storage, filename);
      const uploadTask = await uploadBytesResumable(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      targetInput.value = downloadURL;
      showToast('Image uploaded successfully');
    } catch(e) {
      console.error(e);
      targetInput.value = originalValue;
      showToast('Upload failed', 'error');
    } finally {
      targetInput.disabled = false;
      fileInput.value = '';
    }
  };

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(blob => resolve(blob), 'image/webp', 0.85);
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  }

  // ======================================
  // EXTENDED MANAGERS (About, Contact, Inquiries)
  // ======================================

  window.loadAboutData = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "about"));
      if(snap.exists()){
        const d = snap.data();
        document.getElementById('am-story1').value = d.s1 || '';
        document.getElementById('am-story2').value = d.s2 || '';
        document.getElementById('am-mission').value = d.m || '';
        document.getElementById('am-vision').value = d.v || '';
      }
    } catch(e) {}
  };

  window.saveAboutData = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    const btn = document.getElementById('am-btn'); btn.textContent = 'Saving...';
    try {
      await setDoc(doc(db, "config", "about"), {
        s1: document.getElementById('am-story1').value.trim(),
        s2: document.getElementById('am-story2').value.trim(),
        m: document.getElementById('am-mission').value.trim(),
        v: document.getElementById('am-vision').value.trim()
      });
      showToast('About data saved!');
    } catch(e) { showToast('Error saving data', 'error'); }
    btn.textContent = 'Save Changes';
  };

  window.loadContactData = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "contact"));
      if(snap.exists()){
        const d = snap.data();
        document.getElementById('cm-wa').value = d.wa || '';
        document.getElementById('cm-ph').value = d.ph || '';
        document.getElementById('cm-em').value = d.em || '';
        document.getElementById('cm-ig').value = d.ig || '';
        document.getElementById('cm-area').value = d.area || '';
        document.getElementById('cm-map').value = d.map || '';
      }
    } catch(e) {}
  };

  window.saveContactData = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    const btn = document.getElementById('cm-btn'); btn.textContent = 'Saving...';
    try {
      await setDoc(doc(db, "config", "contact"), {
        wa: document.getElementById('cm-wa').value.trim(),
        ph: document.getElementById('cm-ph').value.trim(),
        em: document.getElementById('cm-em').value.trim(),
        ig: document.getElementById('cm-ig').value.trim(),
        area: document.getElementById('cm-area').value.trim(),
        map: document.getElementById('cm-map').value.trim()
      });
      showToast('Contact data saved!');
    } catch(e) { showToast('Error saving data', 'error'); }
    btn.textContent = 'Save Changes';
  };

  window.loadInquiries = async () => {
    try {
      const snap = await getDocs(collection(db, "inquiries"));
      const list = document.getElementById('inq-list');
      let msgs = [];
      snap.forEach(d => msgs.push({id: d.id, ...d.data()}));
      msgs.sort((a,b) => (b.ts || 0) - (a.ts || 0));
      document.getElementById('st-inq').textContent = msgs.length;
      
      if(msgs.length === 0) {
        list.innerHTML = `<div class="glass-panel" style="padding:40px; text-align:center; color:var(--muted);">No new inquiries.</div>`;
        return;
      }
      list.innerHTML = msgs.map(m => `
        <div class="m-card" style="flex-direction:column; gap:10px;">
          <div style="display:flex; justify-content:space-between; width:100%;">
            <strong style="font-size:1.1rem;">${m.name}</strong>
            <span style="font-size:0.8rem; color:var(--muted);">${new Date(m.ts).toLocaleString()}</span>
          </div>
          <div style="color:var(--muted); font-size:0.9rem;">
            📞 ${m.phone} | 📅 ${m.date || 'N/A'} | 🎉 ${m.event || 'N/A'}
          </div>
          <div style="background:var(--sky-bg); padding:12px; border-radius:8px; font-size:0.9rem; margin-top:8px;">
            ${m.msg || 'No message provided.'}
          </div>
          <button class="btn btn-danger" style="align-self:flex-end; font-size:0.8rem; padding:6px 12px;" onclick="deleteInquiry('${m.id}')">Delete</button>
        </div>
      `).join('');
    } catch(e) {}
  };

  window.deleteInquiry = async (id) => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    if(!confirm("Delete this inquiry?")) return;
    try {
      await deleteDoc(doc(db, "inquiries", id));
      showToast('Inquiry deleted');
      window.loadInquiries();
    } catch(e) {}
  };


  // ======================================
  // OFFERS, REVIEWS, TIMELINE, VALUES
  // ======================================
  
  // OFFERS
  window.loadOffers = async () => {
    try {
      const snap = await getDocs(collection(db, "offers"));
      let html = '';
      snap.forEach(d => {
        const o = d.data();
        html += `<div class="m-card" style="align-items:center;">
          <div style="font-size:2rem;">${o.icon||'✨'}</div>
          <div style="flex-grow:1; margin-left:16px;">
            <div style="font-weight:700;">${o.title}</div>
            <div style="color:var(--muted); font-size:0.85rem;">${o.desc}</div>
          </div>
          <button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="editOffer('${d.id}', \`${o.title.replace(/`/g,'')}\`, \`${(o.desc||'').replace(/`/g,'')}\`, '${o.icon}', '${o.btn}')">Edit</button>
          <button class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem; margin-left:8px;" onclick="deleteOffer('${d.id}')">Delete</button>
        </div>`;
      });
      document.getElementById('offers-list').innerHTML = html || '<div class="glass-panel" style="padding:30px;text-align:center;color:var(--muted);">No offers added.</div>';
    } catch(e){}
  };
  window.openOfferModal = () => { document.getElementById('om-id').value=''; document.getElementById('om-t').value=''; document.getElementById('om-d').value=''; document.getElementById('om-ico').value='✨'; document.getElementById('om-btn-txt').value='View Collection'; document.getElementById('om-title').textContent='Add Offer'; document.getElementById('offer-modal').classList.add('active'); };
  window.editOffer = (id, t, d, ico, b) => { document.getElementById('om-id').value=id; document.getElementById('om-t').value=t; document.getElementById('om-d').value=d; document.getElementById('om-ico').value=ico; document.getElementById('om-btn-txt').value=b; document.getElementById('om-title').textContent='Edit Offer'; document.getElementById('offer-modal').classList.add('active'); };
  window.saveOffer = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied','error');
    const id = document.getElementById('om-id').value;
    const data = { title:document.getElementById('om-t').value, desc:document.getElementById('om-d').value, icon:document.getElementById('om-ico').value, btn:document.getElementById('om-btn-txt').value, ts:Date.now() };
    document.getElementById('om-save-btn').textContent = 'Saving...';
    try {
      if(id) await updateDoc(doc(db,"offers",id), data);
      else await addDoc(collection(db,"offers"), data);
      showToast('Offer saved'); document.getElementById('offer-modal').classList.remove('active'); window.loadOffers();
    } catch(e){} document.getElementById('om-save-btn').textContent = 'Save Offer';
  };
  window.deleteOffer = async (id) => { if(currentRole==='viewer')return; if(confirm('Delete offer?')){ await deleteDoc(doc(db,"offers",id)); window.loadOffers(); showToast('Deleted'); } };

  // REVIEWS
  window.loadReviews = async () => {
    try {
      const snap = await getDocs(collection(db, "reviews"));
      let html = '';
      snap.forEach(d => {
        const r = d.data();
        html += `<div class="m-card" style="align-items:center;">
          <div style="width:40px;height:40px;border-radius:50%;background:${r.bg};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">${r.name.substring(0,2).toUpperCase()}</div>
          <div style="flex-grow:1; margin-left:16px;">
            <div style="font-weight:700;">${r.name} <span style="color:#FFD700; font-size:0.8rem; margin-left:8px;">${'★'.repeat(r.rating)}</span></div>
            <div style="color:var(--muted); font-size:0.85rem;">"${r.text}"</div>
            <div style="color:var(--sky); font-size:0.7rem; font-weight:600; margin-top:4px;">${r.event}</div>
          </div>
          <button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="editReview('${d.id}', \`${r.name.replace(/`/g,'')}\`, \`${(r.text||'').replace(/`/g,'')}\`, '${r.event}', ${r.rating}, '${r.bg}')">Edit</button>
          <button class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem; margin-left:8px;" onclick="deleteReview('${d.id}')">Delete</button>
        </div>`;
      });
      document.getElementById('reviews-list').innerHTML = html || '<div class="glass-panel" style="padding:30px;text-align:center;color:var(--muted);">No reviews added.</div>';
    } catch(e){}
  };
  window.openReviewModal = () => { document.getElementById('rm-id').value=''; document.getElementById('rm-n').value=''; document.getElementById('rm-t').value=''; document.getElementById('rm-ev').value=''; document.getElementById('rm-r').value='5'; document.getElementById('rm-bg').value='#009dff'; document.getElementById('rm-title').textContent='Add Review'; document.getElementById('review-modal').classList.add('active'); };
  window.editReview = (id, n, t, ev, r, bg) => { document.getElementById('rm-id').value=id; document.getElementById('rm-n').value=n; document.getElementById('rm-t').value=t; document.getElementById('rm-ev').value=ev; document.getElementById('rm-r').value=r; document.getElementById('rm-bg').value=bg; document.getElementById('rm-title').textContent='Edit Review'; document.getElementById('review-modal').classList.add('active'); };
  window.saveReview = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied','error');
    const id = document.getElementById('rm-id').value;
    const data = { name:document.getElementById('rm-n').value, text:document.getElementById('rm-t').value, event:document.getElementById('rm-ev').value, rating:parseInt(document.getElementById('rm-r').value), bg:document.getElementById('rm-bg').value, ts:Date.now() };
    document.getElementById('rm-save-btn').textContent = 'Saving...';
    try {
      if(id) await updateDoc(doc(db,"reviews",id), data);
      else await addDoc(collection(db,"reviews"), data);
      showToast('Review saved'); document.getElementById('review-modal').classList.remove('active'); window.loadReviews();
    } catch(e){} document.getElementById('rm-save-btn').textContent = 'Save Review';
  };
  window.deleteReview = async (id) => { if(currentRole==='viewer')return; if(confirm('Delete review?')){ await deleteDoc(doc(db,"reviews",id)); window.loadReviews(); showToast('Deleted'); } };

  // TIMELINE
  window.loadTimeline = async () => {
    try {
      const snap = await getDocs(collection(db, "timeline"));
      let arr = []; snap.forEach(d => arr.push({id: d.id, ...d.data()}));
      arr.sort((a,b) => a.year - b.year);
      let html = '';
      arr.forEach(t => {
        html += `<div class="m-card" style="align-items:center;">
          <div style="font-weight:800; font-size:1.5rem; color:var(--sky); width:80px;">${t.year}</div>
          <div style="flex-grow:1; margin-left:16px;">
            <div style="font-weight:700;">${t.title}</div>
            <div style="color:var(--muted); font-size:0.85rem;">${t.desc}</div>
          </div>
          <button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="editTimeline('${t.id}', '${t.year}', \`${t.title.replace(/`/g,'')}\`, \`${(t.desc||'').replace(/`/g,'')}\`)">Edit</button>
          <button class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem; margin-left:8px;" onclick="deleteTimeline('${t.id}')">Delete</button>
        </div>`;
      });
      document.getElementById('timeline-list').innerHTML = html || '<div class="glass-panel" style="padding:30px;text-align:center;color:var(--muted);">No milestones.</div>';
    } catch(e){}
  };
  window.openTimelineModal = () => { document.getElementById('tm-id').value=''; document.getElementById('tm-y').value=''; document.getElementById('tm-t').value=''; document.getElementById('tm-d').value=''; document.getElementById('tm-title').textContent='Add Milestone'; document.getElementById('tl-modal').classList.add('active'); };
  window.editTimeline = (id, y, t, d) => { document.getElementById('tm-id').value=id; document.getElementById('tm-y').value=y; document.getElementById('tm-t').value=t; document.getElementById('tm-d').value=d; document.getElementById('tm-title').textContent='Edit Milestone'; document.getElementById('tl-modal').classList.add('active'); };
  window.saveTimeline = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied','error');
    const id = document.getElementById('tm-id').value;
    const data = { year:document.getElementById('tm-y').value, title:document.getElementById('tm-t').value, desc:document.getElementById('tm-d').value };
    try {
      if(id) await updateDoc(doc(db,"timeline",id), data);
      else await addDoc(collection(db,"timeline"), data);
      showToast('Milestone saved'); document.getElementById('tl-modal').classList.remove('active'); window.loadTimeline();
    } catch(e){}
  };
  window.deleteTimeline = async (id) => { if(currentRole==='viewer')return; if(confirm('Delete milestone?')){ await deleteDoc(doc(db,"timeline",id)); window.loadTimeline(); } };

  // VALUES
  window.loadValues = async () => {
    try {
      const snap = await getDocs(collection(db, "values"));
      let html = '';
      snap.forEach(d => {
        const v = d.data();
        html += `<div class="m-card" style="align-items:center;">
          <div style="font-size:2rem;">${v.icon||'✨'}</div>
          <div style="flex-grow:1; margin-left:16px;">
            <div style="font-weight:700;">${v.title}</div>
            <div style="color:var(--muted); font-size:0.85rem;">${v.desc}</div>
          </div>
          <button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="editValue('${d.id}', \`${v.title.replace(/`/g,'')}\`, \`${(v.desc||'').replace(/`/g,'')}\`, '${v.icon}')">Edit</button>
          <button class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem; margin-left:8px;" onclick="deleteValue('${d.id}')">Delete</button>
        </div>`;
      });
      document.getElementById('values-list').innerHTML = html || '<div class="glass-panel" style="padding:30px;text-align:center;color:var(--muted);">No values.</div>';
    } catch(e){}
  };
  window.openValueModal = () => { document.getElementById('vm-id').value=''; document.getElementById('vm-t').value=''; document.getElementById('vm-d').value=''; document.getElementById('vm-ico').value='✨'; document.getElementById('vm-title').textContent='Add Value'; document.getElementById('val-modal').classList.add('active'); };
  window.editValue = (id, t, d, ico) => { document.getElementById('vm-id').value=id; document.getElementById('vm-t').value=t; document.getElementById('vm-d').value=d; document.getElementById('vm-ico').value=ico; document.getElementById('vm-title').textContent='Edit Value'; document.getElementById('val-modal').classList.add('active'); };
  window.saveValue = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied','error');
    const id = document.getElementById('vm-id').value;
    const data = { title:document.getElementById('vm-t').value, desc:document.getElementById('vm-d').value, icon:document.getElementById('vm-ico').value, ts:Date.now() };
    try {
      if(id) await updateDoc(doc(db,"values",id), data);
      else await addDoc(collection(db,"values"), data);
      showToast('Value saved'); document.getElementById('val-modal').classList.remove('active'); window.loadValues();
    } catch(e){}
  };
  window.deleteValue = async (id) => { if(currentRole==='viewer')return; if(confirm('Delete value?')){ await deleteDoc(doc(db,"values",id)); window.loadValues(); } };


  // ======================================
  // SETTINGS & USERS
  // ======================================
  
  window.loadSettingsData = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "settings"));
      if(snap.exists()) {
        const d = snap.data();
        document.getElementById('set-title').value = d.title || '';
        document.getElementById('set-desc').value = d.desc || '';
      }
    } catch(e) {}
  };

  window.saveSettingsData = async () => {
    if(currentRole === 'viewer') return showToast('Permission denied', 'error');
    const btn = document.getElementById('set-btn'); btn.textContent = 'Saving...';
    try {
      await setDoc(doc(db, "config", "settings"), {
        title: document.getElementById('set-title').value.trim(),
        desc: document.getElementById('set-desc').value.trim()
      });
      showToast('Settings saved!');
    } catch(e) { showToast('Error saving settings', 'error'); }
    btn.textContent = 'Save Changes';
  };

  window.loadUsersData = async () => {
    if(currentRole !== 'superadmin' && currentRole !== 'admin') {
      document.getElementById('users-list').innerHTML = '<div style="color:red;">You do not have permission to view users.</div>';
      return;
    }
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = document.getElementById('users-list');
      let users = [];
      snap.forEach(d => users.push({id: d.id, ...d.data()}));
      
      list.innerHTML = users.map(u => `
        <div class="m-card" style="align-items:center; padding:16px 24px;">
          <div style="flex-grow:1;">
            <strong style="font-size:1.1rem;">${u.email}</strong>
            <span style="background:var(--sky-bg); color:var(--sky); padding:4px 8px; border-radius:4px; font-size:0.8rem; margin-left:10px; font-weight:bold;">${u.role}</span>
          </div>
          ${u.role !== 'superadmin' ? `<button class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem;" onclick="deleteUserRole('${u.id}')">Remove Role</button>` : ''}
        </div>
      `).join('');
    } catch(e) {}
  };

  window.addUserRole = async () => {
    if(currentRole !== 'superadmin' && currentRole !== 'admin') return showToast('Permission denied', 'error');
    const email = document.getElementById('u-email').value.trim().toLowerCase();
    const role = document.getElementById('u-role').value;
    if(!email) return;
    try {
      await setDoc(doc(db, "users", email), { email: email, role: role, createdAt: Date.now() });
      showToast('User role updated');
      document.getElementById('u-email').value = '';
      window.loadUsersData();
    } catch(e) { showToast('Error updating role', 'error'); }
  };

  window.deleteUserRole = async (id) => {
    if(currentRole !== 'superadmin' && currentRole !== 'admin') return showToast('Permission denied', 'error');
    if(!confirm("Are you sure you want to remove this user's role? They will become a viewer.")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      showToast('User role removed');
      window.loadUsersData();
    } catch(e) {}
  };

  const oldLoadDashboardStats = loadDashboardStats;
  window.loadDashboardStats = async () => {
    await oldLoadDashboardStats();
    window.loadHeroImages();
    window.loadGlobalStats();
    window.loadServices();
    window.loadGallery();
    window.loadAboutData();
    window.loadContactData();
    window.loadInquiries();
    window.loadSettingsData();
    window.loadUsersData();
    window.loadOffers();
    window.loadReviews();
    window.loadTimeline();
    window.loadValues();
  };

