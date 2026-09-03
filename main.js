// main.js (司令塔・初期化 & サイクル制御オーケストレーター)

function isObject(item) { 
    return (item && typeof item === 'object' && !Array.isArray(item)); 
}

function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else Object.assign(target, { [key]: source[key] });
        }
    }
    return mergeDeep(target, ...sources);
}

const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));
const saveAppSettings = () => localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(window.appSettings));

window.appSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS)) || { global: cloneDeep(window.defaultLayerSettings), months: {} };
window.layerSettings = {}; 

window.loadSettingsForCycle = function(cycleIdx) {
    const base = mergeDeep(cloneDeep(window.defaultLayerSettings), cloneDeep(window.appSettings.global));
    const monthData = window.appSettings.months[`cycle_${cycleIdx}`];
    window.layerSettings = monthData ? mergeDeep(base, monthData) : base;
};

window.saveLayerSettings = () => {
    window.appSettings.months[`cycle_${currentCycle}`] = cloneDeep(window.layerSettings);
    saveAppSettings();
};

window.applyGlobalSettings = () => {
    window.appSettings.global = cloneDeep(window.layerSettings);
    window.appSettings.months = {}; 
    saveAppSettings();
    alert("現在の色や設定を、すべての月の基本デザインとして適用しました！");
};

/**
 * 各描画処理を安全に実行し、万一のエラーでも他の描画を止めない
 */
function safeExecute(taskName, fn) {
    try {
        if (typeof fn === 'function') fn();
    } catch (e) {
        console.error(`[機能エラー分離] ${taskName} の描画中に問題が発生したためスキップしました。`, e);
    }
}

/**
 * 選択されたサイクル(月)に応じてすべてのレイヤーを再計算・再描画
 */
function updateCalendarCycle() {
    window.loadSettingsForCycle(currentCycle);
    document.body.style.backgroundColor = window.layerSettings.canvasBg.fill;

    const estimatedStartTimeMs = baseDate.getTime() + (currentCycle * synodicMonth) * MS_PER_DAY;
    let startDate = new Date(estimatedStartTimeMs);

    for (let offset = -3; offset <= 3; offset++) {
        const checkDate = new Date(estimatedStartTimeMs + offset * MS_PER_DAY);
        const dbRow = koyomiDatabase[formatDateStr(checkDate)];
        if (dbRow && dbRow[1] && dbRow[1].includes("月一日")) {
            startDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
            break;
        }
    }

    const cycleStartTimeMs = startDate.getTime();
    window.lastCycleStartTimeMs = cycleStartTimeMs;

    currentStartSegment = Math.round(((cycleStartTimeMs - baseDate.getTime()) / MS_PER_DAY % CYCLE_DAYS) * SEGMENTS_PER_DAY) % TOTAL_SEGMENTS;
    if (currentStartSegment < 0) currentStartSegment += TOTAL_SEGMENTS;
    globalRotation = -currentStartSegment * DEGREES_PER_SEGMENT;

    const targetYear = startDate.getFullYear();
    const cycleDisplay = document.getElementById('cycleDisplay');
    if (cycleDisplay) cycleDisplay.innerHTML = `${targetYear}年 ${startDate.getMonth() + 1}月 <span style="font-size:10px;">▼</span><br><span style="font-size:11px; color:#8b949e;">新月: ${startDate.getMonth() + 1}月${startDate.getDate()}日〜</span>`;
    if (typeof window.updateDayDisplay === 'function') window.updateDayDisplay();

    if (window.lastCheckedTideYear !== targetYear) {
        safeExecute('checkAvailableTides', () => window.checkAvailableTides(targetYear));
        window.lastCheckedTideYear = targetYear;
    }

    safeExecute('computeMonthDays', () => computeMonthDays(startDate));

    safeExecute('drawLunarShadow', () => drawLunarShadow(cycleStartTimeMs));
    safeExecute('drawAstronomicalPins', () => drawAstronomicalPins(cycleStartTimeMs));
    safeExecute('drawDynamicLines', () => drawDynamicLines());
    safeExecute('drawLunarMansions', () => drawLunarMansions(cycleStartTimeMs));
    safeExecute('drawZodiacRing', () => drawZodiacRing(cycleStartTimeMs));
    safeExecute('renderSavedData', () => renderSavedData());
    safeExecute('drawTimeLabels', () => drawTimeLabels());
    safeExecute('drawKoyomiEvents', () => drawKoyomiEvents(startDate));
    safeExecute('drawHaikus', () => drawHaikus(startDate));
    safeExecute('drawClockHands', () => drawClockHands(cycleStartTimeMs));

    safeExecute('applyMasterTransform', () => {
        if (masterGroup) masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
        if (bgGroup) {
            const stBase = window.layerSettings.baseSvg || window.defaultLayerSettings.baseSvg;
            bgGroup.style.opacity = stBase.opacity !== undefined ? stBase.opacity : 1;
            Array.from(bgGroup.querySelectorAll('*')).forEach(el => {
                if (stBase.stroke && stBase.stroke !== "") {
                    el.setAttribute('stroke', stBase.stroke);
                    if (stBase.strokeWidth !== undefined && stBase.strokeWidth > 0) {
                        el.setAttribute('stroke-width', stBase.strokeWidth);
                    }
                } else {
                    const orig = el.getAttribute('data-orig-stroke');
                    if (orig) el.setAttribute('stroke', orig);
                    else el.removeAttribute('stroke');
                    
                    const origW = el.getAttribute('data-orig-stroke-width');
                    if (origW) el.setAttribute('stroke-width', origW);
                    else el.removeAttribute('stroke-width');
                }
            });
        }
    });

    fetchMeteoAndTideData(cycleStartTimeMs).then(() => {
        safeExecute('drawTideGraph', () => drawTideGraph(cycleStartTimeMs)); 
        safeExecute('drawRainfallGraph', () => drawRainfallGraph(cycleStartTimeMs));
        safeExecute('drawDailyRainStats', () => drawDailyRainStats(startDate));
        
        safeExecute('drawMoonEventPins', () => drawMoonEventPins(cycleStartTimeMs));
        safeExecute('drawSunEventPins', () => drawSunEventPins(startDate)); 
    }).catch(e => {
        console.error("fetchMeteoAndTideData の処理全体で致命的エラー", e);
    });
}

