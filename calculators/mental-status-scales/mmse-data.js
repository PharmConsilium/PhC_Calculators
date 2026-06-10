/**
 * Шкала MMSE (Mini-Mental State Examination).
 * @see https://medsoftpro.ru/kalkulyatory/mini-mental-state-examination
 */

export const MMSE_SECTIONS = [
  {
    id: 'time',
    title: '1. Ориентация во времени',
    items: [
      { id: 'm1', label: 'Год', hint: 'Правильно назвал текущий год' },
      { id: 'm2', label: 'Месяц', hint: 'Правильно назвал текущий месяц' },
      { id: 'm3', label: 'Время года', hint: 'Правильно назвал текущее время года' },
      { id: 'm4', label: 'Сегодняшнее число', hint: 'Правильно назвал текущее число' },
      { id: 'm5', label: 'День недели', hint: 'Правильно назвал текущий день недели' },
    ],
  },
  {
    id: 'place',
    title: '2. Ориентация в месте',
    items: [
      { id: 'm6', label: 'Страна', hint: 'Правильно назвал страну' },
      { id: 'm7', label: 'Здание (название или функция)', hint: 'Правильно назвал здание или его функцию' },
      { id: 'm8', label: 'Город/область', hint: 'Правильно назвал город или область' },
      { id: 'm9', label: 'Этаж здания (номер кабинета, адрес)', hint: 'Правильно назвал этаж, кабинет или адрес' },
      { id: 'm10', label: 'Улица (квартал)', hint: 'Правильно назвал улицу или квартал' },
    ],
  },
  {
    id: 'recall-immediate',
    title: '3. Запоминание 3 слов',
    items: [
      { id: 'm11', label: 'Яблоко', hint: "Запомнил и повторил слово «Яблоко»" },
      { id: 'm12', label: 'Копейка', hint: "Запомнил и повторил слово «Копейка»" },
      { id: 'm13', label: 'Стол', hint: "Запомнил и повторил слово «Стол»" },
    ],
  },
  {
    id: 'attention',
    title: '4. Серийное вычитание 7 из 100',
    items: [
      { id: 'm14', label: '93 (100 − 7)', hint: 'Правильно вычел 7 из 100 = 93' },
      { id: 'm15', label: '79 (86 − 7)', hint: 'Правильно вычел 7 из 86 = 79' },
      { id: 'm16', label: '65 (72 − 7)', hint: 'Правильно вычел 7 из 72 = 65' },
      { id: 'm17', label: '86 (93 − 7)', hint: 'Правильно вычел 7 из 93 = 86' },
      { id: 'm18', label: '72 (79 − 7)', hint: 'Правильно вычел 7 из 79 = 72' },
    ],
  },
  {
    id: 'recall-delayed',
    title: '5. Воспроизведение 3 слов',
    items: [
      { id: 'm19', label: 'Яблоко (вспомнил)', hint: "Вспомнил и назвал слово «Яблоко»" },
      { id: 'm20', label: 'Копейка (вспомнил)', hint: "Вспомнил и назвал слово «Копейка»" },
      { id: 'm21', label: 'Стол (вспомнил)', hint: "Вспомнил и назвал слово «Стол»" },
    ],
  },
  {
    id: 'naming',
    title: '6. Называние предметов',
    items: [
      { id: 'm22', label: 'Часы', hint: "Правильно назвал «Часы»" },
      { id: 'm23', label: 'Ручка или карандаш', hint: "Правильно назвал «Ручка» или «Карандаш»" },
    ],
  },
  {
    id: 'repetition',
    title: '7. Повторение фразы',
    items: [
      {
        id: 'm24',
        label: "Никаких «ЕСЛИ», «И» или «НО»",
        hint: 'Правильно повторил всю фразу',
      },
    ],
  },
  {
    id: 'command',
    title: '8. Выполнение 3-этапной команды',
    items: [
      { id: 'm25', label: 'Взять листок бумаги в правую руку', hint: 'Выполнил первый этап команды' },
      { id: 'm26', label: 'Сложить листок пополам', hint: 'Выполнил второй этап команды' },
      { id: 'm27', label: 'Положить листок на стол', hint: 'Выполнил третий этап команды' },
    ],
  },
  {
    id: 'reading',
    title: '9. Выполнение письменной команды',
    items: [
      { id: 'm28', label: 'Закройте глаза', hint: "Выполнил письменную команду «Закройте глаза»" },
    ],
  },
  {
    id: 'writing',
    title: '10. Написание предложения',
    items: [
      { id: 'm29', label: 'Предложение правильное', hint: 'Написал грамматически правильное предложение' },
    ],
  },
  {
    id: 'drawing',
    title: '11. Копирование рисунка',
    items: [
      {
        id: 'm30',
        label: 'Правильно скопировал рисунок',
        hint: 'Рисунок содержит два пересекающихся пятиугольника',
      },
    ],
  },
];

