// ==================== UPDATE UI ====================
// Cache for DOM elements
const uiElements = {
    level: null,
    totalXP: null,
    globalFill: null,
    rankName: null,
    rankIcon: null,
    totalTasksCompleted: null,
    totalSkills: null,
    achievementCount: null,
    daysActive: null,
    streakCount: null,
    prestigeIndicator: null,
    prestigeLevel: null,
    prestigeBonus: null,
    lastSaved: null,
    storageInfo: null
};

// Initialize elements
function initUIElements() {
    uiElements.level = document.getElementById('level');
    uiElements.totalXP = document.getElementById('totalXP');
    uiElements.globalFill = document.getElementById('globalFill');
    uiElements.rankName = document.getElementById('rankName');
    uiElements.rankIcon = document.getElementById('rankIcon');
    uiElements.totalTasksCompleted = document.getElementById('totalTasksCompleted');
    uiElements.totalSkills = document.getElementById('totalSkills');
    uiElements.achievementCount = document.getElementById('achievementCount');
    uiElements.daysActive = document.getElementById('daysActive');
    uiElements.streakCount = document.getElementById('streakCount');
    uiElements.prestigeIndicator = document.getElementById('prestige-indicator');
    uiElements.prestigeLevel = document.getElementById('prestigeLevel');
    uiElements.prestigeBonus = document.getElementById('prestigeBonus');
    uiElements.lastSaved = document.getElementById('last-saved');
    uiElements.storageInfo = document.getElementById('storage-info');
}

// ==================== MAIN UI UPDATE ====================
function updateUI() {
    if (!uiElements.level) return;
    
    try {
        // Update basic stats with animation
        animateValue(uiElements.level, level, 'level');
        animateValue(uiElements.totalXP, xp, 'xp');
        
        // Update progress bar
        updateProgressBar();
        
        // Update rank
        updateRank();
        
        // Update statistics
        updateStatistics();
        
        // Update achievements
        renderAchievements();
        
        // Update last saved time
        updateLastSavedTime();
        
    } catch (error) {
        handleError(error, 'updateUI');
    }
}

function animateValue(element, newValue, type) {
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (newValue - startValue) * progress);
        
        if (type === 'xp') {
            element.textContent = currentValue.toLocaleString();
        } else {
            element.textContent = currentValue;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateProgressBar() {
    if (!uiElements.globalFill) return;
    
    const xpForNextLevel = level * 100;
    const currentLevelXP = (level - 1) * 100;
    const progressXP = Math.max(0, xp - currentLevelXP);
    const progressPercent = Math.min((progressXP / 100) * 100, 100);
    
    uiElements.globalFill.style.width = `${progressPercent}%`;
    uiElements.globalFill.textContent = `${Math.round(progressPercent)}%`;
    uiElements.globalFill.setAttribute('aria-valuenow', Math.round(progressPercent));
}

function updateStatistics() {
    if (!uiElements.totalTasksCompleted) return;
    
    // Update stats with animation
    animateValue(uiElements.totalTasksCompleted, totalTasksCompleted, 'tasks');
    animateValue(uiElements.totalSkills, skills.length, 'skills');
    animateValue(uiElements.achievementCount, achievements.length, 'achievements');
    
    // Calculate days active
    const daysActive = calculateDaysActive();
    if (uiElements.daysActive) {
        uiElements.daysActive.textContent = daysActive;
    }
    
    // Update streak
    if (uiElements.streakCount) {
        uiElements.streakCount.textContent = streak;
    }
}

function calculateDaysActive() {
    try {
        const lastActivity = new Date(lastActivityDate);
        const today = new Date();
        const diffTime = Math.abs(today - lastActivity);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch (error) {
        console.error('Error calculating days active:', error);
        return 1;
    }
}

function updateRank() {
    if (!uiElements.rankName || !uiElements.rankIcon) return;
    
    let currentRank = ranks[0];
    
    // Find current rank
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (xp >= ranks[i].xpRequired) {
            currentRank = ranks[i];
            break;
        }
    }
    
    uiElements.rankName.textContent = currentRank.name;
    uiElements.rankIcon.textContent = currentRank.icon;
}

function updatePrestigeUI() {
    if (!uiElements.prestigeIndicator || !uiElements.prestigeLevel || !uiElements.prestigeBonus) return;
    
    if (prestigeLevel > 0) {
        uiElements.prestigeIndicator.classList.remove('hidden');
        uiElements.prestigeIndicator.textContent = `Prestige ${prestigeLevel}`;
    } else {
        uiElements.prestigeIndicator.classList.add('hidden');
    }
    
    uiElements.prestigeLevel.textContent = prestigeLevel;
    const bonusPercentage = prestigeLevel * 5;
    uiElements.prestigeBonus.textContent = `${bonusPercentage}%`;
}

function updateLastSavedTime() {
    if (uiElements.lastSaved) {
        const now = new Date();
        uiElements.lastSaved.textContent = now.toLocaleTimeString('id-ID');
    }
}

// ==================== NOTIFIKASI SYSTEM ====================
// Notification queue system
let notificationQueue = [];
let isShowingNotification = false;

const showNotification = (message, type = 'info') => {
    if (!notificationsEnabled) return;
    
    // Add to queue
    notificationQueue.push({ message, type });
    
    // Process queue if not already showing
    if (!isShowingNotification) {
        processNotificationQueue();
    }
};

function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }
    
    isShowingNotification = true;
    const { message, type } = notificationQueue.shift();
    
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    // Create notification element
    const notification = createNotificationElement(message, type);
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            // Process next notification
            processNotificationQueue();
        }, 300);
    }, 5000);
}

