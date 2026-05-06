const API_URL = '';
let isRegisterMode = false;

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Navigation logic
function goHome() {
    if (localStorage.getItem('token')) {
        switchTab('landing');
    } else {
        document.getElementById('studentDashboard').classList.add('hidden');
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('heroSection').classList.remove('hidden');
        document.getElementById('globalBg').classList.remove('hidden');
    }
}

function showPublicAbout() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('studentDashboard').classList.remove('hidden');
    switchTab('about');
}

// UI Tabs Logic
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    // Show selected tab
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    
    // Update nav buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if(btn.dataset.tab === tabId) {
            btn.classList.add('text-gold');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('text-gold');
            btn.classList.add('text-gray-400');
        }
    });

    // Refresh specific data
    if(tabId === 'tutors') fetchTutors();
    if(tabId === 'info') fetchAnnouncements();
    if(tabId === 'resources') fetchResources();
}

function showLogin() {
    isRegisterMode = false;
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('globalBg').classList.add('hidden');
    document.getElementById('navTabs').style.display = 'none';
    if(document.getElementById('publicNav')) document.getElementById('publicNav').classList.remove('hidden');
    document.getElementById('authTitle').innerText = 'Login';
    document.getElementById('nameField').classList.add('hidden');
    document.getElementById('authToggleText').innerText = "Don't have an account?";
    document.getElementById('fullName').required = false;
}

function showRegister() {
    isRegisterMode = true;
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('globalBg').classList.add('hidden');
    document.getElementById('navTabs').style.display = 'none';
    if(document.getElementById('publicNav')) document.getElementById('publicNav').classList.remove('hidden');
    document.getElementById('authTitle').innerText = 'Register';
    document.getElementById('nameField').classList.remove('hidden');
    document.getElementById('authToggleText').innerText = "Already have an account?";
    document.getElementById('fullName').required = true;
}

function toggleAuthMode() {
    if (isRegisterMode) {
        showLogin();
    } else {
        showRegister();
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.location.reload();
}

// Authentication API Call
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (isRegisterMode) {
        const fullName = document.getElementById('fullName').value;
        try {
            const res = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName })
            });
            if (res.ok) {
                alert('Registration successful! Please login.');
                showLogin();
            } else {
                const data = await res.json();
                alert('Error: ' + data.detail);
            }
        } catch (err) {
            console.error(err);
        }
    } else {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('name', data.full_name);
                
                if (data.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    initDashboard();
                }
            } else {
                alert('Invalid credentials');
            }
        } catch (err) {
            console.error(err);
        }
    }
}

async function initDashboard() {
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('navLoginBtn').classList.add('hidden');
    document.getElementById('navRegisterBtn').classList.add('hidden');
    if(document.getElementById('publicNav')) document.getElementById('publicNav').classList.add('hidden');
    if(document.getElementById('navAboutBtn')) document.getElementById('navAboutBtn').classList.add('hidden');
    
    document.getElementById('navLogoutBtn').classList.remove('hidden');
    document.getElementById('navTabs').style.display = 'block';
    document.getElementById('globalBg').classList.remove('hidden');
    
    const name = localStorage.getItem('name') || 'Student';
    if(document.getElementById('welcomeName')) {
        document.getElementById('welcomeName').innerText = name;
    }
    
    if (document.getElementById('studentDashboard')) {
        document.getElementById('studentDashboard').classList.remove('hidden');
        switchTab('landing'); // Default tab
        fetchQuote();
    }
}

// Data Fetching: Student View
async function fetchQuote() {
    try {
        const res = await fetch(`${API_URL}/communications/quote`);
        const data = await res.json();
        if(document.getElementById('quoteText')) {
            document.getElementById('quoteText').innerText = `"${data.quote}"`;
        }
    } catch(err) {
        console.error(err);
    }
}

