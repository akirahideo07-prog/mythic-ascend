// ==================== MANAJEMEN TUGAS ====================
// Cache for DOM elements
const taskElements = {
    title: null,
    type: null,
    priority: null,
    deadline: null,
    skill: null,
    customXP: null,
    customXPContainer: null,
    list: null
};

// Task type XP mapping
const TASK_XP_MAP = {
    small: 10,
    big: 50,
    epic: 100,
    custom: 10
};

// Maximum tasks limit
const MAX_TASKS = 100;
const MAX_TASK_TITLE_LENGTH = 100;

// Initialize elements
function initTaskElements() {
    taskElements.title = document.getElementById('taskTitle');
    taskElements.type = document.getElementById('taskType');
    taskElements.priority = document.getElementById('taskPriority');
    taskElements.deadline = document.getElementById('taskDeadline');
    taskElements.skill = document.getElementById('taskSkill');
    taskElements.customXP = document.getElementById('customXP');
    taskElements.customXPContainer = document.getElementById('customXPContainer');
    taskElements.list = document.getElementById('taskList');
}

// ==================== VALIDATION ====================
function validateTaskInput(title, type, customXP) {
    const errors = [];
    
    if (!title || title.trim().length === 0) {
        errors.push('Judul tugas tidak boleh kosong');
    }
    
    if (title && title.length > MAX_TASK_TITLE_LENGTH) {
        errors.push(`Judul tugas terlalu panjang (maksimal ${MAX_TASK_TITLE_LENGTH} karakter)`);
    }
    
    if (!type || !TASK_XP_MAP.hasOwnProperty(type)) {
        errors.push('Jenis tugas tidak valid');
    }
    
    if (type === 'custom' && (!customXP || customXP < 1 || customXP > 1000)) {
        errors.push('Custom XP harus antara 1 dan 1000');
    }
    
    return errors;
}

// ==================== TASK OPERATIONS ====================
async function addTask() {
    const title = taskElements.title.value.trim();
    const type = taskElements.type.value;
    const priority = taskElements.priority.value;
    const deadline = taskElements.deadline.value;
    const skill = taskElements.skill.value;
    
    // Get custom XP if applicable
    let customXP = 0;
    if (type === 'custom') {
        customXP = parseInt(taskElements.customXP.value) || 10;
    }
    
    // Validate input
    const errors = validateTaskInput(title, type, customXP);
    if (errors.length > 0) {
        showNotification(errors.join('. '), 'error');
        return;
    }
    
    // Check task limit
    if (tasks.length >= MAX_TASKS) {
        showNotification(`Maksimal ${MAX_TASKS} tugas sudah tercapai!`, 'error');
        return;
    }
    
    try {
        const taskXP = type === 'custom' ? customXP : TASK_XP_MAP[type];
        const task = {
            id: Date.now(), 
            title: sanitizeHTML(title), 
            type, 
            priority, 
            deadline, 
            skill,
            xp: taskXP, 
            completed: false, 
            createdAt: new Date().toISOString()
        };
        
        tasks.push(task);
        
        // Reset form
        resetTaskForm();
        
        // Update UI
        updateSkillDropdown();
        renderTasks();
        
        // Auto-save
        if (autosaveEnabled) {
            await saveGameState();
        }
        
        showNotification('Tugas berhasil ditambahkan!', 'success');
        logActivity(`Menambahkan tugas: ${title}`);
        
        // Track analytics
        if (window.AnalyticsManager) {
            AnalyticsManager.trackTaskAdded(task);
        }
        
        // Play sound
        if (soundEnabled) {
            SoundManager.play('click');
        }
        
    } catch (error) {
        handleError(error, 'addTask');
    }
}

function resetTaskForm() {
    taskElements.title.value = '';
    taskElements.type.value = 'small';
    taskElements.priority.value = 'low';
    taskElements.deadline.value = '';
    taskElements.skill.value = '';
    taskElements.customXP.value = '';
    taskElements.customXPContainer.classList.add('hidden');
}

async function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    try {
        // Mark task as completed
        task.completed = true;
        task.completedAt = new Date().toISOString();
        
        // Calculate XP with bonuses
        const finalXP = calculateTaskXP(task);
        
        // Add XP to player
        xp += finalXP;
        
        // Update skill if applicable
        if (task.skill) {
            await updateTaskSkill(task.skill, finalXP);
        }
        
        // Update statistics
        totalTasksCompleted++;
        updateDailyStreak();
        
        // Check achievements
        checkAchievements();
        updatePlayerLevel();
        updateUI();
        renderTasks();
        renderSkills();
        
        // Auto-save
        if (autosaveEnabled) {
            await saveGameState();
        }
        
        showNotification(`Tugas selesai! +${finalXP} XP`, 'success');
        logActivity(`Menyelesaikan tugas: ${task.title} (+${finalXP} XP)`);
        
        // Track analytics
        if (window.AnalyticsManager) {
            AnalyticsManager.trackTaskCompleted(task, finalXP);
        }
        
        // Play sound
        if (soundEnabled) {
            SoundManager.play('achievement');
        }
        
        // Remove completed task after delay
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
            if (autosaveEnabled) {
                saveGameState();
            }
        }, 2000);
        
    } catch (error) {
        handleError(error, 'completeTask');
    }
}

