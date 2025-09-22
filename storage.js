// ==================== PENYIMPANAN DATA ====================
// Constants
const STORAGE_KEY = 'mythicascend_save';
const TUTORIAL_KEY = 'mythicascend_tutorial_completed';
const ANALYTICS_KEY = 'mythicascend_analytics';
const VERSION_KEY = 'mythicascend_version';
const CURRENT_VERSION = '1.1.0';

// Cache for storage operations
let storageCache = null;
let isSaving = false;
let saveQueue = [];

// Firebase Configuration (ganti dengan config Anda sendiri)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "mythic-ascend.firebaseapp.com",
    projectId: "mythic-ascend",
    storageBucket: "mythic-ascend.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let firebase;
let auth;
let db;
let cloudSyncEnabled = false;

// Initialize Firebase if available
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            cloudSyncEnabled = true;
            console.log('Firebase initialized successfully');
        }
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
        cloudSyncEnabled = false;
    }
}

// Helper functions
function getGameState() {
    return {
        version: CURRENT_VERSION,
        xp, level, prestigeLevel, 
        skillLevels, skillXP,
        totalTasksCompleted, achievements, hiddenAchievements,
        streak, lastActivityDate, actionHistory, 
        tasks, skills,
        weeklyLeaderboard, alltimeLeaderboard,
        completedTasksToday, lastCompletedTaskDate,
        savedAt: new Date().toISOString()
    };
}

function validateGameState(gameState) {
    const requiredFields = ['xp', 'level', 'prestigeLevel', 'totalTasksCompleted', 'achievements', 'version'];
    return requiredFields.every(field => gameState.hasOwnProperty(field));
}

// ==================== MAIN STORAGE FUNCTIONS ====================
const saveGameState = async () => {
    if (!autosaveEnabled) {
        console.log('Auto-save disabled');
        return false;
    }
    
    if (isSaving) {
        // Queue save operation if already saving
        return new Promise((resolve) => {
            saveQueue.push({ resolve });
        });
    }
    
    isSaving = true;
    
    try {
        const gameState = getGameState();
        const gameStateString = JSON.stringify(gameState);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, gameStateString);
        
        // Update cache
        storageCache = gameState;
        
        // Update last saved time
        updateLastSavedTime();
        
        // Show auto-save indicator
        if (window.AutoSaveIndicator) {
            AutoSaveIndicator.show();
        }
        
        // Try to sync to cloud if enabled
        if (cloudSyncEnabled && auth.currentUser) {
            await syncToCloud(gameState);
        }
        
        // Process queued saves
        processSaveQueue();
        
        return true;
    } catch (error) {
        console.error('Error saving game state:', error);
        handleError(error, 'saveGameState');
        return false;
    } finally {
        isSaving = false;
    }
};

function processSaveQueue() {
    while (saveQueue.length > 0) {
        const { resolve } = saveQueue.shift();
        resolve(true);
    }
}

// ==================== LOAD FUNCTIONS ====================
const loadGameState = async () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            console.log('No saved game state found');
            resetToDefaultState();
            return;
        }
        
        const gameState = JSON.parse(saved);
        
        // Validate game state
        if (!validateGameState(gameState)) {
            throw new Error('Invalid game state data');
        }
        
        // Check version compatibility
        checkVersionCompatibility(gameState.version);
        
        // Load game state with defaults
        xp = gameState.xp || 0;
        level = gameState.level || 1;
        prestigeLevel = gameState.prestigeLevel || 0;
        skillLevels = gameState.skillLevels || {};
        skillXP = gameState.skillXP || {};
        totalTasksCompleted = gameState.totalTasksCompleted || 0;
        achievements = gameState.achievements || [];
        hiddenAchievements = gameState.hiddenAchievements || [];
        streak = gameState.streak || 0;
        lastActivityDate = gameState.lastActivityDate || new Date().toDateString();
        actionHistory = gameState.actionHistory || [];
        tasks = gameState.tasks || [];
        skills = gameState.skills || [];
        weeklyLeaderboard = gameState.weeklyLeaderboard || [];
        alltimeLeaderboard = gameState.alltimeLeaderboard || [];
        completedTasksToday = gameState.completedTasksToday || 0;
        lastCompletedTaskDate = gameState.lastCompletedTaskDate || new Date().toDateString();
        
        // Update cache
        storageCache = gameState;
        
        // Update UI
        renderTasks();
        renderSkills();
        updateUI();
        updatePrestigeUI();
        
        console.log('Game state loaded successfully');
    } catch (error) {
        console.error('Error loading game state:', error);
        handleError(error, 'loadGameState');
        resetToDefaultState();
    }
};

