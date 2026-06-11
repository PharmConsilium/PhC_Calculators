/**
 * years-pe — pure calculation (import in tests)
 * Source: YEARS algorithm for suspected pulmonary embolism.
 */

function asYes(value) {
  return value === true || value === 1 || value === 'yes';
}

export function calculate(input) {
  const pregnant = asYes(input.pregnant);
  const clinicalSignsDvt = asYes(input.clinicalSignsDvt);
  const components = {
    clinicalSignsDvt: clinicalSignsDvt ? 1 : 0,
    hemoptysis: asYes(input.hemoptysis) ? 1 : 0,
    peMostLikely: asYes(input.peMostLikely) ? 1 : 0,
  };

  const yearsItems = Object.values(components).reduce((sum, value) => sum + value, 0);
  const threshold = yearsItems === 0 ? 1000 : 500;
  const dDimerAtOrAboveThreshold = asYes(input.dDimerAtOrAboveThreshold);
  const peExcluded = !dDimerAtOrAboveThreshold;
  const value = peExcluded ? 'ТЭЛА исключена' : 'ТЭЛА не исключена';
  const interpretation = peExcluded
    ? 'Алгоритм YEARS исключает ТЭЛА (0,43% симптомных ВТЭО за 3 месяца наблюдения)'
    : 'Алгоритм YEARS не исключает ТЭЛА; показана КТ-ангиопульмонография или V/Q-сканирование при наличии показаний';
  const pregnancyNote = pregnant && components.clinicalSignsDvt
    ? 'У беременной пациентки с клиническими признаками DVT сначала выполните компрессионное УЗИ симптомной конечности.'
    : '';

  return {
    value,
    peExcluded,
    yearsItems,
    threshold,
    dDimerAtOrAboveThreshold,
    interpretation,
    pregnancyNote,
    components,
  };
}
