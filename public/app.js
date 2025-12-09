/**
 * EconoArena - Main Application Logic
 * Handles state management, data rendering, and interactions.
 */

// --- State Management ---
const AppState = {
    scenarios: [],
    currentScenarioIndex: 0,
    currentView: 'marx', // 'marx', 'smith', 'hayek'
    currentStats: {
        pyramid: {}, // Will be populated from scenario
        indicators: {} // Will be populated from scenario
    },
    lastCommentary: null,
    // Persistence:
    unlockedModes: JSON.parse(localStorage.getItem('unlockedModes')) || ['marx']
};

const MODE_ORDER = ['marx', 'smith', 'hayek', 'keynes', 'friedman'];

function getUnlockOrder() {
    return MODE_ORDER;
}

function updateModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        const mode = btn.dataset.mode;
        if (AppState.unlockedModes.includes(mode)) {
            btn.classList.remove('locked');
            btn.disabled = false;
            // Remove lock icon if present
            const icon = btn.querySelector('.lock-icon');
            if (icon) icon.remove();
        } else {
            btn.classList.add('locked');
            // Ensure lock icon exists if not present
            if (!btn.querySelector('.lock-icon')) {
                btn.innerHTML += ' <span class="lock-icon">🔒</span>';
            }
        }
    });
}

// --- DOM Elements ---
const DOM = {
    gameView: document.getElementById('game-view'),
    welcomeScreen: document.getElementById('welcome-screen'),
    startBtn: document.getElementById('start-marx-btn'),

    // Pyramid
    pyramidContainer: document.getElementById('pyramid-container'),

    // Scenario
    scenarioTitle: document.getElementById('scenario-title'),
    scenarioYear: document.getElementById('scenario-year'),
    scenarioSummary: document.getElementById('scenario-summary'),
    choicesContainer: document.getElementById('choices-container'),

    // Results
    indicatorsContainer: document.getElementById('indicators-container'),
    commentaryText: document.getElementById('commentary-text'),
    schoolButtons: document.querySelectorAll('.school-btn')
};

// --- Initialization ---
async function init() {
    console.log('EconoArena Initializing...');

    // Tooltip System
    setupTooltips();

    // Event Listeners
    DOM.startBtn.addEventListener('click', startGame);

    // Mode Switchers
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.disabled) return;
            const mode = e.target.dataset.mode;
            setGameMode(mode);
        });
    });

    DOM.schoolButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchView(view);
        });
    });

    // Initial Load - Default to Marx
    // Initial Load - Default to Marx
    updateModeButtons();
    setGameMode('marx');

    // Safety: Hide modal
    document.getElementById('game-over-modal').classList.add('hidden');
}

async function setGameMode(mode) {
    if (!AppState.unlockedModes.includes(mode)) {
        alert("Tato éra je zatím uzamčena! Dokončete předchozí úroveň.");
        return;
    }

    console.log(`Switching to ${mode} mode...`);

    // Update Mode UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('mode-btn--active');
        } else {
            btn.classList.remove('mode-btn--active');
        }
    });

    // Fetch Data
    try {
        const response = await fetch(`/api/${mode}/scenarios`);
        const data = await response.json();

        if (!data || data.length === 0) {
            console.error('No scenarios found for mode:', mode);
            return;
        }

        AppState.scenarios = data;
        AppState.currentMode = mode;

        // When switching modes, set the default view to that philosopher
        switchView(mode);

        console.log('Scenarios loaded:', AppState.scenarios);

        // If not on welcome screen, load first scenario immediately
        if (DOM.welcomeScreen.style.display === 'none') {
            loadScenario(0);
        }
    } catch (error) {
        console.error(`Failed to load ${mode} scenarios:`, error);
        alert('Chyba při načítání dat.');
    }
}

function startGame() {
    DOM.welcomeScreen.style.display = 'none';
    DOM.gameView.classList.remove('hidden');
    // Ensure data is loaded (it should be from init -> setGameMode)
    if (AppState.scenarios.length > 0) {
        loadScenario(0);
    } else {
        // Fallback retry if fetch wasn't fast enough
        setTimeout(() => loadScenario(0), 500);
    }
}

