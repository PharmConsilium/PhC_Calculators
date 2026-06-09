/**
 * CDAI — индекс клинической активности РА (Aletaha et al.; MSD).
 * CDAI = SJC + TJC + PGA + EGA
 */

export const LARGE_JOINTS = [
  { id: 'shoulder', label: 'Плечо' },
  { id: 'elbow', label: 'Локоть' },
  { id: 'wrist', label: 'Запястье' },
];

export const HAND_ROW1 = [
  { id: 'mcp1', label: 'MCP 1' },
  { id: 'mcp2', label: 'MCP 2' },
  { id: 'mcp3', label: 'MCP 3' },
  { id: 'mcp4', label: 'MCP 4' },
  { id: 'mcp5', label: 'MCP 5' },
];

export const HAND_ROW2 = [
  { id: 'ip1', label: 'IP 1' },
  { id: 'pip2', label: 'PIP 2' },
  { id: 'pip3', label: 'PIP 3' },
  { id: 'pip4', label: 'PIP 4' },
  { id: 'pip5', label: 'PIP 5' },
];

export const FINGER_LABELS = [
  { num: 1, name: 'Большой', fullName: 'Большой палец' },
  { num: 2, name: 'Указательный', fullName: 'Указательный' },
  { num: 3, name: 'Средний', fullName: 'Средний палец' },
  { num: 4, name: 'Безымянный', fullName: 'Безымянный' },
  { num: 5, name: 'Мизинец', fullName: 'Мизинец' },
];

export const KNEE_JOINT = { id: 'knee', label: 'Колено' };

export const ALL_JOINTS = [...LARGE_JOINTS, ...HAND_ROW1, ...HAND_ROW2, KNEE_JOINT];
export const SIDES = [
  { id: 'right', label: 'Кисть' },
  { id: 'left', label: 'Кисть' },
];

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function parseScale(value, min, max) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return { error: true };
  const n = Number(s);
  if (!Number.isFinite(n) || n < min || n > max) return { error: true };
  return { value: n };
}

export function countJoints(input, prefix) {
  let total = 0;
  for (const side of SIDES) {
    for (const joint of ALL_JOINTS) {
      const key = `${prefix}_${side.id}_${joint.id}`;
      if (input[key]) total += 1;
    }
  }
  return total;
}

export function interpretCdai(cdai) {
  if (cdai <= 2.8) {
    return { category: 'remission', interpretation: 'Ремиссия' };
  }
  if (cdai <= 10) {
    return { category: 'low', interpretation: 'Низкая активность заболевания' };
  }
  if (cdai <= 22) {
    return { category: 'moderate', interpretation: 'Умеренная активность заболевания' };
  }
  return { category: 'high', interpretation: 'Высокая активность заболевания' };
}

export function cdaiScore(input) {
  const pga = parseScale(input.pga, 0, 10);
  const ega = parseScale(input.ega, 0, 10);
  if (!pga || pga.error) return { status: 'INVALID', missing: 'pga' };
  if (!ega || ega.error) return { status: 'INVALID', missing: 'ega' };

  const tjc = countJoints(input, 'tjc');
  const sjc = countJoints(input, 'sjc');
  const cdai = roundHalfUp(tjc + sjc + pga.value + ega.value, 1);
  const { category, interpretation } = interpretCdai(cdai);

  return {
    status: 'OK',
    tjc,
    sjc,
    pga: pga.value,
    ega: ega.value,
    cdai,
    category,
    interpretation,
  };
}

export function calculate(input) {
  const out = cdaiScore(input);
  if (out.status !== 'OK') throw new Error('Укажите PGA и EGA (0–10)');
  return out;
}
