(function () {
  /**
 * Чайлд-Пью и MELD (оригинал до 2016, MELD-Na, MELD 3.0).
 * Child-Pugh: medicalc.pro/childpew
 * MELD: OPTN/UNOS; MDCalc Combined MELD; Kim et al. Gastroenterology 2021 (MELD 3.0)
 */

const CRITERIA = [
  {
    id: 'bilirubin',
    label: 'Билирубин (общий), мкмоль/л',
    options: [
      { value: 'lt34', label: '<34,2', points: 1 },
      { value: '34_51', label: '34,2–51,3', points: 2 },
      { value: 'gt51', label: '>51,3', points: 3 },
    ],
  },
  {
    id: 'albumin',
    label: 'Альбумин, г/л',
    options: [
      { value: 'gt35', label: '>35', points: 1 },
      { value: '28_35', label: '28–35', points: 2 },
      { value: 'lt28', label: '<28', points: 3 },
    ],
  },
  {
    id: 'inr',
    label: 'МНО',
    options: [
      { value: 'lt17', label: '<1,7', points: 1 },
      { value: '17_22', label: '1,7–2,2', points: 2 },
      { value: 'gt22', label: '>2,2', points: 3 },
    ],
  },
  {
    id: 'ascites',
    label: 'Асцит',
    options: [
      { value: 'none', label: 'Нет', points: 1 },
      { value: 'mild', label: 'Лёгкий', points: 2 },
      { value: 'mod_severe', label: 'Средний или тяжёлый', points: 3 },
    ],
  },
  {
    id: 'encephalopathy',
    label: 'Энцефалопатия',
    options: [
      { value: 'none', label: 'Нет', points: 1 },
      { value: 'grade12', label: '1–2 степень', points: 2 },
      { value: 'grade34', label: '3–4 степень', points: 3 },
    ],
  },
];

/** µmol/L → mg/dL */
const BILI_UMOL_PER_MGDL = 17.1;
/** µmol/L → mg/dL */
const CR_UMOL_PER_MGDL = 88.4;

function formatPoints(points) {
  return String(points);
}

function scoreWord(total) {
  const abs = Math.abs(total);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'баллов';
  if (mod10 === 1) return 'балл';
  if (mod10 >= 2 && mod10 <= 4) return 'балла';
  return 'баллов';
}

function pluralBalls(total) {
  return `${total} ${scoreWord(total)}`;
}

/** Класс A: <7; B: 7–9; C: ≥10. */
function interpretChildPugh(total) {
  if (total < 7) {
    return {
      childClass: 'A',
      category: 'A',
      interpretation:
        'Класс A. Продолжительность жизни: 15–20 лет. Периоперационная летальность при абдоминальных операциях: 10%.',
      lifeExpectancy: '15–20 лет',
      periopMortality: '10%',
    };
  }
  if (total < 10) {
    return {
      childClass: 'B',
      category: 'B',
      interpretation:
        'Класс B. Значительное функциональное ухудшение. Периоперационная летальность при абдоминальных операциях: 30%.',
      lifeExpectancy: null,
      periopMortality: '30%',
    };
  }
  return {
    childClass: 'C',
    category: 'C',
    interpretation:
      'Класс C. Продолжительность жизни: 1–3 года. Периоперационная летальность при абдоминальных операциях: 82%.',
    lifeExpectancy: '1–3 года',
    periopMortality: '82%',
  };
}

function isChildPughReady(input) {
  return CRITERIA.every((c) => {
    const v = input[c.id];
    return v != null && String(v).trim() !== '';
  });
}

function calculateChildPugh(input) {
  if (!isChildPughReady(input || {})) {
    throw new Error('Заполните все поля');
  }

  const scores = {};
  let total = 0;
  for (const criterion of CRITERIA) {
    const selected = criterion.options.find((o) => o.value === input[criterion.id]);
    if (!selected) throw new Error('Заполните все поля');
    scores[criterion.id] = selected.points;
    total += selected.points;
  }

  const info = interpretChildPugh(total);
  return {
    mode: 'childPugh',
    total,
    score: total,
    value: total,
    scores,
    childClass: info.childClass,
    category: info.category,
    interpretation: info.interpretation,
    lifeExpectancy: info.lifeExpectancy,
    periopMortality: info.periopMortality,
  };
}

function requireFinite(n, label) {
  if (!Number.isFinite(n)) throw new Error(label || 'Проверьте введённые данные');
  return n;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundMeld(n) {
  return Math.round(n);
}

function boundMeldScore(n) {
  return clamp(roundMeld(n), 6, 40);
}

function toBilirubinMgDl(value, unit) {
  const n = Number(value);
  requireFinite(n, 'Укажите билирубин');
  if (n < 0) throw new Error('Билирубин не может быть отрицательным');
  return unit === 'mgdl' ? n : n / BILI_UMOL_PER_MGDL;
}

function toCreatinineMgDl(value, unit) {
  const n = Number(value);
  requireFinite(n, 'Укажите креатинин');
  if (n < 0) throw new Error('Креатинин не может быть отрицательным');
  return unit === 'mgdl' ? n : n / CR_UMOL_PER_MGDL;
}

function toAlbuminGdl(value, unit) {
  const n = Number(value);
  requireFinite(n, 'Укажите альбумин');
  if (n < 0) throw new Error('Альбумин не может быть отрицательным');
  return unit === 'gdl' ? n : n / 10;
}

function prepareLabs(input, { creatCap, needNa, needAlb, needSex }) {
  const biliUnit = input.bilirubinUnit === 'mgdl' ? 'mgdl' : 'umol';
  const creatUnit = input.creatinineUnit === 'mgdl' ? 'mgdl' : 'umol';
  let bili = toBilirubinMgDl(input.bilirubin, biliUnit);
  let creat = toCreatinineMgDl(input.creatinine, creatUnit);
  const inr = Number(input.inr);
  requireFinite(inr, 'Укажите МНО');
  if (inr <= 0) throw new Error('МНО должно быть больше 0');

  const dialysis = Boolean(input.dialysis);
  if (dialysis) creat = creatCap;

  bili = Math.max(bili, 1);
  creat = clamp(Math.max(creat, 1), 1, creatCap);
  const inrUsed = Math.max(inr, 1);

  let sodium = null;
  if (needNa) {
    sodium = Number(input.sodium);
    requireFinite(sodium, 'Укажите натрий');
    sodium = clamp(sodium, 125, 137);
  }

  let albumin = null;
  if (needAlb) {
    const albUnit = input.albuminUnit === 'gdl' ? 'gdl' : 'gl';
    albumin = toAlbuminGdl(input.albumin, albUnit);
    albumin = clamp(albumin, 1.5, 3.5);
  }

  let female = false;
  if (needSex) {
    const sex = String(input.sex || '').toLowerCase();
    if (sex !== 'male' && sex !== 'female') throw new Error('Укажите пол');
    female = sex === 'female';
  }

  return { bili, creat, inr: inrUsed, sodium, albumin, female, dialysis };
}

/** Взрослая ветка MELD 3.0 (OPTN): пол учитывается с 18 лет. */
function isMeld30Adult(inputOrAge) {
  if (inputOrAge != null && typeof inputOrAge === 'object') {
    if (inputOrAge.ageGroup === 'ge18') return true;
    if (inputOrAge.ageGroup === 'lt18') return false;
    return isMeld30Adult(inputOrAge.ageYears);
  }
  if (inputOrAge === 'ge18') return true;
  if (inputOrAge === 'lt18') return false;
  const age = Number(inputOrAge);
  return Number.isFinite(age) && age >= 18;
}

/** Original MELD (pre-2016 / без натрия). */
function calcMeldOriginal(input) {
  const { bili, creat, inr, dialysis } = prepareLabs(input, {
    creatCap: 4,
    needNa: false,
    needAlb: false,
    needSex: false,
  });
  const raw = 3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(creat) + 6.43;
  const score = boundMeldScore(raw);
  return {
    mode: 'meld',
    score,
    total: score,
    value: score,
    raw,
    dialysis,
    labsUsed: { bilirubinMgDl: bili, creatinineMgDl: creat, inr },
    interpretation: meldInterpretation(score, 'MELD (до 2016)'),
    threeMonthMortality: meldThreeMonthMortality(score),
  };
}

/** MELD-Na (UNOS/OPTN до внедрения MELD 3.0). */
function calcMeldNa(input) {
  const { bili, creat, inr, sodium, dialysis } = prepareLabs(input, {
    creatCap: 4,
    needNa: true,
    needAlb: false,
    needSex: false,
  });
  const rawMeld =
    3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(creat) + 6.43;
  const meld = boundMeldScore(rawMeld);
  let raw = meld;
  let sodiumApplied = false;
  if (meld > 11) {
    const dNa = 137 - sodium;
    raw = meld + 1.32 * dNa - 0.033 * meld * dNa;
    sodiumApplied = true;
  }
  const score = boundMeldScore(raw);
  return {
    mode: 'meldNa',
    score,
    total: score,
    value: score,
    meldBase: meld,
    raw,
    sodiumApplied,
    sodiumUsed: sodium,
    dialysis,
    labsUsed: { bilirubinMgDl: bili, creatinineMgDl: creat, inr, sodium },
    interpretation: meldInterpretation(score, 'MELD-Na'),
    threeMonthMortality: meldThreeMonthMortality(score),
  };
}

/** MELD 3.0 (Kim 2021; текущий OPTN). С 18 лет — пол; младше — ветка без пола (+7,33). */
function calcMeld30(input) {
  const ageGroup =
    input.ageGroup === 'lt18' || input.ageGroup === 'ge18'
      ? input.ageGroup
      : isMeld30Adult(input.ageYears)
        ? 'ge18'
        : input.ageYears != null && String(input.ageYears).trim() !== ''
          ? 'lt18'
          : null;
  if (!ageGroup) throw new Error('Укажите возраст');
  const adult = ageGroup === 'ge18';

  const { bili, creat, inr, sodium, albumin, female, dialysis } = prepareLabs(input, {
    creatCap: 3,
    needNa: true,
    needAlb: true,
    needSex: adult,
  });
  const lnB = Math.log(bili);
  const lnC = Math.log(creat);
  const lnI = Math.log(inr);
  const dNa = 137 - sodium;
  const dAlb = 3.5 - albumin;
  const intercept = adult ? 6 : 7.33;
  const sexTerm = adult && female ? 1.33 : 0;
  const raw =
    sexTerm +
    4.56 * lnB +
    0.82 * dNa -
    0.24 * dNa * lnB +
    9.09 * lnI +
    11.14 * lnC +
    1.85 * dAlb -
    1.83 * dAlb * lnC +
    intercept;
  const score = boundMeldScore(raw);
  return {
    mode: 'meld30',
    score,
    total: score,
    value: score,
    raw,
    ageGroup,
    adult,
    female: adult ? female : null,
    sodiumUsed: sodium,
    albuminUsed: albumin,
    dialysis,
    labsUsed: {
      bilirubinMgDl: bili,
      creatinineMgDl: creat,
      inr,
      sodium,
      albuminGdl: albumin,
    },
    interpretation: meldInterpretation(score, 'MELD 3.0'),
    mortalityBand: meld30MortalityBand(score),
    ninetyDaySurvival: meld30NinetyDaySurvival(score),
  };
}

function meld30MortalityBand(score) {
  if (score < 10) return { band: '<10', approx90d: '~1,5%' };
  if (score < 20) return { band: '10–19', approx90d: '~5,5%' };
  if (score < 30) return { band: '20–29', approx90d: '~18%' };
  if (score < 40) return { band: '30–39', approx90d: '~50%' };
  return { band: '≥40', approx90d: '~70%' };
}

/**
 * Предполагаемая 3-месячная смертность (Wiesner et al., Gastroenterology 2003).
 * Для исходного MELD / MELD-Na.
 */
function meldThreeMonthMortality(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return null;
  if (s <= 9) return { percent: 1.9, display: '1,9' };
  if (s <= 19) return { percent: 6, display: '6' };
  if (s <= 29) return { percent: 19.6, display: '19,6' };
  if (s <= 39) return { percent: 52.6, display: '52,6' };
  return { percent: 71.3, display: '71,3' };
}

function formatPct1(n) {
  const r = Math.round(n * 10) / 10;
  return String(r).replace(/\.0$/, '').replace('.', ',');
}

/**
 * Оценка 90-дневной выживаемости по MELD 3.0 (Kim et al., 2021; как на MDCalc / UW).
 * survival = 0.946 ^ exp(0.17698 × MELD − 3.56) × 100
 */
function meld30NinetyDaySurvival(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return null;
  const survivalPercent = Math.pow(0.946, Math.exp(0.17698 * s - 3.56)) * 100;
  const mortalityPercent = Math.max(0, 100 - survivalPercent);
  return {
    survivalPercent,
    mortalityPercent,
    survivalDisplay: formatPct1(survivalPercent),
    mortalityDisplay: formatPct1(mortalityPercent),
  };
}

function meldInterpretation(score, label) {
  return `${label}: ${score} ${scoreWord(score)}. Чем выше балл, тем выше риск и приоритет при трансплантации (макс. 40 по OPTN).`;
}

function isReady(input) {
  const mode = (input && input.mode) || 'childPugh';
  if (mode === 'childPugh') return isChildPughReady(input);
  if (mode === 'meld') {
    return (
      input.bilirubin != null &&
      String(input.bilirubin).trim() !== '' &&
      input.creatinine != null &&
      String(input.creatinine).trim() !== '' &&
      input.inr != null &&
      String(input.inr).trim() !== ''
    );
  }
  if (mode === 'meldNa') {
    return (
      isReady({ ...input, mode: 'meld' }) &&
      input.sodium != null &&
      String(input.sodium).trim() !== ''
    );
  }
  if (mode === 'meld30') {
    if (input.ageGroup !== 'lt18' && input.ageGroup !== 'ge18') return false;
    if (
      !isReady({ ...input, mode: 'meldNa' }) ||
      input.albumin == null ||
      String(input.albumin).trim() === ''
    ) {
      return false;
    }
    if (isMeld30Adult(input)) {
      return input.sex === 'male' || input.sex === 'female';
    }
    return true;
  }
  return false;
}

function calculate(input) {
  const mode = (input && input.mode) || 'childPugh';
  if (mode === 'childPugh') return calculateChildPugh(input);
  if (mode === 'meld') return calcMeldOriginal(input);
  if (mode === 'meldNa') return calcMeldNa(input);
  if (mode === 'meld30') return calcMeld30(input);
  throw new Error('Неизвестный режим');
}

    var root = document.querySelector('.fc-calc[data-calculator="child-pugh"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-child-pugh-form');
  var calcBtn = root.querySelector('#fc-calc-child-pugh-btn');
  var formError = root.querySelector('#fc-calc-child-pugh-form-error');
  var resultWrap = root.querySelector('#fc-calc-child-pugh-result');
  var resultLabel = root.querySelector('#fc-calc-child-pugh-result-label');
  var resultNumber = root.querySelector('#fc-calc-child-pugh-result-number');
  var resultDesc = root.querySelector('#fc-calc-child-pugh-result-desc');
  var resultExtra = root.querySelector('#fc-calc-child-pugh-result-extra');
  var modeHint = root.querySelector('#fc-calc-child-pugh-mode-hint');
  var tabs = root.querySelectorAll('[data-mode-tab]');
  var panels = root.querySelectorAll('[data-mode-panel]');

  var MODE_HINTS = {
    childPugh:
      'Классификация тяжести цирроза по пяти клинико-лабораторным критериям (Child-Pugh).',
    meld: 'MELD до 2016 года: билирубин, МНО и креатинин (без натрия).',
    meldNa: 'MELD-Na: исходный MELD с коррекцией по натрию (стандарт UNOS/OPTN до MELD 3.0).',
    meld30:
      'MELD 3.0 (рекомендуется OPTN): возраст (<18 / ≥18), лаборатории; пол — только с 18 лет.',
  };

  var RESULT_LABELS = {
    childPugh: 'Результат Child-Pugh',
    meld: 'MELD (до 2016)',
    meldNa: 'MELD-Na',
    meld30: 'MELD 3.0',
  };

  var currentMode = 'childPugh';

  function getAgeGroup(group) {
    var seg = root.querySelector('[data-age-group="' + group + '"]');
    if (!seg) return 'ge18';
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-age') : 'ge18';
  }

  function getSex(group) {
    var seg = root.querySelector('[data-sex-group="' + group + '"]');
    if (!seg) return 'female';
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-sex') : 'female';
  }

  function getUnit(group) {
    var seg = root.querySelector('[data-unit-group="' + group + '"]');
    if (!seg) return null;
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-unit') : null;
  }

  function getDialysis(group) {
    var seg = root.querySelector('[data-dialysis-group="' + group + '"]');
    if (!seg) return false;
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-dialysis') === 'yes' : false;
  }

  function num(id) {
    var el = root.querySelector(id);
    if (!el) return null;
    var s = String(el.value || '').trim().replace(',', '.');
    if (!s) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : { error: true };
  }

  function buildChildPughInput() {
    var input = { mode: 'childPugh' };
    CRITERIA.forEach(function (criterion) {
      var checked = form.querySelector(
        'input[name="fc-calc-child-pugh-' + criterion.id + '"]:checked'
      );
      input[criterion.id] = checked ? checked.value : '';
    });
    return input;
  }

  function buildMeldInput(mode, prefix) {
    var bili = num('#fc-calc-child-pugh-' + prefix + '-bili');
    var creat = num('#fc-calc-child-pugh-' + prefix + '-creat');
    var inr = num('#fc-calc-child-pugh-' + prefix + '-inr');
    if (bili == null || bili.error || creat == null || creat.error || inr == null || inr.error) {
      return { mode: mode };
    }
    var input = {
      mode: mode,
      bilirubin: bili,
      bilirubinUnit: getUnit(prefix + '-bili') || 'umol',
      creatinine: creat,
      creatinineUnit: getUnit(prefix + '-creat') || 'umol',
      inr: inr,
      dialysis: getDialysis(prefix),
    };
    if (mode === 'meldNa' || mode === 'meld30') {
      var na = num('#fc-calc-child-pugh-' + prefix + '-na');
      if (na == null || na.error) return { mode: mode };
      input.sodium = na;
    }
    if (mode === 'meld30') {
      input.ageGroup = getAgeGroup(prefix);
      var alb = num('#fc-calc-child-pugh-' + prefix + '-alb');
      if (alb == null || alb.error) return { mode: mode };
      input.albumin = alb;
      input.albuminUnit = getUnit(prefix + '-alb') || 'gl';
      if (isMeld30Adult(input)) {
        input.sex = getSex(prefix);
      }
    }
    return input;
  }

  function updateMeld30SexVisibility() {
    var sexField = root.querySelector('#fc-calc-child-pugh-meld30-sex-field');
    if (!sexField) return;
    var show = isMeld30Adult({ ageGroup: getAgeGroup('meld30') });
    if (show) sexField.removeAttribute('hidden');
    else sexField.setAttribute('hidden', '');
  }

  function buildInput() {
    if (currentMode === 'childPugh') return buildChildPughInput();
    if (currentMode === 'meld') return buildMeldInput('meld', 'meld');
    if (currentMode === 'meldNa') return buildMeldInput('meldNa', 'meldna');
    if (currentMode === 'meld30') return buildMeldInput('meld30', 'meld30');
    return { mode: currentMode };
  }

  function canCalculate() {
    try {
      return isReady(buildInput());
    } catch (e) {
      return false;
    }
  }

  function updateBtn() {
    updateMeld30SexVisibility();
    var ok = canCalculate();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function setMode(mode) {
    currentMode = mode;
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-mode-tab') === mode;
      tab.classList.toggle('fc-calc__tab--active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-mode-panel') === mode;
      panel.classList.toggle('fc-calc__tab-panel--active', active);
      panel.hidden = !active;
    });
    if (modeHint && MODE_HINTS[mode]) modeHint.textContent = MODE_HINTS[mode];
    formError.textContent = '';
    clearResult();
    updateBtn();
  }

  function renderChildPugh(out) {
    resultLabel.textContent = RESULT_LABELS.childPugh;
    resultNumber.textContent = 'Класс ' + out.childClass;
    resultNumber.className =
      'fc-calc__result-number fc-calc__result-number--' + out.childClass;
    resultDesc.textContent = pluralBalls(out.total);
    var lines = [];
    if (out.lifeExpectancy) {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Продолжительность жизни:</strong> ' +
          out.lifeExpectancy +
          '</p>'
      );
    } else if (out.childClass === 'B') {
      lines.push(
        '<p class="fc-calc__cp-result-line">Значительное функциональное ухудшение.</p>'
      );
    }
    if (out.periopMortality) {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Периоперационная летальность при абдоминальных операциях:</strong> ' +
          out.periopMortality +
          '</p>'
      );
    }
    resultExtra.innerHTML = lines.length
      ? '<div class="fc-calc__cp-result-meta">' + lines.join('') + '</div>'
      : '';
  }

  function mortalityBadgeHtml(mort) {
    if (!mort) return '';
    return (
      '<div class="fc-calc__cp-mortality">' +
      '<p class="fc-calc__cp-mortality-value">' +
      '<span class="fc-calc__cp-mortality-num">' +
      mort.display +
      '</span><span class="fc-calc__cp-mortality-pct">%</span>' +
      '</p>' +
      '<p class="fc-calc__cp-mortality-label">Предполагаемая смертность за 3 месяца</p>' +
      '</div>'
    );
  }

  function survivalBadgeHtml(surv) {
    if (!surv) return '';
    return (
      '<div class="fc-calc__cp-mortality">' +
      '<p class="fc-calc__cp-mortality-value">' +
      '<span class="fc-calc__cp-mortality-num">' +
      surv.survivalDisplay +
      '</span><span class="fc-calc__cp-mortality-pct">%</span>' +
      '</p>' +
      '<p class="fc-calc__cp-mortality-label">Предполагаемая выживаемость за 90 дней</p>' +
      '</div>'
    );
  }

  function renderMeld(out) {
    resultLabel.textContent = RESULT_LABELS[out.mode] || 'MELD';
    resultNumber.textContent = String(out.score);
    resultNumber.className = 'fc-calc__result-number';
    resultDesc.textContent = pluralBalls(out.score);
    var lines = [];
    if (out.mode === 'meldNa' && out.meldBase != null) {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Исходный MELD:</strong> ' +
          out.meldBase +
          (out.sodiumApplied
            ? ' (применена коррекция по Na)'
            : ' (коррекция по Na не применяется при MELD ≤ 11)') +
          '</p>'
      );
    }
    if (out.mode === 'meld30') {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Ветка:</strong> ' +
          (out.adult
            ? 'взрослая (≥18 лет' +
              (out.female ? ', женский пол +1,33' : ', мужской пол') +
              ')'
            : 'до 18 лет (пол не учитывается)') +
          '</p>'
      );
    }
    if (out.dialysis) {
      lines.push(
        '<p class="fc-calc__cp-result-line">Учтён диализ: креатинин принят равным максимуму для формулы.</p>'
      );
    }
    lines.push(
      '<p class="fc-calc__cp-result-line">Балл ограничен диапазоном 6–40 (OPTN).</p>'
    );
    var badge =
      out.mode === 'meld30'
        ? survivalBadgeHtml(out.ninetyDaySurvival)
        : mortalityBadgeHtml(out.threeMonthMortality);
    resultExtra.innerHTML =
      badge + '<div class="fc-calc__cp-result-meta">' + lines.join('') + '</div>';
  }

  function renderResult(out) {
    if (out.mode === 'childPugh') renderChildPugh(out);
    else renderMeld(out);
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.getAttribute('data-mode-tab'));
    });
  });

  root.querySelectorAll('.fc-calc__segmented').forEach(function (seg) {
    seg.querySelectorAll('.fc-calc__segment').forEach(function (btn) {
      btn.addEventListener('click', function () {
        seg.querySelectorAll('.fc-calc__segment').forEach(function (b) {
          b.classList.remove('fc-calc__segment--active');
        });
        btn.classList.add('fc-calc__segment--active');
        clearResult();
        updateBtn();
      });
    });
  });

  form.querySelectorAll('input').forEach(function (el) {
    el.addEventListener('input', function () {
      clearResult();
      updateBtn();
    });
    el.addEventListener('change', function () {
      clearResult();
      updateBtn();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.textContent = '';
    try {
      var out = calculate(buildInput());
      renderResult(out);
    } catch (err) {
      clearResult();
      formError.textContent = err.message || 'Проверьте введённые данные';
    }
  });

  setMode('childPugh');

})();