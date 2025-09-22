// ==================== THEME MANAGER ====================
const ThemeManager = {
    themes: {
        default: {
            name: 'Default',
            primary: '#6366f1',
            secondary: '#8b5cf6',
            accent: '#ec4899',
            dark: '#0f172a',
            darker: '#020617',
            card: '#1e293b',
            light: '#334155',
            glassBg: 'rgba(30,41,59,0.7)',
            glassBorder: 'rgba(100,116,139,0.3)',
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)'
        },
        cosmic: {
            name: 'Cosmic',
            primary: '#6366f1',
            secondary: '#a78bfa',
            accent: '#fbbf24',
            dark: '#0f172a',
            darker: '#020617',
            card: '#1e293b',
            light: '#334155',
            glassBg: 'rgba(30, 41, 59, 0.7)',
            glassBorder: 'rgba(99, 102, 241, 0.2)',
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)'
        },
        forest: {
            name: 'Forest',
            primary: '#059669',
            secondary: '#10b981',
            accent: '#fbbf24',
            dark: '#064e3b',
            darker: '#022c22',
            card: '#065f46',
            light: '#047857',
            glassBg: 'rgba(6, 95, 70, 0.7)',
            glassBorder: 'rgba(16, 185, 129, 0.2)',
            background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)'
        },
        neon: {
            name: 'Neon',
            primary: '#ec4899',
            secondary: '#f472b6',
            accent: '#fbbf24',
            dark: '#1f0730',
            darker: '#16051f',
            card: '#2d1b3d',
            light: '#701a75',
            glassBg: 'rgba(45, 27, 61, 0.7)',
            glassBorder: 'rgba(236, 72, 153, 0.3)',
            background: 'linear-gradient(135deg, #16051f 0%, #1f0730 100%)'
        }
    },
    
    currentTheme: 'default',
    customThemes: [],
    
    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.initializeThemeButtons();
        this.loadCustomThemes();
    },
    
    loadTheme() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'default';
        this.applyTheme(savedTheme);
    },
    
    applyTheme(themeName) {
        const theme = this.themes[themeName] || this.customThemes.find(t => t.id === themeName) || this.themes.default;
        
        if (!theme) return;
        
        this.currentTheme = themeName;
        
        // Update CSS variables
        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--dark', theme.dark);
        root.style.setProperty('--darker', theme.darker);
        root.style.setProperty('--card', theme.card);
        root.style.setProperty('--light', theme.light);
        root.style.setProperty('--glass-bg', theme.glassBg);
        root.style.setProperty('--glass-border', theme.glassBorder);
        
        // Update body background
        document.body.style.background = theme.background;
        
        // Update body class
        document.body.className = document.body.className.replace(/\w*-theme/g, '');
        document.body.classList.add(`${themeName}-theme`);
        
        // Save to localStorage
        localStorage.setItem('selectedTheme', themeName);
        
        // Update active button
        this.updateActiveButton(themeName);
        
        // Track analytics
        if (window.AnalyticsManager) {
            AnalyticsManager.trackThemeChange(themeName);
        }
    },
    
    setupEventListeners() {
        // Theme button listeners
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-btn')) {
                const btn = e.target.closest('.theme-btn');
                const themeName = btn.dataset.theme;
                this.applyTheme(themeName);
            }
        });
        
        // Custom theme creation
        const createThemeBtn = document.getElementById('create-theme-btn');
        if (createThemeBtn) {
            createThemeBtn.addEventListener('click', () => this.showCreateThemeModal());
        }
    },
    
    initializeThemeButtons() {
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            const themeName = btn.dataset.theme;
            if (themeName === this.currentTheme) {
                btn.classList.add('active');
            }
        });
    },
    
    updateActiveButton(themeName) {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === themeName) {
                btn.classList.add('active');
            }
        });
    },
    
    showCreateThemeModal() {
        const modal = document.getElementById('create-theme-modal');
        if (modal) {
            modal.classList.add('show');
            this.setupCreateThemeForm();
        }
    },
    
    setupCreateThemeForm() {
        const form = document.getElementById('create-theme-form');
        if (!form) return;
        
        form.onsubmit = (e) => {
            e.preventDefault();
            this.createCustomTheme(form);
        };
    },
    
    createCustomTheme(form) {
        const formData = new FormData(form);
        const theme = {
            id: 'custom_' + Date.now(),
            name: formData.get('theme-name'),
            primary: formData.get('primary-color'),
            secondary: formData.get('secondary-color'),
            accent: formData.get('accent-color'),
            dark: formData.get('dark-color'),
            darker: this.adjustColor(formData.get('dark-color'), -20),
            card: this.adjustColor(formData.get('dark-color'), 10),
            light: this.adjustColor(formData.get('dark-color'), 30),
            glassBg: 'rgba(30,41,59,0.7)',
            glassBorder: 'rgba(100,116,139,0.3)',
            background: `linear-gradient(135deg, ${this.adjustColor(formData.get('dark-color'), -20)} 0%, ${formData.get('dark-color')} 100%)`
        };
        
        // Validate theme
        if (this.validateTheme(theme)) {
            this.customThemes.push(theme);
            this.saveCustomThemes();
            this.applyTheme(theme.id);
            this.renderCustomThemes();
            
            // Close modal
            const modal = document.getElementById('create-theme-modal');
            if (modal) {
                modal.classList.remove('show');
            }
            
            showNotification('Tema kustom berhasil dibuat!', 'success');
        } else {
            showNotification('Warna tema tidak valid!', 'error');
        }
    },
    
    validateTheme(theme) {
        const colorRegex = /^#[0-9A-F]{6}$/i;
        return colorRegex.test(theme.primary) && 
               colorRegex.test(theme.secondary) && 
               colorRegex.test(theme.accent) && 
               colorRegex.test(theme.dark);
    },
    
    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    },
    
    saveCustomThemes() {
        localStorage.setItem('mythicascend_custom_themes', JSON.stringify(this.customThemes));
    },
    
    loadCustomThemes() {
        const saved = localStorage.getItem('mythicascend_custom_themes');
        if (saved) {
            this.customThemes = JSON.parse(saved);
            this.renderCustomThemes();
        }
    },
    
    renderCustomThemes() {
        const container = document.getElementById('custom-themes-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.customThemes.forEach(theme => {
            const themeElement = document.createElement('div');
            themeElement.className = 'custom-theme-item p-3 rounded-lg bg-slate-800/40 mb-2';
            themeElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded" style="background: ${theme.primary}"></div>
                        <span class="text-sm">${theme.name}</span>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="ThemeManager.applyTheme('${theme.id}')" class="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">Apply</button>
                        <button onclick="ThemeManager.deleteCustomTheme('${theme.id}')" class="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(themeElement);
        });
    },
    
    deleteCustomTheme(themeId) {
        if (confirm('Apakah Anda yakin ingin menghapus tema ini?')) {
            this.customThemes = this.customThemes.filter(t => t.id !== themeId);
            this.saveCustomThemes();
            this.renderCustomThemes();
            showNotification('Tema berhasil dihapus!', 'success');
        }
    },
    
    exportTheme(themeId) {
        const theme = this.themes[themeId] || this.customThemes.find(t => t.id === themeId);
        if (!theme) return;
        
        const themeData = JSON.stringify(theme, null, 2);
        const blob = new Blob([themeData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${theme.name || 'custom'}-theme.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },
    
    importTheme() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const theme = JSON.parse(event.target.result);
                    if (this.validateTheme(theme)) {
                        theme.id = 'imported_' + Date.now();
                        this.customThemes.push(theme);
                        this.saveCustomThemes();
                        this.renderCustomThemes();
                        showNotification('Tema berhasil diimpor!', 'success');
                    } else {
                        showNotification('File tema tidak valid!', 'error');
                    }
                } catch (error) {
                    showNotification('Error membaca file tema!', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    },
    
    resetToDefault() {
        if (confirm('Apakah Anda yakin ingin reset ke tema default?')) {
            this.applyTheme('default');
            showNotification('Tema direset ke default!', 'success');
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

// Export for global access
window.ThemeManager = ThemeManager;