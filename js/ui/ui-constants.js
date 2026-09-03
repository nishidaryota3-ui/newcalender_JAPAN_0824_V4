// js/ui/ui-constants.js (UI定義・レイヤー識別子マップ)

const TEXT_TARGETS = [
    'gregorian', 'weekday', 'sekki', 'kou', 'zassetsu', 'holiday', 'important', 
    'wafuText', 'gregorianText', 'dailyRainText', 'guideTime', 'guideTideText', 
    'guideRainText', 'lunarMansion', 'eventShinto', 'eventBuddhism', 'eventChurch', 
    'eventSonota', 'lunar', 'haikuText'
];

const SHAPE_TARGETS = [
    'baseSvg', 'lunarShadow', 'astroPins', 'dateLines', 'tideGraph', 'rainGraph', 
    'dailyRainBg', 'guideTideLine', 'guideRainLine', 'canvasBg', 'moonRisePin', 
    'moonSetPin', 'sunRisePin', 'sunSetPin'
];

const TARGET_NAMES = {
    canvasBg: "キャンバス背景", 
    baseSvg: "ベース図形", 
    lunarShadow: "月相シャドウ",
    astroPins: "天文学的ピン (朔望)",
    dateLines: "日付区切り線 (30等分)",
    lunarMansion: "二十七宿",
    tideGraph: "潮汐波形",
    rainGraph: "毎時降水量 (棒線)", 
    dailyRainBg: "日別総降水量 (背景)", 
    dailyRainText: "日別総降水量 (数値)", 
    guideTime: "時間ガイド (0/6/12/18)", 
    guideTideLine: "潮位ガイド (cm) 目盛り線", 
    guideTideText: "潮位ガイド (cm) 文字", 
    guideRainLine: "降水量ガイド (mm) 目盛り線", 
    guideRainText: "降水量ガイド (mm) 文字", 
    gregorian: "新暦日付", 
    weekday: "曜日", 
    lunar: "旧暦 (月相対応)", 
    sekki: "24節気", 
    kou: "72候", 
    wafuText: "右上 月名 (旧暦)", 
    gregorianText: "右上 月名 (新暦)", 
    holiday: "祝日 (上段)", 
    zassetsu: "雑節 (中段)", 
    important: "重要年中行事 (下段)", 
    eventShinto: "神事", 
    eventBuddhism: "仏事", 
    eventChurch: "教会行事", 
    eventSonota: "その他",
    haikuText: "俳句 (一番外周)",
    moonRisePin: "月の出 (ピン)", 
    moonSetPin: "月の入 (ピン)", 
    sunRisePin: "日の出 (ピン)", 
    sunSetPin: "日の入 (ピン)" 
};

const LAYER_VISIBILITY_MAP = {
    "toggle-base-svg": "#bg-group", 
    "toggle-lunar-shadow": "#layer-shadow",
    "toggle-astro-pins": "#layer-astronomical-pins",
    "toggle-layer-lunar": "#layer-lunar-mansion",
    "toggle-tide-graph": "#layer-tide-wave",
    "toggle-rain-graph": "#layer-rain-graph",
    "toggle-daily-rain-bg": "#layer-daily-rain-bg", 
    "toggle-daily-rain-text": "#layer-daily-rain-text", 
    "toggle-date-lines": "#layer-lines",
    "toggle-guide-time": "#layer-guide-time", 
    "toggle-haiku-text": "#layer-haiku", 
    "toggle-guide-tide-line": ".layer-guide-tide-line",
    "toggle-guide-tide-text": ".layer-guide-tide-text", 
    "toggle-guide-rain-line": ".layer-guide-rain-line", 
    "toggle-guide-rain-text": ".layer-guide-rain-text",
    "toggle-date-gregorian": ".layer-date-gregorian", 
    "toggle-date-lunar": ".layer-date-lunar", 
    "toggle-date-weekday": ".layer-date-weekday",
    "toggle-wafu-text": ".layer-wafu-text", 
    "toggle-gregorian-text": ".layer-gregorian-text", 
    "toggle-sekki": ".layer-sekki",
    "toggle-kou": ".layer-kou", 
    "toggle-zassetsu": ".layer-zassetsu", 
    "toggle-holiday": ".layer-holiday", 
    "toggle-event-important": ".layer-event-important",
    "toggle-moon-rise": "#layer-moon-rise", 
    "toggle-moon-set": "#layer-moon-set", 
    "toggle-sun-rise": "#layer-sun-rise", 
    "toggle-sun-set": "#layer-sun-set"
};

const iconExport = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
