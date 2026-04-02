// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================

function initDB() {
    if (!localStorage.getItem('admin_users')) {
        const users = [
            { login: 'admin', password: '1234', role: 'administrator' },
            { login: 'editor', password: '0000', role: 'editor' }
        ];
        localStorage.setItem('admin_users', JSON.stringify(users));
    }
    
    if (!localStorage.getItem('articles_data')) {
        const articles = [
            {
                id: 1,
                title: 'Добро пожаловать!',
                content: 'Это пример статьи. Вы можете создавать новые статьи, редактировать и удалять их.',
                author: 'admin',
                date: new Date().toLocaleDateString()
            },
            {
                id: 2,
                title: 'Как работать с панелью',
                content: 'Используйте форму сверху для добавления статей. Для редактирования нажмите "Редактировать" на любой статье.',
                author: 'editor',
                date: new Date().toLocaleDateString()
            }
        ];
        localStorage.setItem('articles_data', JSON.stringify(articles));
    }
}

// ==================== УВЕДОМЛЕНИЯ ====================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==================== ОБНОВЛЕНИЕ ДАШБОРДА ====================

function updateDashboard() {
    const articles = JSON.parse(localStorage.getItem('articles_data')) || [];
    const totalArticles = articles.length;
    const totalStat = document.getElementById('totalArticlesStat');
    if (totalStat) totalStat.textContent = totalArticles;
    
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        const roleText = currentUser.role === 'administrator' ? 'Администратор' : 'Редактор';
        const roleStat = document.getElementById('userRoleStat');
        if (roleStat) roleStat.textContent = roleText;
    }
    
    const lastBackup = localStorage.getItem('last_backup_date');
    const lastRestore = localStorage.getItem('last_restore_date');
    let backupInfo = '';
    
    if (lastBackup) {
        backupInfo = `📦 Последний бэкап: ${lastBackup}`;
    }
    if (lastRestore) {
        backupInfo += backupInfo ? `<br>🔄 Восстановление: ${lastRestore}` : `🔄 Восстановление: ${lastRestore}`;
    }
    if (!lastBackup && !lastRestore) {
        backupInfo = 'Бэкапы не создавались';
    }
    
    const lastBackupStat = document.getElementById('lastBackupStat');
    if (lastBackupStat) {
        lastBackupStat.innerHTML = backupInfo;
    }
}

// ==================== ОТОБРАЖЕНИЕ ПОЛЬЗОВАТЕЛЕЙ ====================

function renderUsersTable() {
    const users = JSON.parse(localStorage.getItem('admin_users')) || [];
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    let html = '';
    users.forEach(user => {
        const roleText = user.role === 'administrator' ? '👑 Администратор' : '✍️ Редактор';
        html += `<tr><td>${user.login}</td><td>${roleText}</td></tr>`;
    });
    tbody.innerHTML = html;
}

// ==================== ОБРАБОТКА ВХОДА ====================

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    
    const users = JSON.parse(localStorage.getItem('admin_users'));
    const user = users.find(u => u.login === username && u.password === password);
    
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify({
            login: user.login,
            role: user.role
        }));
        showAdminPanel(user);
        showNotification(`Добро пожаловать, ${user.login}!`, 'success');
    } else {
        loginError.textContent = '❌ Неверный логин или пароль';
    }
}

// ==================== ОТОБРАЖЕНИЕ ПАНЕЛИ ====================

function showAdminPanel(user) {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    const userDisplay = document.getElementById('currentUserDisplay');
    if (userDisplay) userDisplay.textContent = user.login;
    
    applyRoleRestrictions(user.role);
    showSection('dashboard');
    renderArticlesTable();
    updateDashboard();
    renderUsersTable();
}

// ==================== RBAC ====================

function applyRoleRestrictions(role) {
    const usersMenuItem = document.getElementById('usersMenuItem');
    if (usersMenuItem) {
        usersMenuItem.style.display = role === 'editor' ? 'none' : 'block';
    }
}

// ==================== НАВИГАЦИЯ ====================

function showSection(sectionName) {
    const sections = ['dashboardSection', 'articlesSection', 'usersSection', 'settingsSection'];
    sections.forEach(section => {
        const el = document.getElementById(section);
        if (el) el.style.display = 'none';
    });
    
    const target = document.getElementById(`${sectionName}Section`);
    if (target) target.style.display = 'block';
    
    if (sectionName === 'articles') renderArticlesTable();
    if (sectionName === 'users') renderUsersTable();
    if (sectionName === 'dashboard') updateDashboard();
}

// ==================== CRUD: ЧТЕНИЕ ====================

