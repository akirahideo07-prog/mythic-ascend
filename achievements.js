// ==================== DEFINISI PENCAPAIAN ====================
const achievementDefs = [
    { id: 'first_task', name: 'Pemula', desc: 'Selesaikan tugas pertama', icon: '🎯', xp: 20, tier: 'bronze' },
    { id: 'level_5', name: 'Petualang', desc: 'Capai level 5', icon: '🏆', xp: 50, tier: 'bronze' },
    { id: 'skill_master', name: 'Ahli', desc: 'Level 10 pada sebuah skill', icon: '⭐', xp: 100, tier: 'silver' },
    { id: 'streak_7', name: 'Konsisten', desc: '7 hari streak beruntun', icon: '🔥', xp: 70, tier: 'silver' },
    { id: 'task_master', name: 'Task Master', desc: 'Selesaikan 10 tugas', icon: '✅', xp: 80, tier: 'bronze' },
    { id: 'tasks_10', name: 'Pekerja Rajin', desc: 'Selesaikan 10 tugas', icon: '📝', xp: 50, tier: 'bronze' },
    { id: 'tasks_50', name: 'Pekerja Terampil', desc: 'Selesaikan 50 tugas', icon: '📋', xp: 150, tier: 'silver' },
    { id: 'tasks_100', name: 'Pekerja Sempurna', desc: 'Selesaikan 100 tugas', icon: '📚', xp: 300, tier: 'gold' },
    { id: 'tasks_500', name: 'Pekerja Legendaris', desc: 'Selesaikan 500 tugas', icon: '📖', xp: 1000, tier: 'platinum' },
    { id: 'level_10', name: 'Petualang Berpengalaman', desc: 'Capai level 10', icon: '🧭', xp: 100, tier: 'silver' },
    { id: 'level_25', name: 'Petualang Terampil', desc: 'Capai level 25', icon: '🗺', xp: 250, tier: 'gold' },
    { id: 'level_50', name: 'Petualang Sempurna', desc: 'Capai level 50', icon: '🌍', xp: 500, tier: 'platinum' },
    { id: 'level_100', name: 'Petualang Legendaris', desc: 'Capai level 100', icon: '🌌', xp: 1500, tier: 'diamond' },
    { id: 'skills_5', name: 'Kolektor Skill', desc: 'Miliki 5 skill berbeda', icon: '🔮', xp: 100, tier: 'bronze' },
    { id: 'skills_10', name: 'Master Skill', desc: 'Miliki 10 skill berbeda', icon: '🧪', xp: 200, tier: 'silver' },
    { id: 'skills_20', name: 'Kolektor Skill Legendaris', desc: 'Miliki 20 skill berbeda', icon: '🔬', xp: 500, tier: 'gold' },
    { id: 'night_owl', name: 'Burung Hantu', desc: 'Selesaikan 5 tugas setelah jam 10 malam', icon: '🦉', xp: 150, tier: 'silver', hidden: true },
    { id: 'early_bird', name: 'Burung Pagi', desc: 'Selesaikan 5 tugas sebelum jam 7 pagi', icon: '🐓', xp: 150, tier: 'silver', hidden: true },
    { id: 'speed_demon', name: 'Demon Kecepatan', desc: 'Selesaikan 10 tugas dalam 1 hari', icon: '⚡', xp: 200, tier: 'gold', hidden: true },
    { id: 'perfectionist', name: 'Perfeksionis', desc: 'Selesaikan 20 tugas berturut-turut tanpa melewatkan deadline', icon: '💎', xp: 300, tier: 'platinum', hidden: true },
    { id: 'prestige_1', name: 'Prestige Awal', desc: 'Lakukan prestige reset pertama kali', icon: '👑', xp: 500, tier: 'gold', hidden: true },
    { id: 'prestige_5', name: 'Prestige Master', desc: 'Capai prestige level 5', icon: '🏅', xp: 2000, tier: 'diamond', hidden: true }
];

// Cache for achievement checks to improve performance
const achievementCheckCache = new Map();

