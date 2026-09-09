/**
 * Вероятность цирроза при гепатите C (MultiCalc, как MSD / EBMcalc).
 * Результат: CDS, log-odds Lok, Lok Index, GUCI, APRI, FIB-4.
 * @see https://www.msdmanuals.com/ru/professional/multimedia/clinical-calculator/вероятность-цирроза-при-гепатите-с
 * @see https://ebmcalc.com/CirrhosisProbability_MC.htm
 */

export const DISPLAY_DECIMALS = {
  lok: 3,
  logit: 3,
  apri: 2,
  fib4: 2,
  guci: 2,
};

export const FIELD_LIMITS = {
  age: { min: 18, max: 100 },
  plt: { min: 1, max: 1000 },
  ast: { min: 1, max: 2000 },
  alt: { min: 1, max: 2000 },
  ulnAst: { min: 1, max: 200 },
  inr: { min: 0.01, max: 10 },
};

/** Единицы МНО как в MSD / EBMcalc: ratio, %, fraction. */
export const INR_UNIT_LIMITS = {
  ratio: { min: 0.01, max: 10 },
  percent: { min: 1, max: 1000 },
  fraction: { min: 0.01, max: 10 },
};

/**
 * Приводит ввод МНО к INR (ratio), как в MSD / EBMcalc:
 * ratio и fraction — значение как есть; % — значение / 100 (т.е. 120% = 1,2).
 */
export function inrFromUnit(value, unit = 'ratio') {
  if (unit === 'percent' || unit === '%') return value / 100;
  return value;
}

export function normalizeInrUnit(unit) {
  if (unit === '%' || unit === 'percent') return 'percent';
  if (unit === 'fraction') return 'fraction';
  return 'ratio';
}

export const LOK_THRESHOLDS = {
  unlikelyMax: 0.2,
  indeterminateMax: 0.5,
};

export function rangeErrorMessage(min, max) {
  return `Число не в корректном интервале ${min} - ${max}`;
}

export function isInRange(value, limits) {
  return value >= limits.min && value <= limits.max;
}

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Bonacini CDS: баллы за тромбоциты (×10⁹/л). */
export function cdsPlateletPoints(plt) {
  if (plt > 340) return 0;
  if (plt >= 280) return 1;
  if (plt >= 220) return 2;
  if (plt >= 160) return 3;
  if (plt >= 100) return 4;
  if (plt >= 40) return 5;
  return 6;
}

/** Bonacini CDS: баллы за отношение ALT/AST. */
export function cdsAltAstPoints(altAst) {
  if (altAst > 1.7) return 0;
  if (altAst >= 1.2) return 1;
  if (altAst >= 0.6) return 2;
  return 3;
}

/** Bonacini CDS: баллы за МНО. */
export function cdsInrPoints(inr) {
  if (inr < 1.1) return 0;
  if (inr <= 1.4) return 1;
  return 2;
}

export function bonaciniCds(plt, ast, alt, inr) {
  const altAst = alt / ast;
  const plateletPts = cdsPlateletPoints(plt);
  const altAstPts = cdsAltAstPoints(altAst);
  const inrPts = cdsInrPoints(inr);
  return {
    score: plateletPts + altAstPts + inrPts,
    plateletPts,
    altAstPts,
    inrPts,
    altAstRatio: altAst,
  };
}

export function classifyCds(score) {
  if (score >= 8) {
    return {
      category: 'likely',
      interpretation: 'CDS ≥ 8 — высокая вероятность выраженного фиброза / цирроза',
    };
  }
  return {
    category: 'unlikely',
    interpretation: 'CDS < 8 — цирроз менее вероятен (низкая чувствительность порога)',
  };
}

export function lokLogit(plt, ast, alt, inr) {
  return -5.56 - 0.0089 * plt + 1.26 * (ast / alt) + 5.27 * inr;
}

export function lokIndexFromLogit(x) {
  const ex = Math.exp(x);
  return ex / (1 + ex);
}

export function classifyLok(index) {
  if (index < LOK_THRESHOLDS.unlikelyMax) {
    return {
      category: 'unlikely',
      interpretation: 'Цирроз маловероятен (Lok < 0,2)',
    };
  }
  if (index < LOK_THRESHOLDS.indeterminateMax) {
    return {
      category: 'indeterminate',
      interpretation: 'Неопределённый результат (Lok 0,2–0,5)',
    };
  }
  return {
    category: 'likely',
    interpretation: 'Цирроз вероятен (Lok ≥ 0,5)',
  };
}

/** GUCI = (AST / ULN_AST) × INR × 100 / PLT */
export function guciIndex(ast, ulnAst, inr, plt) {
  return ((ast / ulnAst) * inr * 100) / plt;
}

export function classifyGuci(guci) {
  if (guci < 1) {
    return {
      category: 'unlikely',
      interpretation: 'GUCI < 1 — цирроз маловероятен (высокий NPV)',
    };
  }
  return {
    category: 'likely',
    interpretation: 'GUCI ≥ 1 — повышенная вероятность цирроза',
  };
}

/** APRI = (AST / ULN_AST) / PLT × 100 */
export function apriIndex(ast, ulnAst, plt) {
  return (ast / ulnAst / plt) * 100;
}