async function fetchResources() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/resources/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resources = await res.json();
        const list = document.getElementById('resourceList');
        if(list) {
            list.innerHTML = '';
            resources.forEach(r => {
                const date = new Date(r.upload_date).toLocaleDateString();
                list.innerHTML += `
                    <li class="flex justify-between items-center p-4 glass-card rounded-xl border border-white/5 hover:border-gold/30 transition shadow-sm">
                        <div class="flex items-center gap-3">
                            <i data-lucide="file-text" class="text-gold"></i>
                            <div>
                                <p class="font-bold text-white">${r.title}</p>
                                <p class="text-xs text-gray-400">${r.description || 'No description'} • ${date}</p>
                            </div>
                        </div>
                        <a href="${API_URL}/resources/download/${r.id}" class="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm text-white font-medium transition flex items-center gap-1">
                            <i data-lucide="download" class="w-4 h-4"></i> Get
                        </a>
                    </li>
                `;
            });
            lucide.createIcons();
        }
    } catch(err) {
        console.error(err);
    }
}

async function fetchAnnouncements() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/announcements/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const list = document.getElementById('announcementList');
        if(list) {
            list.innerHTML = '';
            data.forEach(a => {
                const date = new Date(a.post_date).toLocaleString();
                list.innerHTML += `
                    <div class="glass-card p-6 rounded-xl border border-electric/30 border-l-4 border-l-electric">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-bold text-white">${a.title}</h3>
                            <span class="text-xs text-gray-500">${date}</span>
                        </div>
                        <p class="text-gray-300 whitespace-pre-wrap">${a.content}</p>
                    </div>
                `;
            });
        }
    } catch(err) {
        console.error(err);
    }
}

async function fetchTutors() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/tutors/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tutors = await res.json();
        const list = document.getElementById('tutorList');
        if(list) {
            list.innerHTML = '';
            tutors.forEach(t => {
                const imgStr = t.image_path ? `<img src="${t.image_path}" alt="${t.name}" class="w-24 h-24 object-cover rounded-xl border-2 border-gold/50 shadow-lg">` : `<div class="w-24 h-24 bg-white/5 rounded-xl border-2 border-gold/50 flex items-center justify-center shadow-lg"><i data-lucide="user" class="w-8 h-8 text-gold"></i></div>`;
                list.innerHTML += `
                    <div class="tutor-card glass-card p-4 rounded-2xl border border-white/10 flex gap-4 cursor-pointer" onclick="openContactModal('${t.email}', '${t.name}')">
                        ${imgStr}
                        <div class="flex flex-col justify-center">
                            <h3 class="text-xl font-bold text-white">${t.name}</h3>
                            <p class="text-sm text-gold mb-2">${t.email}</p>
                            <p class="text-sm text-gray-400 line-clamp-2">${t.bio}</p>
                        </div>
                    </div>
                `;
            });
            lucide.createIcons();
        }
    } catch(err) {
        console.error(err);
    }
}

// Tutor Modal Logic
function openContactModal(email, name) {
    document.getElementById('contactModal').classList.remove('hidden');
    document.getElementById('modalTutorName').innerText = name;
    document.getElementById('modalTutorEmail').value = email;
}

function closeContactModal() {
    document.getElementById('contactModal').classList.add('hidden');
    document.getElementById('contactForm').reset();
}

async function handleContact(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const studentName = localStorage.getItem('name');
    const email = document.getElementById('modalTutorEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    try {
        const res = await fetch(`${API_URL}/communications/contact-tutor`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                tutor_email: email,
                student_name: studentName,
                subject, 
                message 
            })
        });
        if(res.ok) {
            alert('Message sent successfully!');
            closeContactModal();
        }
    } catch(err) {
        console.error(err);
    }
}

// ------------- EMAIL CENTER (ADMIN) -------------

function emailSubTab(tab) {
    const panels = { broadcast: 'emailPanelBroadcast', welcome: 'emailPanelWelcome' };
    const btns   = { broadcast: 'emailSubBroadcast',   welcome: 'emailSubWelcome' };
    Object.keys(panels).forEach(key => {
        const isActive = key === tab;
        document.getElementById(panels[key]).classList.toggle('hidden', !isActive);
        const btn = document.getElementById(btns[key]);
        if (isActive) {
            btn.classList.add('border-gold', 'text-gold', 'bg-gold/10');
            btn.classList.remove('border-transparent', 'text-gray-400');
        } else {
            btn.classList.remove('border-gold', 'text-gold', 'bg-gold/10');
            btn.classList.add('border-transparent', 'text-gray-400');
        }
    });
    if(tab === 'welcome') loadWelcomeTemplate();
    if(tab === 'broadcast') loadRecipientCount();
}

