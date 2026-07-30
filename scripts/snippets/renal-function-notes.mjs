/**
 * Примечание renal-function — порт из Calculators_MobileApp
 * (renal-function-notes.ts + clinical-notes renal-function).
 */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** **bold** and _italic_ → HTML; bullet lines stay as text for wrapping in ul later */
function inlineMd(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}

function paragraphsToHtml(paragraphs) {
  const parts = [];
  let listItems = [];

  function flushList() {
    if (!listItems.length) return;
    parts.push(
      `<ul class="fc-calc__rf-bullets">${listItems
        .map(
          (t) =>
            `<li class="fc-calc__rf-bullet-item"><span class="fc-calc__rf-bullet" aria-hidden="true">•</span><span class="fc-calc__rf-bullet-text">${inlineMd(
              t.replace(/^•\s*/, '')
            )}</span></li>`
        )
        .join('')}</ul>`
    );
    listItems = [];
  }

  for (const raw of paragraphs) {
    const t = String(raw).trim();
    if (!t) continue;
    if (t.startsWith('• ')) {
      listItems.push(t);
      continue;
    }
    flushList();
    if (/^\*\*[^*]+\*\*$/.test(t) || (t.startsWith('**') && t.endsWith('**') && !t.includes('\n'))) {
      const title = t.replace(/^\*\*/, '').replace(/\*\*$/, '');
      parts.push(`<h4>${inlineMd(title)}</h4>`);
      continue;
    }
    parts.push(`<p>${inlineMd(t)}</p>`);
  }
  flushList();
  return parts.join('\n');
}

