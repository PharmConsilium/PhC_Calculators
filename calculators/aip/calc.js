/**
 * Атерогенный индекс плазмы (AIP).
 * AIP = log10(ТГ / ЛПВП), ммоль/л
 *
 * Риск:
 * - низкий: −0,3 … 0,1
 * - средний: 0,1 … 0,24
 * - высокий: > 0,24
 */

export const AIP_LOW_MAX = 0.1;
export const AIP_INTERMEDIATE_MAX = 0.24;

export function truncTo2(value) {
  return Math.trunc(value * 100 + Number.EPSILON) / 100;
}

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function aipValue(tgMmol, hdlMmol) {
  return Math.log10(tgMmol / hdlMmol);
}

export function interpretAip(aip) {
  if (aip < AIP_LOW_MAX) {
    return {
      risk: 'low',
      riskLabel: 'Низкий риск',
      interpretation:
        'AIP в диапазоне низкого риска (−0,3…0,1): благоприятный липидный профиль, низкая вероятность атеросклероза.',
    };
  }
  if (aip <= AIP_INTERMEDIATE_MAX) {
    return {
      risk: 'intermediate',
      riskLabel: 'Средний риск',
      interpretation:
        'AIP в диапазоне среднего риска (0,1…0,24): умеренный риск сердечно-сосудистых заболеваний.',
    };
  }
  return {
    risk: 'high',
    riskLabel: 'Высокий риск',
    interpretation:
      'AIP выше 0,24: повышенный риск атеросклероза и связанных сердечно-сосудистых заболеваний.',
  };
}

export function aipScore(input) {
  const tgMmol = parsePositive(input.triglycerides ?? input.tg);
  const hdlMmol = parsePositive(input.hdl);

  if (tgMmol == null || hdlMmol == null) {
    return { status: 'INVALID' };
  }

  const aipExact = aipValue(tgMmol, hdlMmol);
  const aip = truncTo2(aipExact);
  const risk = interpretAip(aipExact);

  return {
    status: 'OK',
    aip,
    value: aip,
    ...risk,
  };
}

export function calculate(input) {
  const out = aipScore(input);
  if (out.status !== 'OK') throw new Error('Заполните триглицериды и ХС ЛПВП');
  return out;
}
