// Game State Management
const STORAGE_KEY = 'omerMathQuestState';
let gameState = {
    maxUnlockedLevel: 1,
    coins: 0,
    hearts: 3,
    theme: 'default',
    purchasedThemes: ['default'],
    lifelines: {
        fiftyFifty: 1,
        hintFairy: 1
    },
    activeSession: null
};

// Current Level Session
let currentLevel = 1;
let currentQuestionIndex = 0;
let levelQuestions = [];
let isBossLevel = false;
let bossHp = 100;
let omerHp = 100;

// Initialize
function init() {
    loadState();
    applyTheme(gameState.theme);
    updateGlobalUI();
    renderMap();
    
    if (gameState.activeSession) {
        resumeLevel();
    }
    
    // Event Listeners
    document.getElementById('back-to-map-btn').addEventListener('click', showMap);
    document.getElementById('open-shop-btn').addEventListener('click', openShop);
    document.getElementById('close-shop-btn').addEventListener('click', closeShop);
    document.getElementById('modal-action-btn').addEventListener('click', handleModalAction);
    
    // Lifeline listeners
    document.getElementById('btn-5050').addEventListener('click', useFiftyFifty);
    document.getElementById('btn-hint').addEventListener('click', useHint);
    
    // Shop Listeners
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', handlePurchase);
    });
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    updateGlobalUI();
}

function updateGlobalUI() {
    document.getElementById('coin-display').textContent = gameState.coins;
    document.getElementById('level-coin-display').textContent = gameState.coins;
    document.getElementById('heart-display').textContent = gameState.hearts;
    document.getElementById('shop-coins').textContent = gameState.coins;
}

// Map Rendering
function renderMap() {
    const container = document.getElementById('nodes-container');
    container.innerHTML = '';
    
    // Generate nodes - 8 topics + 1 boss = 9 levels
    const totalLevels = 9;
    const positions = [
        {x: 15, y: 82}, {x: 35, y: 70}, {x: 60, y: 80}, {x: 80, y: 65},
        {x: 75, y: 42}, {x: 55, y: 30}, {x: 35, y: 38}, {x: 20, y: 20},
        {x: 55, y: 10}
    ];

    positions.forEach((pos, i) => {
        const level = i + 1;
        const node = document.createElement('div');
        node.className = `map-node ${level === 9 ? 'boss-node' : ''}`;
        node.style.left = `${pos.x}%`;
        node.style.top = `${pos.y}%`;
        
        if (level === 9) {
            node.textContent = '👑';
        } else {
            node.textContent = level;
        }

        if (level < gameState.maxUnlockedLevel) {
            node.classList.add('completed');
            if (level !== 9) node.textContent = '✔️';
            node.onclick = () => handleLevelClick(level);
        } else if (level === gameState.maxUnlockedLevel) {
            node.classList.add('unlocked');
            node.onclick = () => handleLevelClick(level);
        }

        container.appendChild(node);
    });

    drawPaths(positions);
}

function drawPaths(positions) {
    const svg = document.getElementById('map-paths');
    svg.innerHTML = '';
    for(let i=0; i < positions.length - 1; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${positions[i].x}%`);
        line.setAttribute('y1', `${positions[i].y}%`);
        line.setAttribute('x2', `${positions[i+1].x}%`);
        line.setAttribute('y2', `${positions[i+1].y}%`);
        line.setAttribute('stroke', '#ddd');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-dasharray', '10,10');
        svg.appendChild(line);
    }
}

// Navigation
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function showMap() {
    saveState();
    renderMap();
    switchView('map-view');
}

// Level Logic
function handleLevelClick(level) {
    if (gameState.activeSession && gameState.activeSession.level === level) {
        resumeLevel();
    } else {
        startLevel(level);
    }
}

function resumeLevel() {
    const session = gameState.activeSession;
    currentLevel = session.level;
    isBossLevel = session.isBossLevel;
    currentQuestionIndex = session.currentIndex;
    levelQuestions = session.questions;
    bossHp = session.bossHp;
    omerHp = session.omerHp;
    gameState.lifelines = session.lifelines;
    
    updateLifelineUI();
    
    if (isBossLevel) {
        updateBossHp();
        switchView('boss-view');
        loadBossQuestion();
    } else {
        document.getElementById('level-title').textContent = `שלב ${currentLevel}`;
        document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / 10) * 100}%`;
        switchView('level-view');
        loadQuestion();
    }
}