function tableToHtml(table) {
  const head = table.heading ? `<h4>${esc(table.heading)}</h4>` : '';
  const thead = `<thead><tr>${table.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${table.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`
    )
    .join('')}</tbody>`;
  return `${head}<div class="fc-calc__table-wrap"><table class="fc-calc__table">${thead}${tbody}</table></div>`;
}

const FORMULA_BLOCKS = [
  {
    type: 'text',
    paragraphs: [
      'Современные рекомендации FDA, NKF предлагают использовать eGFR вместо eCrCL (Cockcroft-Gault). При этом предпочтение отдается расово-независимым формулам eGFR с корректировкой на площадь поверхности тела пациента (eGFR(BSAadj)).',
      '**СКФ креатинин (CKD-EPIcr 2021)**',
      'Уравнение CKD-EPI eGFRcr 2021 года для оценки СКФ, выраженное для указанного пола и уровня креатинина в сыворотке (в обычных единицах).',
      '**SCr** = стандартизированный уровень креатинина в сыворотке крови (мг/дл).',
      '**κ** = 0,7 (женщины) или 0,9 (мужчины)',
      '**α** = −0,241 (женщины) или −0,302 (мужчины)',
      '**min(SCr/κ, 1)** — минимум SCr/κ или 1,0.',
      '**max(SCr/κ, 1)** — максимум SCr/κ или 1,0.',
      'Возраст — в годах (≥ 18).',
      'Общая формула: eGFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^−1,200 × 0,9938^возраст × [1,012 для женщин].',
    ],
  },
  {
    type: 'table',
    table: {
      heading: 'CKD-EPI eGFRcr 2021 по полу и креатинину',
      columns: ['Пол', 'SCr (мг/дл)', 'Уравнение (возраст ≥ 18 лет)'],
      rows: [
        ['женский', '≤ 0,7', 'СКФ = 142 × (SCr/0,7)^−0,241 × 0,9938^возраст × 1,012'],
        ['женский', '> 0,7', 'СКФ = 142 × (SCr/0,7)^−1,200 × 0,9938^возраст × 1,012'],
        ['мужской', '≤ 0,9', 'СКФ = 142 × (SCr/0,9)^−0,302 × 0,9938^возраст'],
        ['мужской', '> 0,9', 'СКФ = 142 × (SCr/0,9)^−1,200 × 0,9938^возраст'],
      ],
    },
  },
  {
    type: 'text',
    paragraphs: [
      '**Коэффициенты пересчёта СКФ**',
      '• СКФ мл/мин/1,73 м² → мл/с/1,73 м²: умножить на 0,0167',
      '• Креатинин мкмоль/л → мг/дл: разделить на 88,4',
      '**СКФ креатинин–цистатин (CKD-EPIcr-cys 2021)**',
      'Уравнение CKD-EPI eGFRcr-cys 2021 года рассчитывает скорость клубочковой фильтрации (eGFR) с использованием возраста, пола, уровня креатинина в сыворотке крови и уровня цистатина C в сыворотке крови.',
      '**Сокращения / единицы**',
      '• **eGFR** — расчётная СКФ, мл/мин/1,73 м²',
      '• **SCr** — стандартизированный креатинин сыворотки, мг/дл',
      '• **Scys** — стандартизированный цистатин C сыворотки, мг/л',
      '• **κ** = 0,7 (женщины) или 0,9 (мужчины)',
      '• **α** = −0,219 (женщины) или −0,144 (мужчины)',
      '• **min / max** — минимум / максимум SCr/κ или 1',
      '• Возраст — в годах (≥ 18)',
      'Общая формула: eGFR = 135 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^−0,544 × min(Scys/0,8, 1)^−0,323 × max(Scys/0,8, 1)^−0,778 × 0,9961^возраст × [0,963 для женщин].',
    ],
  },
  {
    type: 'table',
    table: {
      heading: 'CKD-EPI eGFRcr-cys 2021 по полу, креатинину и цистатину C',
      columns: ['Пол', 'SCr (мг/дл)', 'Scys (мг/л)', 'Уравнение (возраст ≥ 18 лет)'],
      rows: [
        ['женский', '≤ 0,7', '≤ 0,8', 'СКФ = 135 × (SCr/0,7)^−0,219 × (Scys/0,8)^−0,323 × 0,9961^возраст × 0,963'],
        ['женский', '≤ 0,7', '> 0,8', 'СКФ = 135 × (SCr/0,7)^−0,219 × (Scys/0,8)^−0,778 × 0,9961^возраст × 0,963'],
        ['женский', '> 0,7', '≤ 0,8', 'СКФ = 135 × (SCr/0,7)^−0,544 × (Scys/0,8)^−0,323 × 0,9961^возраст × 0,963'],
        ['женский', '> 0,7', '> 0,8', 'СКФ = 135 × (SCr/0,7)^−0,544 × (Scys/0,8)^−0,778 × 0,9961^возраст × 0,963'],
        ['мужской', '≤ 0,9', '≤ 0,8', 'СКФ = 135 × (SCr/0,9)^−0,144 × (Scys/0,8)^−0,323 × 0,9961^возраст'],
        ['мужской', '≤ 0,9', '> 0,8', 'СКФ = 135 × (SCr/0,9)^−0,144 × (Scys/0,8)^−0,778 × 0,9961^возраст'],
        ['мужской', '> 0,9', '≤ 0,8', 'СКФ = 135 × (SCr/0,9)^−0,544 × (Scys/0,8)^−0,323 × 0,9961^возраст'],
        ['мужской', '> 0,9', '> 0,8', 'СКФ = 135 × (SCr/0,9)^−0,544 × (Scys/0,8)^−0,778 × 0,9961^возраст'],
      ],
    },
  },
  {
    type: 'text',
    paragraphs: [
      '**Коэффициенты пересчёта СКФ**',
      '• СКФ мл/мин/1,73 м² → мл/с/1,73 м²: умножить на 0,0167',
      '• Креатинин мкмоль/л → мг/дл: разделить на 88,4',
      '• Цистатин C не требует пересчёта единиц измерения',
      '**СКФ CKiD (Schwartz), для детей 2–15 лет**',
      'Уравнение CKiD, разработанное для использования непосредственно у постели больного, было создано на основе данных, полученных в основном от детей в возрасте от 8 до 15 лет с хронической болезнью почек лёгкой и средней степени тяжести, и предназначено для быстрых и срочных оценок в ходе рутинного клинического обследования детей. Уравнение CKiD позволяет оценить скорость клубочковой фильтрации (СКФ) с использованием роста и уровня креатинина в сыворотке крови.',
      '• **eGFR** — расчётная СКФ, мл/мин/1,73 м²',
      '• **SCr** — стандартизированный креатинин сыворотки, мг/дл',
      '• **HT** — рост в метрах',
      'eGFR = 41,3 × (HT / SCr) = 36,5 × (рост, см / SCr, мкмоль/л)',
      '**СКФ CKiD U25**',
      'Помимо демонстрации минимального, статистически незначимого смещения в педиатрической популяции и популяции молодых взрослых с ХБП, уравнение CKiD U25 для расчёта креатинина (U25 eGFRcr) продемонстрировало способность давать достоверные оценки СКФ в педиатрической популяции и популяции молодых взрослых с СКФ ≥ 75 мл/мин/1,73 м², что было продемонстрировано в когорте здоровых европейских детей и молодых взрослых.',
      'eGFR = κ × (ht / SCr)',
      '• **eGFR** — расчётная СКФ, мл/мин/1,73 м²',
      '• **κ** — значения, зависящие от пола и возраста (табл. 1)',
      '• **SCr** — ферментативно определяемый (рекомендуемый), мг/дл',
      '• **ht** — рост в метрах',
    ],
  },
  {
    type: 'table',
    table: {
      heading: 'Таблица 1. Зависимые от пола и возраста значения κ для CKiD U25 eGFRcr',
      columns: ['Возраст, лет', 'Женский', 'Мужской'],
      rows: [
        ['от 1 до <12', '36,1 × 1,008^(возраст−12)', '39,0 × 1,008^(возраст−12)'],
        ['от 12 до <18', '36,1 × 1,023^(возраст−12)', '39,0 × 1,045^(возраст−12)'],
        ['от 18 до 25', '41,4', '50,8'],
      ],
    },
  },
  {
    type: 'text',
    paragraphs: [
      '**Клиренс креатинина (Cockcroft DW, Gault MH)**',
      'Уравнение Коккрофта–Голта для расчёта клиренса креатинина, несмотря на многолетнее использование при подборе доз лекарств, устарело и имеет существенные ограничения: оно разработано на небольшой и однородной выборке, основано на неактуальных методах измерения креатинина и валидировано по менее точному показателю, что приводит к систематическим ошибкам и вариабельности результатов, особенно с учётом изменений массы тела населения и неоднородных клинических практик. Современные условия и стандарты, включая рекомендации FDA и фармкомпаний, смещаются в сторону использования расчётной скорости клубочковой фильтрации (eGFR), которая точнее отражает функцию почек. Национальный фонд почечных заболеваний рекомендует отказаться от CG в пользу расово-независимых уравнений eGFR (например, CKD-EPI 2021) и использовать значения, скорректированные на площадь поверхности тела пациента, для более корректного дозирования лекарственной терапии.',
      'Клиренс креатинина по формуле Cockcroft-Gault = (140 − возраст) × (вес, кг) × (0,85, если пол женский) / (72 × креатинин, мг/дл)',
      'В США креатинин, как правило, измеряется в мг/дл, в то время как в Канаде и Европе — в мкмоль/л. 1 мг/дл креатинина равен 88,4 мкмоль/л.',
      'По этой причине в формуле использован поправочный коэффициент: уровень креатинина делится на 88,4 при переводе из мкмоль/л в мг/дл.',
    ],
  },
];

const CLINICAL_PARAGRAPHS = [
  '**Креатинин** представляет собой низкомолекулярный ангидрид креатина (1-метилгуанидиноуксусной кислоты), образующийся в результате необратимого неферментативного дефосфорилирования креатинфосфата в скелетной мускулатуре. Продукция креатинина эндогенно стабильна и прямо пропорциональна общей массе функциональной мышечной ткани. В системном кровотоке вещество находится в свободном состоянии, свободно фильтруется в почечных клубочках и практически не подвергается реабсорбции в канальцах (незначительная канальцевая секреция составляет около 10–15% и возрастает при выраженной азотемии).',
  'Референсные значения креатинина:',
  '• Мужчины: 62–106 мкмоль/л (0,70–1,20 мг/дл)',
  '• Женщины: 44–80 мкмоль/л (0,50–0,90 мг/дл)',
  '• Дети: 27–62 мкмоль/л (0,31–0,70 мг/дл)',
  '**Цистатин C** — низкомолекулярный белок, вырабатываемый всеми клетками организма. Цистатин C фильтруется исключительно почками и затем полностью разрушается в них. Благодаря тому, что на его концентрацию в крови практически не влияют мышечная масса, пол, возраст или диета, этот анализ считается более точным тестом для определения скорости клубочковой фильтрации (СКФ), особенно на ранних стадиях почечной недостаточности. Помимо почечных заболеваний, повышенный уровень цистатина C в крови связывают с риском развития сердечно-сосудистых патологий, таких как атеросклероз, сердечная недостаточность, инфаркт миокарда и инсульт.',
  'Референсные значения цистатина C:',
  '• До 1 месяца: 1,10–2,20 мг/л',
  '• От 1 до 12 месяцев: 0,50–1,40 мг/л',
  '• От 1 года до 18 лет: 0,50–1,10 мг/л',
  '• Взрослые (мужчины): 0,50–0,96 мг/л; (женщины): 0,57–0,96 мг/л',
  '• Старше 50 лет: 1,20–1,35 мг/л',
  'Оценка ориентировочная; не заменяет клиренс по моче и клиническое суждение. Осторожность при нестабильном креатинине, истощении, ожирении, возрасте >90 лет, после трансплантации печени.',
  '**Расчёт объёма распределения мочевины**',
  'ОРМ по формуле Watson — оценка объёма общей воды организма (ОВО) для мужчин и женщин.',
  'ОРМ (объём распределения мочевины) ≈ объём общей воды организма (ОВО / TBW). Используется при оценке дозы диализа (Kt/V) и в ряде клинических расчётов.',
  'Мужчины: ОРМ (л) = 2,447 − 0,09516 × возраст (лет) + 0,1074 × рост (см) + 0,3362 × масса (кг).',
  'Женщины: ОРМ (л) = −2,097 + 0,1069 × рост (см) + 0,2466 × масса (кг).',
  'Формулы получены у здоровых взрослых; при отёках, асците, ожирении, кахексии, беременности и острых сдвигах водного баланса точность снижается.',
  '**Источники**',
  '1. Клиренс креатинина CKD-EPI 2021 — Hsu CY, Yang W, Parikh RV, et al. Race, genetic ancestry, and estimating kidney function in CKD. The New England Journal of Medicine. 2021;385(19):1750–1760. doi:10.1056/NEJMoa2103753. https://www.kidney.org/professionals/ckd-epi-creatinine-equation-2021',
  '2. Клиренс креатинина CKD-EPI креатинин–цистатин 2021 — Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C–based equations to estimate GFR without race. The New England Journal of Medicine. 2021;385(19):1737–1749.',
  '3. Schwartz GJ, Muñoz A, Schneider MF, et al. New equations to estimate GFR in children with CKD. Journal of the American Society of Nephrology. 2009;20:629–637. doi:10.1681/ASN.2008030287',
  '4. Клиренс креатинина CKiD U25 — Nyman U, Björk J, Berg U, et al. The modified CKiD Study estimated GFR equations for children and young adults under 25 years of age: Performance in a European multicenter cohort. American Journal of Kidney Disease. 2022;80(6):807–810. doi:10.1053/j.ajkd.2022.02.018',
  '5. Bird NJ, Henderson BL, Lui D, Ballinger JR, Peters AM. Indexing glomerular filtration rate to suit children. J Nucl Med. 2003 Jul;44(7):1037-43. PMID: 12843217.',
  '6. Delgado C, Baweja M, Crews DC, et al. A unifying approach for GFR estimation: Recommendations of the NKF-ASN Task Force on Reassessing the Inclusion of Race in Diagnosing Kidney Disease. Am J Kidney Dis. 2021;78(1):103-115.',
  '7. Kramer HJ, Jaar BG, Choi MJ, et al.; National Kidney Foundation Kidney Disease Outcomes Quality Initiative. An Endorsement of the Removal of Race From GFR Estimation Equations: A Position Statement From the National Kidney Foundation Kidney Disease Outcomes Quality Initiative. Am J Kidney Dis. 2022;80(6):691-696.',
  '8. Watson PE, Watson ID, Batt RD. Total body water volumes for adult males and females estimated from simple anthropometric measurements. Am J Clin Nutr. 1980;33(1):27-39.',
];

function clinicalToHtml(paragraphs) {
  const parts = [];
  let listItems = [];
  let olItems = [];

  function flushUl() {
    if (!listItems.length) return;
    parts.push(
      `<ul class="fc-calc__rf-bullets">${listItems
        .map(
          (t) =>
            `<li class="fc-calc__rf-bullet-item"><span class="fc-calc__rf-bullet" aria-hidden="true">•</span><span class="fc-calc__rf-bullet-text">${inlineMd(
              t.replace(/^•\s*/, '')
            )}</span></li>`
        )
        .join('')}</ul>`
    );
    listItems = [];
  }

  function flushOl() {
    if (!olItems.length) return;
    parts.push(
      `<ol class="fc-calc__rf-sources">${olItems
        .map((t, i) => {
          const body = inlineMd(t.replace(/^\d+\.\s*/, ''));
          return `<li value="${i + 1}"><span class="fc-calc__rf-source-num">${i + 1}.</span> ${body}</li>`;
        })
        .join('')}</ol>`
    );
    olItems = [];
  }

  for (const raw of paragraphs) {
    const t = String(raw).trim();
    if (!t) continue;
    if (t.startsWith('• ')) {
      flushOl();
      listItems.push(t);
      continue;
    }
    if (/^\d+\.\s/.test(t)) {
      flushUl();
      olItems.push(t);
      continue;
    }
    flushUl();
    flushOl();
    if (t.startsWith('**') && t.includes('**', 2)) {
      const m = t.match(/^\*\*(.+?)\*\*\s*(.*)$/);
      if (m && !m[2]) {
        parts.push(`<h4>${inlineMd(m[1])}</h4>`);
        continue;
      }
    }
    parts.push(`<p>${inlineMd(t)}</p>`);
  }
  flushUl();
  flushOl();
  return parts.join('\n');
}

export function buildRenalNotesHtml() {
  const formulaHtml = FORMULA_BLOCKS.map((b) =>
    b.type === 'table' ? tableToHtml(b.table) : paragraphsToHtml(b.paragraphs)
  ).join('\n');
  return `${formulaHtml}\n${clinicalToHtml(CLINICAL_PARAGRAPHS)}`;
}
