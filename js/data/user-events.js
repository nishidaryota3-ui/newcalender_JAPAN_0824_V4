/**
 * ユーザー観察記録・フェノロジー・日記データ管理 (User Observations & Diary Storage)
 */

const STORAGE_KEY_USER_EVENTS = 'polarCalendarUserEventsV1';

// 落ち着いた日本の伝統色パレット（過度な装飾・派手さを抑えた上品な色合い）
const USER_EVENT_CATEGORIES = {
    flora:   { id: 'flora',   name: '植物', color: '#5c9272', labelColor: '#88c7a1', desc: '開花・芽吹き・落葉など' },
    fauna:   { id: 'fauna',   name: '生物', color: '#c28542', labelColor: '#e0a96d', desc: '初鳴き・渡り鳥・虫など' },
    weather: { id: 'weather', name: '気象', color: '#5b8ea6', labelColor: '#8bc2db', desc: '初雪・夕立・雲・風など' },
    event:   { id: 'event',   name: '催事', color: '#b85d56', labelColor: '#df8882', desc: '行事・祭り・集いなど' },
    mind:    { id: 'mind',    name: '心想', color: '#7d6b91', labelColor: '#b09dc4', desc: '想い・気付き・日記など' },
    note:    { id: 'note',    name: '雑記', color: '#8b8170', labelColor: '#b8ad9c', desc: '日常のメモ・自由記録' }
};

window.USER_EVENT_CATEGORIES = USER_EVENT_CATEGORIES;

/**
 * すべての記録を localStorage から読み込む
 * 形式: { "YYYY-MM-DD": [ { id, text, category, createdAt, timeStr }, ... ] }
 */
function loadAllUserEvents() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_USER_EVENTS);
        if (!raw) return {};
        return JSON.parse(raw) || {};
    } catch (e) {
        console.error("Failed to load user events:", e);
        return {};
    }
}

/**
 * すべての記録を localStorage に保存する
 */
function saveAllUserEvents(data) {
    try {
        localStorage.setItem(STORAGE_KEY_USER_EVENTS, JSON.stringify(data));
        window.userEventsDatabase = data;
    } catch (e) {
        console.error("Failed to save user events:", e);
    }
}

// グローバルキャッシュ
window.userEventsDatabase = loadAllUserEvents();

/**
 * 特定の日の記録配列を取得
 */
function getUserEventsForDate(dateKey) {
    if (!window.userEventsDatabase) window.userEventsDatabase = loadAllUserEvents();
    return window.userEventsDatabase[dateKey] || [];
}

/**
 * 新しい記録を追加または更新
 */
function saveUserEvent(dateKey, entry) {
    const db = loadAllUserEvents();
    if (!db[dateKey]) db[dateKey] = [];
    
    if (entry.id) {
        const idx = db[dateKey].findIndex(item => item.id === entry.id);
        if (idx !== -1) {
            db[dateKey][idx] = { ...db[dateKey][idx], ...entry, updatedAt: Date.now() };
        } else {
            db[dateKey].push({ ...entry, id: 'ev_' + Date.now(), createdAt: Date.now() });
        }
    } else {
        entry.id = 'ev_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        entry.createdAt = Date.now();
        db[dateKey].push(entry);
    }

    saveAllUserEvents(db);
    return entry;
}

/**
 * 特定の記録を削除
 */
function deleteUserEvent(dateKey, entryId) {
    const db = loadAllUserEvents();
    if (!db[dateKey]) return;
    db[dateKey] = db[dateKey].filter(item => item.id !== entryId);
    if (db[dateKey].length === 0) {
        delete db[dateKey];
    }
    saveAllUserEvents(db);
}

/**
 * 当月のサイクル（30日間）に含まれるすべての記録を日付順に取得
 */
function getCycleUserEvents(startDateMs, totalDays = 30) {
    const db = loadAllUserEvents();
    const result = [];

    for (let day = 0; day < totalDays; day++) {
        const d = new Date(startDateMs + day * MS_PER_DAY);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${dt}`;

        const list = db[key] || [];
        list.forEach(item => {
            result.push({
                ...item,
                dateKey: key,
                dayIndex: day,
                month: d.getMonth() + 1,
                date: d.getDate()
            });
        });
    }

    return result;
}

window.loadAllUserEvents = loadAllUserEvents;
window.getUserEventsForDate = getUserEventsForDate;
window.saveUserEvent = saveUserEvent;
window.deleteUserEvent = deleteUserEvent;
window.getCycleUserEvents = getCycleUserEvents;
