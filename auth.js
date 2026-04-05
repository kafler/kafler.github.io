// ========== СИСТЕМА АККАУНТОВ ==========

const Auth = {
    STORAGE_KEY: 'cards2learn_users',
    SESSION_KEY: 'cards2learn_current_user',
    
    defaultBaseWords: [
        { eng: "Apple", rus: "Яблоко", emoji: "🍎", category: "basic", known: false },
        { eng: "Sun", rus: "Солнце", emoji: "☀️", category: "basic", known: false },
        { eng: "Happy", rus: "Счастливый", emoji: "😊", category: "basic", known: false },
        { eng: "Fast", rus: "Быстрый", emoji: "⚡", category: "basic", known: false },
        { eng: "Water", rus: "Вода", emoji: "💧", category: "basic", known: false },
        { eng: "Friend", rus: "Друг", emoji: "👫", category: "basic", known: false },
        { eng: "Big", rus: "Большой", emoji: "🐘", category: "basic", known: false },
        { eng: "Beautiful", rus: "Красивый", emoji: "🌸", category: "basic", known: false }
    ],
    
    getUsers() {
        const users = localStorage.getItem(this.STORAGE_KEY);
        if (users) return JSON.parse(users);
        
        const defaultUsers = {
            "student": {
                id: "student",
                username: "student",
                email: "student@example.com",
                password: this.hashPassword("123"),
                createdAt: new Date().toISOString(),
                baseWords: JSON.parse(JSON.stringify(this.defaultBaseWords)),
                myWords: [],
                bestScore: 0,
                sessions: 0
            },
            "teacher": {
                id: "teacher",
                username: "teacher",
                email: "teacher@example.com",
                password: this.hashPassword("123"),
                createdAt: new Date().toISOString(),
                baseWords: JSON.parse(JSON.stringify(this.defaultBaseWords)),
                myWords: [],
                bestScore: 0,
                sessions: 0
            }
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
    },
    
    saveUsers(users) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    },
    
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) - hash) + password.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    },
    
    register(username, password, email = "") {
        const users = this.getUsers();
        if (users[username]) {
            return { success: false, error: "Пользователь с таким именем уже существует!" };
        }
        
        users[username] = {
            id: username,
            username: username,
            email: email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            baseWords: JSON.parse(JSON.stringify(this.defaultBaseWords)),
            myWords: [],
            bestScore: 0,
            sessions: 0
        };
        
        this.saveUsers(users);
        return this.login(username, password);
    },
    
    login(username, password) {
        const users = this.getUsers();
        const user = users[username];
        const hashedPassword = this.hashPassword(password);
        
        if (!user) return { success: false, error: "Пользователь не найден!" };
        if (user.password !== hashedPassword) return { success: false, error: "Неверный пароль!" };
        
        const sessionData = {
            username: user.username,
            email: user.email,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        
        this.loadUserData(user);
        
        user.sessions = (user.sessions || 0) + 1;
        this.saveUsers(users);
        
        return { success: true };
    },
    
    loadUserData(user) {
        localStorage.setItem('cards2learn_mywords', JSON.stringify(user.myWords || []));
        localStorage.setItem('cards2learn_bestScore', (user.bestScore || 0).toString());
        localStorage.setItem('cards2learn_sessions', (user.sessions || 0).toString());
        
        if (user.baseWords) {
            const knownData = user.baseWords.map(w => w.known);
            localStorage.setItem('cards2learn_known', JSON.stringify(knownData));
        }
    },
    
    saveCurrentUserData() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        const users = this.getUsers();
        const user = users[currentUser.username];
        if (!user) return;
        
        const myWords = localStorage.getItem('cards2learn_mywords');
        if (myWords) user.myWords = JSON.parse(myWords);
        
        const bestScore = localStorage.getItem('cards2learn_bestScore');
        if (bestScore) user.bestScore = parseInt(bestScore);
        
        const sessions = localStorage.getItem('cards2learn_sessions');
        if (sessions) user.sessions = parseInt(sessions);
        
        const known = localStorage.getItem('cards2learn_known');
        if (known && user.baseWords) {
            const knownData = JSON.parse(known);
            user.baseWords.forEach((w, i) => {
                if (knownData[i] !== undefined) w.known = knownData[i];
            });
        }
        
        this.saveUsers(users);
    },
    
    getCurrentUser() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },
    
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },
    
    logout() {
        this.saveCurrentUserData();
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'login.html';
    },
    
    changePassword(oldPassword, newPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, error: "Не авторизован" };
        
        const users = this.getUsers();
        const user = users[currentUser.username];
        
        if (user.password !== this.hashPassword(oldPassword)) {
            return { success: false, error: "Неверный старый пароль" };
        }
        
        user.password = this.hashPassword(newPassword);
        this.saveUsers(users);
        return { success: true };
    },
    
    exportData() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;
        
        const users = this.getUsers();
        const user = users[currentUser.username];
        
        return JSON.stringify({
            username: user.username,
            email: user.email,
            baseWords: user.baseWords,
            myWords: user.myWords,
            bestScore: user.bestScore,
            sessions: user.sessions,
            exportDate: new Date().toISOString()
        }, null, 2);
    },
    
    importData(jsonData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, error: "Не авторизован" };
        
        try {
            const data = JSON.parse(jsonData);
            const users = this.getUsers();
            const user = users[currentUser.username];
            
            if (data.baseWords) user.baseWords = data.baseWords;
            if (data.myWords) user.myWords = data.myWords;
            if (data.bestScore) user.bestScore = data.bestScore;
            if (data.sessions) user.sessions = data.sessions;
            
            this.saveUsers(users);
            this.loadUserData(user);
            return { success: true };
        } catch(e) {
            return { success: false, error: "Ошибка при импорте" };
        }
    }
};

window.addEventListener('beforeunload', () => {
    if (Auth.isLoggedIn()) Auth.saveCurrentUserData();
});