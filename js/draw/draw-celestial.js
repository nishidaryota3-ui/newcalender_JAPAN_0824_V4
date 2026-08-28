// js/draw/draw-celestial.js (天体・月相・二十八宿・出没ピン・月の影 描画モジュール)

if (typeof window.mansions === 'undefined') {
    window.mansions = [
        { name: "角" }, { name: "亢" }, { name: "氐" }, { name: "房" }, { name: "心" }, { name: "尾" }, { name: "箕" },
        { name: "斗" }, { name: "女" }, { name: "虚" }, { name: "危" }, { name: "室" }, { name: "壁" },
        { name: "奎" }, { name: "婁" }, { name: "胃" }, { name: "昴" }, { name: "畢" }, { name: "觜" }, { name: "参" },
        { name: "井" }, { name: "鬼" }, { name: "柳" }, { name: "星" }, { name: "張" }, { name: "翼" }, { name: "軫" }
    ];
}

/**
 * 太陽・月の黄経差から主要月相（新月・上弦・満月・下弦）ピンを描画
 */
function drawAstronomicalPins(cycleStartTime) {
    const layer = document.getElementById("layer-astronomical-pins");
    if(!layer) return;
    layer.innerHTML = "";
    if (concentricRings.length < MIN_RINGS_FULL) return;

    const st = getLayerStyle('astroPins');
    if(!st || st.opacity === 0) return;

    const rMin = concentricRings[0] + (st.radiusOffset || 0);
    const targets = [
        { diff: 0,   key: 'newMoon',      label: '新月 (0°)' },
        { diff: 90,  key: 'firstQuarter', label: '上弦 (90°)' },
        { diff: 180, key: 'fullMoon',     label: '満月 (180°)' },
        { diff: 270, key: 'lastQuarter',  label: '下弦 (270°)' }
    ];

    let prevDiff = (getLunarLongitude(cycleStartTime) - getSolarLongitude(cycleStartTime) + 360) % 360;
    const totalHours = window.currentMonthDays * 24;
    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;

    for (let h = 1; h <= totalHours; h++) {
        const timeMs = cycleStartTime + h * MS_PER_HOUR;
        const diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;

        for (const t of targets) {
            let crossed = false;
            let targetDiff = t.diff;
            if (t.diff === 0) {
                if (prevDiff > 350 && diff < 10) crossed = true;
            } else {
                if (prevDiff < targetDiff && diff >= targetDiff && (diff - prevDiff) < 20) crossed = true;
            }

            if (crossed) {
                const fraction = t.diff === 0 ? (360 - prevDiff) / ((360 - prevDiff) + diff) : (targetDiff - prevDiff) / (diff - prevDiff);
                const exactHour = (h - 1) + Math.max(0, Math.min(1, fraction));
                const angle = startAngle + exactHour * DEGREES_PER_HOUR;
                const exactTimeMs = cycleStartTime + exactHour * MS_PER_HOUR;
                const dateObj = new Date(exactTimeMs);
                const dateStr = `${dateObj.getMonth()+1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;

                const pt = polarToCartesian(cx, cy, rMin, angle);
                const g = createSVGElem("g", { class: "astronomical-pin", transform: `translate(${pt.x}, ${pt.y}) rotate(${angle})`, opacity: st.opacity });

                const pst = st.phases ? st.phases[t.key] : st;
                const R = 3.5 * (pst.scale || 1);
                const shapeType = pst.shape || "circle";
                const drawSt = { 
                    fill: pst.fill, 
                    stroke: pst.shapeStroke !== undefined ? pst.shapeStroke : pst.stroke, 
                    strokeWidth: pst.shapeStrokeWidth !== undefined ? pst.shapeStrokeWidth : pst.strokeWidth 
                };

                drawPinShape(g, shapeType, R, drawSt);
                g.appendChild(createSVGElem("title", {}, `${t.label}\n時刻: ${dateStr}\n角度: ${angle.toFixed(1)}°`));
                layer.appendChild(g);
            }
        }
        prevDiff = diff;
    }
}

/**
 * 二十七宿（月宿）の天文学的位置と星座マークを描画
 */
function drawLunarMansions(cycleStartTime) {
    const layer = document.getElementById("layer-lunar-mansion");
    if(!layer) return;
    layer.innerHTML = "";
    if (concentricRings.length === 0) return;

    const st = getLayerStyle('lunarMansion');
    const fontSize = st.fontSize !== undefined ? st.fontSize : 20;
    const markScale = st.markScale !== undefined ? st.markScale : 4.0;
    const starSize = st.starSize !== undefined ? st.starSize : 1.5;
    const dividerColor = st.dividerColor || "#777777";
    const dividerWidth = st.strokeWidth !== undefined ? st.strokeWidth : 1.0;

    // 漢字と星座図形の間隔・配置計算（ゆとりを持たせて重なりを完全に防止）
    const kanjiCenterOffset = Math.max(14, fontSize * 0.8);
    const kanjiOuterEdge = kanjiCenterOffset + fontSize * 0.55;
    const gap = 18 + markScale * 2;
    const markRadius = 4 * markScale;
    const markCenterOffset = kanjiOuterEdge + gap + markRadius;
    const bandWidth = markCenterOffset + markRadius + 16;

    const rBase = concentricRings[concentricRings.length - 1] + 60 + (st.radiusOffset || 0);
    const rMax = rBase + bandWidth;
    const resolution = 2;
    const totalHours = window.currentMonthDays * 24;
    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;

    const g = createSVGElem("g", { class: "layer-lunar-mansion-group" });
    const bgRing = createSVGElem("circle", { cx: cx, cy: cy, r: (rBase + rMax)/2, fill: "none", stroke: st.bgRingColor || "#ffffff", "stroke-width": bandWidth, opacity: (st.opacity * (st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.05)) });
    g.appendChild(bgRing);

    let prevMansionIdx = -1;
    let boundaryAngle = startAngle;

    for (let i = 0; i <= totalHours * resolution; i++) {
        const timeMs = cycleStartTime + (i / resolution) * MS_PER_HOUR;
        const lambdaMoon = getLunarLongitude(timeMs);
        const mansionIdx = Math.floor((lambdaMoon % 360) / (360 / 27));
        const currentAngle = startAngle + (i / resolution) * DEGREES_PER_HOUR;

        if (prevMansionIdx !== -1 && mansionIdx !== prevMansionIdx) {
            // 各宿の仕切り線（はっきりと見える境界線）
            if (dividerWidth > 0) {
                const p1 = polarToCartesian(cx, cy, rBase, currentAngle);
                const p2 = polarToCartesian(cx, cy, rMax, currentAngle);
                g.appendChild(createSVGElem("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: dividerColor, "stroke-width": dividerWidth, opacity: st.opacity }));
            }

            const midAngle = (boundaryAngle + currentAngle) / 2;
            const mansionData = window.mansions[prevMansionIdx];
            
            let mansionColor = st.colorEast || "#888888";
            if (prevMansionIdx >= 7 && prevMansionIdx <= 13) mansionColor = st.colorNorth || "#888888";
            else if (prevMansionIdx >= 14 && prevMansionIdx <= 20) mansionColor = st.colorWest || "#888888";
            else if (prevMansionIdx >= 21 && prevMansionIdx <= 26) mansionColor = st.colorSouth || "#888888";

            // 漢字（文字）は内周側へ配置（中心から見て正立する向きに設定）
            const ptText = polarToCartesian(cx, cy, rBase + kanjiCenterOffset, midAngle);
            const textEl = createSVGElem("text", {
                x: ptText.x, y: ptText.y, fill: mansionColor, "font-size": `${fontSize}px`, "font-family": st.fontFamily,
                "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${midAngle}, ${ptText.x}, ${ptText.y})`, opacity: st.opacity
            }, mansionData ? mansionData.name : "");
            g.appendChild(textEl);

            // 星座図形（点と線）は外周側へ配置（十分なスペースを確保）
            const ptMark = polarToCartesian(cx, cy, rBase + markCenterOffset, midAngle);
            drawConstellationMark(g, prevMansionIdx, ptMark.x, ptMark.y, midAngle, mansionColor, st.opacity, starSize, markScale);

            boundaryAngle = currentAngle;
        }

        if (i === 0) {
            if (dividerWidth > 0) {
                const p1 = polarToCartesian(cx, cy, rBase, currentAngle);
                const p2 = polarToCartesian(cx, cy, rMax, currentAngle);
                g.appendChild(createSVGElem("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: dividerColor, "stroke-width": dividerWidth, opacity: st.opacity }));
            }
            boundaryAngle = currentAngle;
        }

        prevMansionIdx = mansionIdx;
    }

    if (boundaryAngle < startAngle + totalHours * DEGREES_PER_HOUR) {
        const finalAngle = startAngle + totalHours * DEGREES_PER_HOUR;
        const midAngle = (boundaryAngle + finalAngle) / 2;
        const mansionData = window.mansions[prevMansionIdx];
        
        let mansionColor = st.colorEast || "#888888";
        if (prevMansionIdx >= 7 && prevMansionIdx <= 13) mansionColor = st.colorNorth || "#888888";
        else if (prevMansionIdx >= 14 && prevMansionIdx <= 20) mansionColor = st.colorWest || "#888888";
        else if (prevMansionIdx >= 21 && prevMansionIdx <= 26) mansionColor = st.colorSouth || "#888888";

        const ptText = polarToCartesian(cx, cy, rBase + kanjiCenterOffset, midAngle);
        const textEl = createSVGElem("text", {
            x: ptText.x, y: ptText.y, fill: mansionColor, "font-size": `${fontSize}px`, "font-family": st.fontFamily,
            "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${midAngle}, ${ptText.x}, ${ptText.y})`, opacity: st.opacity
        }, mansionData ? mansionData.name : "");
        g.appendChild(textEl);

        const ptMark = polarToCartesian(cx, cy, rBase + markCenterOffset, midAngle);
        drawConstellationMark(g, prevMansionIdx, ptMark.x, ptMark.y, midAngle, mansionColor, st.opacity, starSize, markScale);
    }
    layer.appendChild(g);
}

function drawConstellationMark(g, index, x, y, angle, color, opacity, starSize, markScale = 4.0) {
    const markG = createSVGElem("g", { transform: `translate(${x}, ${y}) rotate(${angle})`, opacity: opacity });
    const s = starSize;
    const scale = markScale;
    let lines = [];
    const stars = [
        [{x: 0, y: -4}, {x: 0, y: 4}],
        [{x: -4, y: -4}, {x: -2, y: 0}, {x: 2, y: 2}, {x: 4, y: 4}],
        [{x: -4, y: -3}, {x: 0, y: -4}, {x: 4, y: -2}, {x: 0, y: 3}],
        [{x: -4, y: -4}, {x: -4, y: 4}, {x: 4, y: -4}, {x: 4, y: 4}],
        [{x: 0, y: 0}, {x: -4, y: -3}, {x: 4, y: -3}],
        [{x: -4, y: -4}, {x: -3, y: -1}, {x: -1, y: 2}, {x: 2, y: 4}, {x: 4, y: 3}, {x: 4, y: 1}],
        [{x: -4, y: -3}, {x: 4, y: -3}, {x: -2, y: 3}, {x: 2, y: 3}]
    ][index % 7] || [{x: 0, y: 0}];

    for (let i = 0; i < stars.length - 1; i++) {
        lines.push({x1: stars[i].x * scale, y1: stars[i].y * scale, x2: stars[i+1].x * scale, y2: stars[i+1].y * scale});
    }

    lines.forEach(l => {
        markG.appendChild(createSVGElem("line", { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, stroke: color, "stroke-width": Math.max(0.6, 0.5 * Math.sqrt(scale)), opacity: 0.7 }));
    });
    stars.forEach(st => {
        markG.appendChild(createSVGElem("circle", { cx: st.x * scale, cy: st.y * scale, r: s * Math.max(1, Math.sqrt(scale * 0.4)), fill: color }));
    });
    g.appendChild(markG);
}

/**
 * 黄道十二星座リングを描画 (Astrolabe準拠デザイン)
 */
function drawZodiacRing(cycleStartTime) {
    const layer = document.getElementById("layer-zodiac-ring");
    if (!layer) return;
    layer.innerHTML = "";
    if (concentricRings.length === 0) return;

    const st = getLayerStyle('zodiacRing');
    if (!st || st.opacity === 0) return;

    const stMansion = getLayerStyle('lunarMansion');
    
    // 二十七宿の外側に自動配置
    const mansionFontSize = stMansion.fontSize !== undefined ? stMansion.fontSize : 20;
    const mansionMarkScale = stMansion.markScale !== undefined ? stMansion.markScale : 4.0;
    const mansionKanjiOffset = Math.max(14, mansionFontSize * 0.8);
    const mansionKanjiOuter = mansionKanjiOffset + mansionFontSize * 0.55;
    const mansionGap = 18 + mansionMarkScale * 2;
    const mansionMarkRadius = 4 * mansionMarkScale;
    const mansionBandWidth = mansionKanjiOuter + mansionGap + mansionMarkRadius * 2 + 16;
    const rBaseMansion = concentricRings[concentricRings.length - 1] + 60 + (stMansion.radiusOffset || 0);
    const rMaxMansion = rBaseMansion + mansionBandWidth;

    const fontSize = st.fontSize !== undefined ? st.fontSize : 22;
    const bandWidth = Math.max(32, fontSize + 14);
    const rBase = rMaxMansion + 6 + (st.radiusOffset || 0);
    const rMax = rBase + bandWidth;
    const rText = (rBase + rMax) / 2;

    const resolution = 2;
    const totalHours = window.currentMonthDays * 24;
    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;

    const g = createSVGElem("g", { class: "layer-zodiac-ring-group" });
    
    // 背景リング
    const bgRing = createSVGElem("circle", {
        cx: cx, cy: cy, r: (rBase + rMax) / 2,
        fill: "none",
        stroke: st.bgRingColor || "#ffffff",
        "stroke-width": bandWidth,
        opacity: (st.opacity * (st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.04))
    });
    g.appendChild(bgRing);

    // 外周・内周の境界同心円
    const dividerColor = st.dividerColor || "#8b8170";
    const dividerWidth = st.dividerWidth !== undefined ? st.dividerWidth : 1.0;
    if (dividerWidth > 0) {
        g.appendChild(createSVGElem("circle", { cx: cx, cy: cy, r: rBase, fill: "none", stroke: dividerColor, "stroke-width": dividerWidth * 0.5, opacity: st.opacity * 0.5 }));
        g.appendChild(createSVGElem("circle", { cx: cx, cy: cy, r: rMax, fill: "none", stroke: dividerColor, "stroke-width": dividerWidth * 0.8, opacity: st.opacity * 0.6 }));
    }

    let prevZodiacIdx = -1;
    let boundaryAngle = startAngle;

    for (let i = 0; i <= totalHours * resolution; i++) {
        const timeMs = cycleStartTime + (i / resolution) * MS_PER_HOUR;
        const lambdaMoon = getLunarLongitude(timeMs);
        const zodiacIdx = Math.floor((lambdaMoon % 360) / 30);
        const currentAngle = startAngle + (i / resolution) * DEGREES_PER_HOUR;

        if (prevZodiacIdx !== -1 && zodiacIdx !== prevZodiacIdx) {
            // 30度境界の仕切り線
            if (dividerWidth > 0) {
                const p1 = polarToCartesian(cx, cy, rBase, currentAngle);
                const p2 = polarToCartesian(cx, cy, rMax, currentAngle);
                g.appendChild(createSVGElem("line", {
                    x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                    stroke: dividerColor, "stroke-width": dividerWidth, opacity: st.opacity * 0.7
                }));
            }

            const midAngle = (boundaryAngle + currentAngle) / 2;
            const sign = window.zodiacSigns ? window.zodiacSigns[prevZodiacIdx] : null;
            if (sign) {
                let displayText = sign.symbol;
                if (st.displayType === 'jp') displayText = sign.jp;
                else if (st.displayType === 'en') displayText = sign.name;

                const ptText = polarToCartesian(cx, cy, rText, midAngle);
                const textEl = createSVGElem("text", {
                    x: ptText.x, y: ptText.y,
                    fill: st.color || "#8a8171",
                    "font-size": `${fontSize}px`,
                    "font-family": st.fontFamily || "'Cinzel', 'Shippori Mincho', serif",
                    "font-weight": "normal",
                    "text-anchor": "middle",
                    "dominant-baseline": "central",
                    transform: `rotate(${midAngle}, ${ptText.x}, ${ptText.y})`,
                    opacity: st.opacity
                }, displayText);
                g.appendChild(textEl);
            }

            boundaryAngle = currentAngle;
        }

        if (i === 0) {
            if (dividerWidth > 0) {
                const p1 = polarToCartesian(cx, cy, rBase, currentAngle);
                const p2 = polarToCartesian(cx, cy, rMax, currentAngle);
                g.appendChild(createSVGElem("line", {
                    x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                    stroke: dividerColor, "stroke-width": dividerWidth, opacity: st.opacity * 0.7
                }));
            }
            boundaryAngle = currentAngle;
        }

        prevZodiacIdx = zodiacIdx;
    }

    if (boundaryAngle < startAngle + totalHours * DEGREES_PER_HOUR) {
        const finalAngle = startAngle + totalHours * DEGREES_PER_HOUR;
        const midAngle = (boundaryAngle + finalAngle) / 2;
        const sign = window.zodiacSigns ? window.zodiacSigns[prevZodiacIdx] : null;
        if (sign) {
            let displayText = sign.symbol;
            if (st.displayType === 'jp') displayText = sign.jp;
            else if (st.displayType === 'en') displayText = sign.name;

            const ptText = polarToCartesian(cx, cy, rText, midAngle);
            const textEl = createSVGElem("text", {
                x: ptText.x, y: ptText.y,
                fill: st.color || "#8a8171",
                "font-size": `${fontSize}px`,
                "font-family": st.fontFamily || "'Cinzel', 'Shippori Mincho', serif",
                "font-weight": "normal",
                "text-anchor": "middle",
                "dominant-baseline": "central",
                transform: `rotate(${midAngle}, ${ptText.x}, ${ptText.y})`,
                opacity: st.opacity
            }, displayText);
            g.appendChild(textEl);
        }
    }

    layer.appendChild(g);
}

/**
 * 共通天体ピン（出没）の描画ヘルパー
 */
function drawCelestialPin(timeDate, isRise, stRise, stSet, riseLayer, setLayer, cycleStartTimeMs, rMin, rMax, startAngle) {
    const st = isRise ? stRise : stSet;
    const targetLayer = isRise ? riseLayer : setLayer;
    if (!timeDate || !st || st.opacity === 0 || !targetLayer) return;

    const timeMs = timeDate.getTime();
    if (isNaN(timeMs)) return;
    if (timeMs < cycleStartTimeMs || timeMs > cycleStartTimeMs + window.currentMonthDays * MS_PER_DAY) return;

    const hours = (timeMs - cycleStartTimeMs) / MS_PER_HOUR;
    const angle = startAngle + hours * DEGREES_PER_HOUR;
    if (isNaN(angle)) return; 

    const tideVal = getApproxTideAtTime(timeMs);
    const r = window.getTideRadius(tideVal, rMin, rMax) + (st.radiusOffset || 0);
    const pt = polarToCartesian(cx, cy, r, angle);
    if (isNaN(pt.x) || isNaN(pt.y)) return; 

    const size = 3 * (st.scale !== undefined ? st.scale : 1.5);
    const g = createSVGElem("g", { transform: `translate(${pt.x}, ${pt.y}) rotate(${angle})`, opacity: st.opacity });
    
    drawPinShape(g, st.shape || (isRise ? "arrowUp" : "arrowDown"), size, st);
    targetLayer.appendChild(g);
}

/**
 * 月の出・月の入りピンを描画
 */
function drawMoonEventPins(cycleStartTimeMs) {
    const riseLayer = document.getElementById("layer-moon-rise");
    const setLayer = document.getElementById("layer-moon-set");
    if(riseLayer) riseLayer.innerHTML = "";
    if(setLayer) setLayer.innerHTML = "";
    if (concentricRings.length < MIN_RINGS_DATA) return;
    
    const stRise = getLayerStyle('moonRisePin');
    const stSet = getLayerStyle('moonSetPin');

    const station = TIDE_STATIONS[currentTideStationIndex] || {lat: 35.68, lon: 139.76};
    const rMin = concentricRings[RING_IDX_DATA_BAND_MIN], rMax = concentricRings[RING_IDX_DATA_BAND_MAX];
    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const dayDate = new Date(cycleStartTimeMs + i * MS_PER_DAY + MS_PER_HALF_DAY); 
        const moonTimes = getMoonTimes(dayDate, station.lat, station.lon);

        drawCelestialPin(moonTimes.rise, true, stRise, stSet, riseLayer, setLayer, cycleStartTimeMs, rMin, rMax, startAngle);
        drawCelestialPin(moonTimes.set, false, stRise, stSet, riseLayer, setLayer, cycleStartTimeMs, rMin, rMax, startAngle);
    }
}

