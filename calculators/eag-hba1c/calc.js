/**
 * eag-hba1c — Estimated Average Glucose from HbA1c (MDCalc / Nathan ADAG)
 * eAG (mg/dL) = 28.7 × HbA1c (%) − 46.7
 * eAG (mmol/L) = 1.5944 × HbA1c (%) − 2.594
 */

export const EAG_MG_SLOPE = 28.7;
export const EAG_MG_INTERCEPT = 46.7;
export const EAG_MMOL_SLOPE = 1.5944;
export const EAG_MMOL_INTERCEPT = 2.594;
export const HBA1C_ERROR_MIN = 1;
export const HBA1C_ERROR_MAX = 30;
export const HBA1C_WARN_MIN = 3;
export const HBA1C_WARN_MAX = 12;

function parseHba1c(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error('Invalid hba1c');
  }
  return number;
}

export function calculateEagMgDl(hba1c) {
  return Number((EAG_MG_SLOPE * hba1c - EAG_MG_INTERCEPT).toFixed(10));
}

export function calculateEagMmolL(hba1c) {
  return Number((EAG_MMOL_SLOPE * hba1c - EAG_MMOL_INTERCEPT).toFixed(10));
}

export function roundEagMgDl(eagMgDlExact) {
  return Number(eagMgDlExact.toFixed(1));
}

export function roundEagMmolL(eagMmolLExact) {
  return Math.round(eagMmolLExact * 10) / 10;
}

export function getHba1cWarnings(hba1c) {
  const warnings = [];

  if (hba1c < HBA1C_ERROR_MIN || hba1c > HBA1C_ERROR_MAX) {
    warnings.push(`HbA1c вне допустимого диапазона ${HBA1C_ERROR_MIN}–${HBA1C_ERROR_MAX}%.`);
  } else if (hba1c < HBA1C_WARN_MIN || hba1c > HBA1C_WARN_MAX) {
    warnings.push(
      `HbA1c ${hba1c}% выходит за типичный клинический диапазон ${HBA1C_WARN_MIN}–${HBA1C_WARN_MAX}%; интерпретируйте результат с осторожностью.`
    );
  }

  return warnings;
}

export function calculate(input) {
  const hba1c = parseHba1c(input.hba1c);

  const eagMgDlExact = calculateEagMgDl(hba1c);
  const eagMmolLExact = calculateEagMmolL(hba1c);
  const eagMgDl = roundEagMgDl(eagMgDlExact);
  const eagMmolL = roundEagMmolL(eagMmolLExact);
  const warnings = getHba1cWarnings(hba1c);

  return {
    value: eagMgDl,
    hba1c,
    eagMgDl,
    eagMmolL,
    eagMgDlExact,
    eagMmolLExact,
    warnings,
    warning: warnings.join(' '),
    interpretation: `Средняя глюкоза (eAG): ${eagMgDl} мг/дл (${eagMmolL} ммоль/л)`,
  };
}
