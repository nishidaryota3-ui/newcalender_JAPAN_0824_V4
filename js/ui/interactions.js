// js/ui/interactions.js (キャンバス操作：ズーム・パン・回転・ツールチップ・フリーペイント)

/**
 * 保存されたセルの色を描画
 */
function drawCell(rIn, rOut, startAngle, endAngle, color) {
    const d = getSectorPathD(rIn, rOut, startAngle, endAngle);
    const dataLayer = document.getElementById("layer-data");
    if(dataLayer) dataLayer.appendChild(createSVGElem("path", { d: d, fill: color, opacity: "0.6" }));
}

/**
 * 現在のサイクル(月)に保存されたペイントデータをすべて再描画
 */
function renderSavedData() {
    const dataLayer = document.getElementById("layer-data");
    if(dataLayer) dataLayer.innerHTML = "";
    const cyclePrefix = `c${currentCycle}_`;
    for (const key in calendarData) {
        if (key.startsWith(cyclePrefix)) {
            const data = calendarData[key];
            const startAngle = data.absSegment * DEGREES_PER_SEGMENT;
            const endAngle = (data.absSegment + 1) * DEGREES_PER_SEGMENT;
            drawCell(data.rIn, data.rOut, startAngle, endAngle, data.color);
        }
    }
}

/**
 * キャンバス全体のインタラクション（マウスイベント）を初期化
 */