/**
 * 日の出・日の入りピンを描画（月相日のみ）
 */
function drawSunEventPins(startDate) {
    const riseLayer = document.getElementById("layer-sun-rise");
    const setLayer = document.getElementById("layer-sun-set");
    if(riseLayer) riseLayer.innerHTML = "";
    if(setLayer) setLayer.innerHTML = "";
    if (concentricRings.length < MIN_RINGS_DATA) return;

    const stRise = getLayerStyle('sunRisePin');
    const stSet = getLayerStyle('sunSetPin');

    const station = TIDE_STATIONS[currentTideStationIndex] || {lat: 35.68, lon: 139.76};
    const cycleStartTimeMs = startDate.getTime();
    const rMin = concentricRings[RING_IDX_DATA_BAND_MIN], rMax = concentricRings[RING_IDX_DATA_BAND_MAX];
    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * MS_PER_DAY);
        const dateStr = formatDateStr(loopDate);
        const dbRow = koyomiDatabase[dateStr] || [];
        
        let isPhaseDay = false;
        if (dbRow[1]) {
            const rawLunarDay = (dbRow[1].match(/旧暦.*?月(.+?)日/) || [])[1] || "";
            if (["一", "八", "十五", "二十三"].includes(rawLunarDay)) isPhaseDay = true;
        }
        
        if (isPhaseDay) {
            const sunTimes = getTimes(new Date(loopDate.getTime() + MS_PER_HALF_DAY), station.lat, station.lon);

            drawCelestialPin(sunTimes.sunrise, true, stRise, stSet, riseLayer, setLayer, cycleStartTimeMs, rMin, rMax, startAngle);
            drawCelestialPin(sunTimes.sunset, false, stRise, stSet, riseLayer, setLayer, cycleStartTimeMs, rMin, rMax, startAngle);
        }
    }
}

