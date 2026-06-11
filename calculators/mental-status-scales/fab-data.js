/**
 * Батарея лобной дисфункции (FAB).
 * @see https://medsoftpro.ru/kalkulyatory/frontal-assessment-battery
 */

export const FAB_FLUENCY = {
  id: 'fab2_words',
  label: '2. Беглость речи',
  hint: 'Количество названных слов на букву «С» за 1 минуту (имена собственные не засчитываются)',
};

export const FAB_RADIO_ITEMS = [
  {
    id: 'fab1',
    label: '1. Концептуализация',
    hint: '«Что общего между яблоком и грушей?», «…пальто и курткой?», «…столом и стулом?»',
    options: [
      { value: 3, text: 'Обобщил все 3 категории (Яблоко/Груша, Пальто/Куртка, Стол/Стул)' },
      { value: 2, text: 'Обобщил 2 категории из 3' },
      { value: 1, text: 'Обобщил только 1 категорию из 3' },
      { value: 0, text: 'Не может обобщить даже после подсказки' },
    ],
  },
  {
    id: 'fab3',
    label: '3. Динамический праксис',
    hint: 'Серия движений: кулак — ребро — ладонь (наблюдение, повторение с врачом, 2 самостоятельные серии)',
    options: [
      { value: 3, text: 'Правильное выполнение трёх серий' },
      { value: 2, text: 'Правильное выполнение двух серий' },
      { value: 1, text: 'Правильное выполнение одной серии' },
      { value: 0, text: 'Не может выполнить три правильные серии даже с помощью врача' },
    ],
  },
  {
    id: 'fab4',
    label: '4. Простая реакция выбора',
    hint: 'Ритм 1–1–2–1–2–2–2–1–1–2: 1 удар → 2 удара; 2 удара → 1 удар',
    options: [
      { value: 3, text: 'Правильное выполнение (без ошибок)' },
      { value: 2, text: 'Не более 2 ошибок' },
      { value: 1, text: 'Много ошибок (>3)' },
      { value: 0, text: 'Персеверативное повторение ритма за врачом не менее 4 раз' },
    ],
  },
  {
    id: 'fab5',
    label: '5. Усложнённая реакция выбора',
    hint: 'Ритм 1–1–2–1–2–2–2–1–1–2: 1 удар → ничего; 2 удара → 1 удар',
    options: [
      { value: 3, text: 'Правильное выполнение (без ошибок)' },
      { value: 2, text: 'Не более 2 ошибок' },
      { value: 1, text: 'Много ошибок (>3)' },
      { value: 0, text: 'Персеверативное повторение ритма за врачом не менее 4 раз' },
    ],
  },
  {
    id: 'fab6',
    label: '6. Исследование хватательных рефлексов',
    hint: 'Руки на коленях ладонями вверх, проверка хватательного рефлекса',
    options: [
      { value: 3, text: 'Отсутствие хвата' },
      { value: 2, text: 'Попросил охватить или отказался хватать' },
      { value: 1, text: 'При повторном тесте после запрета хват отсутствует' },
      { value: 0, text: 'Снова схватил' },
    ],
  },
];

export const FAB_INTERPRETATION_ROWS = [
  { label: 'Норма. Лобные функции сохранны', range: '15–18' },
  { label: 'Умеренная лобная дисфункция', range: '12–14' },
  { label: 'Выраженная лобная дисфункция', range: '< 12' },
];

export const FAB_FLUENCY_SCORING_ROWS = [
  { label: '3 балла', range: '> 9 слов' },
  { label: '2 балла', range: '7–9 слов' },
  { label: '1 балл', range: '4–6 слов' },
  { label: '0 баллов', range: '< 4 слов' },
];

export function scoreFabFluency(wordCount) {
  const n = Number(wordCount);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 9) return 3;
  if (n >= 7) return 2;
  if (n >= 4) return 1;
  return 0;
}

export function interpretFabResult(total) {
  if (total <= 12) {
    return {
      category: 'severe',
      title: '⚠️ Подозрение на лобную дисфункцию',
      details: 'Требуется углубленное нейропсихологическое обследование',
      interpretation: 'Подозрение на лобную дисфункцию',
    };
  }
  if (total <= 15) {
    return {
      category: 'moderate',
      title: '⚠️ Сомнительные результаты / Пограничное состояние',
      details: '',
      interpretation: 'Сомнительные результаты / Пограничное состояние',
    };
  }
  return {
    category: 'normal',
    title: '✅ Норма когнитивных функций (лобных долей)',
    details: '',
    interpretation: 'Норма когнитивных функций (лобных долей)',
  };
}

export function buildFabBreakdown(input) {
  const fluencyWords = Number(input[FAB_FLUENCY.id]);
  const fluencyScore = scoreFabFluency(fluencyWords);

  const byId = Object.fromEntries(
    FAB_RADIO_ITEMS.map((item) => [item.id, Number(input[item.id]) || 0])
  );

  const selectedLabels = Object.fromEntries(
    FAB_RADIO_ITEMS.map((item) => {
      const value = Number(input[item.id]);
      const option = item.options.find((opt) => opt.value === value);
      return [item.id, option?.text ?? ''];
    })
  );

  return {
    concept: byId.fab1,
    conceptLabel: selectedLabels.fab1,
    fluency: fluencyScore ?? 0,
    fluencyWords,
    fluencyLabel: fluencyScore === null ? '' : `${fluencyWords} слов на «С»`,
    praxis: byId.fab3,
    praxisLabel: selectedLabels.fab3,
    simple: byId.fab4,
    simpleLabel: selectedLabels.fab4,
    complex: byId.fab5,
    complexLabel: selectedLabels.fab5,
    reflex: byId.fab6,
    reflexLabel: selectedLabels.fab6,
  };
}

export function allFabRequiredIds() {
  return [...FAB_RADIO_ITEMS.map((item) => item.id), FAB_FLUENCY.id];
}