function initInteractions() {
    const appContainer = document.body;
    
    appContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95;
        if (typeof svg === 'undefined' || !svg) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        viewBox.w *= zoomFactor;
        viewBox.h *= zoomFactor;
        viewBox.x = svgP.x - (svgP.x - viewBox.x) * zoomFactor;
        viewBox.y = svgP.y - (svgP.y - viewBox.y) * zoomFactor;
        
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    }, { passive: false });

    let isInteractionActive = false;
    let startPos = { x: 0, y: 0 }, dragDistance = 0;
    let startGlobalRotation = 0, startAngleOffset = 0;
    let lastPaintedCell = null;

    appContainer.addEventListener('mousedown', (e) => {
        dragDistance = 0;
        isInteractionActive = true;
        lastPaintedCell = null;

        if (currentTool === 'pointer') {
            const cursorTarget = document.getElementById('container') || document.body;
            cursorTarget.style.cursor = interactionMode === 'pan' ? 'grabbing' : 'ew-resize';
            if (interactionMode === 'rotate') {
                if(typeof svg === 'undefined' || !svg) return;
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                startAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
                startGlobalRotation = globalRotation;
            } else {
                startPos = { x: e.clientX, y: e.clientY };
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isInteractionActive && currentTool === 'pointer') {
            if (interactionMode === 'pan') {
                const dxScreen = startPos.x - e.clientX, dyScreen = startPos.y - e.clientY;
                dragDistance += Math.abs(dxScreen) + Math.abs(dyScreen);
                if(typeof viewBox !== 'undefined' && appContainer && typeof svg !== 'undefined' && svg) {
                    const cw = appContainer.clientWidth || window.innerWidth;
                    const ch = appContainer.clientHeight || window.innerHeight;
                    viewBox.x += dxScreen * (viewBox.w / cw);
                    viewBox.y += dyScreen * (viewBox.h / ch);
                    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
                }
                startPos = { x: e.clientX, y: e.clientY };
            } else if (interactionMode === 'rotate') {
                if(typeof svg === 'undefined' || !svg) return;
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                const currentAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
                
                let delta = currentAngleOffset - startAngleOffset;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                
                globalRotation = startGlobalRotation + delta;
                if(typeof masterGroup !== 'undefined' && masterGroup) {
                    masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
                }
                dragDistance += Math.abs(delta) * 5;
                startGlobalRotation = globalRotation;
                startAngleOffset = currentAngleOffset;
            }
        }

        if (typeof svg === 'undefined' || !svg || typeof masterGroup === 'undefined' || !masterGroup) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
        const dx = ptM.x - cx, dy = ptM.y - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let angle = Math.atan2(dy, dx) * RAD_TO_DEG;
        angle = (angle + 90 + 360) % 360;
        
        const absSegment = Math.floor(angle / DEGREES_PER_SEGMENT);
        const ringInfo = typeof getRingInfo === 'function' ? getRingInfo(distance) : null;

        let sb = document.getElementById('status-bar');
        if(!sb) {
            sb = document.createElement('div');
            sb.id = 'status-bar';
            document.body.appendChild(sb);
        }

        if (ringInfo) {
            const relSegment = (absSegment - currentStartSegment + TOTAL_SEGMENTS) % TOTAL_SEGMENTS;
            const day = Math.floor(relSegment / SEGMENTS_PER_DAY) + 1;
            const timeSlot = relSegment % SEGMENTS_PER_DAY;
            const timeLabels = ["0:00〜6:00", "6:00〜12:00", "12:00〜18:00", "18:00〜24:00"];
            
            sb.innerText = `第 ${day} 日目 ｜ ${timeLabels[timeSlot]} ｜ ${ringInfo.name}`;
            sb.style.color = "#fff";

            if (isInteractionActive && (currentTool === 'paint' || currentTool === 'erase')) {
                const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;
                if (lastPaintedCell !== cellKey) {
                    if (currentTool === 'erase') delete calendarData[cellKey];
                    else calendarData[cellKey] = { color: activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
                    if (typeof renderSavedData === 'function') renderSavedData();
                    lastPaintedCell = cellKey;
                }
            }
        } else {
            sb.innerText = `キャンバス外`;
            sb.style.color = "#8b949e";
        }
    });

    window.addEventListener('mouseup', () => {
        isInteractionActive = false;
        if (typeof currentTool !== 'undefined' && currentTool === 'pointer') {
            const cursorTarget = document.getElementById('container') || document.body;
            cursorTarget.style.cursor = interactionMode === 'pan' ? 'grab' : 'ew-resize';
        }
        if (typeof calendarData !== 'undefined') localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(calendarData));
    });

    if(typeof svg !== 'undefined' && svg) {
        svg.addEventListener('click', (e) => {
            if (dragDistance > 5 || currentTool === 'pointer') return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            if(typeof masterGroup === 'undefined' || !masterGroup) return;
            const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
            const dx = ptM.x - cx, dy = ptM.y - cy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx) * RAD_TO_DEG;
            angle = (angle + 90 + 360) % 360;
            
            const absSegment = Math.floor(angle / DEGREES_PER_SEGMENT);
            const ringInfo = typeof getRingInfo === 'function' ? getRingInfo(distance) : null;
            if (!ringInfo) return;

            const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;
            
            if (currentTool === 'erase') delete calendarData[cellKey];
            else if (currentTool === 'paint') {
                calendarData[cellKey] = { color: activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
            }
            
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(calendarData));
            if(typeof renderSavedData === 'function') renderSavedData();
        });
    }

    // 日付セグメントのダブルクリックで観察記録・日記モーダルを起動（案A）
    function handleWheelDblClick(e) {
        if (typeof svg === 'undefined' || !svg || typeof masterGroup === 'undefined' || !masterGroup) return;
        
        // パネルやUI上でのダブルクリックは除外
        if (e.target.closest('#nav-bar') || e.target.closest('#layer-panel') || e.target.closest('#palette-container') || e.target.closest('#user-event-modal') || e.target.closest('#user-event-drawer')) {
            return;
        }

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
        const dx = ptM.x - cx, dy = ptM.y - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // カレンダー円盤領域内のダブルクリックか判定（中心ピボット〜最外周）
        if (distance < 50 || distance > 1300) return;

        let angle = Math.atan2(dy, dx) * RAD_TO_DEG;
        angle = (angle + 90 + 360) % 360;
        const absSegment = Math.floor(angle / DEGREES_PER_SEGMENT);
        const relSegment = (absSegment - currentStartSegment + TOTAL_SEGMENTS) % TOTAL_SEGMENTS;
        const dayIndex = Math.floor(relSegment / SEGMENTS_PER_DAY);

        const cycleStart = window.lastCycleStartTimeMs || (window.currentCycleDate ? window.currentCycleDate.getTime() : null);
        if (cycleStart !== null && dayIndex >= 0 && dayIndex < (window.currentMonthDays || 30)) {
            const targetDate = new Date(cycleStart + dayIndex * MS_PER_DAY);
            const dateStr = formatDateStr(targetDate);
            if (typeof window.openUserEventModal === 'function') {
                window.openUserEventModal(dateStr);
            }
        }
    }

    window.addEventListener('dblclick', handleWheelDblClick);
}
