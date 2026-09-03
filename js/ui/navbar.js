// js/ui/navbar.js (ナビゲーションバー・年月移動・観測所選択・テーマ管理)

window.checkAvailableTides = async function(year) {
    const select = document.getElementById('tideSelect');
    if(!select) return;
    
    const promises = TIDE_STATIONS.map(async (station, i) => {
        const url = `tides/tide_${station.code}_${year}.csv`;
        try {
            const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
            if (res.ok) {
                select.options[i].text = `★ ${station.name} (${station.code})`;
            } else {
                select.options[i].text = `${station.name} (${station.code})`;
            }
        } catch(e) {
            select.options[i].text = `${station.name} (${station.code})`;
        }
    });
    
    await Promise.all(promises);
};

function initNavBar() {
    let navDiv = document.getElementById('nav-bar');
    if (navDiv) return;

    navDiv = document.createElement('div');
    navDiv.className = 'panel-ui';
    navDiv.id = 'nav-bar';
    navDiv.style = "position:fixed; top:30px; right:30px; background:rgba(25,30,40,0.85); padding:10px 15px; border-radius:8px; color:#d4af37; z-index:100; display:flex; gap:15px; align-items:center; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);";
    
    let tideOptions = "";
    TIDE_STATIONS.forEach((station, idx) => {
        tideOptions += `<option value="${idx}" ${idx === currentTideStationIndex ? "selected" : ""}>${station.name} (${station.code})</option>`;
    });

    navDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; border-right:1px solid rgba(212,175,55,0.3); padding-right:15px;">
            <div style="display:flex; align-items:center; gap:5px;">
                <span style="font-size:12px; color:#8b949e;">雨(CSV):</span>
                <input type="text" id="locationInput" placeholder="地名を入力" value="${currentLocationName}" style="width:90px; padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:#fff; font-size:12px;">
                <button id="searchLocationBtn" style="background:#0ea5e9; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:bold; font-size:12px;">読込</button>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <span style="font-size:12px; color:#8b949e;">潮(CSV):</span>
                <select id="tideSelect" style="padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:#fff; font-size:12px; max-width: 140px;">
                    ${tideOptions}
                </select>
            </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div style="display:flex; align-items:center; gap:6px;">
                <button id="prevBtn" style="background:transparent; border:1px solid #d4af37; color:#d4af37; padding:2px 8px; cursor:pointer; border-radius:4px; font-size:12px;">◀</button>
                <div id="cycleDisplay" title="クリックして年月を移動" style="font-weight:bold; font-size:13px; text-align:center; min-width:110px; cursor:pointer; padding:2px 4px; border-radius:4px; transition:background 0.2s;">--</div>
                <button id="nextBtn" style="background:#d4af37; border:none; color:#000; padding:2px 8px; cursor:pointer; border-radius:4px; font-weight:bold; font-size:12px;">▶</button>
            </div>
            <div id="day-controller" style="display:flex; align-items:center; gap:4px; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px; border:1px solid rgba(212,175,55,0.25);">
                <button id="prevDayBtn" title="1日戻る" style="background:transparent; border:none; color:#d4af37; cursor:pointer; font-size:11px; padding:1px 4px;">◀</button>
                <span id="dayDisplay" style="font-size:11px; font-weight:bold; color:#fff; min-width:90px; text-align:center;">--</span>
                <button id="nextDayBtn" title="1日進む" style="background:transparent; border:none; color:#d4af37; cursor:pointer; font-size:11px; padding:1px 4px;">▶</button>
                <button id="todayBtn" title="現在日時にリセット" style="background:rgba(212,175,55,0.2); border:1px solid #d4af37; color:#d4af37; font-size:10px; padding:1px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">今日</button>
            </div>
        </div>
    `;
    document.body.appendChild(navDiv);

    const jumpDiv = document.createElement('div');
    jumpDiv.className = 'panel-ui';
    jumpDiv.id = 'jumpMenu';
    jumpDiv.style = "position:fixed; top:80px; right:30px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; border: 1px solid rgba(212,175,55,0.5); display:none; z-index:101; flex-direction:column; gap:8px;";
    jumpDiv.innerHTML = `
        <div style="font-size:12px; color:#fff;">移動先の年月 (例: 2026-08)</div>
        <div style="display:flex; gap:5px;">
            <input type="month" id="jumpInput" style="padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:#fff;">
            <button id="jumpGoBtn" style="background:#d4af37; border:none; color:#000; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">GO</button>
        </div>
    `;
    document.body.appendChild(jumpDiv);

    const blockEvent = (e) => e.stopPropagation();
    [navDiv, jumpDiv].forEach(p => {
        p.addEventListener('mousedown', blockEvent);
        p.addEventListener('wheel', blockEvent);
        p.addEventListener('mousemove', blockEvent);
    });

    const cycleDisplay = document.getElementById('cycleDisplay');
    cycleDisplay.onmouseover = () => { cycleDisplay.style.background = "rgba(255,255,255,0.1)"; };
    cycleDisplay.onmouseout = () => { cycleDisplay.style.background = "transparent"; };
    cycleDisplay.onclick = () => { jumpDiv.style.display = jumpDiv.style.display === 'none' ? 'flex' : 'none'; };

    document.getElementById('prevBtn').onclick = () => {
        currentCycle--;
        if(typeof updateCalendarCycle === 'function') updateCalendarCycle();
        if (document.getElementById('design-panel') && document.getElementById('design-panel').style.display === 'block') loadPanelData();
    };

    document.getElementById('nextBtn').onclick = () => {
        currentCycle++;
        if(typeof updateCalendarCycle === 'function') updateCalendarCycle();
        if (document.getElementById('design-panel') && document.getElementById('design-panel').style.display === 'block') loadPanelData();
    };

    document.getElementById('searchLocationBtn').onclick = () => {
        const query = document.getElementById('locationInput').value.trim();
        if(!query) return;
        currentLocationName = query; 
        if(typeof updateCalendarCycle === 'function') updateCalendarCycle();
    };

    document.getElementById('tideSelect').onchange = (e) => {
        currentTideStationIndex = parseInt(e.target.value);
        if(typeof updateCalendarCycle === 'function') updateCalendarCycle();
    };

    document.getElementById('jumpGoBtn').onclick = () => {
        const val = document.getElementById('jumpInput').value;
        if (!val) return;
        const [y, m] = val.split('-').map(Number);
        const targetDate = new Date(y, m - 1, 15);
        const diffDays = (targetDate.getTime() - baseDate.getTime()) / MS_PER_DAY;
        currentCycle = Math.round(diffDays / synodicMonth);
        jumpDiv.style.display = 'none';
        if(typeof updateCalendarCycle === 'function') updateCalendarCycle();
    };

    // --- 日付送りコントローラーのイベント ---
    window.updateDayDisplay = function() {
        const display = document.getElementById('dayDisplay');
        if (!display) return;

        const cycleStart = window.lastCycleStartTimeMs || 0;
        const monthDays = window.currentMonthDays || 30;
        const nowMs = Date.now();

        if (window.inspectedDateMs) {
            const d = new Date(window.inspectedDateMs);
            display.innerHTML = `${d.getDate()}日 <span style="font-size:10px; color:#38bdf8;">(探索中)</span>`;
        } else if (nowMs >= cycleStart && nowMs <= cycleStart + monthDays * MS_PER_DAY) {
            const d = new Date(nowMs);
            display.innerHTML = `${d.getDate()}日 <span style="font-size:10px; color:#4ade80;">(今日)</span>`;
        } else {
            display.innerHTML = `新月 <span style="font-size:10px; color:#8b949e;">(待機中)</span>`;
        }
    };

    document.getElementById('prevDayBtn').onclick = () => {
        const cycleStart = window.lastCycleStartTimeMs || Date.now();
        const base = window.inspectedDateMs || (Date.now() >= cycleStart && Date.now() <= cycleStart + 30 * MS_PER_DAY ? Date.now() : cycleStart);
        window.inspectedDateMs = base - MS_PER_DAY;
        window.updateDayDisplay();
        if (typeof drawClockHands === 'function') drawClockHands(window.lastCycleStartTimeMs);
    };

    document.getElementById('nextDayBtn').onclick = () => {
        const cycleStart = window.lastCycleStartTimeMs || Date.now();
        const base = window.inspectedDateMs || (Date.now() >= cycleStart && Date.now() <= cycleStart + 30 * MS_PER_DAY ? Date.now() : cycleStart);
        window.inspectedDateMs = base + MS_PER_DAY;
        window.updateDayDisplay();
        if (typeof drawClockHands === 'function') drawClockHands(window.lastCycleStartTimeMs);
    };

    document.getElementById('todayBtn').onclick = () => {
        window.inspectedDateMs = null;
        window.updateDayDisplay();
        if (typeof drawClockHands === 'function') drawClockHands(window.lastCycleStartTimeMs);
        if (statusBar) statusBar.innerText = "時計の針を現在日時にリセットしました";
    };

    window.updateDayDisplay();

    const btnMinimize = document.getElementById('btn-minimize-panel');
    const panelContent = document.getElementById('layer-panel-content');
    if (btnMinimize && panelContent) {
        btnMinimize.onclick = () => {
            if (panelContent.style.display === 'none') {
                panelContent.style.display = 'block';
                btnMinimize.textContent = '−';
            } else {
                panelContent.style.display = 'none';
                btnMinimize.textContent = '＋';
            }
        };
    }

    const themeBox = document.querySelector('#layer-panel-content > div:first-child');
    if (themeBox) {
        themeBox.style.background = "rgba(0, 0, 0, 0.3)";
        themeBox.style.borderColor = "rgba(212, 175, 55, 0.3)";
        themeBox.innerHTML = `
            <div style="font-size:12px; color:#d4af37; margin-bottom:8px; font-weight:bold; text-align:center;">テーマ (プリセット) 管理</div>
            <div style="display:flex; gap:5px; margin-bottom:6px; align-items:center;">
                <select id="theme-select" style="flex:1; min-width:0; background:#222; color:#fff; border:1px solid #555; border-radius:4px; font-size:12px; height:26px; box-sizing:border-box; padding:0 4px;">
                    <option value="default">デフォルト設定</option>
                </select>
                <button id="btn-theme-load" style="width:50px; background:#d4af37; border:none; color:#000; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; height:26px; box-sizing:border-box; padding:0;">読込</button>
            </div>
            <div style="display:flex; gap:5px; margin-bottom:12px; align-items:center;">
                <input type="text" id="theme-name-input" placeholder="テーマ名を入力" style="flex:1; min-width:0; background:#222; color:#fff; border:1px solid #555; border-radius:4px; font-size:12px; height:26px; box-sizing:border-box; padding:0 6px;">
                <button id="btn-theme-save" style="width:50px; background:rgba(56,189,248,0.2); border:1px solid #38bdf8; color:#38bdf8; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; height:26px; box-sizing:border-box; padding:0;">保存</button>
            </div>
            <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0 0 10px 0;">
            <button id="btn-apply-global" style="background:#0ea5e9; color:#fff; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; width:100%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: 0.2s;">
                デザインを全月適用
            </button>
        `;
        document.getElementById('btn-apply-global').onmouseover = function() { this.style.background = '#0284c7'; };
        document.getElementById('btn-apply-global').onmouseout = function() { this.style.background = '#0ea5e9'; };
        document.getElementById('btn-apply-global').onclick = () => {
            if(confirm("現在の色や設定を、すべての月の基本デザインとして適用しますか？")) {
                if(typeof window.applyGlobalSettings === 'function') {
                    window.applyGlobalSettings();
                    updateCalendarCycle();
                }
            }
        };
    }

    const updateThemeSelect = () => {
        const select = document.getElementById('theme-select');
        if(!select) return;
        select.innerHTML = '<option value="default">デフォルト設定</option>';
        for(const name in window.savedThemes) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        }
    };
    if (window.savedThemes) updateThemeSelect();

    const btnThemeSave = document.getElementById('btn-theme-save');
    if (btnThemeSave) {
        btnThemeSave.onclick = () => {
            const name = document.getElementById('theme-name-input').value.trim();
            if(!name) return alert("保存するテーマ名を入力してください");
            if (!window.savedThemes) window.savedThemes = {};
            window.savedThemes[name] = cloneDeep(window.layerSettings);
            localStorage.setItem(STORAGE_KEY_THEMES, JSON.stringify(window.savedThemes));
            updateThemeSelect();
            document.getElementById('theme-select').value = name;
            document.getElementById('theme-name-input').value = "";
            alert(`テーマ「${name}」を保存しました！`);
        };
    }

    const btnThemeLoad = document.getElementById('btn-theme-load');
    if (btnThemeLoad) {
        btnThemeLoad.onclick = () => {
            const name = document.getElementById('theme-select').value;
            if(name === 'default') {
                window.layerSettings = cloneDeep(window.defaultLayerSettings);
            } else if(window.savedThemes && window.savedThemes[name]) {
                window.layerSettings = cloneDeep(window.savedThemes[name]);
            }
            window.saveLayerSettings();
            updateCalendarCycle();
            const dp = document.getElementById('design-panel');
            if (dp) dp.style.display = 'none';
        };
    }

    const resetAllBtn = document.getElementById('reset-all-settings');
    if (resetAllBtn) {
        resetAllBtn.onclick = () => {
            if (confirm('⚠️ すべてのデザイン設定を完全に初期化しますか？\n（各月のデザイン設定もすべて消去されます）')) {
                localStorage.removeItem(STORAGE_KEY_SETTINGS);
                window.appSettings = { global: cloneDeep(window.defaultLayerSettings), months: {} };
                window.layerSettings = cloneDeep(window.defaultLayerSettings);
                window.saveLayerSettings();
                updateCalendarCycle();
                const dp = document.getElementById('design-panel');
                if (dp) dp.style.display = 'none';
                alert('すべてのデザイン設定を初期状態に戻しました。');
            }
        };
    }
}
