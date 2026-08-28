// js/draw/draw-koyomi.js (暦日・旧暦・二十四節気・七十二候・行事・俳句・時間帯 描画モジュール)

/**
 * Google スプレッドシートの旧暦データから当月の実際の日数 (29日 or 30日) を判定
 */
function computeMonthDays(startDate) {
    window.currentMonthDays = 30; 
    for (let i = 15; i < 30; i++) { 
        const loopDate = new Date(startDate.getTime() + i * MS_PER_DAY);
        const dateStr = formatDateStr(loopDate);
        const dbRow = koyomiDatabase[dateStr];
        if (dbRow && dbRow[1] && dbRow[1].match(/旧暦.*?月(.+?)日/)) {
            if (dbRow[1].match(/旧暦.*?月(.+?)日/)[1] === "一") {
                window.currentMonthDays = i; 
                break;
            }
        }
    }
}

/**
 * 6時間ごとの時間帯数値ラベル (0, 6, 12, 18) を描画
 */
function drawTimeLabels() {
    const timeLayer = document.getElementById("layer-guide-time");
    if(timeLayer) timeLayer.innerHTML = "";
    if (concentricRings.length < MIN_RINGS_TIME) return;
    const st = getLayerStyle('guideTime');
    const rMidTime = (concentricRings[RING_IDX_TIME_BAND_MIN] + concentricRings[RING_IDX_TIME_BAND_MAX]) / 2 + (st.offsetRadius || 0);
    const timeStr = ["0", "6", "12", "18"];
    
    for (let i = 0; i < TOTAL_SEGMENTS; i++) { 
        const angle = ((currentStartSegment + i) % TOTAL_SEGMENTS) * DEGREES_PER_SEGMENT;
        const ptTime = polarToCartesian(cx, cy, rMidTime, angle);
        if(timeLayer) timeLayer.appendChild(createStyledText(st, { x: ptTime.x, y: ptTime.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${angle}, ${ptTime.x}, ${ptTime.y})` }, timeStr[i % 4]));
    }
}

/**
 * 日境界線および外周リング線を描画
 */
function drawDynamicLines() {
    const linesLayer = document.getElementById("layer-lines");
    if(linesLayer) linesLayer.innerHTML = "";
    const st = getLayerStyle('dateLines');
    const rMin = concentricRings[0];
    const rMax = concentricRings[concentricRings.length - 1];

    const strokeW = st.strokeWidth !== undefined ? st.strokeWidth : 1.5;
    if(linesLayer) linesLayer.appendChild(createSVGElem("circle", { cx: cx, cy: cy, r: concentricRings[concentricRings.length - 2], fill: "none", stroke: st.stroke, "stroke-width": strokeW, opacity: st.opacity }));

    for (let i = 0; i < CYCLE_DAYS; i++) { 
        const angle = ((currentStartSegment + i * SEGMENTS_PER_DAY) % TOTAL_SEGMENTS) * DEGREES_PER_SEGMENT;
        const ptInner = polarToCartesian(cx, cy, rMin, angle);
        const ptOuter = polarToCartesian(cx, cy, rMax, angle);
        if(linesLayer) linesLayer.appendChild(createSVGElem("line", { x1: ptInner.x, y1: ptInner.y, x2: ptOuter.x, y2: ptOuter.y, stroke: st.stroke, "stroke-width": strokeW, opacity: st.opacity }));
    }
}

/**
 * 暦注・行事・二十四節気・七十二候・旧暦日を描画
 */
function drawKoyomiEvents(startDate) {
    window.lastKoyomiStartDate = startDate;
    window.lastCycleStartTimeMs = startDate.getTime();

    const dateLayer = document.getElementById("layer-solar-dates");
    const outerSeasonLayer = document.getElementById("layer-outer-season");
    const textPathDefs = document.getElementById("text-path-defs");
    
    if(dateLayer) dateLayer.innerHTML = "";
    if(outerSeasonLayer) outerSeasonLayer.innerHTML = "";
    if(textPathDefs) textPathDefs.innerHTML = "";

    const gregorianGroup = createSVGElem("g", { class: "layer-date-gregorian" });
    const weekdayGroup = createSVGElem("g", { class: "layer-date-weekday" });
    const lunarGroup = createSVGElem("g", { class: "layer-date-lunar" });
    const zassetsuGroup = createSVGElem("g", { class: "layer-zassetsu" });
    const holidayGroup = createSVGElem("g", { class: "layer-holiday" });
    const importantGroup = createSVGElem("g", { class: "layer-event-important" });
    const eventMixGroup = createSVGElem("g");

    if(dateLayer) {
        dateLayer.appendChild(gregorianGroup);
        dateLayer.appendChild(weekdayGroup);
        dateLayer.appendChild(lunarGroup);
        dateLayer.appendChild(zassetsuGroup);
        dateLayer.appendChild(holidayGroup);
        dateLayer.appendChild(importantGroup);
        dateLayer.appendChild(eventMixGroup);
    }

    const R = concentricRings;
    if(R.length < MIN_RINGS_FULL) return;

    const stG = getLayerStyle('gregorian');
    const stW = getLayerStyle('weekday');
    const stL = getLayerStyle('lunar');
    const stZ = getLayerStyle('zassetsu');
    const stH = getLayerStyle('holiday');
    const stI = getLayerStyle('important');

    const daysStr = stW.lang === 'ja' ? ["日", "月", "火", "水", "木", "金", "土"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const r24 = (R[RING_IDX_EVENT_TRACKS_START] + R[24]) / 2, r25 = (R[24] + R[25]) / 2, r26 = (R[25] + R[26]) / 2, r27 = (R[26] + R[27]) / 2, r28 = (R[27] + R[28]) / 2, r29 = (R[28] + R[29]) / 2;
    const r30In = R[R.length - 2], r30Out = R[R.length - 1];
    const r30Lower = r30In + (r30Out - r30In) * 0.25, r30Upper = r30In + (r30Out - r30In) * 0.75; 
    const r30U_text = r30In + (r30Out - r30In) * 0.82, r30M_text = r30In + (r30Out - r30In) * 0.50, r30L_text = r30In + (r30Out - r30In) * 0.18; 

    let startWafu = "";
    const startGregorianMonth = startDate.getMonth() + 1;
    const endGregorianMonth = new Date(startDate.getTime() + (window.currentMonthDays - 1) * MS_PER_DAY).getMonth() + 1;

    const showShinto = document.getElementById("toggle-event-shinto") ? document.getElementById("toggle-event-shinto").checked : true;
    const showBuddhism = document.getElementById("toggle-event-buddhism") ? document.getElementById("toggle-event-buddhism").checked : true;
    const showChurch = document.getElementById("toggle-event-church") ? document.getElementById("toggle-event-church").checked : true;
    const showSonota = document.getElementById("toggle-event-sonota") ? document.getElementById("toggle-event-sonota").checked : true;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * MS_PER_DAY);
        const dateStr = formatDateStr(loopDate);
        const dbRow = koyomiDatabase[dateStr] || [];
        const baseAngle = ((currentStartSegment + i * SEGMENTS_PER_DAY) % TOTAL_SEGMENTS) * DEGREES_PER_SEGMENT;

        const arcIdBase = `arc_${currentCycle}_${i}`;
        const angStart = baseAngle + 0.5, angEnd = baseAngle + 11.5;

        createTextArc(textPathDefs, `${arcIdBase}_24`, r24, angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_25`, r25, angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_26`, r26, angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_27`, r27, angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_28`, r28, angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_29`, r29, angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_30U_text`, r30U_text + (stH.offsetRadius || 0), angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_30M_text`, r30M_text + (stZ.offsetRadius || 0), angStart, angEnd);
        createTextArc(textPathDefs, `${arcIdBase}_30L_text`, r30L_text + (stI.offsetRadius || 0), angStart, angEnd);

        const holidayText = [dbRow[8], dbRow[14]].filter(Boolean).join(' ／ ');
        drawSingleTextOnPath(`${arcIdBase}_30U_text`, holidayText, stH, r30U_text + (stH.offsetRadius || 0), holidayGroup);
        drawSingleTextOnPath(`${arcIdBase}_30M_text`, dbRow[7], stZ, r30M_text + (stZ.offsetRadius || 0), zassetsuGroup);
        drawSingleTextOnPath(`${arcIdBase}_30L_text`, dbRow[9], stI, r30L_text + (stI.offsetRadius || 0), importantGroup);

        const dailyEvents = [];
        const pushEvents = (cellData, styleConfig) => {
            if (!cellData) return;
            cellData.split('・').forEach(item => { if (item.trim()) dailyEvents.push({ text: item.trim(), st: styleConfig }); });
        };
        if (showShinto) pushEvents(dbRow[10], getLayerStyle('eventShinto'));
        if (showBuddhism) pushEvents(dbRow[11], getLayerStyle('eventBuddhism'));
        if (showChurch) pushEvents(dbRow[12], getLayerStyle('eventChurch'));
        if (showSonota) pushEvents(dbRow[13], getLayerStyle('eventSonota'));

        const tracks = [[], [], [], [], [], []]; 
        if (dailyEvents.length > 0) {
            let currentTrack = 0;
            dailyEvents.forEach((ev) => { tracks[currentTrack].push(ev); currentTrack = (currentTrack + 1) % 6; });
        }

        const availableR = [r29, r28, r27, r26, r25, r24];
        const availableIds = [`${arcIdBase}_29`, `${arcIdBase}_28`, `${arcIdBase}_27`, `${arcIdBase}_26`, `${arcIdBase}_25`, `${arcIdBase}_24`];

        tracks.forEach((trackEvents, tIdx) => {
            if (trackEvents.length === 0) return;
            const textObj = createSVGElem("text", { dy: "1.5" });
            const textPath = createSVGElem("textPath", { href: `#${availableIds[tIdx]}`, startOffset: "50%", "text-anchor": "middle" });

            let combinedLen = 0;
            trackEvents.forEach((ev, eIdx) => {
                const txt = (eIdx > 0 ? " \u00A0・\u00A0 " : "") + ev.text;
                textPath.appendChild(createSVGElem("tspan", getStyleAttrs(ev.st), txt));
                combinedLen += txt.length * ev.st.fontSize;
            });

            const maxLen = 2 * Math.PI * availableR[tIdx] * (11 / 360);
            if (combinedLen > maxLen * 0.9) {
                textPath.setAttribute("textLength", maxLen * 0.9);
                textPath.setAttribute("lengthAdjust", "spacingAndGlyphs");
            }
            textObj.appendChild(textPath);
            eventMixGroup.appendChild(textObj);
        });

        const ptDate = polarToCartesian(cx, cy, r30Upper + (stG.offsetRadius || 0), baseAngle + 1.5);
        gregorianGroup.appendChild(createStyledText(stG, { class: "layer-date-gregorian", x: ptDate.x, y: ptDate.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 1.5}, ${ptDate.x}, ${ptDate.y})` }, `${loopDate.getMonth() + 1}/${loopDate.getDate()}`));

        const ptDay = polarToCartesian(cx, cy, r30Lower + (stW.offsetRadius || 0), baseAngle + 1.5);
        weekdayGroup.appendChild(createStyledText(stW, { class: "layer-date-weekday", x: ptDay.x, y: ptDay.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 1.5}, ${ptDay.x}, ${ptDay.y})` }, daysStr[loopDate.getDay()]));

        if (dbRow[1]) {
            const rawLunarDay = (dbRow[1].match(/旧暦.*?月(.+?)日/) || [])[1] || "";
            const lunarDay = rawLunarDay.replace("三十", "丗").replace("二十", "廿");
            let phaseKey = "normal";
            if (rawLunarDay === "一") phaseKey = "newMoon";
            else if (rawLunarDay === "八") phaseKey = "firstQuarter";
            else if (rawLunarDay === "十五") phaseKey = "fullMoon";
            else if (rawLunarDay === "二十三") phaseKey = "lastQuarter";

            const pst = stL.phases ? stL.phases[phaseKey] : stL;
            const ptLunar = polarToCartesian(cx, cy, (r30In + r30Out)/2 + (stL.offsetRadius || 0), baseAngle + 10.5);
            const lunarRadius = ((r30Out - r30In) * 0.4) * (pst.scale || 1);

            if (pst.shape !== "none") {
                const shapeG = createSVGElem("g", { class: "layer-date-lunar", transform: `translate(${ptLunar.x}, ${ptLunar.y}) rotate(${baseAngle + 10.5})` });
                const drawSt = {
                    fill: pst.bgFill,
                    stroke: pst.shapeStroke,
                    strokeWidth: pst.shapeStrokeWidth !== undefined ? pst.shapeStrokeWidth : 0,
                    opacity: stL.opacity
                };
                drawPinShape(shapeG, pst.shape, lunarRadius, drawSt);
                lunarGroup.appendChild(shapeG);
            }

            const lunarSt = { ...stL, fill: pst.fill, fontSize: lunarDay.length > 1 ? (stL.fontSize * 0.7) : stL.fontSize };
            lunarGroup.appendChild(createStyledText(lunarSt, { class: "layer-date-lunar", x: ptLunar.x, y: ptLunar.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})` }, lunarDay));

            if (i === 0 && dbRow[1].match(/（(.+?)）/)) startWafu = dbRow[1].match(/（(.+?)）/)[1];
        }

        const drawOuterText = (eventName, isSekki, classStr, stOut, angleOffset) => {
            if (!eventName) return;
            const lineAngle = baseAngle + angleOffset;
            const p1 = polarToCartesian(cx, cy, r30Out, lineAngle);
            const p2 = polarToCartesian(cx, cy, r30Out + (isSekki ? 12 : 8), lineAngle);
            const strokeW = isSekki ? "1.5" : "0.5";
            if(outerSeasonLayer) outerSeasonLayer.appendChild(createSVGElem("line", { class: classStr, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#2c3e50", "stroke-width": strokeW }));

            const ptTextOut = polarToCartesian(cx, cy, r30Out + (isSekki ? 45 : 20) + (stOut.offsetRadius || 0), lineAngle);
            if(outerSeasonLayer) outerSeasonLayer.appendChild(createStyledText(stOut, { class: classStr, x: ptTextOut.x, y: ptTextOut.y, "dominant-baseline": "middle", "text-anchor": "start", transform: `rotate(${lineAngle}, ${ptTextOut.x}, ${ptTextOut.y})` }, eventName));
        };

        if (dbRow[2]) drawOuterText(dbRow[2], true, "layer-sekki", getLayerStyle('sekki'), 0);
        if (dbRow[3]) drawOuterText(dbRow[3], false, "layer-kou", getLayerStyle('kou'), dbRow[2] ? 1.5 : 0);
    }

    const stWafu = getLayerStyle('wafuText');
    const stGreText = getLayerStyle('gregorianText');
    const wafuTextLayer = document.getElementById("layer-wafu-text");
    if(wafuTextLayer) {
        wafuTextLayer.innerHTML = "";
        
        const shiftX = (stWafu.fontSize || 70) * 5;
        const baseX = cx + 860 + shiftX;
        
        wafuTextLayer.appendChild(createStyledText(stWafu, { class: "layer-wafu-text", x: baseX, y: cy - 850 + (stWafu.offsetRadius || 0), "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})` }, startWafu ? `${startWafu}（旧暦）` : "旧暦取得中"));
        
        const wafuList = ['睦月','如月','弥生','卯月','皐月','水無月','文月','葉月','長月','神無月','霜月','師走'];
        const newWafuStr = startGregorianMonth === endGregorianMonth ? wafuList[startGregorianMonth - 1] : `${wafuList[startGregorianMonth - 1]} ／ ${wafuList[endGregorianMonth - 1]}`;
        wafuTextLayer.appendChild(createStyledText(stGreText, { class: "layer-gregorian-text", x: baseX, y: cy - 850 + (stWafu.fontSize * 0.9) + (stGreText.offsetRadius || 0), "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})` }, `${newWafuStr}（新暦）`));
    }
}

/**
 * 該当日の俳句（最大3句）を縦書き描画
 */
function drawHaikus(startDate) {
    const layer = document.getElementById("layer-haiku");
    if(layer) layer.innerHTML = "";
    if (concentricRings.length === 0) return;

    const st = getLayerStyle('haikuText');
    if (!st || st.opacity === 0) return;

    const stMansion = getLayerStyle('lunarMansion');
    const stZodiac = getLayerStyle('zodiacRing');
    const mansionMarkScale = stMansion.markScale !== undefined ? stMansion.markScale : 4.0;
    const mansionBandWidth = 14 + 11 + (18 + mansionMarkScale * 2) + 8 * mansionMarkScale + 16;
    const rMaxMansion = concentricRings[concentricRings.length - 1] + 60 + (stMansion.radiusOffset || 0) + mansionBandWidth;
    const zodiacBandWidth = Math.max(32, (stZodiac.fontSize || 22) + 14);
    const rMaxZodiac = rMaxMansion + 6 + (stZodiac.radiusOffset || 0) + zodiacBandWidth;

    const rBase = rMaxZodiac + 18 + (st.offsetRadius || 0);
    
    for (let i = 0; i < window.currentMonthDays; i++) {
        const dateStr = formatDateStr(new Date(startDate.getTime() + i * MS_PER_DAY));
        const haikus = window.haikuDatabase[dateStr] || [];
        
        if (haikus.length > 0) {
            const baseAngle = ((currentStartSegment + i * SEGMENTS_PER_DAY) % TOTAL_SEGMENTS) * DEGREES_PER_SEGMENT;
            const displayCount = Math.min(haikus.length, 3);
            const angles = displayCount === 1 ? [6] : displayCount === 2 ? [4, 8] : [2.5, 6, 9.5];
            
            for(let j=0; j < displayCount; j++) {
                const angle = baseAngle + angles[j];
                const pt = polarToCartesian(cx, cy, rBase, angle);
                const text = createStyledText(st, { x: pt.x, y: pt.y, style: "writing-mode: vertical-rl; cursor: pointer;", transform: `rotate(${angle + 180}, ${pt.x}, ${pt.y})` }, haikus[j]);
                text.onclick = () => window.openHaikuModal(dateStr, haikus);
                layer.appendChild(text);
            }
            
            if (haikus.length > 3) {
                const pt = polarToCartesian(cx, cy, rBase + 10, baseAngle + 11.5);
                const moreText = createSVGElem("text", { x: pt.x, y: pt.y, fill: "#d25b4e", "font-size": (st.fontSize * 0.8) + "px", "font-family": st.fontFamily, "text-anchor": "middle", "dominant-baseline": "middle", style: "cursor: pointer;", transform: `rotate(${baseAngle + 11.5}, ${pt.x}, ${pt.y})` }, `＋${haikus.length - 3}`);
                moreText.onclick = () => window.openHaikuModal(dateStr, haikus);
                layer.appendChild(moreText);
            }
        }
    }
}

/**
 * ユーザーの私的観察記録・フェノロジー・日記をホイール上に描画
 */
function drawUserEvents(startDate) {
    let layer = document.getElementById("layer-user-events");
    if (!layer) {
        const svg = document.getElementById("calendar-svg") || document.querySelector("svg");
        if (svg) {
            layer = createSVGElem("g", { id: "layer-user-events" });
            svg.appendChild(layer);
        } else {
            return;
        }
    }
    layer.innerHTML = "";
    if (concentricRings.length === 0) return;

    const toggle = document.getElementById("toggle-user-events");
    if (toggle && !toggle.checked) return;

    const st = getLayerStyle('userEvents');
    if (!st || st.opacity === 0) return;

    const R = concentricRings;
    const rIn = R[RING_IDX_DATA_BAND_MIN] || R[16];
    const rOut = R[RING_IDX_DATA_BAND_MAX] || R[22];
    const rLabel = (R[28] + R[29]) / 2 + (st.radiusOffset || 0);

    const categories = window.USER_EVENT_CATEGORIES || {};

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * MS_PER_DAY);
        const dateStr = formatDateStr(loopDate);
        const events = getUserEventsForDate(dateStr);
        if (!events || events.length === 0) continue;

        const baseAngle = ((currentStartSegment + i * SEGMENTS_PER_DAY) % TOTAL_SEGMENTS) * DEGREES_PER_SEGMENT;
        const angStart = baseAngle + 0.5;
        const angEnd = baseAngle + 11.5;

        const firstEv = events[0];
        const cat = categories[firstEv.category] || categories.note || { color: "#8b8170", labelColor: "#d4af37", name: "記録" };

        // 1. 薄い扇形カラー背景
        if (st.showSectorWash !== false) {
            const pathD = describeArcSector(cx, cy, rIn, rOut, angStart, angEnd);
            const wash = createSVGElem("path", {
                d: pathD,
                fill: cat.color,
                opacity: (st.opacity * (st.sectorWashOpacity !== undefined ? st.sectorWashOpacity : 0.2)),
                style: "cursor: pointer; transition: opacity 0.2s;"
            });
            wash.onclick = () => window.openUserEventModal(dateStr, firstEv.id);
            layer.appendChild(wash);
        }

        // 2. 小さな光点ピン（日付境界）
        if (st.showDot !== false) {
            const ptDot = polarToCartesian(cx, cy, rIn + 6, (angStart + angEnd) / 2);
            const dot = createSVGElem("circle", {
                cx: ptDot.x, cy: ptDot.y, r: 2.8,
                fill: cat.color,
                stroke: "#ffffff",
                "stroke-width": 0.6,
                opacity: st.opacity,
                style: "cursor: pointer;"
            });
            dot.onclick = () => window.openUserEventModal(dateStr, firstEv.id);
            layer.appendChild(dot);
        }

        // 3. 弧状テキストラベル（専用テキストパス）
        if (st.showLabel !== false) {
            const arcId = `arc_userev_${currentCycle}_${i}`;
            let defs = document.getElementById("textPathDefs");
            if (!defs) {
                const svg = document.getElementById("calendar-svg") || document.querySelector("svg");
                if (svg) {
                    defs = createSVGElem("defs", { id: "textPathDefs" });
                    svg.insertBefore(defs, svg.firstChild);
                }
            }
            if (defs) {
                createTextArc(defs, arcId, rLabel, angStart, angEnd);

                const textGroup = createSVGElem("g", { class: "user-event-text", style: "cursor: pointer;" });
                textGroup.onclick = () => window.openUserEventModal(dateStr, firstEv.id);

                const titleElem = createSVGElem("title", {}, `${events.map(e => `[${(categories[e.category]||{}).name||'記録'}] ${e.text}`).join('\n')}`);
                textGroup.appendChild(titleElem);

                const labelText = events.length > 1 ? `${firstEv.text} (${events.length})` : firstEv.text;
                const textElem = createSVGElem("text", {
                    fill: cat.labelColor || cat.color,
                    "font-size": `${st.fontSize || 12}px`,
                    "font-family": st.fontFamily || "'Shippori Mincho', serif",
                    "font-weight": "500",
                    opacity: st.opacity
                });

                const textPath = createSVGElem("textPath", {
                    href: `#${arcId}`,
                    startOffset: "50%",
                    "text-anchor": "middle"
                }, labelText);

                textElem.appendChild(textPath);
                textGroup.appendChild(textElem);
                layer.appendChild(textGroup);
            }
        }
    }
}

