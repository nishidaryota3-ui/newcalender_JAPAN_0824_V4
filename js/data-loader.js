// js/data-loader.js (CSV・スプレッドシート非同期通信 & データパース)

const koyomiDatabase = {};
const KOYOMI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqoX31YV0YAO3Mq4WatmLhjP7uUSF6dPMy3D2H3ktEFDFg1X1gJmoIXkul9JpS4aLgK9Ze3SSbV9BZ/pub?gid=0&single=true&output=csv';
const HAIKU_CSV_URL = 'https://docs.google.com/spreadsheets/d/1m0y8AOJNx1Ad4I44poPheQAQNki1-QQIwi9wSw8jaBg/export?format=csv&gid=126185184';

/**
 * CSVの1行を引用符を考慮してパース
 */
function parseCSVRow(str) {
    const result = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === '"') {
            if (inQuotes && str[i+1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += c;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Date オブジェクトを YYYY-MM-DD 形式の文字列にフォーマット
 */
function formatDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * 日付文字列を YYYY-MM-DD 形式に正規化
 */
function standardizeDateKey(rawStr) {
    return rawStr.replace(/\//g, '-').split('-').map(p => p.length === 1 ? '0'+p : p).join('-');
}

/**
 * 該当サイクルの潮位データと降水量データを並行取得
 */
async function fetchMeteoAndTideData(startDateMs) {
    const dStart = new Date(startDateMs);
    const targetYear = dStart.getFullYear(); 
    apiRainData = new Array(TOTAL_CYCLE_HOURS).fill(null);
    localRainData = {}; 
    highLowTidePoints = []; 
    let tideDataFound = false;
    let rainDataFound = false;
    const sb = document.getElementById('status-bar');
    const station = TIDE_STATIONS[currentTideStationIndex];

    const fetchTide = async () => {
        try {
            const res = await fetch(`tides/tide_${station.code}_${targetYear}.csv`);
            if (res.ok) {
                const txt = await res.text();
                const lines = txt.split('\n');
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(',');
                    if (parts.length >= 3) {
                        const dateStr = standardizeDateKey(parts[0]);
                        const timeMs = new Date(`${dateStr}T${parts[1].trim()}:00+09:00`).getTime();
                        if (timeMs >= startDateMs && timeMs <= startDateMs + CYCLE_DAYS * MS_PER_DAY) {
                            const tide = parseFloat(parts[2].trim());
                            if (!isNaN(timeMs) && !isNaN(tide)) highLowTidePoints.push({ time: timeMs, tide: tide });
                        }
                    }
                }
                if (highLowTidePoints.length > 0) {
                    highLowTidePoints.sort((a, b) => a.time - b.time);
                    tideDataFound = true;
                }
            }
        } catch(e) { console.warn("Tide fetch error", e); }
    };

    const fetchRain = async () => {
        try {
            const res = await fetch(`rain/rain_${currentLocationName}_${targetYear}.csv`);
            if (res.ok) {
                const txt = await res.text();
                const lines = txt.split('\n');
                const hourlyMap = {};
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(',');
                    if (parts.length >= 3) {
                        const dateStr = standardizeDateKey(parts[0]);
                        const timeStr = parts[1].trim();
                        const rain = parseFloat(parts[2].trim());
                        if (!isNaN(rain)) {
                            if (localRainData[dateStr] === undefined) localRainData[dateStr] = 0;
                            localRainData[dateStr] += rain;
                            hourlyMap[new Date(`${dateStr}T${timeStr}+09:00`).getTime()] = rain;
                        }
                    }
                }
                for(let h=0; h<TOTAL_CYCLE_HOURS; h++) {
                    const tMs = startDateMs + h * MS_PER_HOUR;
                    apiRainData[h] = hourlyMap[tMs] !== undefined ? hourlyMap[tMs] : null;
                }
                rainDataFound = true;
            }
        } catch(e) { console.warn("Rain fetch error", e); }
    };

    await Promise.all([fetchTide(), fetchRain()]);

    if (sb) {
        let msg = "";
        if (!tideDataFound && !rainDataFound) msg = `⚠️ 潮汐 (${station.name}) と 雨 (${currentLocationName}) のCSVが見つかりません`;
        else if (!tideDataFound) msg = `⚠️ 潮汐 (${station.name}) のCSVが見つかりません (tidesフォルダを確認)`;
        else if (!rainDataFound) msg = `⚠️ 雨 (${currentLocationName}) のCSVが見つかりません (rainフォルダを確認)`;
        else msg = `✅ ${station.name}の潮汐 ＋ ${currentLocationName}の雨 を描画しました`;
        sb.innerText = msg;
        sb.style.color = (tideDataFound && rainDataFound) ? "#38bdf8" : "#ff8888";
    }
}

/**
 * Googleスプレッドシートから暦注データおよび俳句データを非同期取得
 */
async function loadAllData() {
    const fetchCSV = async (url) => {
        try { 
            const res = await fetch(url); 
            return res.ok ? await res.text() : null; 
        } catch(e) { 
            return null; 
        }
    };
    const [koyomiTxt, haikuTxt] = await Promise.all([fetchCSV(KOYOMI_CSV_URL), fetchCSV(HAIKU_CSV_URL)]);
    if (koyomiTxt) {
        const lines = koyomiTxt.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVRow(lines[i]);
            if (row[0]) koyomiDatabase[standardizeDateKey(row[0])] = row;
        }
    }
    if (haikuTxt) {
        const lines = haikuTxt.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVRow(lines[i]);
            if (row.length > 11 && row[1] === "西田上酢" && row[10] === "完成句" && row[11]) {
                const dateKey = standardizeDateKey(row[11]);
                if (!window.haikuDatabase[dateKey]) window.haikuDatabase[dateKey] = [];
                window.haikuDatabase[dateKey].push(row[0]);
            }
        }
    }
}
