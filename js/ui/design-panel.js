// js/ui/design-panel.js (レイヤー詳細デザイン設定モーダル & リアルタイム再描画バインディング)

let currentDesignTarget = null;

function initDesignPanel() {
    let designPanel = document.getElementById('design-panel');
    if (designPanel) return;

    designPanel = document.createElement('div');
    designPanel.id = 'design-panel';
    designPanel.className = 'panel-ui';
    designPanel.style = "display:none; position:fixed; top:100px; left:50%; background:rgba(25,30,40,0.95); padding:0 20px 20px 20px; border-radius:12px; border:1px solid rgba(212,175,55,0.5); color:#fff; z-index:200; box-shadow:0 10px 40px rgba(0,0,0,0.8); min-width:320px; backdrop-filter:blur(10px);";
    
    designPanel.innerHTML = `
        <div id="dp-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(212,175,55,0.3); padding:12px 0 10px 0; cursor:grab; user-select:none;">
            <div id="dp-title" style="color:#d4af37; font-weight:bold; font-size:15px;">デザイン設定</div>
            <div style="display:flex; gap:10px; align-items:center;">
                <button id="dp-reset" style="background:rgba(255,100,100,0.2); border:1px solid #ff8888; color:#ff8888; border-radius:4px; font-size:11px; padding:2px 6px; cursor:pointer;">初期化</button>
                <button id="dp-close" style="background:none; border:none; color:#fff; cursor:pointer; font-size:20px; padding:0; line-height:1;">×</button>
            </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; max-height: 65vh; overflow-y: auto; padding-right: 5px;">
            <div id="dp-row-lunar-phase" style="display:none; flex-direction:column; gap:8px;">
                <label style="display:flex; justify-content:space-between; align-items:center; color:#d4af37; font-weight:bold;">編集対象の月相: 
                    <select id="dp-lunar-phase" style="background:#111; color:#d4af37; border:1px solid #d4af37; padding:4px; border-radius:4px; width:150px; font-weight:bold;">
                        <option value="normal">通常 (平月)</option>
                        <option value="newMoon">新月 (一日)</option>
                        <option value="firstQuarter">上弦 (八日)</option>
                        <option value="fullMoon">満月 (十五日)</option>
                        <option value="lastQuarter">下弦 (二十三日)</option>
                    </select>
                </label>
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
            </div>
            <div id="dp-group-text" style="display:flex; flex-direction:column; gap:12px;">
                <label id="dp-row-font" style="display:flex; justify-content:space-between; align-items:center;">フォント: 
                    <select id="dp-font" style="background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:150px;">
                        <option value="'Shippori Mincho', serif">明朝体 (Shippori)</option>
                        <option value="'YuMincho', 'Yu Mincho', serif">游明朝 (Yu Mincho)</option>
                        <option value="'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif">ゴシック体 (標準)</option>
                        <option value="'YuGothic', 'Yu Gothic', sans-serif">游ゴシック (Yu Gothic)</option>
                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                    </select>
                </label>
                <label id="dp-row-size" style="display:flex; justify-content:space-between; align-items:center;">文字サイズ: 
                    <input type="number" id="dp-size" style="width:60px; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px;" step="0.5">
                </label>
                <label id="dp-row-lang" style="display:none; justify-content:space-between; align-items:center;">表示言語: 
                    <select id="dp-lang" style="background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:120px;">
                        <option value="en">英語 (Sun-Sat)</option>
                        <option value="ja">日本語 (日-土)</option>
                    </select>
                </label>
                <label id="dp-row-color" style="display:flex; justify-content:space-between; align-items:center;">文字色 (Fill): 
                    <input type="color" id="dp-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                </label>
                <label id="dp-row-bold" style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="dp-bold" style="accent-color:#d4af37; width:16px; height:16px;"> 太字にする
                </label>
                <label id="dp-row-stroke-color" style="display:flex; justify-content:space-between; align-items:center;">縁取り色 (Stroke): 
                    <input type="color" id="dp-stroke-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                </label>
                <label id="dp-row-stroke-width" style="display:flex; justify-content:space-between; align-items:center;">縁取り太さ: 
                    <input type="range" id="dp-stroke-width" min="0" max="5" step="0.1" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-stroke-val" style="width:30px; text-align:right;">0</span>
                </label>
            </div>
            <div id="dp-group-mansion-colors" style="display:none; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <label style="display:flex; justify-content:space-between; align-items:center;">文字サイズ (フォント): <input type="number" id="dp-mansion-font-size" style="width:60px; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px;" min="6" max="50" step="1" value="20"></label>
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
                <label style="display:flex; justify-content:space-between; align-items:center;">東方青龍 (角〜箕): <input type="color" id="dp-color-east" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">北方玄武 (斗〜壁): <input type="color" id="dp-color-north" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">西方白虎 (奎〜参): <input type="color" id="dp-color-west" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">南方朱雀 (井〜軫): <input type="color" id="dp-color-south" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
                <label style="display:flex; justify-content:space-between; align-items:center;">図形の大きさ (倍率): <input type="range" id="dp-mansion-mark-scale" min="2" max="16" step="0.5" style="width:100px; accent-color:#d4af37;"> <span id="dp-mansion-mark-scale-val" style="width:30px; text-align:right;">4</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">星の大きさ (点の半径): <input type="range" id="dp-mansion-star-size" min="0.5" max="8" step="0.5" style="width:100px; accent-color:#d4af37;"> <span id="dp-mansion-star-size-val" style="width:30px; text-align:right;">1.5</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">仕切り線の色: <input type="color" id="dp-mansion-divider-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">仕切り線の太さ: <input type="range" id="dp-mansion-divider-width" min="0" max="5" step="0.2" style="width:100px; accent-color:#d4af37;"> <span id="dp-mansion-divider-width-val" style="width:30px; text-align:right;">1</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">配置位置 (半径ズラし): <input type="range" id="dp-mansion-radius-offset" min="-200" max="200" step="1" style="width:100px; accent-color:#d4af37;"> <span id="dp-mansion-radius-offset-val" style="width:30px; text-align:right;">0</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">背景帯の色: <input type="color" id="dp-mansion-bg-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">背景帯の透明度: <input type="range" id="dp-mansion-bg-opacity" min="0" max="1" step="0.05" style="width:100px; accent-color:#d4af37;"> <span id="dp-mansion-bg-opacity-val" style="width:30px; text-align:right;">0.05</span></label>
            </div>
            <div id="dp-group-zodiac" style="display:none; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <label style="display:flex; justify-content:space-between; align-items:center;">表示形式: 
                    <select id="dp-zodiac-display-type" style="background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:140px;">
                        <option value="symbol">記号 (♈︎ ♉︎ ♊︎...)</option>
                        <option value="jp">日本語 (牡羊座...)</option>
                        <option value="en">英語 (Aries...)</option>
                    </select>
                </label>
                <label style="display:flex; justify-content:space-between; align-items:center;">文字サイズ: <input type="number" id="dp-zodiac-font-size" style="width:60px; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px;" min="8" max="60" step="1" value="22"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">文字色: <input type="color" id="dp-zodiac-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
                <label style="display:flex; justify-content:space-between; align-items:center;">仕切り線の色: <input type="color" id="dp-zodiac-divider-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">仕切り線の太さ: <input type="range" id="dp-zodiac-divider-width" min="0" max="5" step="0.2" style="width:100px; accent-color:#d4af37;"> <span id="dp-zodiac-divider-width-val" style="width:30px; text-align:right;">1</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">配置位置 (半径ズラし): <input type="range" id="dp-zodiac-radius-offset" min="-200" max="200" step="1" style="width:100px; accent-color:#d4af37;"> <span id="dp-zodiac-radius-offset-val" style="width:30px; text-align:right;">0</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">背景帯の色: <input type="color" id="dp-zodiac-bg-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">背景帯の透明度: <input type="range" id="dp-zodiac-bg-opacity" min="0" max="1" step="0.05" style="width:100px; accent-color:#d4af37;"> <span id="dp-zodiac-bg-opacity-val" style="width:30px; text-align:right;">0.03</span></label>
            </div>
            <div id="dp-group-clock-hands" style="display:none; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <div style="font-size:11px; color:#d4af37; font-weight:bold;">🌙 月の針 (長針)</div>
                <label style="display:flex; justify-content:space-between; align-items:center;">針の色: <input type="color" id="dp-clock-moon-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">針の太さ: <input type="range" id="dp-clock-moon-width" min="0.5" max="6" step="0.2" style="width:100px; accent-color:#d4af37;"> <span id="dp-clock-moon-width-val" style="width:30px; text-align:right;">1.5</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">針の長さ: <input type="range" id="dp-clock-moon-length" min="400" max="1100" step="10" style="width:100px; accent-color:#d4af37;"> <span id="dp-clock-moon-length-val" style="width:30px; text-align:right;">960</span></label>
                
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
                <div style="font-size:11px; color:#c9743c; font-weight:bold;">☀️ 太陽の針 (短針)</div>
                <label style="display:flex; justify-content:space-between; align-items:center;">針の色: <input type="color" id="dp-clock-sun-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">針の太さ: <input type="range" id="dp-clock-sun-width" min="0.5" max="6" step="0.2" style="width:100px; accent-color:#d4af37;"> <span id="dp-clock-sun-width-val" style="width:30px; text-align:right;">2.2</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">針の長さ: <input type="range" id="dp-clock-sun-length" min="300" max="900" step="10" style="width:100px; accent-color:#d4af37;"> <span id="dp-clock-sun-length-val" style="width:30px; text-align:right;">680</span></label>
                
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
                <div style="font-size:11px; color:#8b8170; font-weight:bold;">⚙️ 中心軸 (ピボット鋲)</div>
                <label style="display:flex; justify-content:space-between; align-items:center;">鋲の大きさ: <input type="range" id="dp-clock-pivot-radius" min="4" max="25" step="1" style="width:100px; accent-color:#d4af37;"> <span id="dp-clock-pivot-radius-val" style="width:30px; text-align:right;">12</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">鋲の色: <input type="color" id="dp-clock-pivot-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
            </div>
            <div id="dp-group-shape" style="display:none; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <label id="dp-row-shape-type" style="display:flex; justify-content:space-between; align-items:center;">図形の形: 
                    <select id="dp-shape" style="background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:120px;">
                        <option value="none">なし</option>
                        <option value="circle">丸 (●)</option>
                        <option value="halfRight">右半月 (☽)</option>
                        <option value="halfLeft">左半月 (☾)</option>
                        <option value="rect">四角 (■)</option>
                        <option value="triangle">三角 (▲)</option>
                        <option value="rhombus">ひし形 (◆)</option>
                        <option value="star">星 (★)</option>
                        <option value="arrowUp">上矢印 (⇧)</option>
                        <option value="arrowDown">下矢印 (⇩)</option>
                    </select>
                </label>
                <label id="dp-row-shape-scale" style="display:none; justify-content:space-between; align-items:center;">図形のサイズ (倍率): 
                    <input type="range" id="dp-shape-scale" min="0.5" max="4" step="0.1" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-shape-scale-val" style="width:30px; text-align:right;">1</span>
                </label>
                <label id="dp-row-radius-offset" style="display:none; justify-content:space-between; align-items:center;">配置位置 (半径ズラし): 
                    <input type="range" id="dp-radius-offset" min="-1000" max="1000" step="1" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-radius-offset-val" style="width:30px; text-align:right;">0</span>
                </label>
                <label id="dp-row-density" style="display:none; justify-content:space-between; align-items:center;">グラデーション濃度: 
                    <input type="range" id="dp-density" min="0.1" max="1" step="0.05" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-density-val" style="width:30px; text-align:right;">0.35</span>
                </label>
                <label id="dp-row-shape-fill" style="display:flex; justify-content:space-between; align-items:center;">塗りつぶし色: 
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" id="dp-shape-fill-trans" title="透明にする" style="accent-color:#d4af37;">
                        <span id="dp-shape-fill-trans-text">透明</span>
                        <input type="color" id="dp-shape-fill" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                    </div>
                </label>
                <label id="dp-row-shape-stroke" style="display:flex; justify-content:space-between; align-items:center;">線の色: 
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" id="dp-shape-stroke-orig" title="単色で上書きする" style="display:none; accent-color:#d4af37;">
                        <span id="dp-shape-stroke-orig-text" style="display:none; font-size:11px;">上書きする</span>
                        <input type="color" id="dp-shape-stroke" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                    </div>
                </label>
                <label id="dp-row-shape-stroke-width" style="display:flex; justify-content:space-between; align-items:center;">線の太さ: 
                    <input type="range" id="dp-shape-stroke-width" min="0" max="10" step="0.1" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-shape-stroke-width-val" style="width:30px; text-align:right;">0</span>
                </label>
            </div>
            <div id="dp-group-common" style="display:flex; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <label id="dp-row-opacity" style="display:flex; justify-content:space-between; align-items:center;">透明度 (全体): 
                    <input type="range" id="dp-opacity" min="0" max="1" step="0.05" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-opacity-val" style="width:30px; text-align:right;">1</span>
                </label>
                <label id="dp-row-offset" style="display:flex; justify-content:space-between; align-items:center;">位置 (文字のY軸微調整): 
                    <input type="number" id="dp-offset" style="width:60px; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px;" step="1">
                </label>
            </div>
        </div>
    `;
    document.body.appendChild(designPanel);

    const blockEvent = (e) => e.stopPropagation();
    designPanel.addEventListener('mousedown', (e) => {
        // ヘッダー以外のパネル内部のクリックは背景に伝播させない
        if (e.target.id !== 'dp-header' && !e.target.closest('#dp-header')) {
            e.stopPropagation();
        }
    });
    designPanel.addEventListener('wheel', blockEvent);

    let isDraggingPanel = false;
    let dpStartX = 0, dpStartY = 0;
    const dpHeader = document.getElementById('dp-header');
    
    dpHeader.addEventListener('mousedown', (e) => {
        if(e.target.id === 'dp-close' || e.target.id === 'dp-reset') return;
        isDraggingPanel = true;
        const rect = designPanel.getBoundingClientRect();
        dpStartX = e.clientX - rect.left;
        dpStartY = e.clientY - rect.top;
        dpHeader.style.cursor = 'grabbing';
        designPanel.style.transform = 'none';
        designPanel.style.left = rect.left + 'px';
        designPanel.style.top = rect.top + 'px';
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if(isDraggingPanel) {
            const newX = e.clientX - dpStartX;
            const newY = e.clientY - dpStartY;
            const maxX = Math.max(10, window.innerWidth - designPanel.offsetWidth - 10);
            const maxY = Math.max(10, window.innerHeight - designPanel.offsetHeight - 10);
            designPanel.style.left = Math.min(Math.max(10, newX), maxX) + 'px';
            designPanel.style.top = Math.min(Math.max(10, newY), maxY) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if(isDraggingPanel) {
            isDraggingPanel = false;
            if(dpHeader) dpHeader.style.cursor = 'grab';
        }
    });

    document.getElementById('dp-close').onclick = () => { designPanel.style.display = 'none'; };
    document.getElementById('dp-reset').onclick = () => {
        if (confirm(`「${TARGET_NAMES[currentDesignTarget]}」のデザイン設定を初期状態に戻しますか？`)) {
            window.layerSettings[currentDesignTarget] = JSON.parse(JSON.stringify(window.defaultLayerSettings[currentDesignTarget]));
            window.saveLayerSettings();
            loadPanelData();
            updateDesign();
        }
    };

    ['dp-lunar-phase', 'dp-font', 'dp-size', 'dp-color', 'dp-bold', 'dp-stroke-color', 'dp-stroke-width', 'dp-shape', 'dp-shape-scale', 'dp-lang', 'dp-density', 'dp-mansion-font-size', 'dp-color-east', 'dp-color-south', 'dp-color-west', 'dp-color-north', 'dp-mansion-mark-scale', 'dp-mansion-star-size', 'dp-mansion-divider-color', 'dp-mansion-divider-width', 'dp-mansion-radius-offset', 'dp-mansion-bg-color', 'dp-mansion-bg-opacity', 'dp-zodiac-display-type', 'dp-zodiac-font-size', 'dp-zodiac-color', 'dp-zodiac-divider-color', 'dp-zodiac-divider-width', 'dp-zodiac-radius-offset', 'dp-zodiac-bg-color', 'dp-zodiac-bg-opacity', 'dp-clock-moon-color', 'dp-clock-moon-width', 'dp-clock-moon-length', 'dp-clock-sun-color', 'dp-clock-sun-width', 'dp-clock-sun-length', 'dp-clock-pivot-radius', 'dp-clock-pivot-color', 'dp-shape-fill-trans', 'dp-shape-fill', 'dp-shape-stroke-orig', 'dp-shape-stroke', 'dp-shape-stroke-width', 'dp-opacity', 'dp-offset', 'dp-radius-offset'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'dp-lunar-phase') el.addEventListener('change', loadPanelData);
            else el.addEventListener('input', updateDesign);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('layer-settings-btn')) {
            currentDesignTarget = e.target.getAttribute('data-target');
            document.getElementById('dp-title').innerText = `${TARGET_NAMES[currentDesignTarget]} の設定`;
            
            // 初回表示時のみ邪魔にならない位置に配置。一度動かしたらその位置を記憶してキープ
            if (!designPanel.getAttribute('data-positioned')) {
                designPanel.style.transform = 'none';
                designPanel.style.left = Math.max(20, window.innerWidth - 650) + 'px';
                designPanel.style.top = '100px';
                designPanel.setAttribute('data-positioned', 'true');
            }
            
            loadPanelData();
            designPanel.style.display = 'block';
        }
    });
}

