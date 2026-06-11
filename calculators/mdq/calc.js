/**
 * mdq — Mood Disorder Questionnaire (MDQ)
 * Source: Hirschfeld RM et al., Am J Psychiatry 2000; MDCalc MDQ calculator.
 */

export const SYMPTOM_THRESHOLD = 7;

export const SYMPTOMS = [
  {
    id: 'hyperOrTrouble',
    label:
      'вы чувствовали себя настолько хорошо или «на взводе», что окружающие считали, что вы «не в себе», или были настолько возбуждены, что попадали в неприятности',
  },
  {
    id: 'irritable',
    label: 'вы были настолько раздражительны, что кричали на людей или ввязывались в драки или споры',
  },
  {
    id: 'selfConfident',
    label: 'вы чувствовали себя намного увереннее в себе, чем обычно',
  },
  {
    id: 'lessSleep',
    label: 'вы спали намного меньше обычного и при этом не ощущали недостатка сна',
  },
  {
    id: 'talkative',
    label: 'вы были намного разговорчивее или говорили быстрее обычного',
  },
  {
    id: 'racingThoughts',
    label: 'мысли неслись в голове, и вы не могли «затормозить»',
  },
  {
    id: 'distracted',
    label:
      'вас так легко отвлекало окружение, что было трудно сосредоточиться или удерживать внимание',
  },
  {
    id: 'moreEnergy',
    label: 'у вас было намного больше энергии, чем обычно',
  },
  {
    id: 'moreActive',
    label: 'вы были намного активнее или делали намного больше дел, чем обычно',
  },
  {
    id: 'moreSocial',
    label:
      'вы были намного общительнее, чем обычно (например, звонили друзьям среди ночи)',
  },
  {
    id: 'moreSex',
    label: 'вас интересовал секс намного больше, чем обычно',
  },
  {
    id: 'unusualRisky',
    label:
      'вы делали необычные для себя вещи, которые другие могли счесть чрезмерными, глупыми или рискованными',
  },
  {
    id: 'spendingTrouble',
    label: 'траты денег создавали проблемы вам или вашей семье',
  },
];

export const PROBLEM_LEVELS = [
  { id: 'none', label: 'Нет проблем' },
  { id: 'minor', label: 'Незначительные проблемы' },
  { id: 'moderate', label: 'Умеренные проблемы' },
  { id: 'serious', label: 'Серьёзные проблемы' },
];

function asYes(value) {
  return value === true || value === 1 || value === 'yes';
}

function parseProblemLevel(value) {
  const allowed = new Set(PROBLEM_LEVELS.map((level) => level.id));
  if (!allowed.has(value)) {
    throw new Error('Invalid problemLevel');
  }
  return value;
}

function isSignificantProblem(problemLevel) {
  return problemLevel === 'moderate' || problemLevel === 'serious';
}

export function calculate(input) {
  const components = {};
  let score = 0;

  for (const symptom of SYMPTOMS) {
    const points = asYes(input[symptom.id]) ? 1 : 0;
    components[symptom.id] = points;
    score += points;
  }

  const problemLevel = parseProblemLevel(input.problemLevel);
  const symptomatic = score >= SYMPTOM_THRESHOLD;
  const significantProblem = isSignificantProblem(problemLevel);
  const positiveScreen = symptomatic && significantProblem;

  return {
    value: score,
    score,
    problemLevel,
    symptomatic,
    significantProblem,
    positiveScreen,
    interpretation: positiveScreen
      ? 'Положительный скрининг MDQ'
      : 'Отрицательный скрининг MDQ',
    components,
  };
}
