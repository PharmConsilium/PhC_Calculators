/**
 * homa-b — Homeostatic Model Assessment for Beta-cell function
 * Source: https://super-calculator.com/homa-b-calculator ; Matthews DR et al., Diabetologia 1985
 */

export const INSULIN_PMOL_PER_UU_ML = 6;
export const GLUCOSE_MMOL_TO_MGDL = 18;
export const HOMA_B_NUMERATOR_MMOL = 20;
export const HOMA_B_NUMERATOR_MGDL = 360;
export const GLUCOSE_OFFSET_MMOL = 3.5;
export const GLUCOSE_OFFSET_MGDL = 63;
export const HOMA_IR_DIVISOR_MMOL = 22.5;
export const HOMA_IR_DIVISOR_MGDL = 405;
export const HOMA_IR_ELEVATED_CUTOFF = 1.9;
export const HOMA_IR_SIGNIFICANT_CUTOFF = 2.9;
export const QUICKI_REDUCED_CUTOFF = 0.339;

function parsePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

function resolveInsulin(input) {
  const insulinUnit = input.insulinUnit === 'pmol' ? 'pmol' : 'uuml';
  const insulin = parsePositive(input.insulin, 'insulin');
  const insulinUuMl =
    insulinUnit === 'pmol' ? insulin / INSULIN_PMOL_PER_UU_ML : insulin;
  return { insulinUnit, insulin, insulinUuMl };
}

function resolveGlucose(input) {
  const glucoseUnit = input.glucoseUnit === 'mgdl' ? 'mgdl' : 'mmol';
  const glucose = parsePositive(input.glucose, 'glucose');

  if (glucoseUnit === 'mgdl') {
    if (glucose <= GLUCOSE_OFFSET_MGDL) {
      throw new Error('Invalid glucose');
    }
    return { glucoseUnit, glucose, glucoseMmolL: glucose / GLUCOSE_MMOL_TO_MGDL };
  }

  if (glucose <= GLUCOSE_OFFSET_MMOL) {
    throw new Error('Invalid glucose');
  }
  return { glucoseUnit, glucose, glucoseMmolL: glucose };
}

export function calculateHomaB(insulinUuMl, glucose, glucoseUnit) {
  if (glucoseUnit === 'mgdl') {
    return (HOMA_B_NUMERATOR_MGDL * insulinUuMl) / (glucose - GLUCOSE_OFFSET_MGDL);
  }
  return (HOMA_B_NUMERATOR_MMOL * insulinUuMl) / (glucose - GLUCOSE_OFFSET_MMOL);
}

export function calculateHomaIr(insulinUuMl, glucose, glucoseUnit) {
  if (glucoseUnit === 'mgdl') {
    return (insulinUuMl * glucose) / HOMA_IR_DIVISOR_MGDL;
  }
  return (insulinUuMl * glucose) / HOMA_IR_DIVISOR_MMOL;
}

export function calculateQuicki(insulinUuMl, glucoseMgDl) {
  return 1 / (Math.log10(insulinUuMl) + Math.log10(glucoseMgDl));
}

export function getHomaBCategory(homaB) {
  if (homaB < 60) {
    return {
      category: 'significantlyReduced',
      label: 'Выраженное снижение функции β-клеток',
      consideration: 'Требуется клиническая оценка',
      interpretation:
        'HOMA-B <60% — выраженное снижение функции β-клеток; требуется клиническая оценка',
    };
  }
  if (homaB < 80) {
    return {
      category: 'mildlyReduced',
      label: 'Умеренное снижение функции β-клеток',
      consideration: 'Регулярное наблюдение',
      interpretation: 'HOMA-B 60–80% — умеренное снижение функции β-клеток',
    };
  }
  if (homaB <= 120) {
    return {
      category: 'normal',
      label: 'Нормальная функция β-клеток',
      consideration: 'Поддерживайте здоровый образ жизни',
      interpretation: 'HOMA-B 80–120% — нормальная функция β-клеток',
    };
  }
  if (homaB <= 200) {
    return {
      category: 'elevated',
      label: 'Повышенная (компенсаторная гиперинсулинемия)',
      consideration: 'Оцените инсулинорезистентность',
      interpretation:
        'HOMA-B 120–200% — повышенная функция β-клеток; оцените инсулинорезистентность',
    };
  }
  return {
    category: 'markedlyElevated',
    label: 'Значительно повышенная',
    consideration: 'Оцените метаболический синдром',
    interpretation: 'HOMA-B >200% — значительно повышенная; оцените метаболический синдром',
  };
}

