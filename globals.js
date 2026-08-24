// globals.js (全体のデータと状態の管理) - 最終完成版

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

const loader = document.createElement('div');
loader.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,17,26,0.8); z-index:999; display:flex; justify-content:center; align-items:center; color:#d4af37; font-size:24px; font-weight:bold; backdrop-filter:blur(5px); display:none;";
loader.innerHTML = "観測データを統合中...";
document.body.appendChild(loader);

let svg, masterGroup, bgGroup;
let viewBox = { x: -479.3141, y: -208.5241, w: 2800, h: 2800 };
const cx = 920.6859;
const cy = 1191.4759;
const svgNS = "http://www.w3.org/2000/svg";

let currentTool = 'pointer'; 
let interactionMode = 'pan'; 
let activeBrush = "#38bdf8"; 
let globalRotation = 0; 

let calendarData = JSON.parse(localStorage.getItem('polarCalendarDataV27')) || {};
let concentricRings = []; 

// ▼ 雨（降水量）用の地名（検索ボックスの初期値） ▼
let currentLocationName = "今治"; 

// ＝★＝★＝★＝★＝★＝★＝★＝★＝★＝★＝
// ▼ 潮汐（CSV）用の観測所リスト ▼
// あなたが用意した「189箇所の正確な座標データ」を、ここの配列（[ ]の中身）と丸ごと差し替えてください。
// ＝★＝★＝★＝★＝★＝★＝★＝★＝★＝★＝
// ▼ 潮汐（CSV）用の観測所リスト（全241地点・正確な緯度経度注入版） ▼
const TIDE_STATIONS = [
    {code: 'WN', name: '稚内', lat: 45.41, lon: 141.67},
    {code: 'KE', name: '枝幸', lat: 44.93, lon: 142.58},
    {code: 'A0', name: '紋別', lat: 44.35, lon: 143.35},
    {code: 'AS', name: '網走', lat: 44.02, lon: 144.27},
    {code: 'A6', name: '羅臼', lat: 44.02, lon: 145.19},
    {code: 'NM', name: '根室', lat: 43.33, lon: 145.58},
    {code: 'HN', name: '花咲', lat: 43.28, lon: 145.58},
    {code: 'KP', name: '霧多布', lat: 43.07, lon: 145.12},
    {code: 'KR', name: '釧路', lat: 42.98, lon: 144.37},
    {code: 'B1', name: '十勝', lat: 42.28, lon: 143.32},
    {code: 'A9', name: '浦河', lat: 42.16, lon: 142.77},
    {code: 'C8', name: '苫小牧東', lat: 42.63, lon: 141.63},
    {code: 'TM', name: '苫小牧西', lat: 42.63, lon: 141.60},
    {code: 'SO', name: '白老', lat: 42.55, lon: 141.35},
    {code: 'A8', name: '室蘭', lat: 42.33, lon: 140.97},
    {code: 'A3', name: '森', lat: 42.10, lon: 140.57},
    {code: 'HK', name: '函館', lat: 41.77, lon: 140.72},
    {code: 'Q0', name: '吉岡', lat: 41.43, lon: 140.23},
    {code: 'A5', name: '松前', lat: 41.43, lon: 140.10},
    {code: 'ES', name: '江差', lat: 41.87, lon: 140.12},
    {code: 'ZP', name: '奥尻', lat: 42.17, lon: 139.43},
    {code: 'OR', name: '奥尻港', lat: 42.17, lon: 139.43},
    {code: 'SE', name: '瀬棚', lat: 42.45, lon: 139.85},
    {code: 'B6', name: '寿都', lat: 42.78, lon: 140.22},
    {code: 'B5', name: '岩内', lat: 42.98, lon: 140.52},
    {code: 'Z8', name: '忍路', lat: 43.20, lon: 140.85},
    {code: 'B3', name: '小樽', lat: 43.20, lon: 141.00},
    {code: 'IK', name: '石狩新港', lat: 43.25, lon: 141.28},
    {code: 'B2', name: '留萌', lat: 43.93, lon: 141.63},
    {code: 'F3', name: '沓形', lat: 45.18, lon: 141.13},
    {code: 'Q1', name: '竜飛', lat: 41.25, lon: 140.33},
    {code: 'AO', name: '青森', lat: 40.82, lon: 140.73},
    {code: 'ZA', name: '浅虫', lat: 40.88, lon: 140.87},
    {code: 'Q2', name: '大湊', lat: 41.27, lon: 141.20},
    {code: 'B4', name: '大間', lat: 41.53, lon: 140.90},
    {code: 'SH', name: '下北', lat: 41.38, lon: 141.20},
    {code: 'XS', name: 'むつ小川原', lat: 40.92, lon: 141.38},
    {code: 'HC', name: '八戸', lat: 40.53, lon: 141.52},
    {code: 'HG', name: '八戸港', lat: 40.53, lon: 141.52},
    {code: 'XT', name: '久慈', lat: 40.18, lon: 141.80},
    {code: 'MY', name: '宮古', lat: 39.63, lon: 141.97},
    {code: 'Q6', name: '釜石', lat: 39.27, lon: 141.88},
    {code: 'OF', name: '大船渡', lat: 39.05, lon: 141.72},
    {code: 'AY', name: '鮎川', lat: 38.30, lon: 141.50},
    {code: 'E6', name: '石巻', lat: 38.42, lon: 141.32},
    {code: 'SG', name: '塩釜', lat: 38.32, lon: 141.03},
    {code: 'SD', name: '仙台新港', lat: 38.27, lon: 141.02},
    {code: 'ZM', name: '相馬', lat: 37.83, lon: 140.95},
    {code: 'ON', name: '小名浜', lat: 36.93, lon: 140.90},
    {code: 'D1', name: '日立', lat: 36.48, lon: 140.62},
    {code: 'D3', name: '大洗', lat: 36.30, lon: 140.57},
    {code: 'D2', name: '鹿島', lat: 35.92, lon: 140.67},
    {code: 'CS', name: '銚子漁港', lat: 35.73, lon: 140.85},
    {code: 'ZF', name: '勝浦', lat: 35.13, lon: 140.30},
    {code: 'MR', name: '布良', lat: 34.92, lon: 139.82},
    {code: 'TT', name: '館山', lat: 34.98, lon: 139.85},
    {code: 'KZ', name: '木更津', lat: 35.38, lon: 139.90},
    {code: 'QL', name: '千葉', lat: 35.58, lon: 140.08},
    {code: 'CB', name: '千葉港', lat: 35.58, lon: 140.08},
    {code: 'TK', name: '東京', lat: 35.63, lon: 139.77},
    {code: 'KW', name: '川崎', lat: 35.52, lon: 139.75},
    {code: 'YK', name: '京浜港', lat: 35.52, lon: 139.75},
    {code: 'QS', name: '横浜', lat: 35.45, lon: 139.65},
    {code: 'HM', name: '本牧', lat: 35.42, lon: 139.67},
    {code: 'QN', name: '横須賀', lat: 35.28, lon: 139.65},
    {code: 'Z1', name: '油壺', lat: 35.15, lon: 139.62},
    {code: 'OK', name: '岡田', lat: 34.78, lon: 139.38},
    {code: 'QO', name: '神津島', lat: 34.20, lon: 139.13},
    {code: 'MJ', name: '三宅島（坪田）', lat: 34.07, lon: 139.55},
    {code: 'QP', name: '三宅島（阿古）', lat: 34.07, lon: 139.50},
    {code: 'D4', name: '八丈島（八重根）', lat: 33.10, lon: 139.77},
    {code: 'QQ', name: '八丈島（神湊）', lat: 33.12, lon: 139.80},
    {code: 'CC', name: '父島', lat: 27.08, lon: 142.18},
    {code: 'MC', name: '南鳥島', lat: 24.28, lon: 153.98},
    {code: 'D8', name: '湘南港', lat: 35.30, lon: 139.48},
    {code: 'OD', name: '小田原', lat: 35.23, lon: 139.15},
    {code: 'Z3', name: '伊東', lat: 34.97, lon: 139.10},
    {code: 'D6', name: '下田', lat: 34.67, lon: 138.95},
    {code: 'QK', name: '南伊豆', lat: 34.60, lon: 138.83},
    {code: 'G9', name: '石廊崎', lat: 34.60, lon: 138.83},
    {code: 'Z4', name: '田子', lat: 34.80, lon: 138.75},
    {code: 'UC', name: '内浦', lat: 35.02, lon: 138.88},
    {code: 'SM', name: '清水港', lat: 35.00, lon: 138.50},
    {code: 'Z5', name: '焼津', lat: 34.87, lon: 138.33},
    {code: 'OM', name: '御前崎', lat: 34.60, lon: 138.22},
    {code: 'MI', name: '舞阪', lat: 34.68, lon: 137.60},
    {code: 'I4', name: '赤羽根', lat: 34.60, lon: 137.18},
    {code: 'G4', name: '三河', lat: 34.78, lon: 137.28},
    {code: 'G5', name: '形原', lat: 34.78, lon: 137.18},
    {code: 'G8', 'name': '衣浦', lat: 34.88, lon: 136.95},
    {code: 'ZD', name: '鬼崎', lat: 34.90, lon: 136.83},
    {code: 'NG', name: '名古屋', lat: 35.08, lon: 136.88},
    {code: 'G3', name: '四日市港', lat: 34.95, lon: 136.63},
    {code: 'TB', name: '鳥羽', lat: 34.48, lon: 136.85},
    {code: 'OW', name: '尾鷲', lat: 34.07, lon: 136.20},
    {code: 'KN', name: '熊野', lat: 33.88, lon: 136.10},
    {code: 'UR', name: '浦神', lat: 33.55, lon: 135.92},
    {code: 'KS', name: '串本', lat: 33.47, lon: 135.77},
    {code: 'SR', name: '白浜', lat: 33.68, lon: 135.33},
    {code: 'GB', name: '御坊', lat: 33.88, lon: 135.15},
    {code: 'H1', name: '下津', lat: 34.12, lon: 135.13},
    {code: 'Z9', name: '海南', lat: 34.15, lon: 135.20},
    {code: 'WY', name: '和歌山', lat: 34.22, lon: 135.13},
    {code: 'TN', name: '淡輪', lat: 34.33, lon: 135.18},
    {code: 'KK', name: '関空島', lat: 34.43, lon: 135.23},
    {code: 'J2', name: '岸和田', lat: 34.47, lon: 135.37},
    {code: 'IO', name: '泉大津', lat: 34.50, lon: 135.40},
    {code: 'SI', name: '堺', lat: 34.58, lon: 135.45},
    {code: 'OS', name: '大阪', lat: 34.65, lon: 135.43},
    {code: 'AM', name: '尼崎', lat: 34.70, lon: 135.40},
    {code: 'J5', name: '西宮', lat: 34.72, lon: 135.33},
    {code: 'KB', name: '神戸', lat: 34.67, lon: 135.20},
    {code: 'AK', name: '明石', lat: 34.63, lon: 134.98},
    {code: 'ST', name: '洲本', lat: 34.33, lon: 134.90},
    {code: 'EI', name: '江井', lat: 34.47, lon: 134.82},
    {code: 'K1', name: '姫路（飾磨）', lat: 34.78, lon: 134.65},
    {code: 'SB', name: '三蟠', lat: 34.58, lon: 133.95},
    {code: 'UN', name: '宇野', lat: 34.48, lon: 133.95},
    {code: 'MM', name: '水島', lat: 34.50, lon: 133.75},
    {code: 'LG', name: '乙島', lat: 34.50, lon: 133.67},
    {code: 'IZ', name: '糸崎', lat: 34.38, lon: 133.10},
    {code: 'TH', name: '竹原', lat: 34.33, lon: 132.90},
    {code: 'Q9', name: '呉', lat: 34.23, lon: 132.55},
    {code: 'Q8', name: '広島', lat: 34.35, lon: 132.45},
    {code: 'QA', name: '徳山', lat: 34.03, lon: 131.80},
    {code: 'J9', name: '三田尻', lat: 34.02, lon: 131.60},
    {code: 'WH', name: '宇部', lat: 33.93, lon: 131.23},
    {code: 'CF', name: '長府', lat: 33.98, lon: 130.98},
    {code: 'A1', name: '弟子待', lat: 33.93, lon: 130.93},
    {code: 'DS', name: '下関', lat: 33.95, lon: 130.93},
    {code: 'TI', name: '田ノ首', lat: 33.93, lon: 130.93},
    {code: 'OH', name: '大山の鼻', lat: 33.92, lon: 130.92},
    {code: 'HR', name: '南風泊', lat: 33.95, lon: 130.90},
    {code: 'MT', name: '松山', lat: 33.85, lon: 132.70},
    {code: 'M3', name: '波止浜', lat: 34.10, lon: 132.97},
    {code: 'M0', name: '今治市小島', lat: 34.10, lon: 132.98},
    {code: 'M1', name: '来島航路', lat: 34.12, lon: 133.00},
    {code: 'L0', name: '今治', lat: 34.07, lon: 133.02},
    {code: 'NI', name: '新居浜', lat: 33.97, lon: 133.27},
    {code: 'L8', name: '伊予三島', lat: 33.98, lon: 133.55},
    {code: 'TX', name: '多度津', lat: 34.27, lon: 133.75},
    {code: 'AX', name: '青木', lat: 34.30, lon: 133.80},
    {code: 'J8', name: '与島', lat: 34.38, lon: 133.82},
    {code: 'TA', name: '高松', lat: 34.35, lon: 134.05},
    {code: 'KM', name: '小松島', lat: 34.00, lon: 134.60},
    {code: 'J6', name: '橘', lat: 33.87, lon: 134.63},
    {code: 'AW', name: '阿波由岐', lat: 33.72, lon: 134.57},
    {code: 'HW', name: '日和佐', lat: 33.72, lon: 134.53},
    {code: 'L7', name: '甲浦', lat: 33.53, lon: 134.30},
    {code: 'MU', name: '室戸岬', lat: 33.25, lon: 134.17},
    {code: 'KC', name: '高知', lat: 33.52, lon: 133.55},
    {code: 'V7', name: '須崎', lat: 33.38, lon: 133.28},
    {code: 'ZH', name: '久礼', lat: 33.32, lon: 133.22},
    {code: 'L6', name: '高知下田', lat: 32.95, lon: 132.97},
    {code: 'TS', name: '土佐清水', lat: 32.78, lon: 132.95},
    {code: 'SU', name: '片島', lat: 32.93, lon: 132.72},
    {code: 'UW', name: '宇和島', lat: 33.23, lon: 132.55},
    {code: 'N1', name: '日明', lat: 33.90, lon: 130.87},
    {code: 'N0', name: '砂津', lat: 33.88, lon: 130.88},
    {code: 'MO', name: '門司', lat: 33.95, lon: 130.95},
    {code: 'AH', name: '青浜', lat: 33.90, lon: 131.02},
    {code: 'O3', name: '苅田', lat: 33.78, lon: 131.00},
    {code: 'BP', name: '別府', lat: 33.28, lon: 131.50},
    {code: 'QC', name: '大分', lat: 33.25, lon: 131.62},
    {code: 'X5', name: '佐伯', lat: 32.97, lon: 131.90},
    {code: 'Z6', name: '細島', lat: 32.42, lon: 131.67},
    {code: 'MG', name: '宮崎', lat: 31.92, lon: 131.45},
    {code: 'AB', name: '油津', lat: 31.58, lon: 131.40},
    {code: 'X6', name: '志布志', lat: 31.47, lon: 131.10},
    {code: 'QG', name: '大泊', lat: 31.02, lon: 130.67},
    {code: 'KG', name: '鹿児島', lat: 31.60, lon: 130.57},
    {code: 'MK', name: '枕崎', lat: 31.27, lon: 130.30},
    {code: 'ZJ', name: '阿久根', lat: 32.02, lon: 130.18},
    {code: 'QH', name: '西之表', lat: 30.73, lon: 131.00},
    {code: 'TJ', name: '種子島', lat: 30.50, lon: 130.95},
    {code: 'QI', name: '中之島', lat: 29.83, lon: 129.87},
    {code: 'QJ', name: '名瀬', lat: 28.38, lon: 129.50},
    {code: 'O9', name: '奄美', lat: 28.38, lon: 129.50},
    {code: 'NK', name: '中城湾港', lat: 26.30, lon: 127.82},
    {code: 'ZO', name: '沖縄', lat: 26.33, lon: 127.80},
    {code: 'NH', name: '那覇', lat: 26.22, lon: 127.67},
    {code: 'DJ', name: '南大東', lat: 25.83, lon: 131.23},
    {code: 'R1', name: '平良', lat: 24.80, lon: 125.28},
    {code: 'IS', name: '石垣', lat: 24.33, lon: 124.15},
    {code: 'IJ', name: '西表', lat: 24.40, lon: 123.77},
    {code: 'YJ', name: '与那国', lat: 24.45, lon: 122.98},
    {code: 'O7', name: '水俣', lat: 32.20, lon: 130.40},
    {code: 'O5', name: '八代', lat: 32.52, lon: 130.58},
    {code: 'HS', name: '本渡瀬戸', lat: 32.45, lon: 130.20},
    {code: 'RH', name: '苓北', lat: 32.52, lon: 130.03},
    {code: 'MS', name: '三角', lat: 32.62, lon: 130.47},
    {code: 'KU', name: '熊本', lat: 32.78, lon: 130.60},
    {code: 'O6', name: '大牟田', lat: 33.02, lon: 130.42},
    {code: 'OU', name: '大浦', lat: 33.03, lon: 130.22},
    {code: 'KT', name: '口之津', lat: 32.60, lon: 130.18},
    {code: 'NS', name: '長崎', lat: 32.73, lon: 129.87},
    {code: 'KO', name: '皇后', lat: 32.73, lon: 129.87},
    {code: 'FE', name: '福江', lat: 32.70, lon: 128.85},
    {code: 'QD', name: '佐世保', lat: 33.15, lon: 129.72},
    {code: 'X2', name: '平戸瀬戸', lat: 33.37, lon: 129.55},
    {code: 'ZL', name: '仮屋', lat: 33.52, lon: 129.83},
    {code: 'KA', name: '唐津', lat: 33.45, lon: 129.97},
    {code: 'QF', name: '博多', lat: 33.60, lon: 130.40},
    {code: 'X3', name: '郷ノ浦', lat: 33.75, lon: 129.68},
    {code: 'QE', name: '厳原', lat: 34.20, lon: 129.28},
    {code: 'O1', name: '対馬', lat: 34.20, lon: 129.28},
    {code: 'N5', name: '対馬比田勝', lat: 34.65, lon: 129.47},
    {code: 'K5', name: '萩', lat: 34.42, lon: 131.40},
    {code: 'ZK', name: '須佐', lat: 34.62, lon: 131.60},
    {code: 'HA', name: '浜田', lat: 34.90, lon: 132.05},
    {code: 'SK', name: '境', lat: 35.53, lon: 133.22},
    {code: 'SA', name: '西郷', lat: 36.20, lon: 133.33},
    {code: 'ZE', name: '田後', lat: 35.58, lon: 134.32},
    {code: 'T6', name: '津居山', lat: 35.65, lon: 134.82},
    {code: 'T2', name: '宮津', lat: 35.53, lon: 135.20},
    {code: 'MZ', name: '舞鶴', lat: 35.45, lon: 135.33},
    {code: 'XM', name: '敦賀', lat: 35.65, lon: 136.07},
    {code: 'ZG', name: '三国', lat: 36.22, lon: 136.13},
    {code: 'T1', name: '金沢', lat: 36.58, lon: 136.60},
    {code: 'Z7', name: '輪島', lat: 37.40, lon: 136.90},
    {code: 'SZ', name: '能登', lat: 37.30, lon: 137.28},
    {code: 'XO', name: '七尾', lat: 37.05, lon: 136.97},
    {code: 'XQ', name: '伏木富山', lat: 36.78, lon: 137.05},
    {code: 'SN', name: '新湊', lat: 36.78, lon: 137.08},
    {code: 'TY', name: '富山', lat: 36.75, lon: 137.23},
    {code: 'I7', name: '生地', lat: 36.88, lon: 137.42},
    {code: 'T3', name: '直江津', lat: 37.15, lon: 138.25},
    {code: 'ZC', name: '柏崎', lat: 37.37, lon: 138.55},
    {code: 'S6', name: '新潟西港', lat: 37.95, lon: 139.07},
    {code: 'I5', name: '新潟東港', lat: 37.98, lon: 139.23},
    {code: 'ZN', name: '小木', lat: 37.82, lon: 138.28},
    {code: 'RZ', name: '両津', lat: 38.08, lon: 138.43},
    {code: 'S0', name: '佐渡', lat: 38.08, lon: 138.43},
    {code: 'QR', name: '粟島', lat: 38.47, lon: 139.25},
    {code: 'ZB', name: '鼠ヶ関', lat: 38.55, lon: 139.55},
    {code: 'S9', name: '酒田', lat: 38.93, lon: 139.82},
    {code: 'ZQ', name: '飛島', lat: 39.20, lon: 139.55},
    {code: 'S1', name: '秋田', lat: 39.75, lon: 140.05},
    {code: 'S2', name: '船川港', lat: 39.87, lon: 139.85},
    {code: 'ZI', name: '男鹿', lat: 39.87, lon: 139.85},
    {code: 'FK', name: '深浦', lat: 40.65, lon: 139.93}
];