async function loadRecipientCount() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users/`, { headers: { 'Authorization': `Bearer ${token}` } });
        const users = await res.json();
        const el = document.getElementById('recipientCount');
        if(el) el.textContent = `${users.length}`;
    } catch(err) { console.error(err); }
}

async function handleBroadcast(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const subject = document.getElementById('broadcastSubject').value;
    const message = document.getElementById('broadcastMessage').value;
    const btn = document.getElementById('broadcastBtn');

    if(!confirm(`You are about to send this email to ALL registered users. Proceed?`)) return;
    
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i> Sending...';
    lucide.createIcons();

    try {
        const res = await fetch(`${API_URL}/communications/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ subject, message })
        });
        const data = await res.json();
        if(res.ok) {
            alert(`✅ ${data.message}`);
            e.target.reset();
        } else {
            alert('Error: ' + data.detail);
        }
    } catch(err) { console.error(err); }
    finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="send" class="w-5 h-5"></i> Send to All Users';
        lucide.createIcons();
    }
}

async function loadWelcomeTemplate() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/communications/welcome-template`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        document.getElementById('templateSubject').value = data.subject;
        document.getElementById('templateBody').value = data.body;
        const d = new Date(data.last_updated);
        const el = document.getElementById('templateLastUpdated');
        if(el) el.textContent = d.toLocaleString();
        updatePreview();
    } catch(err) { console.error(err); }
}

function updatePreview() {
    const subject = document.getElementById('templateSubject')?.value || '';
    const body    = document.getElementById('templateBody')?.value || '';
    const previewSubject = document.getElementById('previewSubject');
    const previewBody    = document.getElementById('previewBody');
    if(previewSubject) previewSubject.textContent = subject;
    if(previewBody)    previewBody.textContent = body.replace(/\{name\}/g, 'John Doe');
}

async function handleSaveTemplate(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/communications/welcome-template`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                subject: document.getElementById('templateSubject').value,
                body: document.getElementById('templateBody').value
            })
        });
        if(res.ok) {
            const data = await res.json();
            const d = new Date(data.last_updated);
            const el = document.getElementById('templateLastUpdated');
            if(el) el.textContent = d.toLocaleString();
            alert('✅ Welcome email template saved successfully!');
        }
    } catch(err) { console.error(err); }
}

// ------------- ADMIN API CALLS -------------


async function fetchStudents() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();
        window.studentData = users; // store for CSV export
        
        const list = document.getElementById('studentTableBody');
        if(list) {
            list.innerHTML = '';
            users.forEach(u => {
                const date = new Date(u.registration_date).toLocaleDateString();
                list.innerHTML += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-3 px-4 font-medium text-white">${u.full_name}</td>
                        <td class="py-3 px-4 text-gray-400">${u.email}</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}">
                                ${u.role}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-gray-400">${date}</td>
                        <td class="py-3 px-4 text-right">
                            <button onclick="deleteUser(${u.id}, '${u.full_name}')" class="p-2 text-gray-500 hover:text-red-500 transition" title="Delete User">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            lucide.createIcons();
        }
    } catch(err) {
        console.error(err);
    }
}

async function handleAdminAddUser(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const full_name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    try {
        const res = await fetch(`${API_URL}/users/admin-create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, full_name, password, role })
        });
        if(res.ok) {
            alert('User created successfully!');
            e.target.reset();
            fetchStudents();
        } else {
            const data = await res.json();
            alert('Error: ' + data.detail);
        }
    } catch(err) {
        console.error(err);
    }
}

async function deleteUser(userId, userName) {
    if(!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;
    
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            alert('User deleted successfully.');
            fetchStudents();
        } else {
            const data = await res.json();
            alert('Error: ' + data.detail);
        }
    } catch(err) {
        console.error(err);
    }
}

async function fetchAdminResources() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/resources/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resources = await res.json();
        
        const list = document.getElementById('adminResourceList');
        if(list) {
            list.innerHTML = '';
            resources.forEach(r => {
                list.innerHTML += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-3 px-4">${r.title}</td>
                        <td class="py-3 px-4 text-right">
                            <button onclick="deleteResource(${r.id})" class="text-red-500 hover:text-red-400 text-sm p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </td>
                    </tr>
                `;
            });
            lucide.createIcons();
        }
    } catch(err) {
        console.error(err);
    }
}

