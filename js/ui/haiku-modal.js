// js/ui/haiku-modal.js (俳句一覧 縦書きモーダル表示)

window.openHaikuModal = function(dateStr, haikus) {
    let modal = document.getElementById('haiku-modal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'haiku-modal';
        modal.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; opacity:0; transition:opacity 0.3s;";
        modal.innerHTML = `
            <div style="background:#fdfbf7; padding:50px 40px 40px 40px; border-radius:8px; max-width:80%; max-height:80%; overflow-x:auto; overflow-y:auto; display:flex; flex-direction:column; align-items:center; position:relative; box-shadow:0 10px 40px rgba(0,0,0,0.8); border: 1px solid #d4af37;">
                <button id="haiku-modal-close" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:28px; cursor:pointer; color:#888;">×</button>
                <div id="haiku-modal-date" style="font-family:'Shippori Mincho', serif; font-size:16px; color:#888; margin-bottom:30px; letter-spacing:2px; text-align:center; width:100%;"></div>
                
                <div id="haiku-modal-content" style="font-family:'Shippori Mincho', serif; font-size:18px; color:#2c3e50; writing-mode:vertical-rl; max-height:60vh; text-align:left;">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('haiku-modal-close').onclick = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.style.display = 'none', 300);
        };
        modal.onclick = (e) => {
            if(e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => modal.style.display = 'none', 300);
            }
        };
    }
    
    document.getElementById('haiku-modal-date').textContent = dateStr.replace(/-/g, '年').replace(/年(\d+)$/, '月$1日');
    const content = document.getElementById('haiku-modal-content');
    content.innerHTML = '';
    
    haikus.forEach((h, idx) => {
        const div = document.createElement('div');
        const borderStyle = idx === haikus.length - 1 ? "" : "border-left:1px dashed #ccc;";
        div.style = `margin-left:30px; padding-left:20px; ${borderStyle} line-height:2; letter-spacing:3px;`;
        div.textContent = h;
        content.appendChild(div);
    });
    
    modal.style.display = 'flex';
    void modal.offsetWidth; 
    modal.style.opacity = '1';
};