let currentTideStationIndex = TIDE_STATIONS.findIndex(s => s.code === 'D8');
if (currentTideStationIndex === -1) currentTideStationIndex = 0;

const baseDate = new Date(2026, 7, 13);
const synodicMonth = 29.530589;
let currentCycle = 0; 
let currentStartSegment = 0; 

let localRainData = {};
let apiRainData = [];
let highLowTidePoints = []; 

// ▼ 天文学計算用エンジン (SunCalc 完全数学的修正版) ▼
const PI = Math.PI, rad = PI / 180.0, e = rad * 23.4397;
function toJulian(date) { return date.valueOf() / 86400000 - 0.5 + 2440588; }
function fromJulian(j) { return new Date((j + 0.5 - 2440588) * 86400000); }
function toDays(date) { return toJulian(date) - 2451545; }
function rightAscension(l, b) { return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)); }
function declination(l, b) { return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)); }
function azimuth(H, phi, dec) { return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)); }
function altitude(H, phi, dec) { return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)); }
function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }
function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }
function eclipticLongitude(M) {
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), P = rad * 102.9372;
    return M + C + P + PI;
}
function sunCoords(d) {
    var M = solarMeanAnomaly(d), L = eclipticLongitude(M);
    return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

function moonCoords(d) {
    var L = rad * (218.316 + 13.176396 * d);
    var M = rad * (134.963 + 13.064993 * d);
    var F = rad * (93.272 + 13.229350 * d);
    var l = L + rad * 6.289 * Math.sin(M);
    var b = rad * 5.128 * Math.sin(F);
    var dt = 385001 - 20905 * Math.cos(M);
    return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

function getTimes(date, lat, lng, height) {
    var lw = rad * -lng, phi = rad * lat, d = toDays(date);
    var n = Math.round(d - 0.0009 - lw / (2 * PI));
    var h0 = -0.0053 - 2.076 * Math.sqrt(height || 0) / 60;
    var c = sunCoords(d + n);
    var val = (Math.sin(h0) - Math.sin(phi) * Math.sin(c.dec)) / (Math.cos(phi) * Math.cos(c.dec));
    if (val > 1) val = 1; if (val < -1) val = -1;
    var H = Math.acos(val);
    var Jnoon = 2451545 + 0.0009 + lw / (2 * PI) + n; 
    var Jset = Jnoon + H / (2 * PI), Jrise = Jnoon - H / (2 * PI);
    return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset) };
}

