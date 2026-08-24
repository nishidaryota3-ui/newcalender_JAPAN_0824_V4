// js/ui/export-service.js (印刷・高解像度PNG画像エクスポートサービス)

const printViewBox = "-304.31 -33.52 2450 2450"; 

function hideUIForOutput() {
    const panels = document.querySelectorAll('.panel-ui, #layer-panel, #status-bar');
    const states = [];
    panels.forEach(p => {
        states.push({ el: p, display: p.style.display });
        p.style.display = 'none';
    });
    return states;
}

function restoreUI(states) {
    states.forEach(state => state.el.style.display = state.display);
}

window.printCalendar = function() {
    if(typeof svg === 'undefined' || !svg) return;
    
    const uiStates = hideUIForOutput();
    const currentViewBox = svg.getAttribute('viewBox');
    
    svg.setAttribute('viewBox', printViewBox);
    window.print(); 
    svg.setAttribute('viewBox', currentViewBox);
    
    restoreUI(uiStates);
};

window.exportHighResPNG = function() {
    if(typeof svg === 'undefined' || !svg) return;
    
    const loader = document.createElement('div');
    loader.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; color:#d4af37; font-size:20px; font-weight:bold;";
    loader.innerHTML = "高解像度画像を生成中... しばらくお待ちください";
    document.body.appendChild(loader);

    setTimeout(() => {
        try {
            const uiStates = hideUIForOutput();

            const clone = svg.cloneNode(true);
            clone.setAttribute('viewBox', printViewBox);
            clone.setAttribute('width', '2450'); 
            clone.setAttribute('height', '2450');

            const bgColor = document.body.style.backgroundColor || (window.layerSettings && window.layerSettings.canvasBg && window.layerSettings.canvasBg.fill) || '#f5f5f0';
            if (bgColor !== 'transparent' && bgColor !== 'none') {
                const bgRect = document.createElementNS(svgNS, "rect");
                bgRect.setAttribute('x', '-500');
                bgRect.setAttribute('y', '-500');
                bgRect.setAttribute('width', '3500');
                bgRect.setAttribute('height', '3500');
                bgRect.setAttribute('fill', bgColor);
                clone.insertBefore(bgRect, clone.firstChild);
            }

            const dateTextParts = document.getElementById('cycleDisplay').innerText.split('\n');
            const titleText = dateTextParts[0].replace('▼', '').trim();

            const svgData = new XMLSerializer().serializeToString(clone);
            const blob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
            const url = URL.createObjectURL(blob);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 4900; 
            canvas.height = 4900;

            const img = new Image();
            img.onload = () => {
                if (bgColor !== 'transparent' && bgColor !== 'none') {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const pngUrl = canvas.toDataURL('image/png', 1.0);
                const a = document.createElement('a');
                a.href = pngUrl;
                const safeName = titleText.replace(/\s/g, '');
                a.download = `PolarCalendar_${safeName}.png`;
                a.click();
                
                URL.revokeObjectURL(url);
                loader.remove();
                restoreUI(uiStates);
            };
            img.onerror = () => {
                alert('画像の生成に失敗しました。');
                loader.remove();
                restoreUI(uiStates);
            };
            img.src = url;
        } catch(e) {
            alert('エラーが発生しました。');
            loader.remove();
            restoreUI(uiStates);
        }
    }, 100); 
};