/**
 * 月の満ち欠け（影の幾何学グラデーション領域）を描画
 */
function drawLunarShadow(cycleStartTime) {
    const shadowLayer = document.getElementById("layer-shadow");
    if(shadowLayer) shadowLayer.innerHTML = "";
    if (concentricRings.length < MIN_RINGS_FULL) return;

    const st = getLayerStyle('lunarShadow'); 
    const rMin = concentricRings[0];
    const rMax = concentricRings[concentricRings.length - 2];
    const maxArea = rMax * rMax - rMin * rMin;
    const resolution = 2;
    const totalHours = TOTAL_CYCLE_HOURS; 
    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;

    let pathD = "";
    for (let i = 0; i <= totalHours * resolution; i++) {
        const timeMs = cycleStartTime + (i / resolution) * MS_PER_HOUR;
        const diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
        const shadow = 1.0 - (0.5 * (1 - Math.cos(diff * Math.PI / 180)));
        const r = Math.sqrt(rMin * rMin + shadow * maxArea);
        const angle = startAngle + (i / resolution) * DEGREES_PER_HOUR;
        const pt = polarToCartesian(cx, cy, r, angle);

        if (i === 0) pathD += `M ${pt.x},${pt.y} `;
        else pathD += `L ${pt.x},${pt.y} `;
    }

    const endAngle = startAngle + (totalHours * DEGREES_PER_HOUR);
    const pEndMin = polarToCartesian(cx, cy, rMin, endAngle);
    const pStartMin = polarToCartesian(cx, cy, rMin, startAngle);
    pathD += ` L ${pEndMin.x},${pEndMin.y} A ${rMin} ${rMin} 0 0 0 ${pStartMin.x} ${pStartMin.y} Z`;

    if(shadowLayer) shadowLayer.appendChild(createSVGElem("path", { d: pathD, fill: st.fill, opacity: st.opacity }));
}

