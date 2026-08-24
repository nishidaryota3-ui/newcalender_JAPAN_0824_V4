// js/draw/svg-utils.js (SVG極座標幾何学計算 & 要素生成ユーティリティ)

/**
 * 極座標 (角度・半径) を 直交座標 (x, y) に変換
 * @param {number} centerX - 円の中心X
 * @param {number} centerY - 円の中心Y
 * @param {number} radius - 半径
 * @param {number} angleInDegrees - 角度(度, 12時方向が0度)
 * @returns {{ x: number, y: number }}
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

/**
 * SVG名前空間の要素を生成し、属性とテキストを設定
 * @param {string} tag - SVGタグ名
 * @param {Object} attrs - 属性オブジェクト
 * @param {string} [text=null] - テキスト内容
 * @returns {SVGElement}
 */
function createSVGElem(tag, attrs = {}, text = null) {
    const el = document.createElementNS(svgNS, tag);
    for (const k in attrs) {
        if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) {
            el.setAttribute(k, attrs[k]);
        }
    }
    if (text !== null) el.textContent = text;
    return el;
}

/**
 * レイヤースタイル設定オブジェクトからSVG属性オブジェクトを生成
 * @param {Object} st - スタイル設定オブジェクト
 * @returns {Object} SVG属性
 */
function getStyleAttrs(st) {
    if (!st) return {};
    const attrs = {
        fill: st.fill,
        "font-size": st.fontSize ? st.fontSize + "px" : null,
        "font-family": st.fontFamily,
        opacity: st.opacity
    };
    if (st.fontWeight === "bold") attrs["font-weight"] = "bold";
    if (st.strokeWidth > 0) {
        attrs.stroke = st.stroke;
        attrs["stroke-width"] = st.strokeWidth;
        attrs["stroke-linejoin"] = "round";
        attrs["paint-order"] = "stroke fill";
    }
    return attrs;
}

/**
 * スタイル付きSVGテキスト要素を生成
 * @param {Object} st - スタイル設定
 * @param {Object} attrs - 追加SVG属性
 * @param {string} [text=null] - テキスト
 * @returns {SVGTextElement}
 */
function createStyledText(st, attrs = {}, text = null) {
    return createSVGElem("text", { ...getStyleAttrs(st), ...attrs }, text);
}

/**
 * 現在のレイヤースタイルを取得（個別月設定 -> グローバル設定 -> デフォルト設定のフォールバック）
 * @param {string} layerKey - レイヤー名
 * @returns {Object} スタイル設定オブジェクト
 */
function getLayerStyle(layerKey) {
    return (window.layerSettings && window.layerSettings[layerKey]) ||
           (window.defaultLayerSettings && window.defaultLayerSettings[layerKey]) || {};
}

/**
 * 日インデックスから該当日の開始角度(度)を算出
 * @param {number} dayIndex - 0〜29日目
 * @returns {number} 角度(度)
 */
function getDayAngle(dayIndex) {
    return ((currentStartSegment + dayIndex * SEGMENTS_PER_DAY) % TOTAL_SEGMENTS) * DEGREES_PER_SEGMENT;
}

/**
 * 内径・外径・開始角・終了角から扇形 (Annular Sector) の SVG パス文字列 (d) を生成
 * @param {number} rIn - 内径
 * @param {number} rOut - 外径
 * @param {number} startAngle - 開始角度(度)
 * @param {number} endAngle - 終了角度(度)
 * @returns {string} SVG Path d 文字列
 */