function renderArticlesTable() {
    const articles = JSON.parse(localStorage.getItem('articles_data')) || [];
    const tbody = document.getElementById('articlesTableBody');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!tbody) return;
    
    if (articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">📭 Нет статей. Добавьте первую статью!</td></tr>';
        return;
    }
    
    let html = '';
    articles.forEach(article => {
        const canEditDelete = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'editor');
        const previewContent = article.content.length > 100 ? article.content.substring(0, 100) + '...' : article.content;
        
        let actionButtons = '';
        if (canEditDelete) {
            actionButtons = `
                <button class="btn-edit" data-id="${article.id}">✏️ Редактировать</button>
                <button class="btn-delete" data-id="${article.id}">🗑️ Удалить</button>
            `;
        } else {
            actionButtons = '<span style="color: gray;">🔒 Нет прав</span>';
        }
        
        html += `
            <tr>
                <td>${article.id}</td>
                <td><strong>${escapeHtml(article.title)}</strong></td>
                <td><div class="article-content-preview" title="${escapeHtml(article.content)}">${escapeHtml(previewContent)}</div></td>
                <td>${article.author}</td>
                <td>${article.date}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editArticle(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteArticle(parseInt(btn.dataset.id)));
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== CRUD: СОЗДАНИЕ ====================

function addArticle() {
    const title = document.getElementById('articleTitle').value.trim();
    const content = document.getElementById('articleContent').value.trim();
    
    if (!title || !content) {
        showNotification('❌ Заполните заголовок и текст статьи', 'error');
        return;
    }
    
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const articles = JSON.parse(localStorage.getItem('articles_data')) || [];
    const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
    
    const newArticle = {
        id: newId,
        title: title,
        content: content,
        author: currentUser.login,
        date: new Date().toLocaleDateString()
    };
    
    articles.push(newArticle);
    localStorage.setItem('articles_data', JSON.stringify(articles));
    
    document.getElementById('articleTitle').value = '';
    document.getElementById('articleContent').value = '';
    document.getElementById('editArticleId').value = '';
    document.getElementById('formTitle').innerHTML = '➕ Добавить новую статью';
    
    renderArticlesTable();
    updateDashboard();
    showNotification('✅ Статья добавлена!', 'success');
}

// ==================== CRUD: РЕДАКТИРОВАНИЕ ====================

function editArticle(id) {
    const articles = JSON.parse(localStorage.getItem('articles_data'));
    const article = articles.find(a => a.id === id);
    
    if (article) {
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleContent').value = article.content;
        document.getElementById('editArticleId').value = article.id;
        document.getElementById('formTitle').innerHTML = '✏️ Редактировать статью';
        document.querySelector('.article-form').scrollIntoView({ behavior: 'smooth' });
    }
}

function updateArticle() {
    const id = parseInt(document.getElementById('editArticleId').value);
    
    if (!id) {
        addArticle();
        return;
    }
    
    const title = document.getElementById('articleTitle').value.trim();
    const content = document.getElementById('articleContent').value.trim();
    
    if (!title || !content) {
        showNotification('❌ Заполните заголовок и текст статьи', 'error');
        return;
    }
    
    const articles = JSON.parse(localStorage.getItem('articles_data'));
    const index = articles.findIndex(a => a.id === id);
    
    if (index !== -1) {
        articles[index] = { ...articles[index], title, content };
        localStorage.setItem('articles_data', JSON.stringify(articles));
        
        document.getElementById('articleTitle').value = '';
        document.getElementById('articleContent').value = '';
        document.getElementById('editArticleId').value = '';
        document.getElementById('formTitle').innerHTML = '➕ Добавить новую статью';
        
        renderArticlesTable();
        updateDashboard();
        showNotification('✅ Статья обновлена!', 'success');
    }
}

// ==================== CRUD: УДАЛЕНИЕ ====================

function deleteArticle(id) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const articles = JSON.parse(localStorage.getItem('articles_data'));
    const article = articles.find(a => a.id === id);
    
    const canDelete = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'editor');
    
    if (!canDelete) {
        showNotification('🔒 Нет прав на удаление!', 'error');
        return;
    }
    
    if (confirm(`Удалить статью "${article.title}"?`)) {
        const newArticles = articles.filter(a => a.id !== id);
        localStorage.setItem('articles_data', JSON.stringify(newArticles));
        renderArticlesTable();
        updateDashboard();
        showNotification('🗑️ Статья удалена!', 'success');
    }
}

// ==================== БЭКАП: ЭКСПОРТ ====================

function exportBackup() {
    try {
        const dump = {
            admin_users: localStorage.getItem('admin_users'),
            articles_data: localStorage.getItem('articles_data'),
            backup_date: new Date().toLocaleString(),
            version: '1.0'
        };
        
        const jsonString = JSON.stringify(dump, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toLocaleDateString().replace(/\./g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        localStorage.setItem('last_backup_date', new Date().toLocaleString());
        updateDashboard();
        showNotification('✅ Бэкап создан!', 'success');
        
    } catch (error) {
        showNotification('❌ Ошибка создания бэкапа', 'error');
    }
}

// ==================== БЭКАП: ИМПОРТ ====================

function importBackup(file) {
    if (!file) {
        showNotification('❌ Выберите файл', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (!backupData.admin_users || !backupData.articles_data) {
                throw new Error('Неверный формат');
            }
            
            if (confirm('⚠️ ВНИМАНИЕ! Данные будут полностью заменены. Продолжить?')) {
                localStorage.setItem('admin_users', backupData.admin_users);
                localStorage.setItem('articles_data', backupData.articles_data);
                localStorage.setItem('last_restore_date', new Date().toLocaleString());
                showNotification('✅ Данные восстановлены! Страница перезагрузится.', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            showNotification('❌ Неверный формат файла', 'error');
        }
    };
    reader.readAsText(file);
}

// ==================== ВЫХОД ====================

function logout() {
    sessionStorage.removeItem('currentUser');
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.textContent = '';
    showNotification('👋 Вы вышли', 'success');
}

// ==================== ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ ====================

function initEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    const navLinks = document.querySelectorAll('.sidebar ul li a[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) showSection(section);
        });
    });
    
    const saveBtn = document.getElementById('saveArticleBtn');
    if (saveBtn) saveBtn.addEventListener('click', updateArticle);
    
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) backupBtn.addEventListener('click', exportBackup);
    
    const restoreBtn = document.getElementById('restoreBtn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('restoreFile');
            if (fileInput && fileInput.files[0]) {
                importBackup(fileInput.files[0]);
                fileInput.value = '';
            } else {
                showNotification('❌ Выберите JSON-файл', 'error');
            }
        });
    }
}

// ==================== ПРОВЕРКА СЕССИИ ====================

function checkExistingSession() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        showAdminPanel(user);
    }
}

// ==================== ЗАПУСК ====================

initDB();
initEventListeners();
checkExistingSession();