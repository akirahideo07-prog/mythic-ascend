// ==================== MANAJEMEN SKILL ====================
// Cache untuk DOM elements
const skillElements = {
    name: null,
    icon: null,
    category: null,
    list: null
};

// Inisialisasi elements
function initSkillElements() {
    skillElements.name = document.getElementById('skillName');
    skillElements.icon = document.getElementById('skillIcon');
    skillElements.category = document.getElementById('skillCategory');
    skillElements.list = document.getElementById('skillList');
}

// ==================== VALIDATION ====================
function validateSkillInput(name, icon, category) {
    const errors = [];
    
    if (!name || name.trim().length === 0) {
        errors.push('Nama skill tidak boleh kosong');
    }
    
    if (name && name.length > 50) {
        errors.push('Nama skill terlalu panjang (maksimal 50 karakter)');
    }
    
    if (!category || !skillCategories[category]) {
        errors.push('Kategori skill tidak valid');
    }
    
    return errors;
}

// ==================== SKILL OPERATIONS ====================
async function addSkill() {
    const name = skillElements.name.value.trim();
    const icon = skillElements.icon.value.trim();
    const category = skillElements.category.value;
    
    // Validasi input
    const errors = validateSkillInput(name, icon, category);
    if (errors.length > 0) {
        showNotification(errors.join('. '), 'error');
        return;
    }
    
    // Cek duplikat (case insensitive)
    if (skills.find(s => s.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Skill sudah ada!', 'error');
        return;
    }
    
    // Batasi maksimal skill
    if (skills.length >= 50) {
        showNotification('Maksimal 50 skill sudah tercapai!', 'error');
        return;
    }
    
    try {
        const skill = {
            id: Date.now(), 
            name, 
            icon: icon || '📚', 
            category,
            level: 1, 
            xp: 0, 
            createdAt: new Date().toISOString()
        };
        
        skills.push(skill);
        skillLevels[name] = 1;
        skillXP[name] = 0;
        
        // Reset form
        resetSkillForm();
        
        // Update UI
        updateSkillDropdown();
        renderSkills();
        
        // Auto-save
        if (autosaveEnabled) {
            await saveGameState();
        }
        
        showNotification('Skill berhasil ditambahkan!', 'success');
        logActivity(`Menambahkan skill: ${name}`);
        
        // Check achievements
        checkAchievements();
        
        // Track analytics
        if (window.AnalyticsManager) {
            AnalyticsManager.trackSkillAdded(skill);
        }
        
        // Play sound
        if (soundEnabled) {
            SoundManager.play('click');
        }
    } catch (error) {
        handleError(error, 'addSkill');
    }
}

function resetSkillForm() {
    skillElements.name.value = '';
    skillElements.icon.value = '';
    skillElements.category.value = 'produktivitas';
}

async function deleteSkill(skillName) {
    if (!skillName) return;
    
    const skill = skills.find(s => s.name === skillName);
    if (!skill) {
        showNotification('Skill tidak ditemukan!', 'error');
        return;
    }
    
    if (confirm(`Apakah Anda yakin ingin menghapus skill ${skillName}?`)) {
        try {
            // Hapus dari arrays
            skills = skills.filter(s => s.name !== skillName);
            delete skillLevels[skillName];
            delete skillXP[skillName];
            
            // Update UI
            updateSkillDropdown();
            renderSkills();
            
            // Auto-save
            if (autosaveEnabled) {
                await saveGameState();
            }
            
            showNotification('Skill berhasil dihapus!', 'success');
            logActivity(`Menghapus skill: ${skillName}`);
            
            // Track analytics
            if (window.AnalyticsManager) {
                AnalyticsManager.trackSkillDeleted(skill);
            }
            
            // Play sound
            if (soundEnabled) {
                SoundManager.play('click');
            }
        } catch (error) {
            handleError(error, 'deleteSkill');
        }
    }
}

// ==================== SKILL XP & LEVELING ====================
async function updateTaskSkill(skillName, xp) {
    if (!skillName) return;
    
    try {
        // Initialize skill if not exists
        if (!skillXP[skillName]) {
            skillXP[skillName] = 0;
            skillLevels[skillName] = 1;
        }
        
        // Add XP to skill
        skillXP[skillName] += xp;
        
        // Check for level up
        const requiredXP = skillLevels[skillName] * 100;
        if (skillXP[skillName] >= requiredXP) {
            const oldLevel = skillLevels[skillName];
            skillLevels[skillName]++;
            skillXP[skillName] = 0;
            
            // Show level up notification
            showNotification(`Skill ${skillName} naik ke level ${skillLevels[skillName]}!`, 'success');
            logActivity(`Skill ${skillName} naik ke level ${skillLevels[skillName]}`);
            
            // Play sound
            if (soundEnabled) {
                SoundManager.play('levelup');
            }
            
            // Trigger confetti for milestone levels
            if (skillLevels[skillName] % 5 === 0) {
                triggerConfetti();
            }
            
            // Track analytics
            if (window.AnalyticsManager) {
                AnalyticsManager.trackSkillLevelUp(skillName, oldLevel, skillLevels[skillName]);
            }
            
            // Check for skill achievements
            checkSkillAchievements(skillName);
        }
        
        // Update UI
        renderSkills();
        
    } catch (error) {
        handleError(error, 'updateTaskSkill');
    }
}

function checkSkillAchievements(skillName) {
    const level = skillLevels[skillName] || 1;
    
    // Check skill master achievement
    if (level >= 10 && !achievements.includes('skill_master')) {
        unlockAchievement('skill_master');
    }
}

// ==================== RENDERING ====================
function renderSkills() {
    if (!skillElements.list) return;
    
    if (skills.length === 0) {
        skillElements.list.innerHTML = `
            <div class="text-center py-6 sm:py-8 text-slate-500">
                <i class="fas fa-wand-magic-sparkles text-3xl sm:text-4xl mb-3" aria-hidden="true"></i>
                <p class="text-sm">Belum ada skill. Tambah skill baru untuk mulai mengembangkan kemampuan!</p>
            </div>
        `;
        return;
    }
    
    skillElements.list.innerHTML = '';
    
    // Sort skills by level and XP
    const sortedSkills = [...skills].sort((a, b) => {
        const levelA = skillLevels[a.name] || 1;
        const levelB = skillLevels[b.name] || 1;
        
        if (levelA !== levelB) return levelB - levelA;
        
        const xpA = skillXP[a.name] || 0;
        const xpB = skillXP[b.name] || 0;
        
        return xpB - xpA;
    });
    
    // Render each skill
    sortedSkills.forEach(skill => {
        const skillElement = createSkillElement(skill);
        skillElements.list.appendChild(skillElement);
    });
}

function createSkillElement(skill) {
    const level = skillLevels[skill.name] || 1;
    const xp = skillXP[skill.name] || 0;
    const requiredXP = level * 100;
    const progress = Math.min((xp / requiredXP) * 100, 100);
    
    const skillElement = document.createElement('div');
    skillElement.className = 'bg-slate-800/40 rounded-lg p-3 sm:p-4 hover:bg-slate-800/60 transition-colors duration-200';
    skillElement.setAttribute('role', 'listitem');
    skillElement.setAttribute('aria-label', `Skill: ${skill.name}, Level ${level}`);
    
    const bonusLevel = Math.floor(level / 5) * 5;
    const bonus = skillBonuses[bonusLevel];
    const bonusText = bonus ? `<span class="text-xs text-green-400 ml-2">${bonus.name}</span>` : '';
    
    skillElement.innerHTML = `
        <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl" aria-hidden="true">${skill.icon}</span>
                    <div>
                        <h4 class="font-medium text-white">${sanitizeHTML(skill.name)}</h4>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs text-slate-400">Level ${level}</span>
                            <span class="skill-category category-${skill.category}">${skillCategories[skill.category]}</span>
                            ${bonusText}
                        </div>
                    </div>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2 mb-1 overflow-hidden">
                    <div class="progress-fill h-full rounded-full transition-all duration-500" 
                         style="width: ${progress}%" 
                         role="progressbar" 
                         aria-valuenow="${Math.round(progress)}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"
                         aria-label="Progress skill ${skill.name}"></div>
                </div>
                <div class="text-xs text-slate-400">${xp}/${requiredXP} XP</div>
            </div>
            <button onclick="deleteSkill('${sanitizeHTML(skill.name)}')" 
                    class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                    aria-label="Hapus skill ${skill.name}">
                <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
        </div>
    `;
    
    return skillElement;
}

// ==================== PRESTIGE SYSTEM ====================
async function prestigeReset() {
    if (level < 25) {
        showNotification('Anda harus mencapai level 25 untuk melakukan prestige reset!', 'error');
        return;
    }

    const confirmMessage = `Apakah Anda yakin ingin melakukan prestige reset?\n\nAnda akan kehilangan:\n- Level (kembali ke 1)\n- XP (kembali ke 0)\n- Skill levels (kembali ke 1)\n\nAnda akan mendapatkan:\n- Prestige level +1\n- Bonus XP permanen +5%\n\nTindakan ini tidak dapat dibatalkan!`;
    
    if (confirm(confirmMessage)) {
        try {
            // Reset player data
            xp = 0;
            level = 1;
            prestigeLevel++;

            // Reset skill levels but keep skills
            Object.keys(skillLevels).forEach(skillName => {
                skillLevels[skillName] = 1;
                skillXP[skillName] = 0;
            });

            // Update UI
            updateUI();
            updatePrestigeUI();
            renderSkills();

            // Check for prestige achievements
            if (prestigeLevel === 1 && !achievements.includes('prestige_1')) {
                unlockAchievement('prestige_1');
            } else if (prestigeLevel === 5 && !achievements.includes('prestige_5')) {
                unlockAchievement('prestige_5');
            }

            // Auto-save
            if (autosaveEnabled) {
                await saveGameState();
            }

            showNotification(`Prestige reset berhasil! Anda sekarang di Prestige Level ${prestigeLevel}`, 'success');
            logActivity(`Melakukan prestige reset! Sekarang di Prestige Level ${prestigeLevel}`);
            
            // Track analytics
            if (window.AnalyticsManager) {
                AnalyticsManager.trackPrestigeReset(prestigeLevel);
            }
            
            // Play sound
            if (soundEnabled) {
                SoundManager.play('levelup');
            }
            
            // Trigger confetti
            triggerConfetti();
        } catch (error) {
            handleError(error, 'prestigeReset');
        }
    }
}

// ==================== UTILITY FUNCTIONS ====================
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', initSkillElements);