function checkVersionCompatibility(savedVersion) {
    if (!savedVersion) {
        console.warn('No version information found in save data');
        return;
    }
    
    if (savedVersion !== CURRENT_VERSION) {
        console.log(`Migrating from version ${savedVersion} to ${CURRENT_VERSION}`);
        // Add migration logic here if needed
    }
}

function resetToDefaultState() {
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
}

// ==================== CLOUD SYNC FUNCTIONS ====================
async function syncToCloud(gameState) {
    if (!cloudSyncEnabled || !auth.currentUser) {
        return;
    }
    
    try {
        const userRef = db.collection('users').doc(auth.currentUser.uid);
        await userRef.set({
            gameState: gameState,
            lastSync: new Date().toISOString(),
            version: CURRENT_VERSION
        });
        
        // Show cloud sync indicator
        if (window.CloudSyncIndicator) {
            CloudSyncIndicator.show();
        }
        
        console.log('Data synced to cloud successfully');
    } catch (error) {
        console.error('Error syncing to cloud:', error);
        // Don't throw error, just log it
    }
}

async function loadFromCloud() {
    if (!cloudSyncEnabled || !auth.currentUser) {
        throw new Error('Cloud sync not available or user not logged in');
    }
    
    try {
        const userRef = db.collection('users').doc(auth.currentUser.uid);
        const doc = await userRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            if (data.gameState) {
                // Load cloud game state
                loadGameStateFromObject(data.gameState);
                showNotification('Data berhasil dimuat dari cloud!', 'success');
                return true;
            }
        }
        
        throw new Error('No cloud data found');
    } catch (error) {
        console.error('Error loading from cloud:', error);
        throw error;
    }
}