function getMoonTimes(date, lat, lng) {
    var t = new Date(date); t.setHours(0, 0, 0, 0);
    var hc = 0.133 * rad, h0 = getMoonPosition(t, lat, lng).altitude - hc, h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;
    for (var i = 1; i <= 24; i += 2) {
        h1 = getMoonPosition(new Date(t.valueOf() + i * 3600000), lat, lng).altitude - hc;
        h2 = getMoonPosition(new Date(t.valueOf() + (i + 1) * 3600000), lat, lng).altitude - hc;
        
        a = (h0 + h2) / 2 - h1; 
        b = (h2 - h0) / 2; 
        roots = 0;

        if (a === 0) {
            if (b !== 0) {
                x1 = -h1 / b;
                if (Math.abs(x1) <= 1) roots++;
            }
        } else {
            xe = -b / (2 * a); 
            ye = (a * xe + b) * xe + h1; 
            d = b * b - 4 * a * h1; 
            if (d >= 0) {
                dx = Math.sqrt(d) / (Math.abs(a) * 2);
                x1 = xe - dx; 
                x2 = xe + dx;
                if (Math.abs(x1) <= 1) roots++;
                if (Math.abs(x2) <= 1) roots++;
                if (x1 < -1) x1 = x2;
            }
        }

        if (roots === 1) {
            if (h0 < 0) rise = i + x1; else set = i + x1;
        } else if (roots === 2) {
            if (ye < 0) { rise = i + x2; set = i + x1; }
            else { rise = i + x1; set = i + x2; }
        }
        if (rise && set) break; 
        h0 = h2;
    }
    var result = {};
    if (rise) result.rise = new Date(t.valueOf() + rise * 3600000);
    if (set) result.set = new Date(t.valueOf() + set * 3600000);
    return result;
}

function getMoonPosition(date, lat, lng) {
    var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = moonCoords(d), H = siderealTime(d, lw) - c.ra;
    var h = altitude(H, phi, c.dec), pa = Math.atan2(Math.sin(H), Math.tan(phi) * Math.cos(c.dec) - Math.sin(c.dec) * Math.cos(H));
    h = h + rad * 0.017 / Math.tan(h + rad * 10.26 / (h + rad * 5.10));
    return { azimuth: azimuth(H, phi, c.dec), altitude: h, distance: c.dist, parallacticAngle: pa };
}

// UIアイコン群
const iconPan = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>`;
const iconRotate = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
const iconPaint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
const iconErase = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"/><line x1="6" y1="11" x2="15" y2="20"/></svg>`;
const iconTrash = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconHome = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
const iconPrint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`;
const iconDrop = `<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