// ==================== SISTEM PENCAPAIAN ====================
function checkAchievements() {
    // Only check achievements if relevant state has changed
    const cacheKey = `${xp}_${level}_${totalTasksCompleted}_${skills.length}_${streak}_${prestigeLevel}`;
    
    if (achievementCheckCache.has(cacheKey)) {
        return;
    }
    
    achievementDefs.forEach(achievement => {
        if (!achievements.includes(achievement.id)) {
            let unlocked = false;
            
            switch(achievement.id) {
                case 'first_task': unlocked = totalTasksCompleted >= 1; break;
                case 'level_5': unlocked = level >= 5; break;
                case 'skill_master': unlocked = Object.values(skillLevels).some(lvl => lvl >= 10); break;
                case 'streak_7': unlocked = streak >= 7; break;
                case 'task_master': unlocked = totalTasksCompleted >= 10; break;
                case 'tasks_10': unlocked = totalTasksCompleted >= 10; break;
                case 'tasks_50': unlocked = totalTasksCompleted >= 50; break;
                case 'tasks_100': unlocked = totalTasksCompleted >= 100; break;
                case 'tasks_500': unlocked = totalTasksCompleted >= 500; break;
                case 'level_10': unlocked = level >= 10; break;
                case 'level_25': unlocked = level >= 25; break;
                case 'level_50': unlocked = level >= 50; break;
                case 'level_100': unlocked = level >= 100; break;
                case 'skills_5': unlocked = skills.length >= 5; break;
                case 'skills_10': unlocked = skills.length >= 10; break;
                case 'skills_20': unlocked = skills.length >= 20; break;
                case 'night_owl': unlocked = checkNightOwlAchievement(); break;
                case 'early_bird': unlocked = checkEarlyBirdAchievement(); break;
                case 'speed_demon': unlocked = completedTasksToday >= 10; break;
                case 'perfectionist': unlocked = checkPerfectionistAchievement(); break;
                case 'prestige_1': unlocked = prestigeLevel >= 1; break;
                case 'prestige_5': unlocked = prestigeLevel >= 5; break;
            }
            
            if (unlocked) {
                unlockAchievement(achievement.id);
            }
        }
    });
    
    // Update cache
    achievementCheckCache.set(cacheKey, true);
    
    // Limit cache size to prevent memory issues
    if (achievementCheckCache.size > 50) {
        // Clear oldest entries
        const firstKey = achievementCheckCache.keys().next().value;
        achievementCheckCache.delete(firstKey);
    }
}

async function unlockAchievement(achievementId) {
    const achievement = achievementDefs.find(a => a.id === achievementId);
    if (!achievement) return;
    
    try {
        achievements.push(achievementId);
        xp += achievement.xp;
        
        updatePlayerLevel();
        updateUI();
        renderAchievements();
        
        if (notificationsEnabled) {
            showNotification(`🎉 Pencapaian terbuka: ${achievement.name}! +${achievement.xp} XP`, 'success');
        }
        
        logActivity(`Membuka pencapaian: ${achievement.name}`);
        triggerConfetti();
        
        // Play sound
        if (soundEnabled) {
            SoundManager.play('achievement');
        }
        
        // Track analytics
        if (window.AnalyticsManager) {
            AnalyticsManager.trackAchievementUnlocked(achievement);
        }
        
        // Auto-save
        if (autosaveEnabled) {
            await saveGameState();
        }
        
    } catch (error) {
        handleError(error, 'unlockAchievement');
    }
}

function checkNightOwlAchievement() {
    const hour = new Date().getHours();
    return hour >= 22 && completedTasksToday >= 5;
}

function checkEarlyBirdAchievement() {
    const hour = new Date().getHours();
    return hour < 7 && completedTasksToday >= 5;
}

function checkPerfectionistAchievement() {
    const recentTasks = tasks.slice(-20);
    if (recentTasks.length < 20) return false;
    
    return recentTasks.every(task => {
        if (!task.completed) return false;
        
        if (task.deadline === 'today' || task.deadline === 'tomorrow' || task.deadline === 'week') {
            const completedDate = new Date(task.completedAt);
            const createdDate = new Date(task.createdAt);
            const daysDiff = Math.floor((completedDate - createdDate) / (1000 * 60 * 60 * 24));
            
            switch(task.deadline) {
                case 'today': return daysDiff <= 1;
                case 'tomorrow': return daysDiff <= 2;
                case 'week': return daysDiff <= 7;
                default: return true;
            }
        }
        
        return true;
    });
}