function saveSession() {
    gameState.activeSession = {
        level: currentLevel,
        isBossLevel: isBossLevel,
        currentIndex: currentQuestionIndex,
        questions: levelQuestions,
        bossHp: bossHp,
        omerHp: omerHp,
        lifelines: { ...gameState.lifelines }
    };
    saveState();
}

function clearSession() {
    gameState.activeSession = null;
    saveState();
}

async function startLevel(level) {
    currentLevel = level;
    isBossLevel = (level === 9);
    currentQuestionIndex = 0;
    
    // Reset lifelines for the level
    gameState.lifelines = { fiftyFifty: 1, hintFairy: 1 };
    updateLifelineUI();

    try {
        // Fetch questions dynamically from the JSON topic files
        const response = await fetch(`topic${level}.json`);
        const allQuestions = await response.json();
        // Shuffle the 100 questions and pick exactly 10
        levelQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
    } catch (e) {
        alert('שגיאה בטעינת השאלות! וודאי שהמשחק רץ על שרת אינטרנט כמו GitHub Pages.');
        return;
    }
    
    if (isBossLevel) {
        bossHp = 100;
        omerHp = gameState.hearts * 33.3; // Convert hearts to HP percentage
        updateBossHp();
        saveSession();
        switchView('boss-view');
        loadBossQuestion();
    } else {
        document.getElementById('level-title').textContent = `שלב ${level}`;
        document.getElementById('progress-bar').style.width = '0%';
        saveSession();
        switchView('level-view');
        loadQuestion();
    }
}

function loadQuestion() {
    const q = levelQuestions[currentQuestionIndex];
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('hint-box').textContent = '';
    
    renderOptions(q.options, q.correct, 'options-container');
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / 10) * 100}%`;
}

function loadBossQuestion() {
    const q = levelQuestions[currentQuestionIndex];
    document.getElementById('boss-question-text').textContent = q.question;
    renderOptions(q.options, q.correct, 'boss-options-container');
}

function renderOptions(optionsArr, correctOption, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Shuffle options
    const shuffled = [...optionsArr].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = (e) => handleAnswer(opt, correctOption, e.target);
        container.appendChild(btn);
    });
}

function handleAnswer(selected, correct, btnElement) {
    const isCorrect = (String(selected) === String(correct));
    const containerId = isBossLevel ? 'boss-options-container' : 'options-container';
    const allBtns = document.querySelectorAll(`#${containerId} .option-btn`);
    
    // Disable all buttons to prevent double clicking
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
        btnElement.classList.add('correct');
        // Earn coin
        gameState.coins += 10;
        createFloatingText('+10 🪙', btnElement);
        
        if (isBossLevel) {
            bossHp -= 10;
            updateBossHp();
            shakeScreen('boss-avatar');
        }

    } else {
        btnElement.classList.add('wrong');
        if (!isBossLevel) {
            gameState.hearts--;
        } else {
            omerHp -= 33.3;
            gameState.hearts--;
            updateBossHp();
            shakeScreen('omer-hp');
            document.querySelector('.boss-arena').classList.add('shake-severe');
            setTimeout(() => document.querySelector('.boss-arena').classList.remove('shake-severe'), 500);
        }
    }

    saveSession();

    // Check Win/Loss conditions
    setTimeout(() => {
        if (gameState.hearts <= 0) {
            clearSession();
            showModal('אוי לא!', 'נגמרו לך החיים. נסי שוב מחר!', 0, 'חזור למפה');
            gameState.hearts = 3; // Reset hearts for next time
            saveState();
            return;
        }

        currentQuestionIndex++;
        if (currentQuestionIndex >= 10 || bossHp <= 0) {
            clearSession();
            levelComplete();
        } else {
            saveSession();
            if (isBossLevel) loadBossQuestion();
            else loadQuestion();
        }
    }, 1500);
}

function levelComplete() {
    createConfetti();
    if (currentLevel === gameState.maxUnlockedLevel && currentLevel < 9) {
        gameState.maxUnlockedLevel++;
    }
    const bonus = isBossLevel ? 200 : 50;
    gameState.coins += bonus;
    saveState();
    
    showModal('כל הכבוד עומר!', isBossLevel ? 'הבסת את מלך החשבון!' : `סיימת את שלב ${currentLevel} בהצלחה!`, bonus, 'המשך');
}

// Boss specific
function updateBossHp() {
    document.getElementById('boss-hp').style.width = `${Math.max(0, bossHp)}%`;
    document.getElementById('omer-hp').style.width = `${Math.max(0, omerHp)}%`;
}