// --- Core Logic ---

function loadScenario(index) {
    if (index >= AppState.scenarios.length) {
        handleVictory(AppState.currentMode);
        return;
    }

    AppState.currentScenarioIndex = index;
    const scenario = AppState.scenarios[index];

    // Init state from scenario defaults
    AppState.currentStats.pyramid = { ...scenario.pyramidEffects };
    AppState.currentStats.indicators = { ...scenario.indicators };
    AppState.lastCommentary = null; // Reset commentary

    renderAll();
}

function handleChoice(choice) {
    // Apply effects
    const effects = choice.effects;

    // Update Pyramid (simple addition for now)
    for (const [key, value] of Object.entries(effects.pyramid)) {
        if (AppState.currentStats.pyramid[key] !== undefined) {
            AppState.currentStats.pyramid[key] += value;
            // Clamp values between 0 and 100
            AppState.currentStats.pyramid[key] = Math.max(0, Math.min(100, AppState.currentStats.pyramid[key]));
        }
    }

    // Update Indicators
    for (const [key, value] of Object.entries(effects.indicators)) {
        if (AppState.currentStats.indicators[key] !== undefined) {
            AppState.currentStats.indicators[key] += value;
            // Round to 2 decimals
            AppState.currentStats.indicators[key] = Math.round(AppState.currentStats.indicators[key] * 100) / 100;
        }
    }

    // Set commentary
    AppState.lastCommentary = effects.commentary;

    // Update Image if specified in effects
    if (effects.imagePath) {
        const imgEl = document.getElementById('scenario-image');
        if (imgEl) {
            imgEl.src = effects.imagePath;
            imgEl.classList.remove('hidden');
        }
    }

    // Re-render
    renderPyramid();
    renderIndicators();
    renderCommentary();

    // CHECK FOR REVOLUTION (Game Over)
    if (AppState.currentStats.indicators.classTension >= 1.0) {
        triggerRevolution();
        return; // Stop further processing
    }

    // Advance to next scenario (after a delay or immediately? For this MVP, let's wait user input or simple alert)
    // Actually, let's keep the user on the same screen to see results, and maybe add a "Next" button or auto-advance.
    // For MVP flow: Choice -> Update UI -> Show Commentary -> User clicks "Next Scenario" (we need to add this button dynamically)

    // Replace choices with "Next Level" button
    DOM.choicesContainer.innerHTML = '';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-primary'; // Reuse primary style
    nextBtn.style.width = '100%';
    nextBtn.textContent = 'Další scénář →';
    nextBtn.onclick = () => loadScenario(AppState.currentScenarioIndex + 1);
    DOM.choicesContainer.appendChild(nextBtn);
}

function triggerRevolution() {
    const modal = document.getElementById('game-over-modal');
    modal.classList.remove('hidden');

    // Add event listener for restart if not already there (or just onclick)
    document.getElementById('restart-btn').onclick = () => {
        modal.classList.add('hidden');
        location.reload(); // Simple reload to restart app
    };
}

function handleVictory(currentMode) {
    const order = getUnlockOrder();
    const currentIndex = order.indexOf(currentMode);

    // Unlock next mode
    if (currentIndex >= 0 && currentIndex < order.length - 1) {
        const nextMode = order[currentIndex + 1];
        if (!AppState.unlockedModes.includes(nextMode)) {
            AppState.unlockedModes.push(nextMode);
            localStorage.setItem('unlockedModes', JSON.stringify(AppState.unlockedModes));
            updateModeButtons();
        }

        // Show Victory Modal
        const modal = document.getElementById('victory-modal');
        const nextBtn = document.getElementById('next-campaign-btn');
        const msg = document.getElementById('victory-message');

        msg.textContent = `Dokončili jste éru: ${currentMode.toUpperCase()}. Nyní se otevírá svět: ${nextMode.toUpperCase()}.`;

        // Configure Next Button
        nextBtn.onclick = () => {
            modal.classList.add('hidden');
            setGameMode(nextMode);
        };

        modal.classList.remove('hidden');
    } else {
        // Final Victory (Friedman finished)
        alert("Gratulujeme! Dokončili jste celou historii ekonomického myšlení!");
    }
}