function loadPanelData() {
    const st = window.layerSettings[currentDesignTarget] || window.defaultLayerSettings[currentDesignTarget];
    if (!st) return;

    ['dp-row-lunar-phase', 'dp-group-text', 'dp-group-shape', 'dp-row-shape-type', 'dp-row-shape-fill', 'dp-row-shape-stroke', 'dp-row-shape-stroke-width', 'dp-shape-stroke-orig', 'dp-shape-stroke-orig-text', 'dp-row-offset', 'dp-row-lang', 'dp-row-density', 'dp-row-shape-scale', 'dp-row-radius-offset', 'dp-group-mansion-colors'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    document.getElementById('dp-row-opacity').style.display = currentDesignTarget === 'canvasBg' ? 'none' : 'flex';
    if (st.opacity !== undefined && currentDesignTarget !== 'canvasBg') {
        document.getElementById('dp-opacity').value = st.opacity;
        document.getElementById('dp-opacity-val').innerText = st.opacity;
    }

    const isTextTarget = TEXT_TARGETS.includes(currentDesignTarget);
    const isShapeTarget = SHAPE_TARGETS.includes(currentDesignTarget);

    if (currentDesignTarget === 'lunar' || currentDesignTarget === 'astroPins') {
        document.getElementById('dp-row-lunar-phase').style.display = 'flex';
        document.getElementById('dp-group-shape').style.display = 'flex';
        document.getElementById('dp-row-shape-type').style.display = 'flex';
        document.getElementById('dp-row-shape-scale').style.display = 'flex';
        document.getElementById('dp-row-shape-fill').style.display = 'flex';
        document.getElementById('dp-row-shape-stroke').style.display = 'flex';
        document.getElementById('dp-row-shape-stroke-width').style.display = 'flex';

        const phaseSelect = document.getElementById('dp-lunar-phase');
        if (currentDesignTarget === 'astroPins') {
            if(phaseSelect.value === 'normal') phaseSelect.value = 'newMoon';
            phaseSelect.querySelector('option[value="normal"]').style.display = 'none';
        } else {
            phaseSelect.querySelector('option[value="normal"]').style.display = 'block';
        }

        const pst = st.phases ? st.phases[phaseSelect.value] : st;
        
        if (currentDesignTarget === 'lunar') {
            document.getElementById('dp-group-text').style.display = 'flex';
            document.getElementById('dp-color').value = pst.fill || "#2c3e50";
        } else {
            document.getElementById('dp-group-text').style.display = 'none';
        }
        
        document.getElementById('dp-shape').value = pst.shape || (currentDesignTarget==='astroPins' ? 'circle' : 'none');
        document.getElementById('dp-shape-scale').value = pst.scale || 1;
        document.getElementById('dp-shape-scale-val').innerText = pst.scale || 1;
        
        const currentFill = currentDesignTarget === 'lunar' ? pst.bgFill : pst.fill;
        document.getElementById('dp-shape-fill-trans').checked = (currentFill === "transparent" || currentFill === "none");
        if(currentFill !== "transparent" && currentFill !== "none") document.getElementById('dp-shape-fill').value = currentFill;
        
        document.getElementById('dp-shape-stroke').value = pst.shapeStroke !== undefined ? pst.shapeStroke : (pst.stroke || "#555555");
        document.getElementById('dp-shape-stroke-width').value = pst.shapeStrokeWidth !== undefined ? pst.shapeStrokeWidth : (pst.strokeWidth || 0);
        document.getElementById('dp-shape-stroke-width-val').innerText = pst.shapeStrokeWidth !== undefined ? pst.shapeStrokeWidth : (pst.strokeWidth || 0);

        if (currentDesignTarget === 'astroPins') {
            document.getElementById('dp-row-radius-offset').style.display = 'flex';
            document.getElementById('dp-radius-offset').value = st.radiusOffset !== undefined ? st.radiusOffset : 0;
            document.getElementById('dp-radius-offset-val').innerText = st.radiusOffset !== undefined ? st.radiusOffset : 0;
        }
    }

    if (isTextTarget && currentDesignTarget !== 'lunar') {
        document.getElementById('dp-group-text').style.display = 'flex';
        if(st.offsetRadius !== undefined) {
            document.getElementById('dp-row-offset').style.display = 'flex';
            document.getElementById('dp-offset').value = st.offsetRadius;
        }
        document.getElementById('dp-font').value = st.fontFamily || "Arial";
        document.getElementById('dp-size').value = st.fontSize || 10;
        
        document.getElementById('dp-color').value = st.fill || "#ffffff";
        document.getElementById('dp-bold').checked = st.fontWeight === "bold";
        document.getElementById('dp-stroke-color').value = st.stroke || "#000000";
        document.getElementById('dp-stroke-width').value = st.strokeWidth || 0;
        document.getElementById('dp-stroke-val').innerText = st.strokeWidth || 0;
    }

    if (currentDesignTarget === 'weekday') {
        document.getElementById('dp-row-lang').style.display = 'flex';
        document.getElementById('dp-lang').value = st.lang || 'en';
    }

    if (currentDesignTarget === 'dailyRainBg') {
        document.getElementById('dp-row-density').style.display = 'flex';
        document.getElementById('dp-density').value = st.density || 0.35;
        document.getElementById('dp-density-val').innerText = st.density || 0.35;
    }

    if (currentDesignTarget === 'lunarMansion') {
        document.getElementById('dp-group-mansion-colors').style.display = 'flex';
        ['East', 'South', 'West', 'North'].forEach(dir => document.getElementById(`dp-color-${dir.toLowerCase()}`).value = st[`color${dir}`] || "#888888");
        
        document.getElementById('dp-mansion-font-size').value = st.fontSize !== undefined ? st.fontSize : 20;

        const markScale = st.markScale !== undefined ? st.markScale : 4.0;
        document.getElementById('dp-mansion-mark-scale').value = markScale;
        document.getElementById('dp-mansion-mark-scale-val').innerText = markScale;

        const starSize = st.starSize !== undefined ? st.starSize : 1.5;
        document.getElementById('dp-mansion-star-size').value = starSize;
        document.getElementById('dp-mansion-star-size-val').innerText = starSize;

        document.getElementById('dp-mansion-divider-color').value = st.dividerColor || "#777777";
        const divW = st.strokeWidth !== undefined ? st.strokeWidth : 1.0;
        document.getElementById('dp-mansion-divider-width').value = divW;
        document.getElementById('dp-mansion-divider-width-val').innerText = divW;

        const rOffset = st.radiusOffset !== undefined ? st.radiusOffset : 0;
        document.getElementById('dp-mansion-radius-offset').value = rOffset;
        document.getElementById('dp-mansion-radius-offset-val').innerText = rOffset;

        document.getElementById('dp-mansion-bg-color').value = st.bgRingColor || "#ffffff";
        const bgOp = st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.05;
        document.getElementById('dp-mansion-bg-opacity').value = bgOp;
        document.getElementById('dp-mansion-bg-opacity-val').innerText = bgOp;
    }

    if (currentDesignTarget === 'zodiacRing') {
        document.getElementById('dp-group-zodiac').style.display = 'flex';
        document.getElementById('dp-zodiac-display-type').value = st.displayType || 'symbol';
        document.getElementById('dp-zodiac-font-size').value = st.fontSize !== undefined ? st.fontSize : 22;
        document.getElementById('dp-zodiac-color').value = st.color || "#8a8171";
        document.getElementById('dp-zodiac-divider-color').value = st.dividerColor || "#8b8170";
        const divW = st.dividerWidth !== undefined ? st.dividerWidth : 1.0;
        document.getElementById('dp-zodiac-divider-width').value = divW;
        document.getElementById('dp-zodiac-divider-width-val').innerText = divW;
        const rOffset = st.radiusOffset !== undefined ? st.radiusOffset : 0;
        document.getElementById('dp-zodiac-radius-offset').value = rOffset;
        document.getElementById('dp-zodiac-radius-offset-val').innerText = rOffset;
        document.getElementById('dp-zodiac-bg-color').value = st.bgRingColor || "#ffffff";
        const bgOp = st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.03;
        document.getElementById('dp-zodiac-bg-opacity').value = bgOp;
        document.getElementById('dp-zodiac-bg-opacity-val').innerText = bgOp;
    }

    if (currentDesignTarget === 'clockHands') {
        document.getElementById('dp-group-clock-hands').style.display = 'flex';
        document.getElementById('dp-clock-moon-color').value = st.moonHandColor || "#d4af37";
        const mW = st.moonHandWidth !== undefined ? st.moonHandWidth : 1.5;
        document.getElementById('dp-clock-moon-width').value = mW;
        document.getElementById('dp-clock-moon-width-val').innerText = mW;
        const mL = st.moonHandLength !== undefined ? st.moonHandLength : 960;
        document.getElementById('dp-clock-moon-length').value = mL;
        document.getElementById('dp-clock-moon-length-val').innerText = mL;

        document.getElementById('dp-clock-sun-color').value = st.sunHandColor || "#c9743c";
        const sW = st.sunHandWidth !== undefined ? st.sunHandWidth : 2.2;
        document.getElementById('dp-clock-sun-width').value = sW;
        document.getElementById('dp-clock-sun-width-val').innerText = sW;
        const sL = st.sunHandLength !== undefined ? st.sunHandLength : 680;
        document.getElementById('dp-clock-sun-length').value = sL;
        document.getElementById('dp-clock-sun-length-val').innerText = sL;

        const pR = st.centerPivotRadius !== undefined ? st.centerPivotRadius : 12;
        document.getElementById('dp-clock-pivot-radius').value = pR;
        document.getElementById('dp-clock-pivot-radius-val').innerText = pR;
        document.getElementById('dp-clock-pivot-color').value = st.centerPivotColor || "#8b8170";
    }

    if (currentDesignTarget === 'canvasBg') {
        document.getElementById('dp-group-shape').style.display = 'flex';
        document.getElementById('dp-row-shape-fill').style.display = 'flex';
        document.getElementById('dp-shape-fill-trans').style.display = 'none';
        document.getElementById('dp-shape-fill-trans-text').style.display = 'none';
        if (st.fill !== "none" && st.fill !== "transparent") document.getElementById('dp-shape-fill').value = st.fill;
    } else {
        document.getElementById('dp-shape-fill-trans').style.display = 'inline-block';
        document.getElementById('dp-shape-fill-trans-text').style.display = 'inline-block';
    }

    if(isShapeTarget && currentDesignTarget !== 'canvasBg' && currentDesignTarget !== 'astroPins') {
        document.getElementById('dp-group-shape').style.display = 'flex';
        
        if (currentDesignTarget === 'dailyRainBg') {
            document.getElementById('dp-group-shape').style.display = 'none';
        }

        if (st.fill !== undefined) {
            document.getElementById('dp-row-shape-fill').style.display = 'flex';
            document.getElementById('dp-shape-fill-trans').checked = (st.fill === "none" || st.fill === "transparent");
            if (st.fill !== "none" && st.fill !== "transparent") document.getElementById('dp-shape-fill').value = st.fill;
        }

        if (st.stroke !== undefined || st.strokeWidth !== undefined) {
            document.getElementById('dp-row-shape-stroke').style.display = 'flex';
            document.getElementById('dp-row-shape-stroke-width').style.display = 'flex';
            
            if (currentDesignTarget === 'baseSvg') {
                document.getElementById('dp-shape-stroke-orig').style.display = 'inline-block';
                document.getElementById('dp-shape-stroke-orig-text').style.display = 'inline-block';
                document.getElementById('dp-shape-stroke-orig').checked = (st.stroke !== "");
                document.getElementById('dp-shape-stroke').value = st.stroke || "#000000";
                document.getElementById('dp-shape-stroke-width').value = st.strokeWidth !== undefined ? st.strokeWidth : 0.5;
                document.getElementById('dp-shape-stroke-width-val').innerText = st.strokeWidth !== undefined ? st.strokeWidth : 0.5;
            } else {
                document.getElementById('dp-shape-stroke').value = st.stroke || "#000000";
                document.getElementById('dp-shape-stroke-width').value = st.strokeWidth !== undefined ? st.strokeWidth : 0;
                document.getElementById('dp-shape-stroke-width-val').innerText = st.strokeWidth !== undefined ? st.strokeWidth : 0;
            }
        }

        if (['moonRisePin', 'moonSetPin', 'sunRisePin', 'sunSetPin'].includes(currentDesignTarget)) {
            document.getElementById('dp-row-shape-type').style.display = 'flex';
            document.getElementById('dp-shape').value = st.shape || "circle";
            
            document.getElementById('dp-row-shape-scale').style.display = 'flex';
            document.getElementById('dp-row-radius-offset').style.display = 'flex';
            document.getElementById('dp-shape-scale').value = st.scale !== undefined ? st.scale : 1;
            document.getElementById('dp-shape-scale-val').innerText = st.scale !== undefined ? st.scale : 1;
            document.getElementById('dp-radius-offset').value = st.radiusOffset !== undefined ? st.radiusOffset : 0;
            document.getElementById('dp-radius-offset-val').innerText = st.radiusOffset !== undefined ? st.radiusOffset : 0;
        }
    }
}

function updateDesign() {
    if (!currentDesignTarget) return;
    const st = window.layerSettings[currentDesignTarget];

    if(document.getElementById('dp-opacity').style.display !== 'none') {
        st.opacity = parseFloat(document.getElementById('dp-opacity').value);
        document.getElementById('dp-opacity-val').innerText = st.opacity;
    }

    if (TEXT_TARGETS.includes(currentDesignTarget) && currentDesignTarget !== 'lunar') {
        st.fontFamily = document.getElementById('dp-font').value;
        st.fontSize = parseFloat(document.getElementById('dp-size').value);
        if(st.offsetRadius !== undefined) st.offsetRadius = parseFloat(document.getElementById('dp-offset').value);
        
        st.fill = document.getElementById('dp-color').value;
        st.fontWeight = document.getElementById('dp-bold').checked ? "bold" : "normal";
        st.stroke = document.getElementById('dp-stroke-color').value;
        st.strokeWidth = parseFloat(document.getElementById('dp-stroke-width').value);
        document.getElementById('dp-stroke-val').innerText = st.strokeWidth;
    }

    if (currentDesignTarget === 'weekday') st.lang = document.getElementById('dp-lang').value;
    if (currentDesignTarget === 'dailyRainBg') {
        st.density = parseFloat(document.getElementById('dp-density').value);
        document.getElementById('dp-density-val').innerText = st.density;
    }

    if (currentDesignTarget === 'lunarMansion') {
        ['East', 'South', 'West', 'North'].forEach(dir => st[`color${dir}`] = document.getElementById(`dp-color-${dir.toLowerCase()}`).value);
        st.fontSize = parseFloat(document.getElementById('dp-mansion-font-size').value) || 20;
        st.markScale = parseFloat(document.getElementById('dp-mansion-mark-scale').value);
        document.getElementById('dp-mansion-mark-scale-val').innerText = st.markScale;
        st.starSize = parseFloat(document.getElementById('dp-mansion-star-size').value);
        document.getElementById('dp-mansion-star-size-val').innerText = st.starSize;
        st.dividerColor = document.getElementById('dp-mansion-divider-color').value;
        st.strokeWidth = parseFloat(document.getElementById('dp-mansion-divider-width').value);
        document.getElementById('dp-mansion-divider-width-val').innerText = st.strokeWidth;
        st.radiusOffset = parseFloat(document.getElementById('dp-mansion-radius-offset').value);
        document.getElementById('dp-mansion-radius-offset-val').innerText = st.radiusOffset;
        st.bgRingColor = document.getElementById('dp-mansion-bg-color').value;
        st.bgRingOpacity = parseFloat(document.getElementById('dp-mansion-bg-opacity').value);
        document.getElementById('dp-mansion-bg-opacity-val').innerText = st.bgRingOpacity;
    }

    if (currentDesignTarget === 'zodiacRing') {
        st.displayType = document.getElementById('dp-zodiac-display-type').value;
        st.fontSize = parseFloat(document.getElementById('dp-zodiac-font-size').value) || 22;
        st.color = document.getElementById('dp-zodiac-color').value;
        st.dividerColor = document.getElementById('dp-zodiac-divider-color').value;
        st.dividerWidth = parseFloat(document.getElementById('dp-zodiac-divider-width').value);
        document.getElementById('dp-zodiac-divider-width-val').innerText = st.dividerWidth;
        st.radiusOffset = parseFloat(document.getElementById('dp-zodiac-radius-offset').value);
        document.getElementById('dp-zodiac-radius-offset-val').innerText = st.radiusOffset;
        st.bgRingColor = document.getElementById('dp-zodiac-bg-color').value;
        st.bgRingOpacity = parseFloat(document.getElementById('dp-zodiac-bg-opacity').value);
        document.getElementById('dp-zodiac-bg-opacity-val').innerText = st.bgRingOpacity;
    }

    if (currentDesignTarget === 'clockHands') {
        st.moonHandColor = document.getElementById('dp-clock-moon-color').value;
        st.moonHandWidth = parseFloat(document.getElementById('dp-clock-moon-width').value);
        document.getElementById('dp-clock-moon-width-val').innerText = st.moonHandWidth;
        st.moonHandLength = parseFloat(document.getElementById('dp-clock-moon-length').value);
        document.getElementById('dp-clock-moon-length-val').innerText = st.moonHandLength;

        st.sunHandColor = document.getElementById('dp-clock-sun-color').value;
        st.sunHandWidth = parseFloat(document.getElementById('dp-clock-sun-width').value);
        document.getElementById('dp-clock-sun-width-val').innerText = st.sunHandWidth;
        st.sunHandLength = parseFloat(document.getElementById('dp-clock-sun-length').value);
        document.getElementById('dp-clock-sun-length-val').innerText = st.sunHandLength;

        st.centerPivotRadius = parseFloat(document.getElementById('dp-clock-pivot-radius').value);
        document.getElementById('dp-clock-pivot-radius-val').innerText = st.centerPivotRadius;
        st.centerPivotColor = document.getElementById('dp-clock-pivot-color').value;
    }

    if (currentDesignTarget === 'canvasBg') {
        st.fill = document.getElementById('dp-shape-fill').value;
        document.body.style.backgroundColor = st.fill;
    }

    if(SHAPE_TARGETS.includes(currentDesignTarget) && currentDesignTarget !== 'canvasBg' && currentDesignTarget !== 'astroPins') {
        if(st.fill !== undefined) st.fill = document.getElementById('dp-shape-fill-trans').checked ? "none" : document.getElementById('dp-shape-fill').value;
        
        if (['moonRisePin', 'moonSetPin', 'sunRisePin', 'sunSetPin'].includes(currentDesignTarget)) {
            st.shape = document.getElementById('dp-shape').value;
            st.scale = parseFloat(document.getElementById('dp-shape-scale').value);
            document.getElementById('dp-shape-scale-val').innerText = st.scale;
            st.radiusOffset = parseFloat(document.getElementById('dp-radius-offset').value);
            document.getElementById('dp-radius-offset-val').innerText = st.radiusOffset;
        }

        if(currentDesignTarget === 'baseSvg') {
            st.stroke = document.getElementById('dp-shape-stroke-orig').checked ? document.getElementById('dp-shape-stroke').value : "";
            st.strokeWidth = parseFloat(document.getElementById('dp-shape-stroke-width').value);
        } else if (currentDesignTarget !== 'dailyRainBg') {
            if(st.stroke !== undefined) st.stroke = document.getElementById('dp-shape-stroke').value;
            if(st.strokeWidth !== undefined) st.strokeWidth = parseFloat(document.getElementById('dp-shape-stroke-width').value);
        }
        if(document.getElementById('dp-shape-stroke-width-val')) document.getElementById('dp-shape-stroke-width-val').innerText = document.getElementById('dp-shape-stroke-width').value;
    }

    if (currentDesignTarget === 'lunar' || currentDesignTarget === 'astroPins') {
        if (!st.phases) {
            st.phases = {
                newMoon: { shape: "circle", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 },
                firstQuarter: { shape: "halfRight", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 },
                fullMoon: { shape: "circle", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 },
                lastQuarter: { shape: "halfLeft", fill: "none", shapeStroke: "#000000", shapeStrokeWidth: 1.2, scale: 1 }
            };
        }
        const phaseSelect = document.getElementById('dp-lunar-phase').value;
        const pst = st.phases[phaseSelect];
        
        pst.shape = document.getElementById('dp-shape').value;
        pst.scale = parseFloat(document.getElementById('dp-shape-scale').value);
        document.getElementById('dp-shape-scale-val').innerText = pst.scale;
        
        const isTrans = document.getElementById('dp-shape-fill-trans').checked;
        const fillColor = isTrans ? (currentDesignTarget === 'lunar' ? "transparent" : "none") : document.getElementById('dp-shape-fill').value;
        
        if (currentDesignTarget === 'lunar') {
            pst.fill = document.getElementById('dp-color').value; 
            st.fontWeight = document.getElementById('dp-bold').checked ? "bold" : "normal";
            pst.bgFill = fillColor;
        } else {
            pst.fill = fillColor;
            st.radiusOffset = parseFloat(document.getElementById('dp-radius-offset').value);
            document.getElementById('dp-radius-offset-val').innerText = st.radiusOffset;
        }
        
        pst.shapeStroke = document.getElementById('dp-shape-stroke').value;
        pst.shapeStrokeWidth = parseFloat(document.getElementById('dp-shape-stroke-width').value);
        document.getElementById('dp-shape-stroke-width-val').innerText = pst.shapeStrokeWidth;
    }

    window.saveLayerSettings();
    triggerRedraw(currentDesignTarget); 
}

function triggerRedraw(target) {
    if (target === 'baseSvg') {
        const bgGroup = document.getElementById('bg-group');
        if(bgGroup) {
            bgGroup.style.opacity = window.layerSettings.baseSvg.opacity;
            Array.from(bgGroup.querySelectorAll('*')).forEach(el => {
                if (window.layerSettings.baseSvg.stroke && window.layerSettings.baseSvg.stroke !== "") {
                    el.setAttribute('stroke', window.layerSettings.baseSvg.stroke);
                    if (window.layerSettings.baseSvg.strokeWidth !== undefined && window.layerSettings.baseSvg.strokeWidth > 0) {
                        el.setAttribute('stroke-width', window.layerSettings.baseSvg.strokeWidth);
                    }
                } else {
                    const orig = el.getAttribute('data-orig-stroke');
                    if(orig) el.setAttribute('stroke', orig);
                    else el.removeAttribute('stroke');
                    
                    const origW = el.getAttribute('data-orig-stroke-width');
                    if (origW) el.setAttribute('stroke-width', origW);
                    else el.removeAttribute('stroke-width');
                }
            });
        }
        return;
    }
    if (target === 'canvasBg') return;

    if (target === 'dateLines' && typeof drawDynamicLines === 'function') drawDynamicLines();
    else if (target === 'guideTime' && typeof drawTimeLabels === 'function') drawTimeLabels();
    
    if (window.lastCycleStartTimeMs) {
        if (['tideGraph', 'guideTideLine', 'guideTideText'].includes(target) && typeof drawTideGraph === 'function') drawTideGraph(window.lastCycleStartTimeMs);
        if (['rainGraph', 'guideRainLine', 'guideRainText'].includes(target) && typeof drawRainfallGraph === 'function') drawRainfallGraph(window.lastCycleStartTimeMs);
        if (target === 'lunarShadow' && typeof drawLunarShadow === 'function') drawLunarShadow(window.lastCycleStartTimeMs);
        if (target === 'astroPins' && typeof drawAstronomicalPins === 'function') drawAstronomicalPins(window.lastCycleStartTimeMs);
        if (['lunarMansion', 'zodiacRing'].includes(target) && typeof drawLunarMansions === 'function') drawLunarMansions(window.lastCycleStartTimeMs);
        if (['lunarMansion', 'zodiacRing'].includes(target) && typeof drawZodiacRing === 'function') drawZodiacRing(window.lastCycleStartTimeMs);
        if (target === 'clockHands' && typeof drawClockHands === 'function') drawClockHands(window.lastCycleStartTimeMs);
        if (['moonRisePin', 'moonSetPin'].includes(target) && typeof drawMoonEventPins === 'function') drawMoonEventPins(window.lastCycleStartTimeMs); 
    }

    if (window.lastKoyomiStartDate) {
        if (['dailyRainBg', 'dailyRainText'].includes(target) && typeof drawDailyRainStats === 'function') drawDailyRainStats(window.lastKoyomiStartDate);
        if (['lunarMansion', 'zodiacRing', 'haikuText'].includes(target) && typeof drawHaikus === 'function') drawHaikus(window.lastKoyomiStartDate);
        if (['gregorian', 'weekday', 'sekki', 'kou', 'zassetsu', 'holiday', 'important', 'eventShinto', 'eventBuddhism', 'eventChurch', 'eventSonota', 'lunar', 'wafuText', 'gregorianText'].includes(target) && typeof drawKoyomiEvents === 'function') drawKoyomiEvents(window.lastKoyomiStartDate);
        if (['sunRisePin', 'sunSetPin'].includes(target) && typeof drawSunEventPins === 'function') drawSunEventPins(window.lastKoyomiStartDate); 
    }
}