export const MMSE_MAX = 30;

export const MMSE_SCREENING_ROWS = [
  { label: 'Патология (скрининг)', range: '< 24' },
  { label: 'Норма (скрининг)', range: '24–30' },
];

export const MMSE_EDUCATION_ROWS = [
  { label: 'Патология при образовании ≤ 9 классов', range: '≤ 21' },
  { label: 'Патология при среднем профессиональном образовании', range: '≤ 23' },
  { label: 'Патология при высшем образовании', range: '≤ 24' },
];

export const MMSE_SEVERITY_ROWS = [
  { label: 'Выраженные когнитивные нарушения (тяжёлая деменция)', range: '0–17' },
  { label: 'Умеренные когнитивные нарушения (лёгкая/умеренная деменция)', range: '18–23' },
  { label: 'Лёгкие когнитивные нарушения или норма', range: '24–30' },
];

export const MMSE_ALZHEIMER_ROWS = [
  { label: 'Продромальная стадия (лёгкие когнитивные нарушения)', range: '25–30' },
  { label: 'Лёгкая деменция', range: '21–24' },
  { label: 'Умеренная деменция', range: '10–20' },
  { label: 'Тяжёлая деменция', range: '0–9' },
];

export function allMmseItemIds() {
  return MMSE_SECTIONS.flatMap((section) => section.items.map((item) => item.id));
}

export function getMmseSimpleInterpretation(total) {
  return total < 24
    ? { text: 'Патология', details: 'Наличие когнитивных нарушений' }
    : { text: 'Норма', details: 'Когнитивные нарушения не выявлены' };
}

export function getMmseRankInterpretation(total) {
  if (total < 21) {
    return {
      text: 'Повышенные шансы деменции',
      details: 'Высокая вероятность деменции, требуется углубленное обследование',
    };
  }
  if (total > 25) {
    return { text: 'Пониженные шансы деменции', details: 'Низкая вероятность деменции' };
  }
  return {
    text: 'Пограничное состояние',
    details: 'Неопределённый результат, требуется наблюдение',
  };
}

export function getMmseEducationInterpretation(total) {
  return {
    school: total < 21 ? 'Патология (балл < 21)' : 'Норма (балл ≥ 21)',
    college: total < 23 ? 'Патология (балл < 23)' : 'Норма (балл ≥ 23)',
    university: total < 24 ? 'Патология (балл < 24)' : 'Норма (балл ≥ 24)',
  };
}

export function getMmseSeverityInterpretation(total) {
  if (total <= 17) {
    return {
      text: 'Выраженные когнитивные нарушения',
      details: 'Тяжёлые нарушения когнитивных функций',
    };
  }
  if (total >= 18 && total <= 23) {
    return {
      text: 'Лёгкие когнитивные нарушения',
      details: 'Умеренные нарушения когнитивных функций',
    };
  }
  return { text: 'Нет когнитивных нарушений', details: 'Когнитивные функции в норме' };
}

export function getMmseAlzheimersInterpretation(total) {
  if (total >= 25 && total <= 30) {
    return {
      text: 'Продромальная стадия',
      details: 'Преддементная стадия, могут быть субъективные жалобы',
    };
  }
  if (total >= 21 && total <= 24) {
    return { text: 'Лёгкая деменция', details: 'Ранняя стадия деменции' };
  }
  if (total >= 10 && total <= 20) {
    return {
      text: 'Умеренно-выраженная деменция',
      details: 'Средняя стадия деменции',
    };
  }
  return { text: 'Выраженная деменция', details: 'Поздняя стадия деменции' };
}

export function getMmseInterpretations(total) {
  return {
    simple: getMmseSimpleInterpretation(total),
    rank: getMmseRankInterpretation(total),
    education: getMmseEducationInterpretation(total),
    severity: getMmseSeverityInterpretation(total),
    alzheimers: getMmseAlzheimersInterpretation(total),
  };
}

export function getMmseCategory(total) {
  if (total <= 17) return 'severe';
  if (total <= 23) return 'moderate';
  return 'normal';
}
