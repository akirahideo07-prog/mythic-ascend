// ==================== VARIABEL GLOBAL ====================
let xp = 0;
let level = 1;
let prestigeLevel = 0;
let skillLevels = {};
let skillXP = {};
let totalTasksCompleted = 0;
let achievements = [];
let streak = 0;
let lastActivityDate = new Date().toDateString();
let actionHistory = [];
let tasks = [];
let skills = [];
let notificationsEnabled = true;
let weeklyLeaderboard = [];
let alltimeLeaderboard = [];
let hiddenAchievements = [];
let completedTasksToday = 0;
let lastCompletedTaskDate = new Date().toDateString();
let autosaveEnabled = true;
let soundEnabled = true;

// ==================== KONSTANTA ====================
const skillCategories = {
    'produktivitas': 'Produktivitas',
    'kesehatan': 'Kesehatan',
    'pembelajaran': 'Pembelajaran',
    'sosial': 'Sosial'
};

const skillBonuses = {
    5: { name: "Pemula", description: "+5% XP untuk tugas terkait", bonus: 0.05 },
    10: { name: "Terampil", description: "+10% XP untuk tugas terkait", bonus: 0.10 },
    15: { name: "Ahli", description: "+15% XP untuk tugas terkait", bonus: 0.15 },
    20: { name: "Master", description: "+20% XP untuk tugas terkait", bonus: 0.20 },
    25: { name: "Grandmaster", description: "+25% XP untuk tugas terkait", bonus: 0.25 }
};

const ranks = [
    { name: "Pemula", icon: "star", xpRequired: 0 },
    { name: "Novice I", icon: "looks_one", xpRequired: 100 },
    { name: "Novice II", icon: "looks_two", xpRequired: 250 },
    { name: "Novice III", icon: "looks_3", xpRequired: 500 },
    { name: "Apprentice I", icon: "auto_awesome", xpRequired: 800 },
    { name: "Apprentice II", icon: "auto_awesome", xpRequired: 1200 },
    { name: "Apprentice III", icon: "auto_awesome", xpRequired: 1600 },
    { name: "Junior I", icon: "workspace_premium", xpRequired: 2000 },
    { name: "Junior II", icon: "workspace_premium", xpRequired: 2500 },
    { name: "Junior III", icon: "workspace_premium", xpRequired: 3000 },
    { name: "Intermediate I", icon: "diamond", xpRequired: 3600 },
    { name: "Intermediate II", icon: "diamond", xpRequired: 4200 },
    { name: "Intermediate III", icon: "diamond", xpRequired: 4800 },
    { name: "Senior I", icon: "military_tech", xpRequired: 5500 },
    { name: "Senior II", icon: "military_tech", xpRequired: 6200 },
    { name: "Senior III", icon: "military_tech", xpRequired: 6900 },
    { name: "Expert I", icon: "emoji_events", xpRequired: 7700 },
    { name: "Expert II", icon: "emoji_events", xpRequired: 8500 },
    { name: "Expert III", icon: "emoji_events", xpRequired: 9300 },
    { name: "Master I", icon: "crisis_alert", xpRequired: 10200 },
    { name: "Master II", icon: "crisis_alert", xpRequired: 11100 },
    { name: "Master III", icon: "crisis_alert", xpRequired: 12000 },
    { name: "Grandmaster", icon: "whatshot", xpRequired: 13000 }
];

// ==================== INISIALISASI ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Load game state
        await loadGameState();
        
        // Initialize managers
        ThemeManager.init();
        SoundManager.init();
        AnalyticsManager.init();
        AutoSaveIndicator.init();
        OfflineManager.init();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        updatePrestigeUI();
        
        // Check daily streak
        checkDailyStreak();
        
        // Initialize tutorial if needed
        if (!tutorialManager.completed) {
            setTimeout(() => tutorialManager.showTutorial(), 1000);
        }
        
        console.log('Mythic Ascend v1.1 initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error memulai aplikasi. Silakan refresh halaman.', 'error');
    }
}