/**
 * 天体時計の針（長針：月、短針：太陽、中心鋲）を描画
 */
function drawClockHands(cycleStartTime) {
    const layer = document.getElementById("layer-clock-hands");
    if (!layer) return;
    layer.innerHTML = "";
    if (concentricRings.length === 0) return;

    const st = getLayerStyle('clockHands');
    if (!st || st.opacity === 0) return;

    const monthDays = window.currentMonthDays || 30;
    const cycleDurationMs = monthDays * MS_PER_DAY;
    const nowMs = Date.now();

    let targetTimeMs;
    let isStandby = false;

    if (window.inspectedDateMs) {
        targetTimeMs = window.inspectedDateMs;
    } else if (nowMs >= cycleStartTime && nowMs <= cycleStartTime + cycleDurationMs) {
        targetTimeMs = nowMs;
    } else {
        // 過去・未来の月は新月（0日目・12時位置）で待機
        targetTimeMs = cycleStartTime;
        isStandby = true;
    }

    const timeOffsetMs = targetTimeMs - cycleStartTime;
    const hoursIntoMonth = Math.max(0, Math.min(monthDays * 24, timeOffsetMs / MS_PER_HOUR));
    
    // 月針の角度（30日の時間軸・天球上を1ヶ月で360度一周する）
    const moonAngle = currentStartSegment * DEGREES_PER_SEGMENT + hoursIntoMonth * DEGREES_PER_HOUR;
    
    // 太陽針の角度（天球文字盤上を1年で360度一周する：1日約0.9856度進む）
    // ※新月(0日目)に月と太陽が重なり、満月(15日目・今日)には中心を挟んでほぼ一直線(180度)に向き合います
    const sunAngle = currentStartSegment * DEGREES_PER_SEGMENT + (hoursIntoMonth / 24) * 0.9856;

    const g = createSVGElem("g", { class: "clock-hands-group", opacity: st.opacity });

    const handStyle = st.handStyle || "classic";
    const sunLen = st.sunHandLength || 850;
    const sunW = st.sunHandWidth !== undefined ? st.sunHandWidth : 2.2;
    const sunCol = st.sunHandColor || "#c9743c";

    const moonLen = st.moonHandLength || 960;
    const moonW = st.moonHandWidth !== undefined ? st.moonHandWidth : 1.5;
    const moonCol = st.moonHandColor || "#d4af37";

    const pivotR = st.centerPivotRadius !== undefined ? st.centerPivotRadius : 12;
    const pivotCol = st.centerPivotColor || "#8b8170";

    // 針の本体を描画するヘルパー
    const renderHand = (parentG, style, len, angle, color, strokeW, isSun) => {
        const pTip = polarToCartesian(cx, cy, len, angle);
        const tailLen = isSun ? 50 : 70;
        const pTail = polarToCartesian(cx, cy, tailLen, angle + 180);

        if (style === 'breguet') {
            // ② ブレゲ針（先端手前に中空リング）
            const pRingCenter = polarToCartesian(cx, cy, len * 0.82, angle);
            const ringR = isSun ? 14 : 11;
            parentG.appendChild(createSVGElem("line", { x1: pTail.x, y1: pTail.y, x2: pTip.x, y2: pTip.y, stroke: color, "stroke-width": strokeW }));
            parentG.appendChild(createSVGElem("circle", { cx: pRingCenter.x, cy: pRingCenter.y, r: ringR, fill: "#222222", stroke: color, "stroke-width": strokeW * 1.2 }));
            parentG.appendChild(createSVGElem("circle", { cx: pRingCenter.x, cy: pRingCenter.y, r: ringR * 0.55, fill: "none", stroke: color, "stroke-width": strokeW }));
            // 尾部リング
            const pTailRing = polarToCartesian(cx, cy, tailLen * 0.6, angle + 180);
            parentG.appendChild(createSVGElem("circle", { cx: pTailRing.x, cy: pTailRing.y, r: 5, fill: "none", stroke: color, "stroke-width": strokeW }));
        } else if (style === 'dauphine') {
            // ③ ドーフィン針（剣型ソリッド菱形）
            const baseW = strokeW * 3.5;
            const pBaseL = polarToCartesian(cx, cy, baseW, angle - 90);
            const pBaseR = polarToCartesian(cx, cy, baseW, angle + 90);
            const dSword = `M ${pTail.x} ${pTail.y} L ${pBaseL.x} ${pBaseL.y} L ${pTip.x} ${pTip.y} L ${pBaseR.x} ${pBaseR.y} Z`;
            parentG.appendChild(createSVGElem("path", { d: dSword, fill: color, opacity: 0.85 }));
            parentG.appendChild(createSVGElem("line", { x1: pTail.x, y1: pTail.y, x2: pTip.x, y2: pTip.y, stroke: "#ffffff", "stroke-width": 0.8, opacity: 0.5 }));
        } else if (style === 'baton') {
            // ④ バトン針（均一な幅のストレートモダン）
            parentG.appendChild(createSVGElem("line", { x1: pTail.x, y1: pTail.y, x2: pTip.x, y2: pTip.y, stroke: color, "stroke-width": strokeW * 1.8, "stroke-linecap": "square" }));
            const pTailBlock = polarToCartesian(cx, cy, tailLen * 0.5, angle + 180);
            parentG.appendChild(createSVGElem("circle", { cx: pTailBlock.x, cy: pTailBlock.y, r: strokeW * 2, fill: color }));
        } else if (style === 'cathedral') {
            // ⑤ カテドラル針（ステンドグラス透かし彫り）
            parentG.appendChild(createSVGElem("line", { x1: pTail.x, y1: pTail.y, x2: pTip.x, y2: pTip.y, stroke: color, "stroke-width": strokeW }));
            const pDiamond = polarToCartesian(cx, cy, len * 0.78, angle);
            const diaW = isSun ? 16 : 13;
            const dFrame = `M ${polarToCartesian(cx, cy, len * 0.88, angle).x} ${polarToCartesian(cx, cy, len * 0.88, angle).y} ` +
                           `L ${polarToCartesian(pDiamond.x, pDiamond.y, diaW, angle - 90).x} ${polarToCartesian(pDiamond.x, pDiamond.y, diaW, angle - 90).y} ` +
                           `L ${polarToCartesian(cx, cy, len * 0.68, angle).x} ${polarToCartesian(cx, cy, len * 0.68, angle).y} ` +
                           `L ${polarToCartesian(pDiamond.x, pDiamond.y, diaW, angle + 90).x} ${polarToCartesian(pDiamond.x, pDiamond.y, diaW, angle + 90).y} Z`;
            parentG.appendChild(createSVGElem("path", { d: dFrame, fill: "#222222", stroke: color, "stroke-width": strokeW * 1.2 }));
            parentG.appendChild(createSVGElem("line", { x1: polarToCartesian(cx, cy, len * 0.68, angle).x, y1: polarToCartesian(cx, cy, len * 0.68, angle).y, x2: polarToCartesian(cx, cy, len * 0.88, angle).x, y2: polarToCartesian(cx, cy, len * 0.88, angle).y, stroke: color, "stroke-width": strokeW }));
            // 尾部クローバー
            const pTailClover = polarToCartesian(cx, cy, tailLen * 0.6, angle + 180);
            parentG.appendChild(createSVGElem("circle", { cx: pTailClover.x, cy: pTailClover.y, r: 5, fill: color }));
        } else {
            // ① クラシック・槍針 (標準デフォルト)
            parentG.appendChild(createSVGElem("line", { x1: pTail.x, y1: pTail.y, x2: pTip.x, y2: pTip.y, stroke: color, "stroke-width": strokeW, "stroke-linecap": "round" }));
            const pTailMid = polarToCartesian(cx, cy, tailLen * 0.6, angle + 180);
            parentG.appendChild(createSVGElem("circle", { cx: pTailMid.x, cy: pTailMid.y, r: isSun ? 4 : 5, fill: isSun ? color : "none", stroke: color, "stroke-width": 1.5 }));
        }

        // --- 先端シンボル ---
        if (isSun) {
            // 太陽シンボル (☉)
            const sunHeadG = createSVGElem("g", { transform: `translate(${pTip.x}, ${pTip.y})` });
            sunHeadG.appendChild(createSVGElem("circle", { cx: 0, cy: 0, r: 10, fill: "rgba(201, 116, 60, 0.25)", stroke: color, "stroke-width": 1.5 }));
            sunHeadG.appendChild(createSVGElem("circle", { cx: 0, cy: 0, r: 3, fill: color }));
            for (let a = 0; a < 360; a += 45) {
                const rad = a * Math.PI / 180;
                sunHeadG.appendChild(createSVGElem("line", { x1: Math.cos(rad) * 11, y1: Math.sin(rad) * 11, x2: Math.cos(rad) * 15, y2: Math.sin(rad) * 15, stroke: color, "stroke-width": 1.2 }));
            }
            parentG.appendChild(sunHeadG);
        } else {
            // 月シンボル (☽)
            const moonHeadG = createSVGElem("g", { transform: `translate(${pTip.x}, ${pTip.y}) rotate(${angle})` });
            moonHeadG.appendChild(createSVGElem("circle", { cx: 0, cy: 0, r: 12, fill: "rgba(212, 175, 55, 0.25)", stroke: color, "stroke-width": 1.5 }));
            const moonPathD = "M -4 -7 A 8 8 0 0 1 4 7 A 6 6 0 0 0 -4 -7 Z";
            moonHeadG.appendChild(createSVGElem("path", { d: moonPathD, fill: color }));
            parentG.appendChild(moonHeadG);
        }
    };

    // --- 1. 太陽針 (短針) ---
    const sunG = createSVGElem("g", { class: "clock-hand-sun" });
    renderHand(sunG, handStyle, sunLen, sunAngle, sunCol, sunW, true);
    g.appendChild(sunG);

    // --- 2. 月針 (長針) ---
    const moonG = createSVGElem("g", { class: "clock-hand-moon" });
    renderHand(moonG, handStyle, moonLen, moonAngle, moonCol, moonW, false);
    g.appendChild(moonG);

    // --- 3. 中心軸 (ピボット・金鋲) ---
    const pivotG = createSVGElem("g", { class: "clock-pivot", style: "cursor: pointer;" });
    pivotG.appendChild(createSVGElem("circle", { cx: cx, cy: cy, r: pivotR, fill: "#222222", stroke: pivotCol, "stroke-width": 2 }));
    pivotG.appendChild(createSVGElem("circle", { cx: cx, cy: cy, r: pivotR * 0.65, fill: "none", stroke: moonCol, "stroke-width": 1.2 }));
    pivotG.appendChild(createSVGElem("circle", { cx: cx, cy: cy, r: pivotR * 0.35, fill: sunCol }));
    
    // クリックで現在時刻に復帰
    pivotG.onclick = (e) => {
        e.stopPropagation();
        window.inspectedDateMs = null;
        if (typeof updateDayDisplay === 'function') updateDayDisplay();
        drawClockHands(cycleStartTime);
        if (statusBar) statusBar.innerText = "時計の針を現在日時にリセットしました";
    };
    g.appendChild(pivotG);

    layer.appendChild(g);
}
