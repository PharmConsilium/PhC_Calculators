/**
 * years-pe — pure calculation (import in tests)
 * Source: YEARS algorithm for suspected pulmonary embolism.
 */

function asYes(value) {
  return value === true || value === 1 || value === 'yes';
}

function countYearsItems(input) {
  return [
    asYes(input.clinicalSignsDvt),
    asYes(input.hemoptysis),
    asYes(input.peMostLikely),
  ].filter(Boolean).length;
}

function getThreshold(yearsItems) {
  return yearsItems === 0 ? 1000 : 500;
}

export function calculate(input) {
  const pregnant = asYes(input.pregnant);
  const clinicalSignsDvt = asYes(input.clinicalSignsDvt);
  const dvtFound = asYes(input.dvtFound);
  const components = {
    clinicalSignsDvt: clinicalSignsDvt ? 1 : 0,
    hemoptysis: asYes(input.hemoptysis) ? 1 : 0,
    peMostLikely: asYes(input.peMostLikely) ? 1 : 0,
  };

  const yearsItems = countYearsItems(input);
  if (pregnant && clinicalSignsDvt && dvtFound) {
    return {
      value: 'ТГВ выявлен',
      route: 'dvt-found',
      peExcluded: false,
      yearsItems,
      threshold: null,
      dDimerAtOrAboveThreshold: null,
      dvtFound: true,
      interpretation: 'Компрессионное УЗИ симптомной конечности выявило тромбоз глубоких вен. Диагноз ВТЭО считается установленным; дальнейшая визуализация для исключения ТЭЛА не требуется.',
      pregnancyNote: 'Начните антикоагулянтную терапию после оценки риска кровотечения.',
      components,
    };
  }

  const threshold = getThreshold(yearsItems);
  const dDimerAtOrAboveThreshold = asYes(input.dDimerAtOrAboveThreshold);
  const peExcluded = !dDimerAtOrAboveThreshold;
  const value = peExcluded ? 'ТЭЛА исключена' : 'ТЭЛА не исключена';
  const route = peExcluded ? 'years-excluded' : 'years-not-excluded';
  const interpretation = peExcluded
    ? 'Алгоритм YEARS исключает ТЭЛА (0,43% симптомных ВТЭО за 3 месяца наблюдения)'
    : 'Алгоритм YEARS не исключает ТЭЛА; показана КТ-ангиопульмонография или вентиляционно-перфузионное сканирование при наличии показаний';
  const pregnancyNote = pregnant && components.clinicalSignsDvt
    ? 'У беременной пациентки с клиническими признаками ТГВ сначала выполните компрессионное УЗИ симптомной конечности.'
    : '';

  return {
    value,
    route,
    peExcluded,
    yearsItems,
    threshold,
    dDimerAtOrAboveThreshold,
    dvtFound: false,
    interpretation,
    pregnancyNote,
    components,
  };
}
