// ==================== ANALYTICS MANAGER ====================
const AnalyticsManager = {
    data: {
        dailyTasks: {},
        weeklyTasks: {},
        monthlyTasks: {},
        taskCompletionRates: {},
        skillProgress: {},
        xpGrowth: [],
        activityLog: [],
        themeChanges: [],
        achievements: [],
        errors: [],
        sessionStart: new Date().toISOString(),
        sessionEvents: []
    },
    
    charts: {},
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeCharts();
    },
    
    loadData() {
        const saved = localStorage.getItem('mythicascend_analytics');
        if (saved) {
            try {
                this.data = JSON.parse(saved);
            } catch (error) {
                console.error('Error loading analytics data:', error);
            }
        }
    },
    
    saveData() {
        try {
            localStorage.setItem('mythicascend_analytics', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving analytics data:', error);
        }
    },
    
    setupEventListeners() {
        // Track task completion
        const originalCompleteTask = window.completeTask;
        window.completeTask = (taskId) => {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                this.trackTaskCompleted(task, calculateTaskXP(task));
            }
            originalCompleteTask(taskId);
        };
        
        // Track task addition
        const originalAddTask = window.addTask;
        window.addTask = () => {
            const taskTitle = document.getElementById('taskTitle')?.value;
            if (taskTitle) {
                this.trackTaskAdded({
                    title: taskTitle,
                    type: document.getElementById('taskType')?.value,
                    priority: document.getElementById('taskPriority')?.value,
                    skill: document.getElementById('taskSkill')?.value
                });
            }
            originalAddTask();
        };
        
        // Track skill operations
        const originalAddSkill = window.addSkill;
        window.addSkill = () => {
            const skillName = document.getElementById('skillName')?.value;
            if (skillName) {
                this.trackSkillAdded({
                    name: skillName,
                    category: document.getElementById('skillCategory')?.value
                });
            }
            originalAddSkill();
        };
        
        // Track activity
        const originalLogActivity = window.logActivity;
        window.logActivity = (message) => {
            this.trackActivity(message);
            originalLogActivity(message);
        };
        
        // Track errors
        window.addEventListener('error', (event) => {
            this.trackError(event.error, 'Global Error');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(event.reason, 'Unhandled Promise Rejection');
        });
    },
    
    // ==================== TRACKING METHODS ====================
    trackTaskCompleted(task, xp) {
        const today = new Date().toDateString();
        const thisWeek = this.getWeekNumber(new Date());
        const thisMonth = new Date().getMonth();
        
        // Update daily data
        if (!this.data.dailyTasks[today]) {
            this.data.dailyTasks[today] = { count: 0, totalXP: 0 };
        }
        this.data.dailyTasks[today].count++;
        this.data.dailyTasks[today].totalXP += xp;
        
        // Update weekly data
        if (!this.data.weeklyTasks[thisWeek]) {
            this.data.weeklyTasks[thisWeek] = { count: 0, totalXP: 0 };
        }
        this.data.weeklyTasks[thisWeek].count++;
        this.data.weeklyTasks[thisWeek].totalXP += xp;
        
        // Update monthly data
        if (!this.data.monthlyTasks[thisMonth]) {
            this.data.monthlyTasks[thisMonth] = { count: 0, totalXP: 0 };
        }
        this.data.monthlyTasks[thisMonth].count++;
        this.data.monthlyTasks[thisMonth].totalXP += xp;
        
        // Track XP growth
        this.data.xpGrowth.push({
            date: new Date().toISOString(),
            xp: window.xp,
            level: window.level,
            source: 'task'
        });
        
        // Track completion rate by priority
        if (!this.data.taskCompletionRates[task.priority]) {
            this.data.taskCompletionRates[task.priority] = { completed: 0, total: 0 };
        }
        this.data.taskCompletionRates[task.priority].completed++;
        
        this.saveData();
    },
    
    trackTaskAdded(task) {
        // Track task creation rate
        const today = new Date().toDateString();
        if (!this.data.taskCompletionRates['created']) {
            this.data.taskCompletionRates['created'] = { count: 0 };
        }
        this.data.taskCompletionRates['created'].count++;
        
        // Add to session events
        this.data.sessionEvents.push({
            type: 'task_added',
            data: task,
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackSkillAdded(skill) {
        if (!this.data.skillProgress[skill.name]) {
            this.data.skillProgress[skill.name] = {
                level: 1,
                xp: 0,
                category: skill.category,
                createdAt: new Date().toISOString(),
                levelUpHistory: []
            };
        }
        
        this.data.sessionEvents.push({
            type: 'skill_added',
            data: skill,
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackSkillLevelUp(skillName, oldLevel, newLevel) {
        if (this.data.skillProgress[skillName]) {
            this.data.skillProgress[skillName].level = newLevel;
            this.data.skillProgress[skillName].levelUpHistory.push({
                from: oldLevel,
                to: newLevel,
                timestamp: new Date().toISOString()
            });
        }
        
        this.data.sessionEvents.push({
            type: 'skill_level_up',
            data: { skillName, oldLevel, newLevel },
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackActivity(message) {
        this.data.activityLog.push({
            message,
            timestamp: new Date().toISOString(),
            xp: window.xp,
            level: window.level,
            tasksCompleted: window.totalTasksCompleted
        });
        
        // Limit activity log size
        if (this.data.activityLog.length > 1000) {
            this.data.activityLog = this.data.activityLog.slice(-500);
        }
        
        this.saveData();
    },
    
    trackThemeChange(themeName) {
        this.data.themeChanges.push({
            themeName,
            timestamp: new Date().toISOString()
        });
        
        this.data.sessionEvents.push({
            type: 'theme_change',
            data: { themeName },
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackAchievementUnlocked(achievement) {
        this.data.achievements.push({
            ...achievement,
            unlockedAt: new Date().toISOString(),
            playerLevel: window.level,
            playerXP: window.xp
        });
        
        this.data.sessionEvents.push({
            type: 'achievement_unlocked',
            data: achievement,
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackPrestigeReset(newPrestigeLevel) {
        this.data.sessionEvents.push({
            type: 'prestige_reset',
            data: { prestigeLevel: newPrestigeLevel },
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackModalView(modalName, additionalData = {}) {
        this.data.sessionEvents.push({
            type: 'modal_view',
            data: { modalName, ...additionalData },
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackTutorialCompleted() {
        this.data.sessionEvents.push({
            type: 'tutorial_completed',
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    trackError(error, context) {
        this.data.errors.push({
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
    },
    
    // ==================== ANALYTICS METHODS ====================
    generateReport() {
        const report = {
            summary: this.generateSummary(),
            productivity: this.generateProductivityAnalysis(),
            skills: this.generateSkillAnalysis(),
            progress: this.generateProgressAnalysis(),
            session: this.generateSessionAnalysis()
        };
        
        return report;
    },
    
    generateSummary() {
        const totalDays = Object.keys(this.data.dailyTasks).length;
        const totalTasks = Object.values(this.data.dailyTasks).reduce((sum, day) => sum + day.count, 0);
        const totalXP = Object.values(this.data.dailyTasks).reduce((sum, day) => sum + day.totalXP, 0);
        
        return {
            totalDays,
            totalTasks,
            totalXP,
            averageDailyTasks: totalDays > 0 ? (totalTasks / totalDays).toFixed(2) : 0,
            averageDailyXP: totalDays > 0 ? (totalXP / totalDays).toFixed(2) : 0,
            sessionDuration: this.getSessionDuration()
        };
    },
    
    generateProductivityAnalysis() {
        const dailyData = Object.entries(this.data.dailyTasks).map(([date, data]) => ({
            date,
            tasks: data.count,
            xp: data.totalXP
        }));
        
        // Find most productive day
        const mostProductiveDay = dailyData.reduce((max, day) => 
            day.tasks > max.tasks ? day : max, { tasks: 0, date: '' });
        
        // Calculate productivity trend
        const recentDays = dailyData.slice(-7);
        const trend = this.calculateTrend(recentDays.map(d => d.tasks));
        
        return {
            mostProductiveDay: mostProductiveDay.date,
            mostProductiveCount: mostProductiveDay.tasks,
            trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
            dailyData: dailyData.slice(-30) // Last 30 days
        };
    },
    
    generateSkillAnalysis() {
        const skillStats = {};
        
        Object.entries(this.data.skillProgress).forEach(([skillName, data]) => {
            skillStats[skillName] = {
                level: data.level,
                xp: data.xp,
                category: data.category,
                createdAt: data.createdAt,
                levelUps: data.levelUpHistory.length,
                lastLevelUp: data.levelUpHistory[data.levelUpHistory.length - 1]?.timestamp || null
            };
        });
        
        return skillStats;
    },
    
    generateProgressAnalysis() {
        const xpData = this.data.xpGrowth.slice(-30); // Last 30 entries
        
        const growthRate = this.calculateGrowthRate(xpData);
        const consistency = this.calculateConsistency(this.data.dailyTasks);
        
        return {
            currentXP: window.xp,
            currentLevel: window.level,
            growthRate: growthRate.toFixed(2),
            consistency: consistency.toFixed(2),
            xpData: xpData
        };
    },
    
    generateSessionAnalysis() {
        const sessionEvents = this.data.sessionEvents;
        const eventTypes = {};
        
        sessionEvents.forEach(event => {
            eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
        });
        
        return {
            duration: this.getSessionDuration(),
            eventCount: sessionEvents.length,
            eventTypes,
            startTime: this.data.sessionStart,
            endTime: new Date().toISOString()
        };
    },
    
    // ==================== UTILITY METHODS ====================
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    },
    
    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        return secondAvg - firstAvg;
    },
    
    calculateGrowthRate(xpData) {
        if (xpData.length < 2) return 0;
        
        const firstXP = xpData[0].xp;
        const lastXP = xpData[xpData.length - 1].xp;
        const daysDiff = Math.ceil((new Date(xpData[xpData.length - 1].date) - new Date(xpData[0].date)) / (1000 * 60 * 60 * 24));
        
        return daysDiff > 0 ? (lastXP - firstXP) / daysDiff : 0;
    },
    
    calculateConsistency(dailyTasks) {
        const taskCounts = Object.values(dailyTasks).map(day => day.count);
        if (taskCounts.length === 0) return 0;
        
        const average = taskCounts.reduce((sum, count) => sum + count, 0) / taskCounts.length;
        const variance = taskCounts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / taskCounts.length;
        
        // Consistency score (0-100, higher is more consistent)
        return Math.max(0, 100 - (Math.sqrt(variance) / average * 100));
    },
    
    getSessionDuration() {
        const start = new Date(this.data.sessionStart);
        const end = new Date();
        return Math.floor((end - start) / 1000 / 60); // Duration in minutes
    },
    
    // ==================== EXPORT/IMPORT ====================
    exportData() {
        return JSON.stringify(this.data, null, 2);
    },
    
    importData(data) {
        try {
            this.data = { ...this.data, ...data };
            this.saveData();
            return true;
        } catch (error) {
            console.error('Error importing analytics data:', error);
            return false;
        }
    },
    
    clearData() {
        if (confirm('Apakah Anda yakin ingin menghapus semua data analytics?')) {
            this.data = {
                dailyTasks: {},
                weeklyTasks: {},
                monthlyTasks: {},
                taskCompletionRates: {},
                skillProgress: {},
                xpGrowth: [],
                activityLog: [],
                themeChanges: [],
                achievements: [],
                errors: [],
                sessionStart: new Date().toISOString(),
                sessionEvents: []
            };
            this.saveData();
            showNotification('Data analytics dihapus!', 'success');
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    AnalyticsManager.init();
});

// Export for global access
window.AnalyticsManager = AnalyticsManager;