// ==================== RENDERING ====================
function renderAchievements() {
    const achievementList = document.getElementById('achievementList');
    
    if (achievements.length === 0) {
        achievementList.innerHTML = `
            <div class="text-center py-4 text-slate-500">
                <p class="text-sm">Selesaikan tugas untuk membuka pencapaian!</p>
            </div>
        `;
        return;
    }
    
    achievementList.innerHTML = '';
    
    const unlockedAchievements = achievementDefs.filter(a => achievements.includes(a.id));
    
    const tierOrder = { diamond: 0, platinum: 1, gold: 2, silver: 3, bronze: 4 };
    const sortedAchievements = [...unlockedAchievements].sort((a, b) => {
        if (tierOrder[a.tier] !== tierOrder[b.tier]) {
            return tierOrder[a.tier] - tierOrder[b.tier];
        }
        return b.xp - a.xp;
    });
    
    sortedAchievements.forEach(achievement => {
        const achievementElement = createAchievementElement(achievement);
        achievementList.appendChild(achievementElement);
    });
}

function createAchievementElement(achievement) {
    const achievementElement = document.createElement('div');
    achievementElement.className = `bg-slate-800/40 rounded-lg p-3 flex items-center gap-3 tier-${achievement.tier} transition-all duration-200 hover:bg-slate-800/60`;
    
    achievementElement.innerHTML = `
        <div class="badge">
            ${achievement.icon}
        </div>
        <div class="flex-1">
            <h4 class="font-medium text-white">${sanitizeHTML(achievement.name)}</h4>
            <p class="text-xs text-slate-400">${achievement.desc}</p>
        </div>
    `;
    
    return achievementElement;
}

// ==================== LEVEL SYSTEM ====================
function updatePlayerLevel() {
    const newLevel = Math.floor(xp / 100) + 1;
    
    if (newLevel > level) {
        level = newLevel;
        
        if (notificationsEnabled) {
            showNotification(`🎉 Level up! Sekarang level ${level}`, 'success');
        }
        
        logActivity(`Naik ke level ${level}`);
        triggerConfetti();
        
        // Play sound
        if (soundEnabled) {
            SoundManager.play('levelup');
        }
    }
}

function checkDailyStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (lastActivityDate === today) {
        return;
    } else if (lastActivityDate === yesterday) {
        streak++;
    } else if (lastActivityDate !== today) {
        streak = 1;
    }
    
    lastActivityDate = today;
    if (uiElements.streakCount) {
        uiElements.streakCount.textContent = streak;
    }
    checkAchievements();
}

// ==================== TUTORIAL SYSTEM ====================
const tutorialSteps = [
    { title: "Selamat Datang di Mythic Ascend!", description: "Ubah hidup Anda menjadi petualangan epik. Ayo kita mulai perjalanan Anda!", element: null, position: "center" },
    { title: "Profil dan Level", description: "Di sini Anda bisa melihat level, XP, dan rank Anda. Setiap tugas yang diselesaikan akan memberikan XP.", element: "#avatarName", position: "bottom" },
    { title: "Tambah Tugas", description: "Buat tugas dengan menentukan judul, jenis, prioritas, dan deadline. Anda juga bisa menambahkan custom XP!", element: "#taskTitle", position: "top" },
    { title: "Pilih Skill", description: "Pilih skill yang ingin dikembangkan atau buat skill baru dengan kategori tertentu. Skill akan naik level seiring penggunaan.", element: "#taskSkill", position: "top" },
    { title: "Selesaikan Tugas", description: "Klik 'Selesaikan' pada tugas yang sudah selesai. Anda akan mendapatkan XP dan skill terkait akan meningkat.", element: "#taskList", position: "top" },
    { title: "Tingkatkan Skill", description: "Skill dapat ditingkatkan secara manual atau otomatis. Setiap 5 level skill memberikan bonus XP untuk tugas terkait.", element: "#skillList", position: "left" },
    { title: "Pencapaian", description: "Buka pencapaian dengan menyelesaikan tugas tertentu. Ada pencapaian tersembunyi yang bisa Anda temukan!", element: "#achievementList", position: "left" },
    { title: "Prestige System", description: "Setelah mencapai level 25, Anda bisa melakukan prestige reset untuk mendapatkan bonus permanen dan mulai petualangan baru!", element: "#prestigeInfo", position: "left" },
    { title: "Leaderboard", description: "Bersaing dengan diri Anda sendiri di leaderboard mingguan dan sepanjang masa!", element: "#leaderboard-modal", position: "top" },
    { title: "Pengaturan", description: "Anda dapat mengatur notifikasi melalui panel pengaturan. Klik ikon gear di pojok kanan bawah.", element: "#settings-button", position: "top" },
    { title: "Siap Bertualang!", description: "Sekarang Anda sudah siap memulai perjalanan Mythic Ascend. Jangan lupa untuk menyimpan progress Anda secara manual!", element: null, position: "center" }
];