// ==================== AUTHENTICATION FUNCTIONS ====================
async function loginWithEmail(email, password) {
    if (!cloudSyncEnabled) {
        throw new Error('Cloud sync not available');
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login berhasil!', 'success');
        updateCloudAuthUI();
        return userCredential.user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function registerWithEmail(email, password) {
    if (!cloudSyncEnabled) {
        throw new Error('Cloud sync not available');
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        showNotification('Registrasi berhasil!', 'success');
        updateCloudAuthUI();
        return userCredential.user;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function logout() {
    if (!cloudSyncEnabled) {
        return;
    }
    
    try {
        await auth.signOut();
        showNotification('Logout berhasil!', 'success');
        updateCloudAuthUI();
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

function updateCloudAuthUI() {
    const loggedOutSection = document.getElementById('cloud-logged-out');
    const loggedInSection = document.getElementById('cloud-logged-in');
    const userEmail = document.getElementById('cloud-user-email');
    
    if (auth.currentUser) {
        if (loggedOutSection) loggedOutSection.classList.add('hidden');
        if (loggedInSection) loggedInSection.classList.remove('hidden');
        if (userEmail) userEmail.textContent = auth.currentUser.email;
    } else {
        if (loggedOutSection) loggedOutSection.classList.remove('hidden');
        if (loggedInSection) loggedInSection.classList.add('hidden');
    }
}

// ==================== STORAGE MANAGEMENT ====================
function checkStorageCapacity() {
    try {
        let usedStorage = 0;
        
        // Calculate total localStorage usage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            usedStorage += localStorage.getItem(key).length;
        }
        
        usedStorage = Math.round(usedStorage / 1024); // Convert to KB
        
        const storageInfo = {
            used: usedStorage,
            total: localStorage.length,
            available: 5120 - usedStorage // Assuming 5MB limit
        };
        
        updateStorageUI(storageInfo);
        return storageInfo;
    } catch (e) {
        console.error('Error checking storage capacity:', e);
        updateStorageUI({ used: 'Error' });
        return null;
    }
}

function updateStorageUI(storageInfo) {
    const storageInfoElement = document.getElementById('storage-info');
    if (storageInfoElement) {
        storageInfoElement.textContent = typeof storageInfo.used === 'number' 
            ? `${storageInfo.used}KB digunakan` 
            : storageInfo.used;
    }
}

function updateLastSavedTime() {
    const lastSavedElement = document.getElementById('last-saved');
    if (lastSavedElement) {
        const now = new Date();
        lastSavedElement.textContent = now.toLocaleTimeString('id-ID');
    }
}

// ==================== DATA EXPORT/IMPORT ====================
const exportData = () => {
    const data = {
        version: CURRENT_VERSION,
        gameState: getGameState(),
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

    showNotification('Data berhasil diekspor!', 'success');
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
        
        reader.onload = async event => {
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
                await saveGameState();
                
                showNotification('Data berhasil diimpor!', 'success');
                logActivity("Mengimpor data dari file");
            } catch (error) {
                console.error('Error importing data:', error);
                handleError(error, 'importData');
            }
        };
        
        reader.onerror = () => {
            handleError(new Error('Error membaca file'), 'importData');
        };
        
        reader.readAsText(file);
    };
    
    input.click();
};

function loadGameStateFromObject(gameState) {
    // Validate and load game state
    if (validateGameState(gameState)) {
        xp = gameState.xp || 0;
        level = gameState.level || 1;
        prestigeLevel = gameState.prestigeLevel || 0;
        skillLevels = gameState.skillLevels || {};
        skillXP = gameState.skillXP || {};
        totalTasksCompleted = gameState.totalTasksCompleted || 0;
        achievements = gameState.achievements || [];
        hiddenAchievements = gameState.hiddenAchievements || [];
        streak = gameState.streak || 0;
        lastActivityDate = gameState.lastActivityDate || new Date().toDateString();
        actionHistory = gameState.actionHistory || [];
        tasks = gameState.tasks || [];
        skills = gameState.skills || [];
        weeklyLeaderboard = gameState.weeklyLeaderboard || [];
        alltimeLeaderboard = gameState.alltimeLeaderboard || [];
        completedTasksToday = gameState.completedTasksToday || 0;
        lastCompletedTaskDate = gameState.lastCompletedTaskDate || new Date().toDateString();
        
        renderTasks();
        renderSkills();
        updateUI();
        updatePrestigeUI();
    }
}

// ==================== RESET FUNCTIONS ====================
const resetData = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data? Tindakan ini tidak dapat dibatalkan!')) {
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ANALYTICS_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
        
        // Reset variables
        resetToDefaultState();
        
        showNotification('Data telah direset!', 'success');
        logActivity("Mereset semua data");
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    initializeFirebase();
    
    // Setup auth state listener
    if (auth) {
        auth.onAuthStateChanged(user => {
            updateCloudAuthUI();
        });
    }
    
    // Check storage capacity
    checkStorageCapacity();
    
    // Setup cloud sync event listeners
    setupCloudSyncEventListeners();
});

function setupCloudSyncEventListeners() {
    const loginBtn = document.getElementById('cloud-login');
    const registerBtn = document.getElementById('cloud-register');
    const logoutBtn = document.getElementById('cloud-logout');
    const syncNowBtn = document.getElementById('cloud-sync-now');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('cloud-email').value;
            const password = document.getElementById('cloud-password').value;
            
            try {
                await loginWithEmail(email, password);
            } catch (error) {
                handleError(error, 'Cloud Login');
            }
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const email = document.getElementById('cloud-email').value;
            const password = document.getElementById('cloud-password').value;
            
            try {
                await registerWithEmail(email, password);
            } catch (error) {
                handleError(error, 'Cloud Register');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await logout();
            } catch (error) {
                handleError(error, 'Cloud Logout');
            }
        });
    }
    
    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', async () => {
            try {
                await saveGameState();
                showNotification('Data disinkronkan ke cloud!', 'success');
            } catch (error) {
                handleError(error, 'Cloud Sync');
            }
        });
    }
}