/**
 * ユーザー観察記録・フェノロジー・日記 UI モーダル ＆ サイドドロワー
 * (Inline Event Modal & Observation Timeline Drawer)
 */

(function() {
    // --- 1. インライン入力モーダル HTML 生成 ---
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'user-event-modal-overlay';
    modalOverlay.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); backdrop-filter:blur(6px); z-index:9999; display:none; justify-content:center; align-items:center;";

    modalOverlay.innerHTML = `
        <div id="user-event-modal" style="background:#181d28; border:1px solid rgba(212,175,55,0.4); border-radius:12px; width:440px; max-width:92vw; padding:22px; color:#e2e8f0; box-shadow:0 15px 40px rgba(0,0,0,0.7); position:relative; font-family:'Shippori Mincho', 'YuMincho', serif;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                <div>
                    <div id="uem-date-title" style="font-size:18px; font-weight:bold; color:#d4af37; letter-spacing:0.05em;">--月--日</div>
                    <div id="uem-lunar-title" style="font-size:12px; color:#94a3b8; margin-top:2px;">--</div>
                </div>
                <button id="uem-close-btn" style="background:none; border:none; color:#94a3b8; font-size:20px; cursor:pointer; padding:0 4px; line-height:1;" title="閉じる">✕</button>
            </div>

            <!-- 当日の既存記録リスト -->
            <div id="uem-existing-list" style="margin-bottom:14px; max-height:140px; overflow-y:auto; display:none; flex-direction:column; gap:6px;"></div>

            <!-- 入力フォーム -->
            <div id="uem-form-title" style="font-size:12px; color:#cbd5e1; margin-bottom:6px; font-weight:bold;">新しい記録を追加:</div>
            <textarea id="uem-text-input" placeholder="動植物の様子、気象の気付き、日々の出来事や想い..." rows="2" style="width:100%; box-sizing:border-box; background:#0f131a; border:1px solid #334155; border-radius:6px; color:#f8fafc; padding:8px 10px; font-size:13px; font-family:inherit; resize:vertical; outline:none; margin-bottom:12px;"></textarea>

            <!-- カテゴリ選択（上品で控えめな和の色ボタン） -->
            <div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">分類 (カテゴリー):</div>
            <div id="uem-category-group" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-bottom:18px;"></div>

            <!-- 操作ボタン -->
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button id="uem-delete-btn" style="background:rgba(220,38,38,0.2); border:1px solid #ef4444; color:#fca5a5; padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer; display:none;">削除</button>
                <div style="display:flex; gap:8px; margin-left:auto;">
                    <button id="uem-cancel-btn" style="background:transparent; border:1px solid #475569; color:#cbd5e1; padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer;">キャンセル</button>
                    <button id="uem-save-btn" style="background:#d4af37; border:none; color:#0f172a; font-weight:bold; padding:6px 18px; border-radius:6px; font-size:12px; cursor:pointer;">保存する</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    // --- 2. サイドドロワー（観察記録タイムライン一覧） HTML 生成 ---
    const drawerOverlay = document.createElement('div');
    drawerOverlay.id = 'user-event-drawer';
    drawerOverlay.style = "position:fixed; top:0; right:-380px; width:360px; max-width:85vw; height:100vh; background:rgba(20,25,35,0.92); backdrop-filter:blur(16px); border-left:1px solid rgba(212,175,55,0.3); z-index:9998; box-shadow:-10px 0 30px rgba(0,0,0,0.6); transition:right 0.3s cubic-bezier(0.16, 1, 0.3, 1); display:flex; flex-direction:column; color:#e2e8f0; font-family:'Shippori Mincho', serif;";

    drawerOverlay.innerHTML = `
        <div style="padding:18px 20px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:16px; font-weight:bold; color:#d4af37; letter-spacing:0.06em;">観察記録・日記一覧</div>
                <div id="ued-month-title" style="font-size:11px; color:#94a3b8; margin-top:2px;">今月の記録</div>
            </div>
            <button id="ued-close-btn" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer; padding:2px;" title="閉じる">✕</button>
        </div>

        <div style="padding:10px 16px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; gap:6px; overflow-x:auto;" id="ued-filter-bar">
            <!-- フィルターボタンが自動生成されます -->
        </div>

        <div id="ued-timeline-list" style="flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:10px;">
            <!-- タイムライン項目が自動生成されます -->
        </div>

        <div style="padding:14px 16px; border-top:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2);">
            <button id="ued-add-today-btn" style="width:100%; background:rgba(212,175,55,0.15); border:1px solid #d4af37; color:#d4af37; padding:8px; border-radius:6px; font-size:13px; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:6px;">
                <span>＋ 今日の記録を追加</span>
            </button>
        </div>
    `;
    document.body.appendChild(drawerOverlay);

    // --- 3. 状態変数 ---
    let currentModalDateKey = "";
    let currentEditingEventId = null;
    let selectedCategory = "flora";
    let isDrawerOpen = false;
    let currentCategoryFilter = "all";

    // カテゴリ選択ボタンをモーダル内に構築
    const catGroup = document.getElementById('uem-category-group');
    const categories = window.USER_EVENT_CATEGORIES || {};

    Object.keys(categories).forEach(k => {
        const c = categories[k];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.catId = k;
        btn.style = `background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); color:#e2e8f0; padding:6px 8px; border-radius:6px; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s; font-family:inherit;`;
        btn.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${c.color};"></span><span>${c.name}</span>`;
        
        btn.onclick = () => {
            selectedCategory = k;
            updateCategoryButtonStyles();
        };
        catGroup.appendChild(btn);
    });

    function updateCategoryButtonStyles() {
        catGroup.querySelectorAll('button').forEach(btn => {
            const catId = btn.dataset.catId;
            const c = categories[catId];
            if (catId === selectedCategory) {
                btn.style.background = `rgba(${hexToRgb(c.color)}, 0.25)`;
                btn.style.borderColor = c.color;
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.background = 'rgba(255,255,255,0.05)';
                btn.style.borderColor = 'rgba(255,255,255,0.15)';
                btn.style.fontWeight = 'normal';
            }
        });
    }

    function hexToRgb(hex) {
        const num = parseInt(hex.replace('#', ''), 16);
        return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    }

    // --- 4. モーダル開閉・保存ロジック ---
    window.openUserEventModal = function(dateStr, eventId = null) {
        currentModalDateKey = dateStr;
        currentEditingEventId = eventId;

        const dParts = dateStr.split('-');
        const y = parseInt(dParts[0]), m = parseInt(dParts[1]), dt = parseInt(dParts[2]);
        const dateObj = new Date(y, m - 1, dt);

        document.getElementById('uem-date-title').innerText = `${m}月${dt}日 (${['日','月','火','水','木','金','土'][dateObj.getDay()]})`;

        // 旧暦情報の取得
        const koyomiRow = (window.koyomiDatabase && window.koyomiDatabase[dateStr]) || [];
        const lunarStr = koyomiRow[1] ? `旧暦 ${koyomiRow[0] || ''} ${koyomiRow[1]}` : "";
        const sekkiStr = koyomiRow[2] || "";
        document.getElementById('uem-lunar-title').innerText = [lunarStr, sekkiStr].filter(Boolean).join(' ・ ');

        // 既存記録リストの描画
        const existingList = document.getElementById('uem-existing-list');
        const events = getUserEventsForDate(dateStr);

        if (events.length > 0) {
            existingList.style.display = 'flex';
            existingList.innerHTML = events.map(ev => {
                const cat = categories[ev.category] || categories.note;
                const isSelected = ev.id === currentEditingEventId;
                return `
                    <div style="background:${isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.3)'}; border:1px solid ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.1)'}; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center; font-size:12px; cursor:pointer;" onclick="window.selectEventToEdit('${ev.id}')">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${cat.color};"></span>
                            <span style="color:#f1f5f9;">${escapeHTML(ev.text)}</span>
                        </div>
                        <span style="font-size:10px; color:#94a3b8;">${cat.name}</span>
                    </div>
                `;
            }).join('');
        } else {
            existingList.style.display = 'none';
            existingList.innerHTML = '';
        }

        // 編集モード or 新規作成モード
        if (currentEditingEventId) {
            const editingEv = events.find(e => e.id === currentEditingEventId);
            if (editingEv) {
                document.getElementById('uem-form-title').innerText = "記録を編集:";
                document.getElementById('uem-text-input').value = editingEv.text;
                selectedCategory = editingEv.category || 'flora';
                document.getElementById('uem-delete-btn').style.display = 'block';
            }
        } else {
            document.getElementById('uem-form-title').innerText = "新しい記録を追加:";
            document.getElementById('uem-text-input').value = "";
            selectedCategory = 'flora';
            document.getElementById('uem-delete-btn').style.display = 'none';
        }

        updateCategoryButtonStyles();
        modalOverlay.style.display = 'flex';
        setTimeout(() => document.getElementById('uem-text-input').focus(), 50);
    };

    window.selectEventToEdit = function(id) {
        window.openUserEventModal(currentModalDateKey, id);
    };

    function closeModal() {
        modalOverlay.style.display = 'none';
        currentEditingEventId = null;
    }

    document.getElementById('uem-close-btn').onclick = closeModal;
    document.getElementById('uem-cancel-btn').onclick = closeModal;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) closeModal();
    };

    document.getElementById('uem-save-btn').onclick = () => {
        const text = document.getElementById('uem-text-input').value.trim();
        if (!text) {
            alert("記録内容を入力してください。");
            return;
        }

        saveUserEvent(currentModalDateKey, {
            id: currentEditingEventId,
            text: text,
            category: selectedCategory
        });

        closeModal();
        redrawCalendarAndDrawer();
    };

    document.getElementById('uem-delete-btn').onclick = () => {
        if (!currentEditingEventId) return;
        if (confirm("この記録を削除しますか？")) {
            deleteUserEvent(currentModalDateKey, currentEditingEventId);
            closeModal();
            redrawCalendarAndDrawer();
        }
    };

    // --- 5. サイドドロワー一覧描画 ＆ 連動 ---
    window.toggleObservationDrawer = function(forceState) {
        if (typeof forceState === 'boolean') isDrawerOpen = forceState;
        else isDrawerOpen = !isDrawerOpen;

        drawerOverlay.style.right = isDrawerOpen ? '0px' : '-380px';
        if (isDrawerOpen) {
            renderDrawerTimeline();
        }
    };

    document.getElementById('ued-close-btn').onclick = () => window.toggleObservationDrawer(false);

    document.getElementById('ued-add-today-btn').onclick = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const dt = String(now.getDate()).padStart(2, '0');
        window.openUserEventModal(`${y}-${m}-${dt}`);
    };

    function renderDrawerTimeline() {
        const cycleStart = window.lastCycleStartTimeMs || (window.currentCycleDate ? window.currentCycleDate.getTime() : Date.now());
        const events = getCycleUserEvents(cycleStart, window.currentMonthDays || 30);

        const listElem = document.getElementById('ued-timeline-list');
        const filterBar = document.getElementById('ued-filter-bar');

        // フィルターボタン群の生成
        filterBar.innerHTML = `
            <button class="ued-f-btn ${currentCategoryFilter === 'all' ? 'active' : ''}" onclick="window.setObservationFilter('all')" style="background:${currentCategoryFilter === 'all' ? '#d4af37' : 'rgba(255,255,255,0.08)'}; color:${currentCategoryFilter === 'all' ? '#0f172a' : '#cbd5e1'}; border:none; padding:3px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:${currentCategoryFilter === 'all' ? 'bold' : 'normal'}; white-space:nowrap;">すべて (${events.length})</button>
            ${Object.keys(categories).map(k => {
                const c = categories[k];
                const count = events.filter(e => e.category === k).length;
                const isAct = currentCategoryFilter === k;
                return `<button class="ued-f-btn ${isAct ? 'active' : ''}" onclick="window.setObservationFilter('${k}')" style="background:${isAct ? c.color : 'rgba(255,255,255,0.08)'}; color:${isAct ? '#fff' : '#cbd5e1'}; border:none; padding:3px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:${isAct ? 'bold' : 'normal'}; white-space:nowrap;">${c.name} (${count})</button>`;
            }).join('')}
        `;

        const filtered = currentCategoryFilter === 'all' ? events : events.filter(e => e.category === currentCategoryFilter);

        if (filtered.length === 0) {
            listElem.innerHTML = `
                <div style="text-align:center; padding:40px 10px; color:#64748b; font-size:13px;">
                    <div style="font-size:24px; margin-bottom:8px; opacity:0.6;">📝</div>
                    今月の観察記録はまだありません。<br>ホイールの日付をダブルクリックして記録を追加できます。
                </div>
            `;
            return;
        }

        listElem.innerHTML = filtered.map(ev => {
            const cat = categories[ev.category] || categories.note;
            return `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-left:3px solid ${cat.color}; border-radius:6px; padding:10px 12px; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='rgba(212,175,55,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'" onclick="window.openUserEventModal('${ev.dateKey}', '${ev.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:13px; font-weight:bold; color:#d4af37;">${ev.month}月${ev.date}日</span>
                        <span style="font-size:10px; background:rgba(255,255,255,0.08); color:${cat.labelColor || cat.color}; padding:2px 6px; border-radius:3px;">${cat.name}</span>
                    </div>
                    <div style="font-size:13px; color:#f1f5f9; line-height:1.5;">${escapeHTML(ev.text)}</div>
                </div>
            `;
        }).join('');
    }

    window.setObservationFilter = function(filter) {
        currentCategoryFilter = filter;
        renderDrawerTimeline();
    };

    function redrawCalendarAndDrawer() {
        if (typeof drawUserEvents === 'function' && window.currentCycleDate) {
            drawUserEvents(window.currentCycleDate);
        }
        if (isDrawerOpen) {
            renderDrawerTimeline();
        }
    }

    function escapeHTML(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ツールバーボタン（観察記録ボタン）のイベントバインド
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('btn-toggle-observations');
        if (btn) btn.onclick = () => window.toggleObservationDrawer();
    });
})();
