// js/ui/toolbar.js (ツールバー・カラーパレット・ショートカット・レイヤー表示切替)

let previousTool = 'pointer';
let isSpacePressed = false;

function setTool(tool, mode = null) {
    currentTool = tool;
    if (tool === 'pointer' && mode) interactionMode = mode;
    
    const btnPointer = document.getElementById('tool-pointer');
    const btnPaint = document.getElementById('tool-paint');
    const btnErase = document.getElementById('tool-erase');
    const paletteDiv = document.getElementById('palette-container');

    if (btnPointer && btnPaint && btnErase) {
        [btnPointer, btnPaint, btnErase].forEach(b => {
            b.style.background = 'transparent';
            b.style.borderColor = 'transparent';
            b.style.color = '#fff';
        });

        if (paletteDiv) paletteDiv.style.display = (tool === 'paint') ? 'grid' : 'none';

        const activeBtn = tool === 'pointer' ? btnPointer : tool === 'paint' ? btnPaint : btnErase;
        activeBtn.style.background = 'rgba(212,175,55,0.85)';
        activeBtn.style.borderColor = '#d4af37';
        activeBtn.style.color = '#000';
    }

    const cursorTarget = document.getElementById('container') || document.body;
    if (tool === 'pointer') cursorTarget.style.cursor = interactionMode === 'pan' ? 'grab' : 'ew-resize';
    else if (tool === 'paint') cursorTarget.style.cursor = 'crosshair';
    else if (tool === 'erase') cursorTarget.style.cursor = 'cell';
}

function initToolbar() {
    let toolsDiv = document.getElementById('tools-palette');
    if (toolsDiv) return;

    toolsDiv = document.createElement('div');
    toolsDiv.className = 'panel-ui';
    toolsDiv.id = 'tools-palette'; 
    toolsDiv.style = "position:fixed; top:100px; left:20px; background:rgba(25,30,40,0.9); padding:8px; border-radius:8px; z-index:100; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.5); display:flex; flex-direction:column; gap:8px; width:44px; box-sizing:border-box;";
    toolsDiv.innerHTML = `
        <button id="tool-pointer" title="移動/回転切替 (V)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:rgba(212,175,55,0.85); border:1px solid #d4af37; color:#000; padding:0; display:flex; justify-content:center; align-items:center;">${iconPan}</button>
        <button id="tool-paint" title="塗る (B)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconPaint}</button>
        <button id="tool-erase" title="消す (E)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconErase}</button>
        <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
        <button id="clearBtn" title="選択色を全消去" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconTrash}</button>
        <button id="printBtn" title="印刷 (余白カット)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${iconPrint}</button>
        <button id="exportBtn" title="高画質で画像保存 (PNG)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${iconExport}</button>
        <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
        <button id="homeBtn" title="新月を真上にリセット" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${iconHome}</button>
    `;
    document.body.appendChild(toolsDiv);

    const paletteDiv = document.createElement('div');
    paletteDiv.className = 'panel-ui';
    paletteDiv.id = 'palette-container';
    paletteDiv.style = "position:fixed; top:134px; left:74px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; z-index:99; border: 1px solid rgba(255,255,255,0.1); display:none; grid-template-columns:repeat(4, 1fr); gap:6px; width:120px; box-sizing:border-box;";
    document.body.appendChild(paletteDiv);

    const blockEvent = (e) => e.stopPropagation();
    [toolsDiv, paletteDiv].forEach(p => {
        p.addEventListener('mousedown', blockEvent);
        p.addEventListener('wheel', blockEvent);
        p.addEventListener('mousemove', blockEvent);
    });

    const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#fb7185", "#a8a29e", "#57534e"];
    colors.forEach(color => {
        const div = document.createElement('div');
        div.style = `width:100%; aspect-ratio:1; background-color:${color}; border-radius:4px; border:2px solid transparent; cursor:pointer; transition:0.1s; box-sizing:border-box;`;
        if(typeof activeBrush !== 'undefined' && color === activeBrush) {
            div.style.borderColor = '#fff';
            div.style.transform = 'scale(1.1)';
        }
        div.onclick = () => {
            paletteDiv.querySelectorAll('div').forEach(el => { el.style.borderColor = 'transparent'; el.style.transform = 'scale(1)'; });
            div.style.borderColor = '#fff';
            div.style.transform = 'scale(1.1)';
            if(typeof activeBrush !== 'undefined') activeBrush = color;
        };
        paletteDiv.appendChild(div);
    });

    const btnPointer = document.getElementById('tool-pointer');
    const btnPaint = document.getElementById('tool-paint');
    const btnErase = document.getElementById('tool-erase');

    btnPointer.onclick = () => setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
    btnPaint.onclick = () => setTool('paint');
    btnErase.onclick = () => setTool('erase');

    document.getElementById('printBtn').onclick = () => window.printCalendar();
    document.getElementById('exportBtn').onclick = () => window.exportHighResPNG();

    document.getElementById('homeBtn').onclick = () => {
        globalRotation = -currentStartSegment * DEGREES_PER_SEGMENT;
        if(masterGroup) masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
        viewBox = { x: -479.3141, y: -208.5241, w: 2800, h: 2800 };
        if(svg) svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    };

    document.getElementById('clearBtn').onclick = () => {
        if(currentTool !== 'paint') return alert("ペン(B)で消したい色を選択してください。");
        if(confirm(`現在の月（輪）から、選択中の色をすべて削除しますか？`)) {
            for (const key in calendarData) {
                if (key.startsWith(`c${currentCycle}_`) && calendarData[key].color === activeBrush) delete calendarData[key];
            }
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(calendarData));
            if(typeof renderSavedData === 'function') renderSavedData();
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (!isSpacePressed) {
                isSpacePressed = true;
                previousTool = currentTool;
                setTool('pointer', 'pan');
            }
            return;
        }
        const key = e.key.toLowerCase();
        if (key === 'v') setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
        if (key === 'b') setTool('paint');
        if (key === 'e') setTool('erase');
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpacePressed = false;
            setTool(previousTool);
        }
    });

    setTool('pointer', 'pan');

    let styleBlock = document.getElementById("layer-style-block");
    if (!styleBlock) {
        styleBlock = document.createElement("style");
        styleBlock.id = "layer-style-block";
        document.head.appendChild(styleBlock);
    }

    const updateLayerVisibility = () => {
        let css = "";
        for (const [toggleId, selector] of Object.entries(LAYER_VISIBILITY_MAP)) {
            const el = document.getElementById(toggleId);
            if (el && !el.checked) css += `${selector} { display: none !important; }\n`;
        }
        styleBlock.innerHTML = css;

        if (typeof drawKoyomiEvents === 'function' && window.lastKoyomiStartDate) {
            drawKoyomiEvents(window.lastKoyomiStartDate);
        }
    };

    document.body.addEventListener("change", (e) => {
        if (e.target && e.target.type === 'checkbox' && e.target.id.startsWith('toggle-')) updateLayerVisibility();
    });
    updateLayerVisibility();
}

function initUI() {
    document.querySelectorAll('.panel-ui').forEach(el => el.remove());
    initNavBar();
    initToolbar();
    initDesignPanel();
}
