/**
 * Гериатрическая шкала депрессии (GDS).
 * @see https://medsoftpro.ru/kalkulyatory/heriatr-depression-scale
 */

export const GDS_ITEMS = [
  {
    id: 'g1',
    label: '1. Довольны ли Вы в целом жизнью?',
    options: [
      { value: 0, text: 'да' },
      { value: 1, text: 'нет' },
    ],
  },
  {
    id: 'g2',
    label: '2. От многих ли занятий и форм проведения досуга Вы отказались?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g3',
    label: '3. Есть ли у Вас чувство, что Ваша жизнь пуста?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g4',
    label: '4. Вы часто скучаете?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g5',
    label: '5. У Вас обычно хорошее настроение?',
    options: [
      { value: 0, text: 'да' },
      { value: 1, text: 'нет' },
    ],
  },
  {
    id: 'g6',
    label: '6. Боитесь ли Вы, что с Вами произойдет что-то плохое?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g7',
    label: '7. Ощущаете ли Вы себя по большей части удовлетворенным человеком?',
    options: [
      { value: 0, text: 'да' },
      { value: 1, text: 'нет' },
    ],
  },
  {
    id: 'g8',
    label: '8. Часто ли Вы чувствуете себя беспомощным?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g9',
    label: '9. Предпочитаете ли Вы остаться дома или выйти на прогулку за новыми впечатлениями?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g10',
    label: '10. Считаете ли Вы, что у Вас память хуже, чем у большинства людей?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g11',
    label: '11. Считаете ли Вы, что сейчас жить хорошо?',
    options: [
      { value: 0, text: 'да' },
      { value: 1, text: 'нет' },
    ],
  },
  {
    id: 'g12',
    label: '12. Чувствуете ли Вы себя в данный момент ненужным?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g13',
    label: '13. Ощущаете ли Вы себя полным энергии?',
    options: [
      { value: 0, text: 'да' },
      { value: 1, text: 'нет' },
    ],
  },
  {
    id: 'g14',
    label: '14. Есть ли у Вас ощущение, что Ваше положение безнадежно?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
  {
    id: 'g15',
    label: '15. Считаете ли Вы, что большинству людей живется лучше, чем Вам?',
    options: [
      { value: 1, text: 'да' },
      { value: 0, text: 'нет' },
    ],
  },
];

export const GDS_INTERPRETATION_ROWS = [
  { label: 'Нет признаков депрессии', range: 'менее 6' },
  { label: 'Обнаруживаются признаки депрессии', range: '6 и более' },
];