const tutorialManager = {
    currentStep: 0,
    completed: localStorage.getItem(TUTORIAL_KEY) === 'true',

    init: function() {
        if (!this.completed) {
            setTimeout(() => this.showTutorial(), 1000);
        }

        document.getElementById('tutorial-next').addEventListener('click', () => this.nextStep());
        document.getElementById('tutorial-prev').addEventListener('click', () => this.prevStep());
        document.getElementById('tutorial-skip').addEventListener('click', () => this.completeTutorial());
        
        const helpButton = document.getElementById('help-button');
        if (helpButton) {
            helpButton.addEventListener('click', () => this.showTutorial());
        }
    },

    showTutorial: function() {
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            tutorialOverlay.classList.remove('hidden');
            this.showStep(0);
        }
    },

    showStep: function(stepIndex) {
        this.currentStep = stepIndex;
        const step = tutorialSteps[stepIndex];

        const tutorialTitle = document.getElementById('tutorial-title');
        const tutorialDescription = document.getElementById('tutorial-description');
        
        if (tutorialTitle && tutorialDescription) {
            tutorialTitle.textContent = step.title;
            tutorialDescription.textContent = step.description;
        }

        this.positionTutorialBox(step);

        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        
        if (prevBtn) {
            prevBtn.classList.toggle('hidden', stepIndex === 0);
        }
        if (nextBtn) {
            nextBtn.textContent = stepIndex === tutorialSteps.length - 1 ? 'Selesai' : 'Selanjutnya';
        }
    },

    positionTutorialBox: function(step) {
        const tutorialBox = document.querySelector('.tutorial-content');
        if (!tutorialBox) return;
        
        tutorialBox.style.transform = 'none';

        if (step.element && document.querySelector(step.element)) {
            const targetElement = document.querySelector(step.element);
            const rect = targetElement.getBoundingClientRect();
            const tutorialRect = tutorialBox.getBoundingClientRect();

            document.querySelectorAll('.tutorial-highlight').forEach(el => {
                el.classList.remove('tutorial-highlight');
            });

            targetElement.classList.add('tutorial-highlight');

            let top, left;

            switch(step.position) {
                case 'top':
                    top = rect.top - tutorialRect.height - 20;
                    left = rect.left + (rect.width / 2) - (tutorialRect.width / 2);
                    break;
                case 'bottom':
                    top = rect.bottom + 20;
                    left = rect.left + (rect.width / 2) - (tutorialRect.width / 2);
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - (tutorialRect.height / 2);
                    left = rect.left - tutorialRect.width - 20;
                    break;
                case 'right':
                    top = rect.top + (rect.height / 2) - (tutorialRect.height / 2);
                    left = rect.right + 20;
                    break;
                case 'center':
                default:
                    top = window.innerHeight / 2 - tutorialRect.height / 2;
                    left = window.innerWidth / 2 - tutorialRect.width / 2;
            }

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (left + tutorialRect.width > viewportWidth) {
                left = viewportWidth - tutorialRect.width - 20;
            }

            if (left < 20) {
                left = 20;
            }

            if (top + tutorialRect.height > viewportHeight) {
                top = viewportHeight - tutorialRect.height - 20;
            }

            if (top < 20) {
                top = 20;
            }

            tutorialBox.style.top = `${top}px`;
            tutorialBox.style.left = `${left}px`;
        } else {
            const tutorialRect = tutorialBox.getBoundingClientRect();
            const top = window.innerHeight / 2 - tutorialRect.height / 2;
            const left = window.innerWidth / 2 - tutorialRect.width / 2;

            tutorialBox.style.top = `${top}px`;
            tutorialBox.style.left = `${left}px`;
        }
    },

    nextStep: function() {
        if (this.currentStep < tutorialSteps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    },

    prevStep: function() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    },

    completeTutorial: function() {
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            tutorialOverlay.classList.add('hidden');
        }
        
        this.completed = true;
        localStorage.setItem(TUTORIAL_KEY, 'true');

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        logActivity("Menyelesaikan tutorial!");

        if (notificationsEnabled) {
            showNotification('Tutorial selesai!', 'success');
        }
        
        // Track analytics
        if (window.AnalyticsManager) {
            AnalyticsManager.trackTutorialCompleted();
        }
    }
};

