// js/draw/draw-meteo.js (潮汐波形・降水量グラフ・日別雨量背景 描画モジュール)

window.currentTideScaleMin = 0;
window.currentTideScaleMax = 100;

if (typeof window.getTideRadius === 'undefined') {
    window.getTideRadius = function(tide, rMin, rMax) {
        const ratio = (tide - window.currentTideScaleMin) / (window.currentTideScaleMax - window.currentTideScaleMin);
        return rMin + ratio * (rMax - rMin);
    };
}

/**
 * 日別総降水量背景（扇形ハイライト）および降水量数値を描画
 */
function drawDailyRainStats(startDate) {
    const bgLayer = document.getElementById("layer-daily-rain-bg");
    const textLayer = document.getElementById("layer-daily-rain-text");
    if(bgLayer) bgLayer.innerHTML = "";
    if(textLayer) textLayer.innerHTML = "";

    const stBg = getLayerStyle('dailyRainBg');
    const stText = getLayerStyle('dailyRainText');

    const rMin = concentricRings[RING_IDX_DATA_BAND_MIN];
    const rMax = concentricRings[RING_IDX_DATA_BAND_MAX];
    const layer23CenterR = (concentricRings[RING_IDX_DATA_BAND_MAX] + concentricRings[RING_IDX_EVENT_TRACKS_START]) / 2;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * MS_PER_DAY);
        const dateStr = formatDateStr(loopDate);
        if (localRainData[dateStr] !== undefined && localRainData[dateStr] > 0) {
            const rain = localRainData[dateStr];
            const startAngle = (currentStartSegment + i * SEGMENTS_PER_DAY) * DEGREES_PER_SEGMENT;
            const endAngle = startAngle + DEGREES_PER_DAY;
            const computedOpacity = Math.min(rain / 150, 1) * (stBg.density || 0.35) + 0.05;

            const d = getSectorPathD(rMin, rMax, startAngle, endAngle);
            if(bgLayer) bgLayer.appendChild(createSVGElem("path", { d: d, fill: stBg.fill, opacity: computedOpacity }));

            const angleMid = startAngle + 6;
            const ptText = polarToCartesian(cx, cy, layer23CenterR + (stText.offsetRadius || 0), angleMid);
            
            const textGroup = createSVGElem("g", { transform: `rotate(${angleMid + 180}, ${ptText.x}, ${ptText.y})` });
            
            const iconGroup = createSVGElem("g", { transform: `translate(${ptText.x - 14}, ${ptText.y - 4})`, fill: stText.fill, style: `color: ${stText.fill};` });
            iconGroup.innerHTML = iconDrop;
            textGroup.appendChild(iconGroup);

            const text = createStyledText(stText, { x: ptText.x - 2, y: ptText.y, "text-anchor": "start", "dominant-baseline": "central" }, rain.toFixed(1) + "mm");
            textGroup.appendChild(text);

            if(textLayer) textLayer.appendChild(textGroup);
        }
    }
}

/**
 * 潮位連続波形グラフおよびガイド線を描画
 */
