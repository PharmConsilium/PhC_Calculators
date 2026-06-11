/**
 * Шкала Caprini — риск ВТЭО у хирургических пациентов.
 * @see https://medsoftpro.ru/kalkulyatory/caprini-scale
 */

export const GROUPS = [
  {
    id: 'age',
    number: 1,
    label: 'Возраст',
    type: 'radio',
    required: true,
    options: [
      { id: 'age41', points: 1, label: 'возраст 41 - 60 лет' },
      { id: 'age61', points: 2, label: 'возраст 61 - 74 года' },
      { id: 'age75', points: 3, label: 'возраст старше 75 лет' },
    ],
  },
  {
    id: 'surgery',
    number: 2,
    label: 'Плановое хирургическое вмешательство',
    type: 'radio',
    required: true,
    options: [
      { id: 'surgeryMinor', points: 1, label: 'малое хирургическое вмешательство (менее 60 мин.)' },
      { id: 'surgeryMajor', points: 2, label: 'большое хирургическое вмешательство (более 60 мин.)' },
    ],
  },
  {
    id: 'heart',
    number: 3,
    label: 'Болезни сердца',
    type: 'checkbox',
    options: [
      { id: 'mi', points: 1, label: 'острый инфаркт миокарда' },
      { id: 'chf', points: 1, label: 'хроническая сердечная недостаточность (давностью до 1 мес)' },
    ],
  },
  {
    id: 'vte',
    number: 4,
    label: 'Венозные тромбоэмболические осложнения',
    type: 'checkbox',
    options: [
      { id: 'vtePersonal', points: 3, label: 'личный анамнез ВТЭО' },
      { id: 'vteFamily', points: 3, label: 'семейный анамнез ВТЭО' },
    ],
  },
  {
    id: 'lungs',
    number: 5,
    label: 'Болезни лёгких',
    type: 'checkbox',
    options: [
      { id: 'lungSerious', points: 1, label: 'серьезное заболевание лёгких (в т.ч. пневмония давностью до 1 мес.)' },
      { id: 'copd', points: 1, label: 'хроническая обструктивная болезнь лёгких' },
    ],
  },
  {
    id: 'mutations',
    number: 6,
    label: 'Мутации',
    type: 'checkbox',
    options: [
      { id: 'leiden', points: 3, label: 'мутация типа Лейден' },
      { id: 'prothrombin', points: 3, label: 'мутация протромбина 20210А' },
    ],
  },
  {
    id: 'trauma',
    number: 7,
    label: 'Травмы',
    type: 'checkbox',
    options: [
      { id: 'polytrauma', points: 5, label: 'множественная травма (давностью до 1 мес.)' },
      { id: 'legFracture', points: 5, label: 'перелом костей бедра и голени (давностью до 1 мес)' },
      { id: 'spinalTrauma', points: 5, label: 'травма спинного мозга/паралич (давностью до 1 мес)' },
    ],
  },
  {
    id: 'other',
    number: 8,
    label: 'остальное',
    type: 'checkbox',
    options: [
      { id: 'sepsis', points: 1, label: 'сепсис (давностью до 1 мес.)' },
      { id: 'edema', points: 1, label: 'отек нижних конечностей' },
      { id: 'varicose', points: 1, label: 'варикозные вены' },
      { id: 'bmi25', points: 1, label: 'индекс массы тела более 25 кг/м²' },
      { id: 'ocp', points: 1, label: 'прием оральных контрацептивов, гормонозаместительная терапия' },
      { id: 'pregnancy', points: 1, label: 'беременность и послеродовый период (до 1 мес)' },
      {
        id: 'obstetricHistory',
        points: 1,
        label:
          'в анамнезе: необъяснимые мертворождения, выкидыши (≥3), преждевременные роды с токсикозом или задержка внутриутробного развития',
      },
      { id: 'bedRest', points: 1, label: 'постельный режим у нехирургического пациента' },
      { id: 'ibd', points: 1, label: 'воспалительные заболевания толстой кишки в анамнезе' },
      { id: 'arthroscopy', points: 2, label: 'артроскопическая хирургия' },
      { id: 'malignancy', points: 2, label: 'злокачественное новообразование' },
      { id: 'laparoscopy', points: 2, label: 'лапароскопическое вмешательство (длительностью более 45 мин)' },
      { id: 'bedRest72', points: 2, label: 'постельный режим более 72 ч' },
      { id: 'cvc', points: 2, label: 'катетеризация центральных вен' },
      { id: 'hyperhomocysteine', points: 3, label: 'гипергомоцистеинемия' },
      { id: 'hit', points: 3, label: 'гепарининдуцированная тромбоцитопения' },
      { id: 'anticardiolipin', points: 3, label: 'повышенный уровень антител к кардиолипину' },
      { id: 'lupusAc', points: 3, label: 'волчаночный антикоагулянт' },
      { id: 'stroke', points: 5, label: 'инсульт (давностью до 1 мес)' },
      { id: 'jointReplacement', points: 5, label: 'эндопротезирование крупных суставов' },
    ],
  },
];

export const INTERPRETATION_ROWS = [
  { label: 'Низкий риск', range: 'менее 1' },
  { label: 'Умеренный риск', range: 'от 2 до 2' },
  { label: 'Высокий риск', range: 'от 3 до 4' },
  { label: 'Очень высокий риск', range: 'более 5' },
];

/** medsoftpro: {res}0|1 … {res}5|100 */
export function interpretCaprini(total) {
  if (total >= 5) return { category: 'very-high', label: 'Очень высокий риск' };
  if (total >= 3) return { category: 'high', label: 'Высокий риск' };
  if (total === 2) return { category: 'moderate', label: 'Умеренный риск' };
  return { category: 'low', label: 'Низкий риск' };
}

function sumGroupPoints(group, input) {
  if (group.type === 'radio') {
    const opt = group.options.find((o) => input[group.id] === o.id);
    return opt ? opt.points : 0;
  }
  return group.options.reduce((sum, opt) => sum + (input[opt.id] ? opt.points : 0), 0);
}

export function capriniScore(input) {
  const data = input || {};
  for (const group of GROUPS) {
    if (!group.required) continue;
    if (!group.options.some((opt) => data[group.id] === opt.id)) {
      return { status: 'INVALID', missing: group.id };
    }
  }

  let total = 0;
  for (const group of GROUPS) {
    total += sumGroupPoints(group, data);
  }

  const risk = interpretCaprini(total);

  return {
    status: 'OK',
    total,
    category: risk.category,
    interpretation: risk.label,
  };
}

export function calculate(input) {
  const out = capriniScore(input);
  if (out.status !== 'OK') throw new Error('Выберите возраст и плановое хирургическое вмешательство');
  return out;
}