function createNotificationElement(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="flex items-start">
            <span class="mr-2" aria-hidden="true">${icon}</span>
            <div>${sanitizeHTML(message)}</div>
        </div>
    `;
    
    return notification;
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// ==================== ACTIVITY LOG ====================
// Activity log management
const MAX_LOG_ENTRIES = 100;
const MAX_VISIBLE_LOG_ENTRIES = 10;

function logActivity(message) {
    const log = document.getElementById('log');
    if (!log) return;
    
    const timestamp = new Date().toLocaleTimeString('id-ID');
    
    // Create log entry
    const logEntry = createLogEntry(message, timestamp);
    
    // Add to history
    actionHistory.unshift({
        message,
        timestamp: new Date().toISOString()
    });
    
    // Limit history size
    if (actionHistory.length > MAX_LOG_ENTRIES) {
        actionHistory = actionHistory.slice(0, MAX_LOG_ENTRIES);
    }
    
    // Update UI
    updateActivityLog(log, logEntry);
    
    // Track analytics
    if (window.AnalyticsManager) {
        AnalyticsManager.trackActivity(message);
    }
}

function createLogEntry(message, timestamp) {
    const logEntry = document.createElement('div');
    logEntry.className = 'text-slate-300 mb-1 fade-in';
    logEntry.textContent = `[${timestamp}] ${sanitizeHTML(message)}`;
    return logEntry;
}

function updateActivityLog(log, logEntry) {
    // Clear "no activity" message if present
    if (log.children.length === 1 && log.children[0].textContent.includes('Tidak ada aktivitas')) {
        log.innerHTML = '';
    }
    
    // Add new entry at the top
    log.insertBefore(logEntry, log.firstChild);
    
    // Limit visible entries
    while (log.children.length > MAX_VISIBLE_LOG_ENTRIES) {
        log.removeChild(log.lastChild);
    }
    
    // Scroll to top
    log.scrollTop = 0;
}

// ==================== MODALS ====================
// Modal management
const modals = {
    ranks: {
        element: null,
        list: null
    },
    leaderboard: {
        element: null,
        list: null,
        weeklyBtn: null,
        alltimeBtn: null
    },
    analytics: {
        element: null,
        content: null
    }
};

function initModals() {
    modals.ranks.element = document.getElementById('ranks-modal');
    modals.ranks.list = document.getElementById('ranks-list');
    
    modals.leaderboard.element = document.getElementById('leaderboard-modal');
    modals.leaderboard.list = document.getElementById('leaderboard-list');
    modals.leaderboard.weeklyBtn = document.getElementById('leaderboard-weekly');
    modals.leaderboard.alltimeBtn = document.getElementById('leaderboard-alltime');
    
    modals.analytics.element = document.getElementById('analytics-modal');
    modals.analytics.content = document.getElementById('analytics-content');
}

function showRanksModal() {
    if (!modals.ranks.element || !modals.ranks.list) return;
    
    // Clear existing content
    modals.ranks.list.innerHTML = '';
    
    // Render ranks
    ranks.forEach((rank, index) => {
        const rankElement = createRankElement(rank, index);
        modals.ranks.list.appendChild(rankElement);
    });
    
    // Show modal
    modals.ranks.element.classList.add('show');
    
    // Focus management
    trapFocus(modals.ranks.element);
    
    // Track analytics
    if (window.AnalyticsManager) {
        AnalyticsManager.trackModalView('ranks');
    }
}

function createRankElement(rank, index) {
    const rankItem = document.createElement('div');
    const isCurrent = isCurrentRank(rank, index);
    const isUnlocked = xp >= rank.xpRequired;
    
    rankItem.className = `rank-item p-3 rounded-lg mb-2 transition-all duration-200 ${isCurrent ? 'current' : isUnlocked ? 'unlocked' : 'locked'}`;
    rankItem.setAttribute('role', 'listitem');
    
    const statusText = isCurrent ? 'Current' : isUnlocked ? 'Unlocked' : 'Locked';
    const statusClass = isCurrent ? 'indigo' : isUnlocked ? 'green' : 'gray';
    
    rankItem.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-2xl ${isCurrent ? 'text-yellow-400' : isUnlocked ? 'text-green-400' : 'text-gray-500'}" aria-hidden="true">${rank.icon}</span>
            <div class="flex-1">
                <div class="font-medium">${sanitizeHTML(rank.name)}</div>
                <div class="text-xs text-slate-400">${rank.xpRequired.toLocaleString()} XP</div>
            </div>
            <span class="text-xs bg-${statusClass}-600 text-white px-2 py-1 rounded">${statusText}</span>
        </div>
    `;
    
    return rankItem;
}