export function classifyApri(apri) {
  if (apri <= 0.5) {
    return {
      category: 'unlikely',
      interpretation: 'Значительный фиброз или цирроз печени менее вероятен',
    };
  }
  if (apri <= 1) {
    return {
      category: 'unlikely',
      interpretation: 'Значительный фиброз неточный, цирроз печени менее вероятен',
    };
  }
  if (apri <= 1.5) {
    return {
      category: 'indeterminate',
      interpretation: 'Значительный фиброз более вероятен, цирроз неточный',
    };
  }
  if (apri <= 2) {
    return {
      category: 'indeterminate',
      interpretation: 'Значительный фиброз более вероятен, но цирроз неточный',
    };
  }
  return {
    category: 'likely',
    interpretation: 'Значительный фиброз и цирроз печени более вероятен',
  };
}

/** FIB-4 = (возраст × AST) / (PLT × √ALT) */
export function fib4Index(age, ast, alt, plt) {
  return (age * ast) / (plt * Math.sqrt(alt));
}

export function classifyFib4(fib4) {
  if (fib4 < 1.45) {
    return {
      category: 'unlikely',
      interpretation: 'Цирроз печени менее вероятен',
    };
  }
  if (fib4 <= 3.25) {
    return {
      category: 'indeterminate',
      interpretation: 'Неточный',
    };
  }
  return {
    category: 'likely',
    interpretation: 'Цирроз печени более вероятен',
  };
}

export function cirrhosisProbabilityCalculation(input = {}) {
  const age = parsePositive(input.age);
  const plt = parsePositive(input.plt);
  const ast = parsePositive(input.ast);
  const alt = parsePositive(input.alt);
  const ulnAst = parsePositive(input.ulnAst);
  const inrRaw = parsePositive(input.inr);
  const inrUnit = normalizeInrUnit(input.inrUnit);

  if (
    age == null ||
    plt == null ||
    ast == null ||
    alt == null ||
    ulnAst == null ||
    inrRaw == null
  ) {
    return { status: 'INVALID' };
  }

  const inrLimits = INR_UNIT_LIMITS[inrUnit] || INR_UNIT_LIMITS.ratio;
  const fields = [
    { key: 'age', value: age, limits: FIELD_LIMITS.age },
    { key: 'plt', value: plt, limits: FIELD_LIMITS.plt },
    { key: 'ast', value: ast, limits: FIELD_LIMITS.ast },
    { key: 'alt', value: alt, limits: FIELD_LIMITS.alt },
    { key: 'ulnAst', value: ulnAst, limits: FIELD_LIMITS.ulnAst },
    { key: 'inr', value: inrRaw, limits: inrLimits },
  ];
  for (const field of fields) {
    if (!isInRange(field.value, field.limits)) {
      return {
        status: 'INVALID',
        field: field.key,
        message: rangeErrorMessage(field.limits.min, field.limits.max),
      };
    }
  }

  const inr = roundHalfUp(inrFromUnit(inrRaw, inrUnit), 3);

  const cds = bonaciniCds(plt, ast, alt, inr);
  const cdsInterp = classifyCds(cds.score);

  const lokX = lokLogit(plt, ast, alt, inr);
  const lokRaw = lokIndexFromLogit(lokX);
  const lokIndex = roundHalfUp(lokRaw, DISPLAY_DECIMALS.lok);
  const lokLogOdds = roundHalfUp(lokX, DISPLAY_DECIMALS.logit);
  const lokInterp = classifyLok(lokIndex);

  const guciRaw = guciIndex(ast, ulnAst, inr, plt);
  const guci = roundHalfUp(guciRaw, DISPLAY_DECIMALS.guci);
  const guciInterp = classifyGuci(guci);

  const apriRaw = apriIndex(ast, ulnAst, plt);
  const apri = roundHalfUp(apriRaw, DISPLAY_DECIMALS.apri);
  const apriInterp = classifyApri(apri);

  const fib4Raw = fib4Index(age, ast, alt, plt);
  const fib4 = roundHalfUp(fib4Raw, DISPLAY_DECIMALS.fib4);
  const fib4Interp = classifyFib4(fib4);

  return {
    status: 'OK',
    age,
    plt,
    ast,
    alt,
    ulnAst,
    inr,
    inrRaw,
    inrUnit,
    cds: cds.score,
    cdsCategory: cdsInterp.category,
    cdsInterpretation: cdsInterp.interpretation,
    cdsParts: {
      plateletPts: cds.plateletPts,
      altAstPts: cds.altAstPts,
      inrPts: cds.inrPts,
      altAstRatio: roundHalfUp(cds.altAstRatio, 2),
    },
    lokLogOdds,
    lokIndex,
    lokCategory: lokInterp.category,
    lokInterpretation: lokInterp.interpretation,
    guci,
    guciCategory: guciInterp.category,
    guciInterpretation: guciInterp.interpretation,
    apri,
    apriCategory: apriInterp.category,
    apriInterpretation: apriInterp.interpretation,
    fib4,
    fib4Category: fib4Interp.category,
    fib4Interpretation: fib4Interp.interpretation,
  };
}

export function calculate(input) {
  const out = cirrhosisProbabilityCalculation(input);
  if (out.status !== 'OK') {
    throw new Error(out.message || 'Заполните все поля');
  }
  return out;
}
