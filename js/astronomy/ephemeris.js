// js/astronomy/ephemeris.js (日の出・日の入り・月の出・月の入り・月位置計算モジュール)

const PI = Math.PI;
const rad = PI / 180.0;
const e = rad * EARTH_OBLIQUITY_DEG;

/**
 * Date オブジェクトからユリウス日を算出
 */
function toJulian(date) { 
    return date.valueOf() / MS_PER_DAY - 0.5 + 2440588; 
}

/**
 * ユリウス日から Date オブジェクトを復元
 */
function fromJulian(j) { 
    return new Date((j + 0.5 - 2440588) * MS_PER_DAY); 
}

/**
 * J2000.0 からの経過日数を算出
 */
function toDays(date) { 
    return toJulian(date) - J2000_EPOCH_JD; 
}

function rightAscension(l, b) { 
    return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)); 
}

function declination(l, b) { 
    return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)); 
}

function azimuth(H, phi, dec) { 
    return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)); 
}

function altitude(H, phi, dec) { 
    return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)); 
}

function siderealTime(d, lw) { 
    return rad * (280.16 + 360.9856235 * d) - lw; 
}

function solarMeanAnomaly(d) { 
    return rad * (357.5291 + 0.98560028 * d); 
}

function eclipticLongitude(M) {
    const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const P = rad * 102.9372;
    return M + C + P + PI;
}

function sunCoords(d) {
    const M = solarMeanAnomaly(d);
    const L = eclipticLongitude(M);
    return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

function moonCoords(d) {
    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.229350 * d);
    const l = L + rad * 6.289 * Math.sin(M);
    const b = rad * 5.128 * Math.sin(F);
    const dt = 385001 - 20905 * Math.cos(M);
    return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

/**
 * 指定地点の日の出・日の入り時刻を計算
 * @param {Date} date 
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @param {number} [height=0] - 標高(m)
 * @returns {{ sunrise: Date, sunset: Date }}
 */
function getTimes(date, lat, lng, height) {
    const lw = rad * -lng, phi = rad * lat, d = toDays(date);
    const n = Math.round(d - 0.0009 - lw / (2 * PI));
    const h0 = -0.0053 - 2.076 * Math.sqrt(height || 0) / 60;
    const c = sunCoords(d + n);
    let val = (Math.sin(h0) - Math.sin(phi) * Math.sin(c.dec)) / (Math.cos(phi) * Math.cos(c.dec));
    if (val > 1) val = 1; 
    if (val < -1) val = -1;
    const H = Math.acos(val);
    const Jnoon = J2000_EPOCH_JD + 0.0009 + lw / (2 * PI) + n; 
    const Jset = Jnoon + H / (2 * PI), Jrise = Jnoon - H / (2 * PI);
    return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset) };
}

/**
 * 指定地点の月の出・月の入り時刻を計算
 * @param {Date} date 
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @returns {{ rise?: Date, set?: Date }}
 */
function getMoonTimes(date, lat, lng) {
    const t = new Date(date); 
    t.setHours(0, 0, 0, 0);
    const hc = 0.133 * rad;
    let h0 = getMoonPosition(t, lat, lng).altitude - hc, h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;
    for (let i = 1; i <= 24; i += 2) {
        h1 = getMoonPosition(new Date(t.valueOf() + i * MS_PER_HOUR), lat, lng).altitude - hc;
        h2 = getMoonPosition(new Date(t.valueOf() + (i + 1) * MS_PER_HOUR), lat, lng).altitude - hc;
        
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
    const result = {};
    if (rise) result.rise = new Date(t.valueOf() + rise * MS_PER_HOUR);
    if (set) result.set = new Date(t.valueOf() + set * MS_PER_HOUR);
    return result;
}

/**
 * 指定日時の月の方位角・高度・距離を計算
 * @param {Date} date 
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 */
function getMoonPosition(date, lat, lng) {
    const lw = rad * -lng, phi = rad * lat, d = toDays(date), c = moonCoords(d), H = siderealTime(d, lw) - c.ra;
    let h = altitude(H, phi, c.dec);
    const pa = Math.atan2(Math.sin(H), Math.tan(phi) * Math.cos(c.dec) - Math.sin(c.dec) * Math.cos(H));
    h = h + rad * 0.017 / Math.tan(h + rad * 10.26 / (h + rad * 5.10));
    return { azimuth: azimuth(H, phi, c.dec), altitude: h, distance: c.dist, parallacticAngle: pa };
}