function setupEventListeners() {
    // Task type change handler
    const taskTypeSelect = document.getElementById('taskType');
    if (taskTypeSelect) {
        taskTypeSelect.addEventListener('change', handleTaskTypeChange);
    }
    
    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }
    
    // Add skill button
    const addSkillBtn = document.getElementById('addSkillBtn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', addSkill);
    }
    
    // Settings toggles
    const notificationToggle = document.getElementById('notification-toggle');
    if (notificationToggle) {
        notificationToggle.addEventListener('change', handleNotificationToggle);
    }
    
    const autosaveToggle = document.getElementById('autosave-toggle');
    if (autosaveToggle) {
        autosaveToggle.addEventListener('change', handleAutosaveToggle);
    }
    
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', handleSoundToggle);
    }
    
    // Data management buttons
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importData);
    }
    
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetData);
    }
    
    // Prestige reset button
    const prestigeResetBtn = document.getElementById('prestigeResetBtn');
    if (prestigeResetBtn) {
        prestigeResetBtn.addEventListener('click', prestigeReset);
    }
    
    // Share achievements button
    const shareAchievementsBtn = document.getElementById('shareAchievementsBtn');
    if (shareAchievementsBtn) {
        shareAchievementsBtn.addEventListener('click', shareAchievements);
    }
    
    // Analytics button
    const analyticsBtn = document.querySelector('[onclick*="showAnalytics"]');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', showAnalytics);
    }
    
    // Auto-save on page visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Auto-save before unload
    window.addEventListener('beforeunload', handleBeforeUnload);
}

// ==================== EVENT HANDLERS ====================
function handleTaskTypeChange(e) {
    const customXPContainer = document.getElementById('customXPContainer');
    if (customXPContainer) {
        if (e.target.value === 'custom') {
            customXPContainer.classList.remove('hidden');
        } else {
            customXPContainer.classList.add('hidden');
        }
    }
}

function handleNotificationToggle(e) {
    notificationsEnabled = e.target.checked;
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
    showNotification(`Notifikasi ${notificationsEnabled ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
}

function handleAutosaveToggle(e) {
    autosaveEnabled = e.target.checked;
    localStorage.setItem('autosaveEnabled', autosaveEnabled);
    showNotification(`Auto-save ${autosaveEnabled ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
}

function handleSoundToggle(e) {
    soundEnabled = e.target.checked;
    SoundManager.setEnabled(soundEnabled);
    localStorage.setItem('soundEnabled', soundEnabled);
    showNotification(`Sound effects ${soundEnabled ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
}

async function handleVisibilityChange() {
    if (document.visibilityState === 'hidden' && autosaveEnabled) {
        await saveGameState();
    }
}

async function handleBeforeUnload() {
    if (autosaveEnabled) {
        await saveGameState();
    }
}

// ==================== LEVEL & XP SYSTEM ====================
function updatePlayerLevel() {
    const newLevel = Math.floor(xp / 100) + 1;
    
    if (newLevel > level) {
        const levelsGained = newLevel - level;
        level = newLevel;
        
        // Show level up notification
        if (levelsGained === 1) {
            showNotification(`🎉 Level up! Sekarang level ${level}`, 'success');
        } else {
            showNotification(`🎉 Level up! Naik ${levelsGained} level ke level ${level}`, 'success');
        }
        
        logActivity(`Naik ke level ${level}`);
        
        // Play sound
        if (soundEnabled) {
            SoundManager.play('levelup');
        }
        
        // Trigger confetti
        triggerConfetti();
        
        // Auto-save
        if (autosaveEnabled) {
            saveGameState();
        }
    }
}

function calculateTaskXP(task) {
    let baseXP = task.xp;
    
    // Apply skill bonus if applicable
    if (task.skill && skillLevels[task.skill]) {
        const skillLevel = skillLevels[task.skill];
        const bonusLevel = Math.floor(skillLevel / 5) * 5;
        
        if (skillBonuses[bonusLevel]) {
            const bonusMultiplier = 1 + skillBonuses[bonusLevel].bonus;
            baseXP = Math.floor(baseXP * bonusMultiplier);
        }
    }
    
    // Apply prestige bonus
    const prestigeBonus = 1 + (prestigeLevel * 0.05);
    return Math.floor(baseXP * prestigeBonus);
}

// ==================== UTILITY FUNCTIONS ====================
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced save function
const debouncedSave = debounce(saveGameState, 1000);

// ==================== ERROR HANDLING ====================
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    showNotification(`Terjadi error: ${error.message}`, 'error');
    
    // Log error for analytics
    if (window.AnalyticsManager) {
        AnalyticsManager.trackError(error, context);
    }
}

// Global error handler
window.addEventListener('error', function(event) {
    handleError(event.error, 'Global Error Handler');
});

window.addEventListener('unhandledrejection', function(event) {
    handleError(event.reason, 'Unhandled Promise Rejection');
});