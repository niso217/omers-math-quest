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

// Game Config from config.json
let gameConfig = {
    gameTitle: "המסע האפי של עומר",
    playerName: "עומר",
    difficulty: "medium",
    totalLevels: 9,
    shop: { themeCost: 500, heartCost: 100 }
};

// Current Level Session
let currentLevel = 1;
let currentQuestionIndex = 0;
let levelQuestions = [];
let isBossLevel = false;
let bossHp = 100;
let omerHp = 100;

// Initialize
async function init() {
    await fetchConfig();
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

async function fetchConfig() {
    try {
        const response = await fetch('config.json');
        if (response.ok) {
            gameConfig = await response.json();
            // Apply config visually
            document.getElementById('head-title').textContent = gameConfig.gameTitle;
            document.getElementById('game-title').textContent = gameConfig.gameTitle;
            
            // Update shop prices in UI dynamically
            document.querySelectorAll('[data-type="theme"]').forEach(btn => {
                btn.setAttribute('data-cost', gameConfig.shop.themeCost);
                btn.previousElementSibling.textContent = `מחיר: ${gameConfig.shop.themeCost} 🪙`;
            });
            document.querySelectorAll('[data-type="heart"]').forEach(btn => {
                btn.setAttribute('data-cost', gameConfig.shop.heartCost);
                btn.previousElementSibling.textContent = `מחיר: ${gameConfig.shop.heartCost} 🪙`;
            });
        }
    } catch (e) {
        console.warn('Could not load config.json, using defaults.');
    }
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
    
    // Generate nodes based on config
    const totalLevels = gameConfig.totalLevels || 9;
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
    miniGameActive = false;
    
    // Reset lifelines for the level
    gameState.lifelines = { fiftyFifty: 1, hintFairy: 1 };
    updateLifelineUI();

    // Roll which question will be the mini-game (only for non-boss levels)
    if (!isBossLevel) {
        rollMiniGameIndex();
    }

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
    // Check if this question should be the mini-game
    if (!isBossLevel && currentQuestionIndex === miniGameIndex) {
        launchMiniGame();
        return;
    }
    
    const q = levelQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerHTML = q.question;
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('hint-box').textContent = '';
    
    renderOptions(q.options, q.correct, 'options-container');
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / 10) * 100}%`;
}

function loadBossQuestion() {
    const q = levelQuestions[currentQuestionIndex];
    document.getElementById('boss-question-text').innerHTML = q.question;
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

// ==========================================
//  MINI-GAME ENGINE — 8 unique games
// ==========================================
let miniGameIndex = -1; // which question index triggers the mini-game
let miniGameActive = false;
let miniGameTimers = []; // track all timers so we can clean up

function clearMiniGameTimers() {
    miniGameTimers.forEach(t => clearTimeout(t));
    miniGameTimers.forEach(t => clearInterval(t));
    miniGameTimers = [];
}

// Decide the mini-game index when a level starts
function rollMiniGameIndex() {
    // Pick a random question between index 2-7 (avoid first, last, and boss)
    miniGameIndex = Math.floor(Math.random() * 6) + 2;
}

// Called from loadQuestion when it's mini-game time
function launchMiniGame() {
    miniGameActive = true;
    const q = levelQuestions[currentQuestionIndex];
    
    // Update mini-game UI
    document.getElementById('mg-heart-display').textContent = gameState.hearts;
    document.getElementById('mg-coin-display').textContent = gameState.coins;
    document.getElementById('mg-question-text').innerHTML = q.question;
    
    // Game names per level
    const gameNames = {
        1: '🎈 פיצוץ הבלונים!',
        2: '☄️ מתקפת המטאורים!',
        3: '🎯 ישר המספרים!',
        4: '🏴‍☠️ תיבות האוצר!',
        5: '🧱 קוביות נופלות!',
        6: '🚀 שיגור הטיל!',
        7: '🔨 הכה את החפרפרת!',
        8: '⚡ בליץ מהירות!'
    };
    
    document.getElementById('minigame-title').textContent = gameNames[currentLevel] || '🎮 שלב בונוס!';
    switchView('minigame-view');
    
    const playArea = document.getElementById('mg-play-area');
    playArea.innerHTML = '';
    
    // Launch the level-specific game
    switch(currentLevel) {
        case 1: playBalloonPop(q, playArea); break;
        case 2: playMeteorDefense(q, playArea); break;
        case 3: playNumberLine(q, playArea); break;
        case 4: playTreasureChests(q, playArea); break;
        case 5: playFallingBlocks(q, playArea); break;
        case 6: playRocketLaunch(q, playArea); break;
        case 7: playWhackAMole(q, playArea); break;
        case 8: playSpeedBlitz(q, playArea); break;
        default: playBalloonPop(q, playArea); break;
    }
}

function miniGameCorrect(playArea) {
    clearMiniGameTimers();
    gameState.coins += 50;
    saveState();
    createConfetti();
    
    const overlay = document.createElement('div');
    overlay.className = 'mg-bonus-overlay';
    overlay.innerHTML = `
        <div class="mg-bonus-text">🎉 מדהים! +50 🪙</div>
        <div class="mg-bonus-sub">תשובה נכונה!</div>
    `;
    playArea.appendChild(overlay);
    
    const t = setTimeout(() => {
        miniGameActive = false;
        currentQuestionIndex++;
        if (currentQuestionIndex >= 10) { clearSession(); levelComplete(); }
        else { saveSession(); switchView('level-view'); loadQuestion(); }
    }, 2000);
    miniGameTimers.push(t);
}

function miniGameWrong(playArea) {
    gameState.hearts--;
    document.getElementById('mg-heart-display').textContent = gameState.hearts;
    saveState();
    
    if (gameState.hearts <= 0) {
        clearMiniGameTimers();
        miniGameActive = false;
        clearSession();
        showModal('אוי לא!', 'נגמרו לך החיים. נסי שוב!', 0, 'חזור למפה');
        gameState.hearts = 3;
        saveState();
    }
}

// ---- GAME 1: Balloon Pop 🎈 ----
function playBalloonPop(q, area) {
    area.style.position = 'relative';
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    
    opts.forEach((opt, i) => {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.textContent = opt;
        balloon.style.backgroundColor = colors[i % colors.length];
        balloon.style.left = `${15 + Math.random() * 60}%`;
        balloon.style.setProperty('--float-duration', `${5 + Math.random() * 3}s`);
        balloon.style.animationDelay = `${i * 0.8}s`;
        
        balloon.addEventListener('click', () => {
            if (String(opt) === String(q.correct)) {
                balloon.classList.add('pop');
                balloon.textContent = '💥';
                miniGameCorrect(area);
            } else {
                balloon.classList.add('wrong-pop');
                balloon.textContent = '💨';
                miniGameWrong(area);
            }
        });
        
        area.appendChild(balloon);
    });
}

// ---- GAME 2: Meteor Defense ☄️ ----
function playMeteorDefense(q, area) {
    const scene = document.createElement('div');
    scene.className = 'meteor-scene';
    
    // Meteor
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.textContent = '☄️';
    meteor.style.setProperty('--fall-speed', '6s');
    scene.appendChild(meteor);
    
    // Cannon row
    const cannons = document.createElement('div');
    cannons.className = 'cannon-row';
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'cannon-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
            cannons.querySelectorAll('.cannon-btn').forEach(b => b.disabled = true);
            if (String(opt) === String(q.correct)) {
                meteor.classList.add('explode');
                meteor.textContent = '💥';
                miniGameCorrect(area);
            } else {
                btn.style.opacity = '0.3';
                btn.disabled = true;
                // Re-enable others
                cannons.querySelectorAll('.cannon-btn:not([disabled])').forEach(b => b.disabled = false);
                miniGameWrong(area);
            }
        });
        cannons.appendChild(btn);
    });
    scene.appendChild(cannons);
    
    // If meteor reaches bottom
    const t = setTimeout(() => {
        if (!miniGameActive) return;
        miniGameWrong(area);
        miniGameCorrect(area); // force advance
    }, 6500);
    miniGameTimers.push(t);
    
    area.appendChild(scene);
}

// ---- GAME 3: Number Line Slider 🎯 ----
function playNumberLine(q, area) {
    const game = document.createElement('div');
    game.className = 'number-line-game';
    
    const correct = q.correct;
    const rangeMin = Math.max(0, correct - 50);
    const rangeMax = correct + 50;
    
    const track = document.createElement('div');
    track.className = 'number-line-track';
    
    // Ticks every 10
    for (let v = rangeMin; v <= rangeMax; v += 10) {
        const pct = ((v - rangeMin) / (rangeMax - rangeMin)) * 100;
        const tick = document.createElement('div');
        tick.className = 'nl-tick';
        tick.style.left = `${pct}%`;
        track.appendChild(tick);
        
        const label = document.createElement('div');
        label.className = 'nl-label';
        label.style.left = `${pct}%`;
        label.textContent = v;
        track.appendChild(label);
    }
    
    // Draggable marker
    const marker = document.createElement('div');
    marker.className = 'nl-marker';
    marker.textContent = '📍';
    marker.style.left = '50%';
    let markerValue = rangeMin + (rangeMax - rangeMin) / 2;
    track.appendChild(marker);
    
    // Touch/drag
    function updateMarkerPos(clientX) {
        const rect = track.getBoundingClientRect();
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        marker.style.left = `${pct}%`;
        markerValue = Math.round(rangeMin + (pct / 100) * (rangeMax - rangeMin));
    }
    
    track.addEventListener('touchmove', e => { e.preventDefault(); updateMarkerPos(e.touches[0].clientX); }, { passive: false });
    track.addEventListener('mousemove', e => { if (e.buttons) updateMarkerPos(e.clientX); });
    track.addEventListener('click', e => updateMarkerPos(e.clientX));
    
    game.appendChild(track);
    
    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'nl-submit-btn';
    submitBtn.textContent = '✅ זה המספר!';
    submitBtn.addEventListener('click', () => {
        if (Math.abs(markerValue - correct) <= 3) {
            miniGameCorrect(area);
        } else {
            miniGameWrong(area);
            // Shake marker
            marker.style.transition = 'none';
            marker.classList.add('shake-severe');
            setTimeout(() => marker.classList.remove('shake-severe'), 500);
        }
    });
    game.appendChild(submitBtn);
    
    area.appendChild(game);
}

// ---- GAME 4: Treasure Chests 🏴‍☠️ ----
function playTreasureChests(q, area) {
    const scene = document.createElement('div');
    scene.className = 'treasure-scene';
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    
    opts.forEach(opt => {
        const chest = document.createElement('div');
        chest.className = 'treasure-chest';
        chest.innerHTML = `<span>🎁</span><span class="chest-answer">${opt}</span>`;
        
        chest.addEventListener('click', () => {
            scene.querySelectorAll('.treasure-chest').forEach(c => c.style.pointerEvents = 'none');
            if (String(opt) === String(q.correct)) {
                chest.classList.add('open-correct');
                chest.querySelector('span').textContent = '💎';
                miniGameCorrect(area);
            } else {
                chest.classList.add('open-wrong');
                chest.querySelector('span').textContent = '👻';
                // Re-enable others after a short delay
                const t = setTimeout(() => {
                    scene.querySelectorAll('.treasure-chest:not(.open-wrong)').forEach(c => c.style.pointerEvents = 'auto');
                }, 800);
                miniGameTimers.push(t);
                miniGameWrong(area);
            }
        });
        
        scene.appendChild(chest);
    });
    
    area.appendChild(scene);
}

// ---- GAME 5: Falling Blocks 🧱 ----
function playFallingBlocks(q, area) {
    const scene = document.createElement('div');
    scene.className = 'falling-blocks-scene';
    scene.style.position = 'relative';
    scene.style.width = '100%';
    scene.style.height = '100%';
    scene.style.minHeight = '300px';
    
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    
    opts.forEach((opt, i) => {
        const block = document.createElement('div');
        block.className = 'falling-block';
        block.textContent = opt;
        block.style.left = `${10 + Math.random() * 60}%`;
        block.style.setProperty('--fall-speed', `${3.5 + Math.random() * 2}s`);
        block.style.animationDelay = `${i * 1.2}s`;
        
        // Different colors per block
        const blockColors = ['#e74c3c', '#3498db', '#9b59b6', '#1abc9c'];
        block.style.background = `linear-gradient(135deg, ${blockColors[i % 4]}, ${blockColors[(i+1) % 4]})`;
        
        block.addEventListener('click', () => {
            if (String(opt) === String(q.correct)) {
                block.classList.add('caught');
                block.textContent = '⭐';
                miniGameCorrect(area);
            } else {
                block.classList.add('caught');
                block.textContent = '❌';
                miniGameWrong(area);
            }
        });
        
        scene.appendChild(block);
    });
    
    area.appendChild(scene);
}

// ---- GAME 6: Rocket Launch 🚀 ----
function playRocketLaunch(q, area) {
    const scene = document.createElement('div');
    scene.className = 'rocket-scene';
    scene.style.minHeight = '350px';
    
    // Star field
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'star-dot';
        star.style.cssText = `position:absolute;width:2px;height:2px;background:white;border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*70}%;opacity:${0.3+Math.random()*0.7};animation:twinkle ${1+Math.random()*2}s infinite alternate;`;
        scene.appendChild(star);
    }
    
    const rocket = document.createElement('div');
    rocket.className = 'rocket-emoji';
    rocket.textContent = '🚀';
    scene.appendChild(rocket);
    
    const exhaust = document.createElement('div');
    exhaust.className = 'rocket-exhaust';
    exhaust.textContent = '🔥';
    scene.appendChild(exhaust);
    
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'rocket-options';
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'rocket-fuel-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
            optionsGrid.querySelectorAll('.rocket-fuel-btn').forEach(b => b.disabled = true);
            if (String(opt) === String(q.correct)) {
                btn.classList.add('correct-fuel');
                exhaust.classList.add('active');
                const t = setTimeout(() => {
                    rocket.classList.add('launched');
                    miniGameCorrect(area);
                }, 400);
                miniGameTimers.push(t);
            } else {
                btn.classList.add('wrong-fuel');
                // Re-enable others
                const t = setTimeout(() => {
                    optionsGrid.querySelectorAll('.rocket-fuel-btn:not(.wrong-fuel)').forEach(b => b.disabled = false);
                }, 600);
                miniGameTimers.push(t);
                miniGameWrong(area);
            }
        });
        optionsGrid.appendChild(btn);
    });
    scene.appendChild(optionsGrid);
    
    area.appendChild(scene);
}

// ---- GAME 7: Whack-a-Mole 🔨 ----
function playWhackAMole(q, area) {
    const grid = document.createElement('div');
    grid.className = 'whack-grid';
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    
    const holes = [];
    opts.forEach(opt => {
        const hole = document.createElement('div');
        hole.className = 'mole-hole';
        const content = document.createElement('div');
        content.className = 'mole-content';
        content.innerHTML = `<span>🐹</span><span class="mole-answer">${opt}</span>`;
        hole.appendChild(content);
        
        hole.addEventListener('click', () => {
            if (!content.classList.contains('visible')) return;
            grid.querySelectorAll('.mole-hole').forEach(h => h.style.pointerEvents = 'none');
            
            if (String(opt) === String(q.correct)) {
                hole.classList.add('whacked-correct');
                content.querySelector('span').textContent = '⭐';
                miniGameCorrect(area);
            } else {
                hole.classList.add('whacked-wrong');
                content.querySelector('span').textContent = '💀';
                miniGameWrong(area);
                // Reset and continue
                const t = setTimeout(() => {
                    hole.classList.remove('whacked-wrong');
                    content.querySelector('span').textContent = '🐹';
                    grid.querySelectorAll('.mole-hole').forEach(h => h.style.pointerEvents = 'auto');
                }, 800);
                miniGameTimers.push(t);
            }
        });
        
        grid.appendChild(hole);
        holes.push(content);
    });
    
    // Mole pop-up cycle
    function cycleMoles() {
        holes.forEach(h => h.classList.remove('visible'));
        // Show 2-3 random moles
        const count = 2 + Math.floor(Math.random() * 2);
        const shuffled = [...holes].sort(() => Math.random() - 0.5);
        shuffled.slice(0, count).forEach(h => h.classList.add('visible'));
    }
    
    cycleMoles();
    const interval = setInterval(cycleMoles, 2000);
    miniGameTimers.push(interval);
    
    area.appendChild(grid);
}

// ---- GAME 8: Speed Blitz ⚡ ----
function playSpeedBlitz(q, area) {
    const scene = document.createElement('div');
    scene.className = 'speed-blitz-scene';
    
    let timeLeft = 15;
    let blitzScore = 0;
    let blitzQuestionIdx = currentQuestionIndex;
    
    const timerEl = document.createElement('div');
    timerEl.className = 'blitz-timer';
    timerEl.textContent = `⏰ ${timeLeft}`;
    scene.appendChild(timerEl);
    
    const scoreEl = document.createElement('div');
    scoreEl.className = 'blitz-score';
    scoreEl.textContent = `ניקוד: ${blitzScore}`;
    scene.appendChild(scoreEl);
    
    const questionEl = document.createElement('div');
    questionEl.className = 'blitz-question';
    scene.appendChild(questionEl);
    
    const optionsEl = document.createElement('div');
    optionsEl.className = 'blitz-options';
    scene.appendChild(optionsEl);
    
    function loadBlitzQuestion() {
        const bq = levelQuestions[blitzQuestionIdx % levelQuestions.length];
        questionEl.innerHTML = bq.question;
        optionsEl.innerHTML = '';
        const opts = [...bq.options].sort(() => Math.random() - 0.5);
        
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'blitz-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => {
                if (String(opt) === String(bq.correct)) {
                    btn.classList.add('blitz-correct');
                    blitzScore++;
                    scoreEl.textContent = `ניקוד: ${blitzScore}`;
                    blitzQuestionIdx++;
                    const t = setTimeout(loadBlitzQuestion, 300);
                    miniGameTimers.push(t);
                } else {
                    btn.classList.add('blitz-wrong');
                    miniGameWrong(area);
                    blitzQuestionIdx++;
                    const t = setTimeout(loadBlitzQuestion, 600);
                    miniGameTimers.push(t);
                }
            });
            optionsEl.appendChild(btn);
        });
    }
    
    loadBlitzQuestion();
    
    const interval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `⏰ ${timeLeft}`;
        if (timeLeft <= 5) timerEl.style.color = '#e74c3c';
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            // Blitz over — if scored at least 3, it's a win
            if (blitzScore >= 3) {
                miniGameCorrect(area);
            } else {
                miniGameWrong(area);
                // Show results and advance
                const overlay = document.createElement('div');
                overlay.className = 'mg-bonus-overlay';
                overlay.innerHTML = `
                    <div class="mg-bonus-text" style="color:#e74c3c;">⏰ נגמר הזמן!</div>
                    <div class="mg-bonus-sub">ענית נכון ${blitzScore} פעמים. צריך לפחות 3!</div>
                `;
                area.appendChild(overlay);
                const t = setTimeout(() => {
                    miniGameActive = false;
                    currentQuestionIndex++;
                    if (currentQuestionIndex >= 10) { clearSession(); levelComplete(); }
                    else { saveSession(); switchView('level-view'); loadQuestion(); }
                }, 2500);
                miniGameTimers.push(t);
            }
        }
    }, 1000);
    miniGameTimers.push(interval);
    
    area.appendChild(scene);
}

// Admin Modal Logic
function openAdminModal() {
    document.getElementById('admin-coins').value = gameState.coins;
    document.getElementById('admin-hearts').value = gameState.hearts;
    document.getElementById('admin-levels').value = gameState.maxUnlockedLevel;
    document.getElementById('admin-levels').max = gameConfig.totalLevels;
    document.getElementById('admin-modal').classList.remove('hidden');
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.add('hidden');
}

function saveAdminSettings() {
    gameState.coins = parseInt(document.getElementById('admin-coins').value) || 0;
    gameState.hearts = parseInt(document.getElementById('admin-hearts').value) || 1;
    gameState.maxUnlockedLevel = parseInt(document.getElementById('admin-levels').value) || 1;
    
    if (gameState.maxUnlockedLevel > gameConfig.totalLevels) {
        gameState.maxUnlockedLevel = gameConfig.totalLevels;
    }
    
    saveState();
    closeAdminModal();
    renderMap();
    alert('הגדרות המשחק נשמרו!');
}

function resetGameProgress() {
    if (confirm('האם אתה בטוח שברצונך לאפס את כל התקדמות המשחק? פעולה זו תמחק הכל!')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// Start Game
window.onload = init;
