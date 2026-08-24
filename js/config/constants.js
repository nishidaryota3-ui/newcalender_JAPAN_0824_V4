// js/config/constants.js (プロジェクト共通定数・基本幾何学設定)

// --- 時間定数 ---
const MS_PER_HOUR = 3_600_000;          // 1時間 = 3,600,000ミリ秒
const MS_PER_DAY  = 86_400_000;         // 1日   = 86,400,000ミリ秒
const MS_PER_HALF_DAY = 43_200_000;     // 12時間

// --- 朔望月サイクル定数 ---
const CYCLE_DAYS = 30;                  // 1サイクルの表示日数
const TOTAL_SEGMENTS = 120;             // 1周 = 120セグメント (30日 × 4)
const SEGMENTS_PER_DAY = 4;             // 1日 = 4セグメント (6時間ごと)
const TOTAL_CYCLE_HOURS = 720;          // 1サイクル = 720時間 (30日 × 24)
const synodicMonth = 29.530589;         // 平均朔望月の日数
const baseDate = new Date(2026, 7, 13); // 基準新月日 (2026年8月13日)

// --- 角度定数 ---
const DEGREES_PER_SEGMENT = 3;          // 1セグメント = 3° (360° / 120)
const DEGREES_PER_DAY = 12;             // 1日 = 12° (3° × 4セグメント)
const DEGREES_PER_HOUR = 0.5;           // 1時間 = 0.5° (360° / 720時間)
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// --- 同心円リングのインデックス定数 ---
const RING_IDX_DATA_BAND_MIN = 16;      // 潮汐・降水グラフ帯の内側
const RING_IDX_TIME_BAND_MIN = 19;      // 時間マーカー帯の内側
const RING_IDX_TIME_BAND_MAX = 20;      // 時間マーカー帯の外側
const RING_IDX_DATA_BAND_MAX = 22;      // 潮汐・降水グラフ帯の外側
const RING_IDX_EVENT_TRACKS_START = 23; // イベントトラック開始 (階層24-29)
const MIN_RINGS_TIME = 20;              // 時間レイヤー描画に必要な最小リング数
const MIN_RINGS_DATA = 23;              // データレイヤー描画に必要な最小リング数
const MIN_RINGS_FULL = 30;              // 全レイヤー描画に必要な最小リング数

// --- LocalStorage キー ---
const STORAGE_KEY_DATA     = 'polarCalendarDataV27';
const STORAGE_KEY_SETTINGS = 'polarCalendarSettingsV5';
const STORAGE_KEY_THEMES   = 'polarCalendarThemesV1';

// --- 天文学定数 (ユリウス日・J2000.0) ---
const JD_UNIX_EPOCH = 2440587.5;        // Unix epoch (1970-01-01) のユリウス日
const J2000_EPOCH_JD = 2451545.0;       // J2000.0 のユリウス日
const EARTH_OBLIQUITY_DEG = 23.4397;    // 地球の軸傾斜角 (度)

// --- 幾何学・SVG原点 ---
const cx = 920.6859;
const cy = 1191.4759;
const svgNS = "http://www.w3.org/2000/svg";

// --- グローバルDOM参照 & 状態変数 ---
const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

let svg, masterGroup, bgGroup;
let viewBox = { x: -479.3141, y: -208.5241, w: 2800, h: 2800 };
let currentTool = 'pointer'; 
let interactionMode = 'pan'; 
let activeBrush = "#38bdf8"; 
let globalRotation = 0; 
let calendarData = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA)) || {};
let concentricRings = []; 
let currentLocationName = "今治"; 
let currentCycle = 0; 
let currentStartSegment = 0; 
let localRainData = {};
let apiRainData = [];
let highLowTidePoints = []; 

// --- UIアイコン群 ---
const iconPan = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>`;
const iconPaint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
const iconErase = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"/><line x1="6" y1="11" x2="15" y2="20"/></svg>`;
const iconTrash = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconHome = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
const iconPrint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`;
const iconDrop = `<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