/**
 * アプリケーションの初期化
 */
async function initApp() {
    initUI();
    await loadAllData();

    try {
        const svgResponse = await fetch('calendar.svg');
        const svgCode = await svgResponse.text();
        
        if (container) container.innerHTML = svgCode;
        svg = container.querySelector('svg');
        if (!svg) return;
        
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
        svg.querySelectorAll('*[fill="#fff"]').forEach(el => el.setAttribute('fill', 'none'));
        svg.querySelectorAll('text, rect').forEach(el => el.remove());
        
        concentricRings = [];
        svg.querySelectorAll('circle').forEach(c => {
            const r = parseFloat(c.getAttribute('r'));
            if (r && Math.abs(parseFloat(c.getAttribute('cx')) - cx) < 1 && Math.abs(parseFloat(c.getAttribute('cy')) - cy) < 1) concentricRings.push(r);
        });
        concentricRings = [...new Set(concentricRings)].sort((a, b) => a - b);
        
        masterGroup = document.createElementNS(svgNS, "g");
        masterGroup.setAttribute("id", "master-group");
        bgGroup = document.createElementNS(svgNS, "g");
        bgGroup.setAttribute("id", "bg-group");
        
        while (svg.firstChild) {
            const child = svg.firstChild;
            if (child.nodeType === 1) { 
                if (child.getAttribute('stroke')) child.setAttribute('data-orig-stroke', child.getAttribute('stroke'));
                if (child.getAttribute('stroke-width')) child.setAttribute('data-orig-stroke-width', child.getAttribute('stroke-width'));
                child.querySelectorAll('*').forEach(el => {
                    if (el.getAttribute('stroke')) el.setAttribute('data-orig-stroke', el.getAttribute('stroke'));
                    if (el.getAttribute('stroke-width')) el.setAttribute('data-orig-stroke-width', el.getAttribute('stroke-width'));
                });
            }
            bgGroup.appendChild(child);
        }
        masterGroup.appendChild(bgGroup);
        svg.appendChild(masterGroup);

        const defs = document.createElementNS(svgNS, "defs");
        defs.setAttribute("id", "text-path-defs");
        masterGroup.appendChild(defs);
        
        const layerIds = ["layer-shadow", "layer-astronomical-pins", "layer-lines", "layer-data", "layer-tide-wave", "layer-rain-graph", "layer-daily-rain-bg", "layer-lunar-mansion", "layer-zodiac-ring", "layer-solar-dates", "layer-outer-season", "layer-guide-tide", "layer-guide-rain", "layer-daily-rain-text", "layer-guide-time", "layer-wafu-text", "layer-haiku", "layer-moon-rise", "layer-moon-set", "layer-sun-rise", "layer-sun-set", "layer-clock-hands"];
        layerIds.forEach(id => {
            const g = document.createElementNS(svgNS, "g");
            g.setAttribute("id", id);
            masterGroup.appendChild(g);
        });
        
        updateCalendarCycle();
        safeExecute('initInteractions', () => initInteractions());
        
    } catch(err) {
        console.error("SVG Init Error:", err);
    }
}

initApp();
