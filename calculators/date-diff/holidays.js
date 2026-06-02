/**
 * Праздничные дни (РБ): фиксированные ежегодно + переменные по годам (2020–2049).
 */

/** [month 1–12, day] */
export const FIXED_HOLIDAY_MD = [
  [1, 1],
  [1, 2],
  [1, 7],
  [3, 8],
  [5, 1],
  [5, 9],
  [7, 3],
  [11, 7],
  [12, 25],
];

/** ISO-даты переменных праздников по годам */
export const VARIABLE_HOLIDAYS_BY_YEAR = {
  2020: ['2020-04-12', '2020-04-19'],
  2021: ['2021-04-04', '2021-05-02'],
  2022: ['2022-04-17', '2022-04-24'],
  2023: ['2023-04-09', '2023-04-16'],
  2024: ['2024-03-31', '2024-05-05'],
  2025: ['2025-04-20'],
  2026: ['2026-04-05', '2026-04-12'],
  2027: ['2027-03-28', '2027-05-02'],
  2028: ['2028-04-16'],
  2029: ['2029-04-01', '2029-04-08'],
  2030: ['2030-04-21', '2030-04-28'],
  2031: ['2031-04-13'],
  2032: ['2032-03-28', '2032-05-02'],
  2033: ['2033-04-17', '2033-04-24'],
  2034: ['2034-04-09'],
  2035: ['2035-03-25', '2035-04-29'],
  2036: ['2036-04-13', '2036-04-20'],
  2037: ['2037-04-05'],
  2038: ['2038-04-25'],
  2039: ['2039-04-10', '2039-04-17'],
  2040: ['2040-04-01', '2040-05-06'],
  2041: ['2041-04-21'],
  2042: ['2042-04-06', '2042-04-13'],
  2043: ['2043-03-29', '2043-05-03'],
  2044: ['2044-04-17', '2044-04-24'],
  2045: ['2045-04-09'],
  2046: ['2046-03-25', '2046-04-29'],
  2047: ['2047-04-14', '2047-04-21'],
  2048: ['2048-04-05'],
  2049: ['2049-04-18', '2049-04-25'],
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function isoDatesForYear(year) {
  const fixed = FIXED_HOLIDAY_MD.map(([m, d]) => `${year}-${pad2(m)}-${pad2(d)}`);
  const variable = VARIABLE_HOLIDAYS_BY_YEAR[year] || [];
  return fixed.concat(variable);
}

/**
 * Праздники, попадающие в закрытый интервал [min(start,end), max(start,end)] (UTC, по дате).
 * @param {Date} startUTC
 * @param {Date} endUTC
 * @returns {string[]} ISO YYYY-MM-DD, отсортированы
 */
export function holidaysInRangeUTC(startUTC, endUTC) {
  let min = startUTC;
  let max = endUTC;
  if (max.getTime() < min.getTime()) {
    min = endUTC;
    max = startUTC;
  }
  const minT = min.getTime();
  const maxT = max.getTime();
  const seen = new Set();
  const out = [];
  for (let y = min.getUTCFullYear(); y <= max.getUTCFullYear(); y++) {
    for (const iso of isoDatesForYear(y)) {
      if (seen.has(iso)) continue;
      const parts = iso.split('-').map(Number);
      const t = Date.UTC(parts[0], parts[1] - 1, parts[2]);
      if (t >= minT && t <= maxT) {
        seen.add(iso);
        out.push(iso);
      }
    }
  }
  out.sort();
  return out;
}