// ==================== CONFETTI EFFECT ====================
function triggerConfetti() {
    const colors = ['#f0f', '#0ff', '#ff0', '#0f0', '#00f', '#f00'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 50);
    }
}

// ==================== DATA MANAGEMENT ====================
const shareAchievements = () => {
    if (navigator.share) {
        navigator.share({
            title: 'Pencapaian Mythic Ascend Saya',
            text: `Saya telah membuka ${achievements.length} pencapaian di Mythic Ascend! Level ${level} dengan ${xp} XP.`,
            url: window.location.href
        }).catch(() => {
            if (notificationsEnabled) {
                showNotification('Berbagi dibatalkan', 'info');
            }
        });
    } else {
        if (notificationsEnabled) {
            showNotification('Fitur berbagi tidak didukung di browser ini', 'error');
        }
    }
};

const exportData = () => {
    const data = {
        version: CURRENT_VERSION,
        xp, level, prestigeLevel, totalTasksCompleted,
        achievements, skills: skillLevels,
        analytics: localStorage.getItem(ANALYTICS_KEY) ? JSON.parse(localStorage.getItem(ANALYTICS_KEY)) : null,
        exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `mythicascend-data-${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    if (notificationsEnabled) {
        showNotification('Data berhasil diekspor!', 'success');
    }
    
    logActivity("Mengekspor data");
};

const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Validate imported data
                if (!data || typeof data !== 'object') {
                    throw new Error('Data tidak valid');
                }
                
                if (data.gameState) {
                    loadGameStateFromObject(data.gameState);
                }
                
                if (data.analytics && window.AnalyticsManager) {
                    AnalyticsManager.importData(data.analytics);
                }
                
                updateUI();
                updatePrestigeUI();
                saveGameState();
                
                if (notificationsEnabled) {
                    showNotification('Data berhasil diimpor!', 'success');
                }
                
                logActivity("Mengimpor data dari file");
            } catch (error) {
                console.error('Error importing data:', error);
                
                if (notificationsEnabled) {
                    showNotification('Error mengimpor data: ' + error.message, 'error');
                }
            }
        };
        
        reader.onerror = () => {
            if (notificationsEnabled) {
                showNotification('Error membaca file', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
};

const resetData = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data? Tindakan ini tidak dapat dibatalkan!')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ANALYTICS_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
        
        xp = 0;
        level = 1;
        prestigeLevel = 0;
        skillLevels = {};
        skillXP = {};
        totalTasksCompleted = 0;
        achievements = [];
        hiddenAchievements = [];
        streak = 0;
        lastActivityDate = new Date().toDateString();
        actionHistory = [];
        tasks = [];
        skills = [];
        weeklyLeaderboard = [];
        alltimeLeaderboard = [];
        completedTasksToday = 0;
        lastCompletedTaskDate = new Date().toDateString();

        updateUI();
        updatePrestigeUI();
        renderTasks();
        renderSkills();
       
        if (notificationsEnabled) {
            showNotification('Data telah direset!', 'success');
        }
        
        logActivity("Mereset semua data");
    }
};