function isCurrentRank(rank, index) {
    const isCurrentRank = xp >= rank.xpRequired;
    const isNextRankUnlocked = index === ranks.length - 1 || xp < ranks[index + 1].xpRequired;
    return isCurrentRank && isNextRankUnlocked;
}

function closeRanksModal() {
    if (modals.ranks.element) {
        modals.ranks.element.classList.remove('show');
    }
}

function showLeaderboard(type) {
    if (!modals.leaderboard.element || !modals.leaderboard.list) return;
    
    // Update button states
    updateLeaderboardButtons(type);
    
    // Clear and render leaderboard
    modals.leaderboard.list.innerHTML = '';
    const leaderboard = getLeaderboardData(type);
    
    leaderboard.forEach((entry, index) => {
        const entryElement = createLeaderboardEntry(entry, index);
        modals.leaderboard.list.appendChild(entryElement);
    });
    
    // Show modal
    modals.leaderboard.element.classList.add('show');
    
    // Focus management
    trapFocus(modals.leaderboard.element);
    
    // Track analytics
    if (window.AnalyticsManager) {
        AnalyticsManager.trackModalView('leaderboard', { type });
    }
}

function updateLeaderboardButtons(type) {
    if (!modals.leaderboard.weeklyBtn || !modals.leaderboard.alltimeBtn) return;
    
    if (type === 'weekly') {
        modals.leaderboard.weeklyBtn.className = 'btn-primary px-3 py-1 rounded text-sm';
        modals.leaderboard.alltimeBtn.className = 'bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm';
    } else {
        modals.leaderboard.weeklyBtn.className = 'bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm';
        modals.leaderboard.alltimeBtn.className = 'btn-primary px-3 py-1 rounded text-sm';
    }
}

function getLeaderboardData(type) {
    const leaderboard = type === 'weekly' ? weeklyLeaderboard : alltimeLeaderboard;
    
    // Check if current player is in leaderboard
    const currentPlayerIndex = leaderboard.findIndex(entry => entry.id === 'current');
    if (currentPlayerIndex === -1) {
        // Add current player
        const currentPlayerEntry = {
            id: 'current',
            name: 'Anda',
            xp: xp,
            level: level,
            prestige: prestigeLevel,
            tasks: totalTasksCompleted,
            timestamp: new Date().toISOString()
        };
        
        leaderboard.push(currentPlayerEntry);
        
        // Sort and limit
        sortLeaderboard(leaderboard);
        if (leaderboard.length > 10) leaderboard.pop();
        
        // Save updated leaderboard
        if (type === 'weekly') {
            weeklyLeaderboard = leaderboard;
        } else {
            alltimeLeaderboard = leaderboard;
        }
        
        saveGameState();
    }
    
    return leaderboard;
}

