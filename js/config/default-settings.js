// js/config/default-settings.js (レイヤー初期スタイル設定)

window.defaultLayerSettings = {
    canvasBg: { fill: "#f5f3eb" },
    baseSvg: { stroke: "", strokeWidth: 0.5, opacity: 0.8 },
    lunarShadow: { fill: "#000000", opacity: 0.03 },
    astroPins: { 
        opacity: 1, radiusOffset: 0,
        phases: {
            newMoon:      { shape: "circle", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 },
            firstQuarter: { shape: "halfRight", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 },
            fullMoon:     { shape: "circle", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 },
            lastQuarter:  { shape: "halfLeft", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 }
        }
    },
    dateLines: { stroke: "#555555", strokeWidth: 1.5, opacity: 1 },
    lunarMansion: {
        strokeWidth: 1.0, dividerColor: "#777777", opacity: 0.8, fontFamily: "'Shippori Mincho', 'YuMincho', serif", fontSize: 20,
        colorEast: "#888888", colorSouth: "#888888", colorWest: "#888888", colorNorth: "#888888",
        starSize: 1.5, markScale: 4.0, radiusOffset: 0, bgRingColor: "#ffffff", bgRingOpacity: 0.05
    },
    zodiacRing: {
        displayType: "symbol",
        fontFamily: "'Cinzel', 'Shippori Mincho', serif",
        fontSize: 22,
        color: "#8a8171",
        dividerColor: "#8b8170",
        dividerWidth: 1.0,
        opacity: 0.85,
        radiusOffset: 0,
        bgRingColor: "#ffffff",
        bgRingOpacity: 0.03
    },
    tideGraph: { stroke: "#3b82f6", strokeWidth: 1.5, opacity: 1 },
    rainGraph: { stroke: "rgba(14, 165, 233, 0.8)", strokeWidth: 1.5, opacity: 1 },
    dailyRainBg: { fill: "rgba(14, 165, 233, 1)", opacity: 1, density: 0.35 },
    dailyRainText: { fontFamily: "'Arial', sans-serif", fontSize: 8, fill: "rgba(14, 165, 233, 1)", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    guideTime: { fontFamily: "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif", fontSize: 7, fill: "#2c3e50", fontWeight: "bold", stroke: "rgba(255, 255, 255, 0.5)", strokeWidth: 3, opacity: 1, offsetRadius: 0 },
    guideTideLine: { stroke: "rgba(114, 113, 113, 0.4)", strokeWidth: 0.5, opacity: 1 },
    guideTideText: { fontFamily: "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif", fontSize: 7, fill: "#3b82f6", fontWeight: "bold", stroke: "rgba(255, 255, 255, 0.5)", strokeWidth: 3, opacity: 1, offsetRadius: 0 },
    guideRainLine: { stroke: "rgba(14, 165, 233, 0.3)", strokeWidth: 1, opacity: 1 },
    guideRainText: { fontFamily: "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif", fontSize: 7, fill: "rgba(14, 165, 233, 1)", fontWeight: "bold", stroke: "rgba(255, 255, 255, 0.5)", strokeWidth: 2.5, opacity: 1, offsetRadius: 0 },
    gregorian: { fontFamily: "'Shippori Mincho', serif", fontSize: 9, fill: "#727171", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    weekday: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#b0b0b0", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0, lang: "en" },
    sekki: { fontFamily: "'Shippori Mincho', serif", fontSize: 19, fill: "#2c3e50", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    kou: { fontFamily: "'Shippori Mincho', serif", fontSize: 14, fill: "#2c3e50", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    wafuText: { fontFamily: "'Shippori Mincho', serif", fontSize: 70, fill: "#d4af37", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    gregorianText: { fontFamily: "'Shippori Mincho', serif", fontSize: 40, fill: "#b0b0b0", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    holiday: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#d25b4e", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    zassetsu: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#727171", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    important: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#2c3e50", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventShinto: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#1e3a8a", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventBuddhism: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#3f3d56", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventChurch: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#6b5b4e", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventSonota: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#555555", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    haikuText: { fontFamily: "'Shippori Mincho', serif", fontSize: 8, fill: "#2c3e50", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 40 },
    moonRisePin: { fill: "none", stroke: "#d4af37", strokeWidth: 1.2, opacity: 1, scale: 1.5, radiusOffset: 0, shape: "arrowUp" },
    moonSetPin: { fill: "none", stroke: "#d4af37", strokeWidth: 1.2, opacity: 1, scale: 1.5, radiusOffset: 0, shape: "arrowDown" },
    sunRisePin: { fill: "none", stroke: "#ff8888", strokeWidth: 1.2, opacity: 0.8, scale: 1.5, radiusOffset: 30, shape: "arrowUp" },
    sunSetPin: { fill: "none", stroke: "#ff8888", strokeWidth: 1.2, opacity: 0.8, scale: 1.5, radiusOffset: 30, shape: "arrowDown" },
    lunar: {
        fontFamily: "'Shippori Mincho', serif", fontSize: 11, fontWeight: "normal", opacity: 1, offsetRadius: 0,
        phases: {
            normal:       { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 },
            newMoon:      { shape: "circle", fill: "#d4af37", bgFill: "transparent", shapeStroke: "#d4af37", shapeStrokeWidth: 1.2, scale: 1 },
            firstQuarter: { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 },
            fullMoon:     { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 },
            lastQuarter:  { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 }
        }
    }
};

window.haikuDatabase = {};