function switchView(viewName) {
    AppState.currentView = viewName;

    // Update buttons UI
    DOM.schoolButtons.forEach(btn => {
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update commentary
    renderCommentary();
}

// --- Rendering ---

function renderAll() {
    renderScenarioInfo();
    renderPyramid();
    renderIndicators();
    renderCommentary();
}

function renderScenarioInfo() {
    const scenario = AppState.scenarios[AppState.currentScenarioIndex];

    // Check and render image
    const imgEl = document.getElementById('scenario-image');
    if (imgEl) {
        if (scenario.imagePath) {
            imgEl.src = scenario.imagePath;
            imgEl.classList.remove('hidden');
        } else {
            imgEl.classList.add('hidden');
        }
    }

    DOM.scenarioTitle.textContent = scenario.title;
    DOM.scenarioYear.textContent = `Rok: ${scenario.year}`;
    DOM.scenarioSummary.textContent = scenario.summary;

    // Render Choices
    DOM.choicesContainer.innerHTML = '';
    scenario.choices.forEach(choice => {
        const btn = document.createElement('div');
        btn.className = 'choice-btn';
        btn.innerHTML = `
            <h4>${choice.label}</h4>
            <p>${choice.description}</p>
        `;
        btn.addEventListener('click', () => handleChoice(choice));
        DOM.choicesContainer.appendChild(btn);
    });
}

function renderPyramid() {
    DOM.pyramidContainer.innerHTML = '';
    const p = AppState.currentStats.pyramid;

    // Define layers order (bottom to top is handled by flex-direction: column-reverse in CSS)
    // So we just render them. 
    // Wait, CSS `column-reverse` means first DOM element is at bottom.
    // Standard Pyramid: Workers (Base) -> Petite B -> Bourgeoisie -> Finance -> State (Top)

    const layers = [
        { id: 'workers', label: 'Proletariát' },
        { id: 'petitBourgeoisie', label: 'Maloburžoazie' },
        { id: 'bourgeoisie', label: 'Buržoazie' },
        { id: 'financeCapital', label: 'Finanční kapitál' },
        { id: 'stateIdeology', label: 'Stát & Ideologie' }
    ];

    layers.forEach(layerDef => {
        const value = p[layerDef.id];
        const el = document.createElement('div');
        el.className = 'pyramid-layer';
        el.textContent = `${layerDef.label} (${value})`;

        // Dynamic styles
        // Width: somewhat relative to value (e.g., 50% + value/2 %)
        // But for a pyramid shape, we usually want fixed widths decreasing upwards.
        // Let's rely on Color for satisfaction/status and maybe width for "Power"?
        // Prompt said: "šířka nebo saturace barvy se mění podle síly".
        // Let's map Value to Color State.

        if (value < 40) el.classList.add('layer--angry');
        else if (value < 70) el.classList.add('layer--neutral');
        else el.classList.add('layer--happy');

        // Let's mimic a pyramid shape via width, but modify it slightly by power/size if we had that metric.
        // Here we just have one number per layer. Let's assume it's Satisfaction/Stability.
        // So width is fixed for the visual pyramid shape.

        // Simple manual pyramid widths
        const widths = {
            'workers': '100%',
            'petitBourgeoisie': '85%',
            'bourgeoisie': '70%',
            'financeCapital': '55%',
            'stateIdeology': '40%'
        };
        el.style.width = widths[layerDef.id];

        DOM.pyramidContainer.appendChild(el);
    });
}

function renderIndicators() {
    DOM.indicatorsContainer.innerHTML = '';
    const i = AppState.currentStats.indicators;

    const labels = {
        profitRate: 'Míra zisku',
        classTension: 'Třídní napětí',
        unemployment: 'Nezaměstnanost'
    };

    for (const [key, value] of Object.entries(i)) {
        const el = document.createElement('div');
        el.className = 'indicator-item';

        // Format value (e.g. 0.15 -> 15%)
        const formattedVal = (value * 100).toFixed(1) + '%';

        el.innerHTML = `
            <span class="indicator-label">${labels[key] || key}</span>
            <span class="indicator-value">${formattedVal}</span>
        `;
        DOM.indicatorsContainer.appendChild(el);
    }
}

function renderCommentary() {
    if (!AppState.lastCommentary) {
        DOM.commentaryText.innerHTML = '<p style="color:var(--text-muted)">Vyberte možnost pro zobrazení výsledku.</p>';
        return;
    }

    const text = AppState.lastCommentary[AppState.currentView];
    // Add School prefix
    const schoolNames = {
        marx: 'Karl Marx',
        smith: 'Adam Smith',
        hayek: 'F.A. Hayek',
        keynes: 'J.M. Keynes',
        friedman: 'Milton Friedman'
    };

    DOM.commentaryText.innerHTML = `
        <strong style="display:block; margin-bottom:0.5rem; color:var(--parchment)">${schoolNames[AppState.currentView]}:</strong>
        ${text}
    `;

    // Change border color based on school
    const colors = {
        marx: '#8b0000',
        smith: '#4682b4',
        hayek: '#556b2f',
        keynes: '#483d8b', // Dark Slate Blue
        friedman: '#daa520' // Goldenrod
    };
    DOM.commentaryText.style.borderLeftColor = colors[AppState.currentView];
}

// --- Tooltip System ---
function setupTooltips() {
    const tooltipEl = document.getElementById('global-tooltip');

    // 1. Handle .tooltip-container (Pyramid/Indicators)
    document.querySelectorAll('.tooltip-container').forEach(container => {
        const textEl = container.querySelector('.tooltip-text');
        if (textEl) {
            // Move text content to data attribute for clean access
            const htmlContent = textEl.innerHTML;
            container.dataset.tooltip = htmlContent;

            // Attach events
            attachTooltipEvents(container, tooltipEl);
        }
    });

    // 2. Handle Locked Buttons
    // Since these can change state, we might need a delegated listener or re-attach on update.
    // For simplicity, let's use a document-level delegation for buttons to handle dynamic changes.
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.mode-btn.locked');
        if (target) {
            showTooltip(e, "Dokončete předchozí úroveň!", tooltipEl);
        } else if (e.target.closest('.tooltip-container')) {
            // Handled by specific listeners or we can do delegation here too? 
            // Let's stick to delegation for everything to be robust against dynamic content.
            const container = e.target.closest('.tooltip-container');
            if (container && container.dataset.tooltip) {
                showTooltip(e, container.dataset.tooltip, tooltipEl);
            }
        }
    });

    document.body.addEventListener('mousemove', (e) => {
        if (tooltipEl.style.display !== 'none') {
            moveTooltip(e, tooltipEl);
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const lockedBtn = e.target.closest('.mode-btn.locked');
        const container = e.target.closest('.tooltip-container');
        if (lockedBtn || container) {
            hideTooltip(tooltipEl);
        }
    });
}

function attachTooltipEvents(element, tooltipEl) {
    // Legacy direct attachment helper (superseded by delegation above but kept for structure if needed)
}

function showTooltip(e, content, tooltipEl) {
    tooltipEl.innerHTML = content;
    tooltipEl.classList.remove('hidden');
    tooltipEl.style.display = 'block'; // Ensure visibility
    moveTooltip(e, tooltipEl);
}

function moveTooltip(e, tooltipEl) {
    // Offset from mouse
    const x = e.clientX + 15;
    const y = e.clientY + 15;

    // Bounds check (keep onscreen)
    // For now simple positioning
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
}

function hideTooltip(tooltipEl) {
    tooltipEl.classList.add('hidden');
    tooltipEl.style.display = 'none';
}

// Start
window.addEventListener('scroll', (e) => e.preventDefault()); // Prevent accidental scroll
init();