async function handleUpload(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const title = document.getElementById('uploadTitle').value;
    const desc = document.getElementById('uploadDesc').value;
    const file = document.getElementById('uploadFile').files[0];
    
    const formData = new FormData();
    formData.append('title', title);
    if(desc) formData.append('description', desc);
    formData.append('file', file);
    
    try {
        const res = await fetch(`${API_URL}/resources/upload`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if(res.ok) {
            alert('File uploaded successfully!');
            e.target.reset();
            fetchAdminResources();
        }
    } catch(err) {
        console.error(err);
    }
}

async function deleteResource(id) {
    if(!confirm("Are you sure you want to delete this resource?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/resources/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            fetchAdminResources();
        }
    } catch(err) {
        console.error(err);
    }
}

async function fetchAdminTutors() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/tutors/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tutors = await res.json();
        
        const list = document.getElementById('adminTutorList');
        if(list) {
            list.innerHTML = '';
            tutors.forEach(t => {
                list.innerHTML += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-3 px-4">${t.name}</td>
                        <td class="py-3 px-4">${t.email}</td>
                        <td class="py-3 px-4 text-right">
                            <button onclick="deleteTutor(${t.id})" class="text-red-500 hover:text-red-400 text-sm p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </td>
                    </tr>
                `;
            });
            lucide.createIcons();
        }
    } catch(err) {
        console.error(err);
    }
}

async function handleAddTutor(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('name', document.getElementById('tutorName').value);
    formData.append('email', document.getElementById('tutorEmail').value);
    formData.append('bio', document.getElementById('tutorBio').value);
    
    const file = document.getElementById('tutorImage').files[0];
    if(file) formData.append('image', file);
    
    try {
        const res = await fetch(`${API_URL}/tutors/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if(res.ok) {
            alert('Tutor added successfully!');
            e.target.reset();
            fetchAdminTutors();
        } else {
            const data = await res.json();
            alert('Error: ' + data.detail);
        }
    } catch(err) {
        console.error(err);
    }
}

async function deleteTutor(id) {
    if(!confirm("Are you sure you want to delete this tutor?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/tutors/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            fetchAdminTutors();
        }
    } catch(err) {
        console.error(err);
    }
}

async function handlePostAnnouncement(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API_URL}/announcements/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: document.getElementById('annTitle').value,
                content: document.getElementById('annContent').value
            })
        });
        if(res.ok) {
            alert('Announcement published successfully!');
            e.target.reset();
        }
    } catch(err) {
        console.error(err);
    }
}

function exportCSV() {
    if(!window.studentData) return;
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Registration Date'];
    const rows = window.studentData.map(u => [
        u.id, 
        u.full_name, 
        u.email, 
        u.role, 
        new Date(u.registration_date).toLocaleDateString()
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_demographics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Search Filter Logic
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchResources');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll('#resourceList li');
            items.forEach(item => {
                const text = item.innerText.toLowerCase();
                if(text.includes(term)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Auto check login status
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

    if(token) {
        if(role === 'admin' && !window.location.pathname.includes('/admin')) {
            if(isPreview) {
                // Admin viewing student side in preview mode
                initDashboard();
                // Show admin preview banner
                const banner = document.getElementById('adminPreviewBanner');
                if(banner) {
                    banner.classList.remove('hidden');
                    // Add bottom padding to body so content isn't hidden behind banner
                    document.body.style.paddingBottom = '64px';
                    lucide.createIcons();
                }
            } else {
                // Normal admin login → go to admin panel
                window.location.href = '/admin';
            }
        } else if (role !== 'admin' && !window.location.pathname.includes('/admin')) {
            initDashboard();
        }
    }
});