function updateDailyStreak() {
    const today = new Date().toDateString();
    
    if (lastCompletedTaskDate === today) {
        completedTasksToday++;
    } else {
        completedTasksToday = 1;
        lastCompletedTaskDate = today;
    }
}

async function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        showNotification('Tugas tidak ditemukan!', 'error');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        try {
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
            
            // Auto-save
            if (autosaveEnabled) {
                await saveGameState();
            }
            
            showNotification('Tugas berhasil dihapus!', 'success');
            logActivity(`Menghapus tugas: ${task.title}`);
            
            // Track analytics
            if (window.AnalyticsManager) {
                AnalyticsManager.trackTaskDeleted(task);
            }
            
            // Play sound
            if (soundEnabled) {
                SoundManager.play('click');
            }
        } catch (error) {
            handleError(error, 'deleteTask');
        }
    }
}

// ==================== RENDERING ====================
function renderTasks() {
    if (!taskElements.list) return;
    
    if (tasks.length === 0) {
        taskElements.list.innerHTML = `
            <div class="text-center py-6 sm:py-8 text-slate-500">
                <i class="fas fa-clipboard-list text-3xl sm:text-4xl mb-3" aria-hidden="true"></i>
                <p class="text-sm">Belum ada tugas. Tambah tugas baru untuk memulai petualangan Anda!</p>
            </div>
        `;
        return;
    }
    
    taskElements.list.innerHTML = '';
    
    // Sort tasks: incomplete first, then by priority, then by creation date
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    // Render each task
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskElements.list.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-card bg-slate-800/40 rounded-lg p-3 sm:p-4 priority-${task.priority} ${task.completed ? 'opacity-50' : ''} transition-all duration-200`;
    taskElement.setAttribute('role', 'listitem');
    taskElement.setAttribute('aria-label', `Tugas: ${task.title}, ${task.xp} XP, ${task.completed ? 'selesai' : 'belum selesai'}`);
    
    const deadlineText = getDeadlineText(task.deadline);
    const skillText = task.skill ? `<span class="skill-category category-${task.skill}">${skillCategories[task.skill]}</span>` : '';
    
    taskElement.innerHTML = `
        <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
                <h4 class="font-medium ${task.completed ? 'line-through' : ''}">${sanitizeHTML(task.title)}</h4>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-xs text-slate-400">${task.xp} XP</span>
                    ${skillText}
                    ${deadlineText ? `<span class="text-xs text-amber-400"><i class="fas fa-clock mr-1" aria-hidden="true"></i>${deadlineText}</span>` : ''}
                </div>
            </div>
            <div class="flex gap-2">
                ${!task.completed ? `
                    <button onclick="completeTask(${task.id})" 
                            class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                            aria-label="Selesaikan tugas ${task.title}">
                        <i class="fas fa-check" aria-hidden="true"></i>
                    </button>
                ` : ''}
                <button onclick="deleteTask(${task.id})" 
                        class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                        aria-label="Hapus tugas ${task.title}">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    `;
    
    return taskElement;
}

function getDeadlineText(deadline) {
    if (!deadline) return '';
    
    const deadlineMap = {
        'today': 'Hari ini',
        'tomorrow': 'Besok',
        'week': 'Minggu ini'
    };
    
    return deadlineMap[deadline] || '';
}

// ==================== SKILL DROPDOWN ====================
function updateSkillDropdown() {
    if (!taskElements.skill) return;
    
    const currentValue = taskElements.skill.value;
    
    // Clear existing options except the first one
    while (taskElements.skill.children.length > 1) {
        taskElements.skill.removeChild(taskElements.skill.lastChild);
    }
    
    // Add skill options
    skills.forEach(skill => {
        const option = document.createElement('option');
        option.value = skill.name;
        option.textContent = `${skill.icon} ${skill.name}`;
        taskElements.skill.appendChild(option);
    });
    
    // Restore selected value
    taskElements.skill.value = currentValue;
}

// ==================== EVENT LISTENERS ====================
function setupTaskEventListeners() {
    if (!taskElements.type) return;
    
    // Show/hide custom XP input
    taskElements.type.addEventListener('change', function() {
        if (taskElements.customXPContainer) {
            if (this.value === 'custom') {
                taskElements.customXPContainer.classList.remove('hidden');
            } else {
                taskElements.customXPContainer.classList.add('hidden');
            }
        }
    });
    
    // Add task on Enter key
    if (taskElements.title) {
        taskElements.title.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTask();
            }
        });
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initTaskElements();
    setupTaskEventListeners();
});