function drawTideGraph(cycleStartTimeMs) {
    const waveLayer = document.getElementById("layer-tide-wave");
    const guideLayer = document.getElementById("layer-guide-tide");
    if(waveLayer) waveLayer.innerHTML = "";
    if(guideLayer) guideLayer.innerHTML = "";
    if (concentricRings.length < MIN_RINGS_DATA) return;

    if (!highLowTidePoints || highLowTidePoints.length === 0) return;

    const stGraph = getLayerStyle('tideGraph');
    const stLine = getLayerStyle('guideTideLine') || getLayerStyle('guideTide');
    const stText = getLayerStyle('guideTideText') || getLayerStyle('guideTide');

    const rMin = concentricRings[RING_IDX_DATA_BAND_MIN];
    const rMax = concentricRings[RING_IDX_DATA_BAND_MAX];

    const displayData = highLowTidePoints.filter(pt => {
        const hours = (pt.time - cycleStartTimeMs) / MS_PER_HOUR;
        return hours >= 0 && hours <= window.currentMonthDays * 24;
    });

    if (displayData.length === 0) return;

    const minT = Math.min(...displayData.map(p => p.tide));
    const maxT = Math.max(...displayData.map(p => p.tide));
    let range = maxT - minT;
    if(range === 0) range = 100;

    window.currentTideScaleMin = Math.floor((minT - range * 0.1) / 10) * 10;
    window.currentTideScaleMax = Math.ceil((maxT + range * 0.1) / 10) * 10;

    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;

    const guideVals = [];
    const numSteps = 4;
    for (let s = 0; s <= numSteps; s++) {
        guideVals.push(Math.round(window.currentTideScaleMin + s * (window.currentTideScaleMax - window.currentTideScaleMin) / numSteps));
    }

    const tideGuideAngles = [24, 84, 144, 204, 264, 324];

    guideVals.forEach(val => {
        const r = window.getTideRadius(val, rMin, rMax);
        const strokeW = stLine.strokeWidth !== undefined ? stLine.strokeWidth : 0.5;
        if(guideLayer) guideLayer.appendChild(createSVGElem("circle", { class: "layer-guide-tide-line", cx: cx, cy: cy, r: r, fill: "none", stroke: stLine.stroke, "stroke-width": strokeW, opacity: stLine.opacity }));
        
        tideGuideAngles.forEach(relAngle => {
            const labelAngle = startAngle + relAngle;
            const pt = polarToCartesian(cx, cy, r + (stText.offsetRadius || 0), labelAngle);
            // 中心側から読む向き（rotate(labelAngle)）で描画
            if(guideLayer) guideLayer.appendChild(createStyledText(stText, { class: "layer-guide-tide-text", x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${labelAngle}, ${pt.x}, ${pt.y})` }, `${val}cm`));
        });
    });

    const points = [];
    displayData.forEach(pt => {
        const hours = (pt.time - cycleStartTimeMs) / MS_PER_HOUR;
        const angle = startAngle + hours * DEGREES_PER_HOUR;
        const r = window.getTideRadius(pt.tide, rMin, rMax);
        points.push({ ...polarToCartesian(cx, cy, r, angle), tide: pt.tide, time: pt.time });
    });

    if (points.length < 2) return;

    let pathD = `M ${points[0].x},${points[0].y} `;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = (i > 0) ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = (i != points.length - 2) ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        pathD += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
    }

    const strokeW = stGraph.strokeWidth !== undefined ? stGraph.strokeWidth : 1.5;
    if(waveLayer) waveLayer.appendChild(createSVGElem("path", { d: pathD, fill: "none", stroke: stGraph.stroke, "stroke-width": strokeW, opacity: stGraph.opacity }));
}

/**
 * 指定時刻の概算潮位を補間計算
 */
function getApproxTideAtTime(timeMs) {
    if (!highLowTidePoints || highLowTidePoints.length === 0) return 0;
    
    let p1 = null, p2 = null;
    for (let i = 0; i < highLowTidePoints.length - 1; i++) {
        if (highLowTidePoints[i].time <= timeMs && highLowTidePoints[i+1].time >= timeMs) {
            p1 = highLowTidePoints[i];
            p2 = highLowTidePoints[i+1];
            break;
        }
    }
    if (!p1 || !p2) {
        if (timeMs < highLowTidePoints[0].time) return highLowTidePoints[0].tide;
        return highLowTidePoints[highLowTidePoints.length - 1].tide;
    }
    
    const ratio = (timeMs - p1.time) / (p2.time - p1.time);
    return p1.tide + (p2.tide - p1.tide) * ratio;
}

/**
 * 毎時降水量グラフおよびガイド線を描画
 */
function drawRainfallGraph(cycleStartTimeMs) {
    const rainLayer = document.getElementById("layer-rain-graph");
    const guideLayer = document.getElementById("layer-guide-rain");
    if(rainLayer) rainLayer.innerHTML = "";
    if(guideLayer) guideLayer.innerHTML = "";
    if (concentricRings.length < MIN_RINGS_DATA) return;

    const stGraph = getLayerStyle('rainGraph');
    const stLine = getLayerStyle('guideRainLine') || getLayerStyle('guideRain');
    const stText = getLayerStyle('guideRainText') || getLayerStyle('guideRain');

    const rMin = concentricRings[RING_IDX_DATA_BAND_MIN];
    const rMax = concentricRings[RING_IDX_DATA_BAND_MAX];
    const maxRain = 30;
    const rainGroup = createSVGElem("g");

    const strokeW = stLine.strokeWidth !== undefined ? stLine.strokeWidth : 1;
    if(guideLayer) guideLayer.appendChild(createSVGElem("circle", { class: "layer-guide-rain-line", cx: cx, cy: cy, r: rMax, fill: "none", stroke: stLine.stroke, "stroke-width": strokeW, opacity: stLine.opacity }));

    const startAngle = currentStartSegment * DEGREES_PER_SEGMENT;
    const graphStrokeW = stGraph.strokeWidth !== undefined ? stGraph.strokeWidth : 1.5;
    
    for (let h = 0; h < window.currentMonthDays * 24; h++) {
        const rain = apiRainData[h];
        if(rain === null || isNaN(rain) || rain <= 0) continue;
        const r = rMax - (rMax - rMin) * (rain / maxRain);
        const angle = startAngle + h * DEGREES_PER_HOUR + 0.25;
        const p1 = polarToCartesian(cx, cy, rMax, angle);
        const p2 = polarToCartesian(cx, cy, r, angle);
        rainGroup.appendChild(createSVGElem("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stGraph.stroke, "stroke-width": graphStrokeW, "stroke-linecap": "round", opacity: stGraph.opacity }));
    }

    [{ relAngle: 96 }, { relAngle: 288 }].forEach(target => {
        const labelAngle = startAngle + target.relAngle;
        [5, 10, 15, 20, 25, 30].forEach(val => {
            const r = rMax - (rMax - rMin) * (val / maxRain);
            const p1 = polarToCartesian(cx, cy, r - 3, labelAngle);
            const p2 = polarToCartesian(cx, cy, r + 3, labelAngle);
            if(guideLayer) guideLayer.appendChild(createSVGElem("line", { class: "layer-guide-rain-line", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stLine.stroke, "stroke-width": strokeW, opacity: stLine.opacity }));
            
            const ptLabel = polarToCartesian(cx, cy, r + (stText.offsetRadius || 0), labelAngle);
            if(guideLayer) guideLayer.appendChild(createStyledText(stText, { class: "layer-guide-rain-text", x: ptLabel.x, y: ptLabel.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${labelAngle + 180}, ${ptLabel.x}, ${ptLabel.y})` }, val + "mm"));
        });
    });

    if(rainLayer) rainLayer.appendChild(rainGroup);
}