function shakeScreen(elementId) {
    const el = document.getElementById(elementId);
    el.classList.add('shake-severe');
    setTimeout(() => el.classList.remove('shake-severe'), 500);
}

// Lifelines
function updateLifelineUI() {
    const btn50 = document.getElementById('btn-5050');
    const btnHint = document.getElementById('btn-hint');
    btn50.textContent = `50/50 (${gameState.lifelines.fiftyFifty})`;
    btnHint.textContent = `🧚‍♀️ גלגל הצלה (${gameState.lifelines.hintFairy})`;
    btn50.disabled = gameState.lifelines.fiftyFifty <= 0;
    btnHint.disabled = gameState.lifelines.hintFairy <= 0;
}

function useFiftyFifty() {
    if (gameState.lifelines.fiftyFifty <= 0) return;
    gameState.lifelines.fiftyFifty--;
    updateLifelineUI();

    const q = levelQuestions[currentQuestionIndex];
    const containerId = isBossLevel ? 'boss-options-container' : 'options-container';
    const btns = Array.from(document.querySelectorAll(`#${containerId} .option-btn`));
    
    let wrongBtns = btns.filter(b => String(b.textContent) !== String(q.correct));
    // Remove 2 wrong options randomly
    for(let i=0; i<2; i++) {
        if(wrongBtns.length > 0) {
            const idx = Math.floor(Math.random() * wrongBtns.length);
            wrongBtns[idx].style.opacity = '0';
            wrongBtns[idx].disabled = true;
            wrongBtns.splice(idx, 1);
        }
    }
    saveSession();
}

function useHint() {
    if (gameState.lifelines.hintFairy <= 0) return;
    gameState.lifelines.hintFairy--;
    updateLifelineUI();

    const q = levelQuestions[currentQuestionIndex];
    const hintBox = document.getElementById('hint-box');
    hintBox.textContent = `💡 רמז מעומר: ${q.hint}`;
    hintBox.classList.remove('hidden');
    saveSession();
}

// Visual Effects
function createFloatingText(text, parentElement) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    const rect = parentElement.getBoundingClientRect();
    el.style.left = `${rect.left + rect.width/2}px`;
    el.style.top = `${rect.top}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

function createConfetti() {
    const container = document.getElementById('particle-container');
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
    for(let i=0; i<100; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `-10px`;
        const duration = Math.random() * 3 + 2;
        particle.style.transition = `top ${duration}s ease-in, transform ${duration}s linear`;
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.style.top = '100vh';
            particle.style.transform = `rotate(${Math.random() * 720}deg) translateX(${Math.random() * 100 - 50}px)`;
        }, 10);
        
        setTimeout(() => particle.remove(), duration * 1000);
    }
}

// Shop & Themes
function openShop() {
    document.getElementById('shop-modal').classList.remove('hidden');
    document.getElementById('shop-coins').textContent = gameState.coins;
}

function closeShop() {
    document.getElementById('shop-modal').classList.add('hidden');
}

function handlePurchase(e) {
    const type = e.target.getAttribute('data-type');
    const cost = parseInt(e.target.getAttribute('data-cost'));
    
    if (gameState.coins >= cost) {
        if (type === 'theme') {
            const theme = e.target.getAttribute('data-theme');
            if (gameState.purchasedThemes.includes(theme)) {
                applyTheme(theme);
                alert('הנושא הוחל!');
                return;
            }
            gameState.coins -= cost;
            gameState.purchasedThemes.push(theme);
            applyTheme(theme);
            e.target.textContent = 'בשימוש';
        } else if (type === 'heart') {
            gameState.coins -= cost;
            gameState.hearts++;
        }
        saveState();
        document.getElementById('shop-coins').textContent = gameState.coins;
    } else {
        alert('אין לך מספיק מטבעות!');
    }
}

function applyTheme(themeName) {
    gameState.theme = themeName;
    document.body.className = `theme-${themeName}`;
    saveState();
}

// Modals
function showModal(title, desc, reward, btnText) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-desc').textContent = desc;
    document.getElementById('modal-action-btn').textContent = btnText;
    
    const rewardBox = document.getElementById('modal-reward-box');
    if (reward > 0) {
        rewardBox.classList.remove('hidden');
        document.getElementById('modal-coins-earned').textContent = reward;
    } else {
        rewardBox.classList.add('hidden');
    }
    
    document.getElementById('modal').classList.remove('hidden');
}

function handleModalAction() {
    document.getElementById('modal').classList.add('hidden');
    showMap();
}

// Start Game
window.onload = init;