function sortLeaderboard(leaderboard) {
    leaderboard.sort((a, b) => {
        // Sort by prestige first, then by XP
        if (a.prestige !== b.prestige) return b.prestige - a.prestige;
        return b.xp - a.xp;
    });
}

function createLeaderboardEntry(entry, index) {
    const entryElement = document.createElement('div');
    const isCurrent = entry.id === 'current';
    
    entryElement.className = `leaderboard-entry p-3 rounded-lg mb-2 transition-all duration-200 ${isCurrent ? 'current' : ''}`;
    entryElement.setAttribute('role', 'listitem');
    
    const rankColor = getRankColor(index);
    const prestigeBadge = entry.prestige > 0 ? `<div class="text-xs bg-amber-600 text-white px-2 py-1 rounded">P${entry.prestige}</div>` : '';
    
    entryElement.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="text-lg font-bold ${rankColor}" aria-label="Peringkat ${index + 1}">#${index + 1}</div>
            <div class="flex-1">
                <div class="font-medium">${sanitizeHTML(entry.name)}</div>
                <div class="text-xs text-slate-400">Level ${entry.level} • ${entry.xp.toLocaleString()} XP</div>
            </div>
            ${prestigeBadge}
        </div>
    `;
    
    return entryElement;
}

function getRankColor(index) {
    const colors = [
        'text-yellow-400', // 1st place
        'text-gray-300',   // 2nd place
        'text-amber-700',  // 3rd place
        'text-slate-400'   // Other places
    ];
    return colors[Math.min(index, colors.length - 1)];
}

function closeLeaderboardModal() {
    if (modals.leaderboard.element) {
        modals.leaderboard.element.classList.remove('show');
    }
}

// ==================== ANALYTICS MODAL ====================
function showAnalytics() {
    if (!modals.analytics.element || !modals.analytics.content) return;
    
    try {
        const report = AnalyticsManager.generateReport();
        
        modals.analytics.content.innerHTML = `
            <div class="space-y-4">
                <div class="glass p-4 rounded-lg">
                    <h3 class="text-lg font-bold mb-2">Statistik Produktivitas</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-2xl font-bold text-indigo-300">${report.averageDailyTasks}</div>
                            <div class="text-xs text-slate-400">Rata-rata tugas/hari</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-green-300">${report.mostProductiveDay.count}</div>
                            <div class="text-xs text-slate-400">Tugas terbanyak</div>
                        </div>
                    </div>
                </div>
                
                <div class="glass p-4 rounded-lg">
                    <h3 class="text-lg font-bold mb-2">Progress XP</h3>
                    <div class="text-lg font-bold text-purple-300">${report.xpGrowthRate} XP/hari</div>
                    <div class="text-xs text-slate-400">Pertumbuhan rata-rata</div>
                </div>
                
                <div class="glass p-4 rounded-lg">
                    <h3 class="text-lg font-bold mb-2">Distribusi Skill</h3>
                    <div class="space-y-2">
                        ${Object.entries(report.skillDistribution).map(([skill, level]) => `
                            <div class="flex justify-between">
                                <span>${skill}</span>
                                <span class="text-yellow-300">Level ${level}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Show modal
        modals.analytics.element.classList.add('show');
        
        // Focus management
        trapFocus(modals.analytics.element);
        
        // Track analytics
        AnalyticsManager.trackModalView('analytics');
        
    } catch (error) {
        handleError(error, 'showAnalytics');
    }
}

function closeAnalyticsModal() {
    if (modals.analytics.element) {
        modals.analytics.element.classList.remove('show');
    }
}

// ==================== FOCUS MANAGEMENT ====================
function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstFocusableElement.focus();
    
    // Trap focus
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    e.preventDefault();
                    lastFocusableElement.focus();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    e.preventDefault();
                    firstFocusableElement.focus();
                }
            }
        }
        
        // Close on Escape
        if (e.key === 'Escape') {
            if (modal.id === 'ranks-modal') {
                closeRanksModal();
            } else if (modal.id === 'leaderboard-modal') {
                closeLeaderboardModal();
            } else if (modal.id === 'analytics-modal') {
                closeAnalyticsModal();
            }
        }
    });
}

// ==================== UTILITY FUNCTIONS ====================
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initUIElements();
    initModals();
});