/**
 * date-diff — pure calculation (import in tests)
 * Source: internal utility calculator
 */

import { holidaysInRangeUTC } from './holidays.js';

function parseIsoDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (!Number.isFinite(d.getTime())) return null;
  // Validate round-trip (catch 2026-02-31 etc)
  const iso = d.toISOString().slice(0, 10);
  if (iso !== dateStr) return null;
  return d;
}

function formatIsoDateUTC(d) {
  return new Date(d.getTime()).toISOString().slice(0, 10);
}

function diffInDaysUTC(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.trunc(ms / 86400000);
}

function isWeekdayUTC(d) {
  const day = d.getUTCDay(); // 0 Sun..6 Sat
  return day !== 0 && day !== 6;
}

function countWeekdaysBetweenUTC(a, b) {
  // Count weekdays in (min(a,b), max(a,b)] i.e. excluding start date, including end date
  let start = a;
  let end = b;
  if (end.getTime() < start.getTime()) {
    start = b;
    end = a;
  }
  let count = 0;
  const cur = new Date(start.getTime());
  while (cur.getTime() < end.getTime()) {
    cur.setUTCDate(cur.getUTCDate() + 1);
    if (isWeekdayUTC(cur)) count++;
  }
  return count;
}

function fullMonthsBetweenUTC(a, b) {
  // Whole calendar months between dates, measured by month boundaries, with day-of-month clamp.
  // Returns signed integer such that addMonthsClamped(a, months) <= b < addMonthsClamped(a, months+1) for b>=a
  let sign = 1;
  let start = a;
  let end = b;
  if (end.getTime() < start.getTime()) {
    sign = -1;
    start = b;
    end = a;
  }
  const y1 = start.getUTCFullYear();
  const m1 = start.getUTCMonth();
  const y2 = end.getUTCFullYear();
  const m2 = end.getUTCMonth();
  let months = (y2 - y1) * 12 + (m2 - m1);
  const candidate = addMonthsClamped(start, months);
  if (candidate.getTime() > end.getTime()) months -= 1;
  const out = months * sign;
  return out === 0 ? 0 : out;
}

function daysInMonthUTC(year, monthIndex0) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function addMonthsClamped(dateUTC, months) {
  const y = dateUTC.getUTCFullYear();
  const m = dateUTC.getUTCMonth();
  const d = dateUTC.getUTCDate();
  const targetMonth = m + months;
  const ty = y + Math.floor(targetMonth / 12);
  const tm = ((targetMonth % 12) + 12) % 12;
  const maxDay = daysInMonthUTC(ty, tm);
  const td = Math.min(d, maxDay);
  return new Date(Date.UTC(ty, tm, td));
}

export function addInterval({ date, amount, unit }) {
  const base = parseIsoDate(date);
  const n = Number(amount);
  if (!base) throw new Error('Invalid date');
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error('Invalid amount');
  if (typeof unit !== 'string') throw new Error('Invalid unit');

  if (unit === 'days') {
    const out = new Date(base.getTime());
    out.setUTCDate(out.getUTCDate() + n);
    return { date: formatIsoDateUTC(out) };
  }
  if (unit === 'weeks') {
    const out = new Date(base.getTime());
    out.setUTCDate(out.getUTCDate() + n * 7);
    return { date: formatIsoDateUTC(out) };
  }
  if (unit === 'months') {
    const out = addMonthsClamped(base, n);
    return { date: formatIsoDateUTC(out) };
  }
  if (unit === 'years') {
    const out = addMonthsClamped(base, n * 12);
    return { date: formatIsoDateUTC(out) };
  }
  if (unit === 'workdays') {
    const out = new Date(base.getTime());
    const step = n >= 0 ? 1 : -1;
    let remaining = Math.abs(n);
    while (remaining > 0) {
      out.setUTCDate(out.getUTCDate() + step);
      if (isWeekdayUTC(out)) remaining--;
    }
    return { date: formatIsoDateUTC(out) };
  }
  throw new Error('Invalid unit');
}

export function calculate(input) {
  const mode = input?.mode ?? 'diff';

  if (mode === 'diff') {
    const start = parseIsoDate(input.start);
    const end = parseIsoDate(input.end);
    if (!start || !end) throw new Error('Invalid start/end');
    const days = diffInDaysUTC(start, end);
    const workdays = countWeekdaysBetweenUTC(start, end) * (days >= 0 ? 1 : -1);
    const weeks = days / 7;
    const monthsFull = fullMonthsBetweenUTC(start, end);
    const holidays = holidaysInRangeUTC(start, end);
    return {
      days,
      workdays,
      weeks: Number(weeks.toFixed(4)),
      monthsFull,
      holidays,
    };
  }

  if (mode === 'add') {
    const { date } = addInterval({ date: input.base, amount: input.amount, unit: input.unit });
    return { date };
  }

  throw new Error('Invalid mode');
}