export function getHomaIrCategory(homaIr) {
  if (homaIr < HOMA_IR_ELEVATED_CUTOFF) {
    return {
      category: 'normal',
      label: 'Норма',
      interpretation: 'HOMA-IR <1,9 — инсулинорезистентность не выражена',
    };
  }
  if (homaIr < HOMA_IR_SIGNIFICANT_CUTOFF) {
    return {
      category: 'earlyResistance',
      label: 'Ранняя инсулинорезистентность',
      interpretation: 'HOMA-IR 1,9–2,9 — ранняя инсулинорезистентность',
    };
  }
  return {
    category: 'significantResistance',
    label: 'Выраженная инсулинорезистентность',
    interpretation: 'HOMA-IR ≥2,9 — выраженная инсулинорезистентность',
  };
}

export function getQuickiCategory(quicki) {
  if (quicki < QUICKI_REDUCED_CUTOFF) {
    return {
      category: 'reduced',
      label: 'Сниженная чувствительность',
      interpretation: 'QUICKI <0,339 — сниженная чувствительность к инсулину',
    };
  }
  return {
    category: 'normal',
    label: 'Нормальная чувствительность',
    interpretation: 'QUICKI ≥0,339 — чувствительность к инсулину в пределах нормы',
  };
}

export function getCombinedInterpretation(homaB, homaIr) {
  const lowB = homaB < 80;
  const normalB = homaB >= 80 && homaB <= 120;
  const elevatedB = homaB > 120;
  const elevatedIr = homaIr >= HOMA_IR_ELEVATED_CUTOFF;

  if (normalB && !elevatedIr) {
    return 'Здоровый метаболический профиль. Поддерживайте образ жизни.';
  }
  if (normalB && elevatedIr) {
    return 'Инсулинорезистентность есть, но β-клетки пока компенсируют. Коррекция резистентности.';
  }
  if (elevatedB && elevatedIr) {
    return 'Компенсаторная гиперинсулинемия: β-клетки перегружены. Высокий риск прогрессии.';
  }
  if (lowB && !elevatedIr) {
    return 'Возможная первичная дисфункция β-клеток. Рекомендуется дополнительная оценка.';
  }
  if (lowB && elevatedIr) {
    return 'Сочетание снижения β-клеток и инсулинорезистентности. Наивысший риск СД 2 типа. Срочная оценка.';
  }
  if (elevatedB && !elevatedIr) {
    return 'Повышенный HOMA-B без выраженной инсулинорезистентности. Интерпретируйте с учётом контекста.';
  }
  return 'Интерпретируйте HOMA-B совместно с HOMA-IR и клинической картиной.';
}

export function getCompensatoryPhaseNote(homaB, homaIr) {
  if (homaB > 120 && homaIr >= HOMA_IR_ELEVATED_CUTOFF) {
    return 'Компенсаторная фаза: β-клетки компенсируют инсулинорезистентность повышенной секрецией инсулина. Без коррекции возможно последующее снижение функции β-клеток.';
  }
  return null;
}

export function calculate(input) {
  const { insulin, insulinUnit, insulinUuMl } = resolveInsulin(input);
  const { glucoseUnit, glucose, glucoseMmolL } = resolveGlucose(input);
  const glucoseMgDl = glucoseUnit === 'mgdl' ? glucose : glucose * GLUCOSE_MMOL_TO_MGDL;

  const homaBExact = calculateHomaB(insulinUuMl, glucose, glucoseUnit);
  const homaIrExact = calculateHomaIr(insulinUuMl, glucose, glucoseUnit);
  const quickiExact = calculateQuicki(insulinUuMl, glucoseMgDl);

  const homaB = Number(homaBExact.toFixed(1));
  const homaIr = Number(homaIrExact.toFixed(2));
  const quicki = Number(quickiExact.toFixed(3));

  const homaBResult = getHomaBCategory(homaB);
  const homaIrResult = getHomaIrCategory(homaIr);
  const quickiResult = getQuickiCategory(quicki);
  const compensatoryPhaseNote = getCompensatoryPhaseNote(homaB, homaIr);

  return {
    value: homaB,
    homaB,
    homaIr,
    quicki,
    glucose,
    glucoseUnit,
    glucoseMmolL,
    insulin,
    insulinUnit,
    insulinUuMl,
    homaBCategory: homaBResult.category,
    homaBLabel: homaBResult.label,
    homaBConsideration: homaBResult.consideration,
    homaIrCategory: homaIrResult.category,
    homaIrLabel: homaIrResult.label,
    quickiCategory: quickiResult.category,
    quickiLabel: quickiResult.label,
    interpretation: homaBResult.interpretation,
    homaIrInterpretation: homaIrResult.interpretation,
    quickiInterpretation: quickiResult.interpretation,
    combinedInterpretation: getCombinedInterpretation(homaB, homaIr),
    compensatoryPhaseNote,
  };
}