function getSectorPathD(rIn, rOut, startAngle, endAngle) {
    const startIn = polarToCartesian(cx, cy, rIn, endAngle);
    const endIn = polarToCartesian(cx, cy, rIn, startAngle);
    const startOut = polarToCartesian(cx, cy, rOut, endAngle);
    const endOut = polarToCartesian(cx, cy, rOut, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", startOut.x, startOut.y, "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y, "L", endIn.x, endIn.y, "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y, "Z"].join(" ");
}

/**
 * 距離(半径)から所属する同心円階層の情報を取得
 * @param {number} distance 
 * @returns {{ layerId: string, name: string, rIn: number, rOut: number } | null}
 */
function getRingInfo(distance) {
    if (concentricRings.length === 0) return null;
    for (let i = 0; i < concentricRings.length - 1; i++) {
        if (distance > concentricRings[i] && distance <= concentricRings[i+1]) {
            return { layerId: `layer_${i}`, name: `階層 ${i+1}`, rIn: concentricRings[i], rOut: concentricRings[i+1] };
        }
    }
    return null;
}

/**
 * SVG defs 内に文字描画用の円弧パスを生成
 */
function createTextArc(defs, id, r, angStart, angEnd) {
    const p1 = polarToCartesian(cx, cy, r, angStart);
    const p2 = polarToCartesian(cx, cy, r, angEnd);
    if(defs) defs.appendChild(createSVGElem("path", { id: id, d: `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}` }));
}

/**
 * 円弧パスに沿ってテキストを描画
 */
function drawSingleTextOnPath(pathId, textContent, styleConfig, rVal, targetGroup) {
    if (!textContent) return;
    const textObj = createStyledText(styleConfig);
    const textPath = createSVGElem("textPath", { href: `#${pathId}`, startOffset: "50%", "text-anchor": "middle" }, textContent);
    const maxLen = 2 * Math.PI * rVal * (11 / 360);
    if (textContent.length * parseFloat(styleConfig.fontSize) > maxLen * 0.9) {
        textPath.setAttribute("textLength", maxLen * 0.9);
        textPath.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
    textObj.appendChild(textPath);
    targetGroup.appendChild(textObj);
}

/**
 * 天体・出没ピンの形状を描画
 */
function drawPinShape(g, shapeType, size, st) {
    if (shapeType === "none") return;
    const fillCol = st.fill || "none";
    const strokeCol = st.stroke || "none";
    const strokeW = st.strokeWidth !== undefined ? st.strokeWidth : 1.2;
    let shapeEl = null;

    if (shapeType === "circle") {
        shapeEl = createSVGElem("circle", { cx: 0, cy: 0, r: size });
    } else if (shapeType === "halfRight") {
        shapeEl = createSVGElem("g");
        shapeEl.appendChild(createSVGElem("path", { d: `M 0,-${size} A ${size},${size} 0 0,1 0,${size} Z`, fill: fillCol, stroke: "none" }));
        shapeEl.appendChild(createSVGElem("circle", { cx: 0, cy: 0, r: size, fill: "none", stroke: strokeCol, "stroke-width": strokeW }));
    } else if (shapeType === "halfLeft") {
        shapeEl = createSVGElem("g");
        shapeEl.appendChild(createSVGElem("path", { d: `M 0,-${size} A ${size},${size} 0 0,0 0,${size} Z`, fill: fillCol, stroke: "none" }));
        shapeEl.appendChild(createSVGElem("circle", { cx: 0, cy: 0, r: size, fill: "none", stroke: strokeCol, "stroke-width": strokeW }));
    } else if (shapeType === "rect") {
        shapeEl = createSVGElem("rect", { x: -size, y: -size, width: size*2, height: size*2, rx: size*0.2 });
    } else if (shapeType === "triangle") {
        shapeEl = createSVGElem("polygon", { points: `0,-${size*1.2} ${size*1.1},${size*0.8} -${size*1.1},${size*0.8}` });
    } else if (shapeType === "rhombus") {
        shapeEl = createSVGElem("polygon", { points: `0,-${size*1.5} ${size},0 0,${size*1.5} -${size},0` });
    } else if (shapeType === "star") {
        let pts = "";
        for(let k=0; k<10; k++) pts += `${k%2===0 ? size*1.2 : size*0.5 * Math.sin(k*36*Math.PI/180)},${-(k%2===0 ? size*1.2 : size*0.5) * Math.cos(k*36*Math.PI/180)} `;
        shapeEl = createSVGElem("polygon", { points: pts.trim() });
    } else if (shapeType === "arrowUp") {
        shapeEl = createSVGElem("g");
        shapeEl.appendChild(createSVGElem("circle", { cx: 0, cy: 0, r: size, fill: fillCol, stroke: strokeCol, "stroke-width": strokeW }));
        shapeEl.appendChild(createSVGElem("path", { d: `M0,${size*0.5} L0,-${size*0.5} M-${size*0.4},-0.1 L0,-${size*0.5} L${size*0.4},-0.1`, fill: "none", stroke: strokeCol, "stroke-width": Math.max(0.5, strokeW * 0.8), "stroke-linecap": "round", "stroke-linejoin": "round" }));
    } else if (shapeType === "arrowDown") {
        shapeEl = createSVGElem("g");
        shapeEl.appendChild(createSVGElem("circle", { cx: 0, cy: 0, r: size, fill: fillCol, stroke: strokeCol, "stroke-width": strokeW }));
        shapeEl.appendChild(createSVGElem("path", { d: `M0,-${size*0.5} L0,${size*0.5} M-${size*0.4},0.1 L0,${size*0.5} L${size*0.4},0.1`, fill: "none", stroke: strokeCol, "stroke-width": Math.max(0.5, strokeW * 0.8), "stroke-linecap": "round", "stroke-linejoin": "round" }));
    }

    if (shapeEl) {
        if (shapeEl.tagName.toLowerCase() !== 'g') {
            shapeEl.setAttribute("fill", fillCol);
            shapeEl.setAttribute("stroke", strokeCol);
            shapeEl.setAttribute("stroke-width", strokeW);
        }
        g.appendChild(shapeEl);
    }
}
