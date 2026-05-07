const aiTools = [
  { id: "chatgpt", name: "ChatGPT", category: "модель", logo: "assets/logos/chatgpt.png" },
  { id: "gemini", name: "Gemini", category: "модель", logo: "assets/logos/gemini.svg" },
  { id: "claude", name: "Claude", category: "модель", logo: "assets/logos/claude.svg" },
  { id: "deepseek", name: "DeepSeek", category: "модель", logo: "assets/logos/deepseek.svg" },
  { id: "qwen", name: "Qwen", category: "модель", logo: "assets/logos/qwen.svg" },
  { id: "kimi", name: "Kimi", category: "модель", logo: "assets/logos/kimi.png" },
  { id: "zai", name: "Z.ai", category: "модель", logo: "assets/logos/zai.png" },
  { id: "perplexity", name: "Perplexity", category: "поиск", logo: "assets/logos/perplexity.svg" },
  { id: "notebooklm", name: "NotebookLM", category: "знания", logo: "assets/logos/notebooklm.svg" },
  { id: "ai-studio", name: "AI Studio", category: "модели", logo: "assets/logos/google-ai-studio.png" },
  { id: "gamma", name: "Gamma", category: "презентации", logo: "assets/logos/gamma.png" },
  { id: "canva", name: "Canva", category: "дизайн", logo: "assets/logos/canva.png" },
  { id: "figma", name: "Figma", category: "дизайн", logo: "assets/logos/figma.svg" },
  { id: "napkin", name: "Napkin", category: "схемы", logo: "assets/logos/napkin.png" },
  { id: "recraft", name: "Recraft", category: "визуал", logo: "assets/logos/recraft.png" },
  { id: "ideogram", name: "Ideogram", category: "визуал", logo: "assets/logos/ideogram.png" },
  { id: "midjourney", name: "Midjourney", category: "визуал", logo: "assets/logos/midjourney.png" },
  { id: "runway", name: "Runway", category: "видео", logo: "assets/logos/runway.png" },
  { id: "suno", name: "Suno", category: "музыка", logo: "assets/logos/suno.svg" },
  { id: "elevenlabs", name: "ElevenLabs", category: "голос", logo: "assets/logos/elevenlabs.svg" },
  { id: "heygen", name: "HeyGen", category: "видео", logo: "assets/logos/heygen.png" },
  { id: "capcut", name: "CapCut", category: "монтаж", logo: "assets/logos/capcut.png" },
  { id: "cursor", name: "Cursor", category: "код", logo: "assets/logos/cursor.svg" },
  { id: "lovable", name: "Lovable", category: "сайты", logo: "assets/logos/lovable.png" },
  { id: "bolt", name: "Bolt.new", category: "сайты", logo: "assets/logos/bolt.png" },
  { id: "v0", name: "v0", category: "интерфейсы", logo: "assets/logos/v0.svg" },
  { id: "replit", name: "Replit", category: "код", logo: "assets/logos/replit.svg" },
  { id: "manus", name: "Manus", category: "агенты", logo: "assets/logos/manus.png" },
  { id: "genspark", name: "Genspark", category: "агенты", logo: "assets/logos/genspark.png" },
  { id: "n8n", name: "n8n", category: "автоматизация", logo: "assets/logos/n8n.svg" },
  { id: "make", name: "Make", category: "автоматизация", logo: "assets/logos/make.svg" },
  { id: "zapier", name: "Zapier", category: "автоматизация", logo: "assets/logos/zapier.svg" }
];

const tools = aiTools.map((tool) => tool.name);

const stages = [
  "Сканируем отношение к ИИ",
  "Находим зоны роста",
  "Считываем деятельность",
  "Выделяем рутину",
  "Собираем инструменты",
  "Формируем цифровую команду"
];

const questions = [
  {
    id: "attitude",
    type: "single",
    stage: stages[0],
    title: "Что сейчас ближе всего про ИИ?",
    hint: "Это не тест на правильность. Нам важно понять стартовую точку, чтобы не давить на тебя лишними сервисами и терминами.",
    options: [
      { id: "fomo", title: "Все уже используют, а я не успеваю", copy: "Есть ощущение, что поезд ушел без меня." },
      { id: "tried", title: "Пробовал, но не понял, как применять", copy: "Вроде работает, но в жизнь не встроилось." },
      { id: "skeptic", title: "Кажется, это хайп и игрушка", copy: "Видел ошибки, картинки и много шума." },
      { id: "fear", title: "Боюсь, что ИИ заменит людей", copy: "Хочу понять, как не оказаться догоняющим." },
      { id: "beginner", title: "Хочу разобраться, но не знаю, с чего начать", copy: "Нужен спокойный первый маршрут." },
      { id: "unsystem", title: "Уже пользуюсь, но бессистемно", copy: "Есть инструменты, нет собственной системы." }
    ]
  },
  {
    id: "areas",
    type: "multi",
    stage: stages[1],
    title: "Где ты хочешь усилиться с помощью ИИ?",
    hint: "Выбери несколько сфер. ИИ полезен не только в работе: он усиливает все, что проходит через экран, документы, сообщения, решения и обучение.",
    options: [
      { id: "career", title: "Работа и карьера", copy: "Задачи, документы, коммуникации, рост." },
      { id: "business", title: "Бизнес и деньги", copy: "Продажи, клиенты, процессы, решения." },
      { id: "learning", title: "Учеба и саморазвитие", copy: "Разбор сложного, планы, объяснения." },
      { id: "life", title: "Дом, быт и личные дела", copy: "Решения, списки, порядок, рутина." },
      { id: "creative", title: "Творчество и хобби", copy: "Идеи, тексты, визуал, сценарии." },
      { id: "comms", title: "Коммуникации и отношения", copy: "Ответы, письма, переговоры, тон." },
      { id: "order", title: "Порядок, планы и решения", copy: "Системность, расписание, приоритеты." }
    ]
  },
  {
    id: "about",
    type: "text",
    stage: stages[2],
    title: "Опиши контекст без личных данных",
    hint: "Нужны не секреты и не анкета, а типы задач: чем занимаешься, что повторяется, где устаешь и что хочется усилить с помощью ИИ."
  },
  {
    id: "routine",
    type: "multi",
    stage: stages[3],
    title: "Что повторяется у тебя каждую неделю?",
    hint: "Именно здесь чаще всего лежит первая экономия времени: ИИ не должен заменить тебя, он должен забрать повторяющуюся ручную работу.",
    options: [
      { id: "messages", title: "Письма, сообщения, ответы", copy: "Формулировки, тон, быстрые черновики." },
      { id: "docs", title: "Документы, отчеты, инструкции", copy: "Структура, выжимки, шаблоны, правки." },
      { id: "research", title: "Поиск информации и сравнение вариантов", copy: "Разобраться, выбрать, проверить, объяснить." },
      { id: "content", title: "Идеи, тексты, посты, сценарии", copy: "Черновики, углы подачи, упаковка мысли." },
      { id: "data", title: "Таблицы, цифры, анализ", copy: "Сводки, выводы, гипотезы, прогнозы." },
      { id: "planning", title: "Планирование и списки задач", copy: "Приоритеты, календарь, порядок действий." },
      { id: "learning", title: "Обучение, разбор сложного", copy: "Объяснить проще, собрать план, проверить себя." },
      { id: "sales", title: "Клиенты, продажи, переговоры", copy: "Скрипты, КП, ответы на возражения." },
      { id: "visuals", title: "Презентации, визуалы, оформление", copy: "Слайды, схемы, обложки, макеты." },
      { id: "life", title: "Бытовые решения и личная организация", copy: "Покупки, планы, поездки, семейные дела." }
    ]
  },
  {
    id: "outcome",
    type: "multi",
    stage: stages[4],
    title: "Какой результат тебе важнее всего?",
    hint: "Выбери то, что хочется почувствовать уже в ближайшие две недели.",
    options: [
      { id: "time", title: "Освободить время", copy: "Меньше ручной рутины, больше скорости." },
      { id: "money", title: "Стать сильнее на рынке", copy: "Работать как человек с командой помощников." },
      { id: "order", title: "Навести порядок", copy: "Планы, задачи, документы, личная система." },
      { id: "confidence", title: "Перестать бояться ИИ", copy: "Понять логику и начать управлять." },
      { id: "learning", title: "Быстрее учиться", copy: "Разбирать сложное и сразу применять." },
      { id: "creative", title: "Делать больше идей и визуала", copy: "Тексты, картинки, презентации, сценарии." }
    ]
  },
  {
    id: "level",
    type: "single",
    stage: stages[5],
    title: "На каком ты уровне сейчас?",
    hint: "Финальный маршрут будет отличаться: новичку не нужны сложные агенты, а опытному человеку уже пора собирать процессы.",
    options: [
      { id: "zero", title: "Почти не пользовался", copy: "Нужен старт без технической перегрузки." },
      { id: "basic", title: "Иногда задаю вопросы", copy: "Есть первые пробы, но нет привычки." },
      { id: "regular", title: "Пользуюсь каждую неделю", copy: "Можно систематизировать и ускориться." },
      { id: "advanced", title: "Уже строю связки и процессы", copy: "Пора переходить к помощникам и автоматизации." }
    ]
  }
];

const helperLibrary = {
  messages: {
    title: "ИИ-помощник для писем и ответов",
    body: "Готовит черновики сообщений, помогает выбрать тон, сокращает длинные переписки и быстро формулирует ответы.",
    tools: ["ChatGPT", "Claude", "Gemini"]
  },
  docs: {
    title: "ИИ-помощник для документов",
    body: "Собирает структуру, делает выжимки, превращает хаос мыслей в инструкции, отчеты, письма и понятные тексты.",
    tools: ["ChatGPT", "Claude", "NotebookLM"]
  },
  research: {
    title: "ИИ-помощник для поиска и выбора",
    body: "Ищет, сравнивает варианты, объясняет простыми словами и помогает принимать решения без десяти открытых вкладок.",
    tools: ["Perplexity", "ChatGPT", "Gemini"]
  },
  content: {
    title: "ИИ-помощник для идей и текстов",
    body: "Помогает придумать темы, собрать черновик, усилить мысль, адаптировать текст под пост, письмо или сценарий.",
    tools: ["ChatGPT", "Claude", "DeepSeek"]
  },
  data: {
    title: "ИИ-помощник для таблиц и цифр",
    body: "Находит закономерности, формулирует выводы, объясняет цифры и превращает данные в понятные решения.",
    tools: ["ChatGPT", "Gemini", "Sheets"]
  },
  planning: {
    title: "ИИ-помощник для порядка и планов",
    body: "Разбирает список дел, выстраивает приоритеты, собирает маршрут и помогает держать фокус без перегруза.",
    tools: ["ChatGPT", "Notion AI", "Gemini"]
  },
  learning: {
    title: "ИИ-помощник для учебы и объяснений",
    body: "Объясняет сложное простым языком, делает план обучения, задает вопросы и помогает закреплять материал.",
    tools: ["ChatGPT", "NotebookLM", "Claude"]
  },
  sales: {
    title: "ИИ-помощник для клиентов и продаж",
    body: "Готовит предложения, ответы на возражения, сценарии переговоров и помогает быстрее доводить клиента до решения.",
    tools: ["ChatGPT", "Claude", "Gamma"]
  },
  visuals: {
    title: "ИИ-помощник для визуалов и презентаций",
    body: "Собирает структуру слайдов, визуальные идеи, обложки и варианты подачи без пустого листа.",
    tools: ["Gamma", "Canva", "Recraft"]
  },
  life: {
    title: "ИИ-помощник для быта и личных решений",
    body: "Помогает планировать покупки, поездки, семейные дела, сравнивать варианты и освобождать голову от мелкой рутины.",
    tools: ["ChatGPT", "Gemini", "Perplexity"]
  },
  order: {
    title: "ИИ-помощник для личной системы",
    body: "Связывает цели, задачи, календарь и заметки в понятный порядок, чтобы ты не начинал каждый день с хаоса.",
    tools: ["ChatGPT", "Notion AI", "Calendar"]
  }
};

const routineMeta = {
  messages: { title: "Коммуникации", detail: "письма, чаты, ответы", weight: 3 },
  docs: { title: "Документы", detail: "отчеты, инструкции, выжимки", weight: 4 },
  research: { title: "Поиск и сравнение", detail: "варианты, объяснения, решения", weight: 3 },
  content: { title: "Тексты и идеи", detail: "посты, сценарии, формулировки", weight: 3 },
  data: { title: "Цифры и таблицы", detail: "выводы, сводки, анализ", weight: 4 },
  planning: { title: "Порядок задач", detail: "планы, приоритеты, списки", weight: 3 },
  learning: { title: "Обучение", detail: "разбор сложного и закрепление", weight: 2 },
  sales: { title: "Клиенты и продажи", detail: "скрипты, КП, возражения", weight: 4 },
  visuals: { title: "Визуал и презентации", detail: "слайды, схемы, оформление", weight: 3 },
  life: { title: "Личные дела", detail: "быт, покупки, поездки", weight: 2 }
};

const areaToHelper = {
  career: ["docs", "messages", "planning"],
  business: ["sales", "data", "research"],
  learning: ["learning", "research", "docs"],
  life: ["life", "planning", "research"],
  creative: ["content", "visuals", "research"],
  comms: ["messages", "sales", "content"],
  order: ["order", "planning", "docs"]
};

const keywordToHelper = [
  { helper: "sales", words: ["клиент", "продаж", "переговор", "заявк", "коммерчес", "маркет"] },
  { helper: "docs", words: ["документ", "договор", "отчет", "инструкц", "регламент", "акт"] },
  { helper: "data", words: ["таблиц", "цифр", "аналит", "отчет", "данн", "метрик"] },
  { helper: "content", words: ["пост", "контент", "текст", "сценар", "стать", "блог"] },
  { helper: "visuals", words: ["презентац", "слайд", "визуал", "дизайн", "картин"] },
  { helper: "learning", words: ["уч", "обуч", "курс", "разбира", "изуч"] },
  { helper: "messages", words: ["чат", "письм", "сообщ", "ответ"] },
  { helper: "planning", words: ["план", "задач", "распис", "проект"] }
];

const contextTemplates = {
  work: "Деятельность: ",
  routine: "Повторяющаяся рутина: ",
  life: "Жизнь вне работы: ",
  friction: "Где тяжело: "
};

const contextSignals = [
  { id: "work", words: ["работ", "занима", "клиент", "продаж", "документ", "управ", "бизнес", "проект", "услуг", "команд"] },
  { id: "routine", words: ["кажд", "часто", "регуляр", "повтор", "недел", "письм", "чат", "отчет", "план", "таблиц"] },
  { id: "life", words: ["дом", "сем", "быт", "спорт", "хобби", "здоров", "обуч", "личн", "путеше", "дет"] },
  { id: "friction", words: ["хаос", "устал", "долго", "сложно", "тормоз", "не успева", "рутин", "раздраж", "отклады"] },
  { id: "goal", words: ["хочу", "цель", "важно", "нужно", "помог", "сэконом", "усил", "разобрат", "навести"] }
];

const ABOUT_MIN_SCORE = 45;

const state = {
  current: 0,
  answers: {
    attitude: null,
    areas: [],
    about: "",
    routine: [],
    outcome: [],
    level: null,
    knownTools: []
  },
  analysisTimer: null
};

const elements = {
  app: document.getElementById("app"),
  toolCloud: document.getElementById("toolCloud"),
  toolWall: document.getElementById("toolWall"),
  knownCount: document.getElementById("knownCount"),
  knownInsight: document.getElementById("knownInsight"),
  startBtn: document.getElementById("startBtn"),
  previewResultBtn: document.getElementById("previewResultBtn"),
  scanner: document.getElementById("scanner"),
  intro: document.getElementById("intro"),
  analysis: document.getElementById("analysis"),
  result: document.getElementById("result"),
  stageKicker: document.getElementById("stageKicker"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  questionTitle: document.getElementById("questionTitle"),
  questionHint: document.getElementById("questionHint"),
  optionsGrid: document.getElementById("optionsGrid"),
  textCapture: document.getElementById("textCapture"),
  aboutText: document.getElementById("aboutText"),
  contextScore: document.getElementById("contextScore"),
  contextMeterFill: document.getElementById("contextMeterFill"),
  contextMeterNote: document.getElementById("contextMeterNote"),
  contextPrompts: document.getElementById("contextPrompts"),
  contextChecklist: document.getElementById("contextChecklist"),
  backBtn: document.getElementById("backBtn"),
  nextBtn: document.getElementById("nextBtn"),
  scanStages: document.getElementById("scanStages"),
  topbarStatus: document.getElementById("topbarStatus"),
  analysisStatus: document.getElementById("analysisStatus"),
  resultTitle: document.getElementById("resultTitle"),
  resultLead: document.getElementById("resultLead"),
  levelValue: document.getElementById("levelValue"),
  levelLabel: document.getElementById("levelLabel"),
  routineMap: document.getElementById("routineMap"),
  timeValue: document.getElementById("timeValue"),
  timeNote: document.getElementById("timeNote"),
  blockerText: document.getElementById("blockerText"),
  teamGrid: document.getElementById("teamGrid"),
  toolStack: document.getElementById("toolStack"),
  avoidText: document.getElementById("avoidText"),
  firstStep: document.getElementById("firstStep"),
  routeGrid: document.getElementById("routeGrid"),
  restartBtn: document.getElementById("restartBtn"),
  telegramBtn: document.getElementById("telegramBtn")
};

function init() {
  renderHumanFigures();
  renderToolCloud();
  renderToolWall();
  renderStages();
  renderQuestion();
  elements.topbarStatus.textContent = "Готов к сканированию";
  bindEvents();
}

function renderHumanFigures() {
  document.querySelectorAll(".human").forEach((node, index) => {
    const id = `humanFigure${index}`;
    node.innerHTML = createHumanFigure(id);
  });
}

function createHumanFigure(id) {
  return `
    <svg class="human-figure" viewBox="0 0 240 420" role="img" aria-label="Скан-силуэт человека с цифровым экзоскелетом">
      <defs>
        <linearGradient id="${id}-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dffff8" stop-opacity=".24"/>
          <stop offset="48%" stop-color="#56f0d3" stop-opacity=".15"/>
          <stop offset="100%" stop-color="#041011" stop-opacity=".72"/>
        </linearGradient>
        <linearGradient id="${id}-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".86"/>
          <stop offset="45%" stop-color="#53f2d2" stop-opacity=".74"/>
          <stop offset="100%" stop-color="#ffbf5a" stop-opacity=".5"/>
        </linearGradient>
        <filter id="${id}-glow" x="-40%" y="-30%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g class="figure-grid" fill="none">
        <path d="M38 120 H202"/>
        <path d="M30 210 H210"/>
        <path d="M44 300 H196"/>
        <path d="M82 38 V386"/>
        <path d="M158 38 V386"/>
      </g>
      <g class="aura-lines" fill="none" stroke-linecap="round">
        <path d="M54 136 C86 116 154 116 186 136"/>
        <path d="M38 214 C80 188 160 188 202 214"/>
        <path d="M60 308 C92 326 148 326 180 308"/>
      </g>
      <g class="figure-body" filter="url(#${id}-glow)">
        <path class="figure-glass" fill="url(#${id}-glass)" d="M120 36 C145 36 164 56 164 82 C164 109 145 130 120 130 C95 130 76 109 76 82 C76 56 95 36 120 36 Z M104 142 H136 L145 178 L168 199 L154 222 L144 204 L150 326 L166 382 H144 L124 274 H116 L96 382 H74 L90 326 L96 204 L86 222 L72 199 L95 178 Z"/>
        <path class="figure-edge" stroke="url(#${id}-edge)" d="M120 36 C145 36 164 56 164 82 C164 109 145 130 120 130 C95 130 76 109 76 82 C76 56 95 36 120 36 Z"/>
        <path class="figure-edge" stroke="url(#${id}-edge)" d="M104 142 H136 L145 178 L168 199 L154 222 L144 204 L150 326 L166 382 H144 L124 274 H116 L96 382 H74 L90 326 L96 204 L86 222 L72 199 L95 178 Z"/>
      </g>
      <g class="exo-spine" fill="none" stroke-linecap="round">
        <path d="M120 146 V318"/>
        <path d="M94 176 H146"/>
        <path d="M96 222 H144"/>
        <path d="M102 270 H138"/>
        <path d="M96 204 L120 222 L144 204"/>
      </g>
      <g class="exo-joints">
        <circle cx="120" cy="82" r="4"/>
        <circle cx="120" cy="146" r="4"/>
        <circle cx="94" cy="176" r="3.5"/>
        <circle cx="146" cy="176" r="3.5"/>
        <circle cx="96" cy="222" r="3.5"/>
        <circle cx="144" cy="222" r="3.5"/>
        <circle cx="120" cy="270" r="3.5"/>
      </g>
    </svg>
  `;
}

function bindEvents() {
  elements.startBtn.addEventListener("click", () => {
    showScreen("scanner");
    renderQuestion();
  });

  elements.previewResultBtn.addEventListener("click", () => {
    seedDemoAnswers();
    showAnalysis();
  });

  elements.backBtn.addEventListener("click", () => {
    if (state.current === 0) {
      showScreen("intro");
      return;
    }
    state.current -= 1;
    renderQuestion();
    scrollToTop();
  });

  elements.nextBtn.addEventListener("click", () => {
    const question = questions[state.current];
    if (question.type === "text") {
      state.answers.about = elements.aboutText.value.trim();
    }
    if (!isAnswered(question)) {
      return;
    }
    if (state.current === questions.length - 1) {
      showAnalysis();
      return;
    }
    state.current += 1;
    renderQuestion();
    scrollToTop();
  });

  elements.aboutText.addEventListener("input", () => {
    state.answers.about = elements.aboutText.value.trim();
    updateContextMeter();
    updateNextState();
  });

  elements.contextPrompts.addEventListener("click", (event) => {
    const button = event.target.closest("[data-context-template]");
    if (!button) return;
    addContextTemplate(button.dataset.contextTemplate);
  });

  elements.restartBtn.addEventListener("click", () => {
    reset();
    showScreen("scanner");
    renderQuestion();
  });

  elements.telegramBtn.addEventListener("click", (event) => {
    event.preventDefault();
    alert("На следующем шаге сюда подключим реальную Telegram-ссылку на барсетку нейроэнтузиаста.");
  });
}

function renderToolCloud() {
  const fragment = document.createDocumentFragment();
  aiTools.forEach((tool, index) => {
    const chip = document.createElement("span");
    chip.className = "tool-chip";
    if (index % 7 === 0) chip.classList.add("is-hot");
    if (index % 9 === 0) chip.classList.add("is-warm");
    chip.textContent = tool.name;
    chip.style.setProperty("--left", `${(index * 23) % 96}%`);
    chip.style.setProperty("--top", `${(index * 37) % 94}%`);
    chip.style.setProperty("--speed", `${18 + (index % 9) * 3}s`);
    chip.style.setProperty("--delay", `${-1 * (index % 11) * 1.4}s`);
    fragment.appendChild(chip);
  });
  elements.toolCloud.appendChild(fragment);
}

function renderToolWall() {
  const fragment = document.createDocumentFragment();
  aiTools.forEach((tool) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tool-logo-card";
    button.dataset.tool = tool.id;
    button.innerHTML = `
      <span class="tool-logo-mark">
        <img src="${tool.logo}" alt="" loading="eager">
      </span>
      <span class="tool-logo-name">${tool.name}</span>
      <span class="tool-logo-category">${tool.category}</span>
    `;
    button.addEventListener("click", () => toggleKnownTool(tool.id));
    fragment.appendChild(button);
  });
  elements.toolWall.appendChild(fragment);
  updateKnownToolsSummary();
}

function toggleKnownTool(toolId) {
  const selected = new Set(state.answers.knownTools || []);
  if (selected.has(toolId)) {
    selected.delete(toolId);
  } else {
    selected.add(toolId);
  }
  state.answers.knownTools = Array.from(selected);
  updateKnownToolsSummary();
}

function updateKnownToolsSummary() {
  const count = state.answers.knownTools.length;
  document.querySelectorAll(".tool-logo-card").forEach((card) => {
    card.classList.toggle("is-selected", state.answers.knownTools.includes(card.dataset.tool));
  });
  elements.knownCount.textContent = `${count} ${pluralize(count, ["знакомый инструмент", "знакомых инструмента", "знакомых инструментов"])}`;
  elements.knownInsight.textContent = getKnownInsight(count);
}

function getKnownInsight(count) {
  if (count === 0) return "Нормально, если пока ничего не знакомо. Сканер начнет с самого простого маршрута.";
  if (count <= 3) return "Хорошая стартовая точка: дальше отделим полезное от шума и не перегрузим тебя сервисами.";
  if (count <= 9) return "У тебя уже есть база. Теперь важно понять, какие инструменты действительно нужны под твои задачи.";
  return "Ты уже видел много инструментов. Следующий шаг - собрать из них систему, а не расширять хаос.";
}

function pluralize(count, forms) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function renderStages() {
  elements.scanStages.innerHTML = stages.map((stage, index) => (
    `<div class="scan-stage" data-stage="${index}">${stage}</div>`
  )).join("");
}

function renderQuestion() {
  const question = questions[state.current];
  elements.stageKicker.textContent = question.stage;
  elements.progressText.textContent = `${state.current + 1} / ${questions.length}`;
  elements.progressFill.style.width = `${((state.current + 1) / questions.length) * 100}%`;
  elements.questionTitle.textContent = question.title;
  elements.questionHint.textContent = question.hint;
  elements.topbarStatus.textContent = question.stage;

  const scanPercent = 18 + state.current * 13;
  document.querySelectorAll(".human-scene").forEach((scene) => {
    scene.style.setProperty("--scan", `${scanPercent}%`);
    scene.style.setProperty("--reveal", String(0.34 + state.current * 0.1));
  });

  updateStages();

  elements.optionsGrid.innerHTML = "";
  elements.optionsGrid.hidden = question.type === "text";
  elements.textCapture.hidden = question.type !== "text";
  elements.aboutText.value = state.answers.about || "";
  updateContextMeter();

  if (question.options) {
    const selected = getAnswerArray(question);
    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      if (selected.includes(option.id)) {
        button.classList.add("is-selected");
      }
      button.innerHTML = `
        <span class="option-title">${option.title}</span>
        <span class="option-copy">${option.copy}</span>
      `;
      button.addEventListener("click", () => toggleOption(question, option.id));
      elements.optionsGrid.appendChild(button);
    });
  }

  elements.backBtn.textContent = state.current === 0 ? "К началу" : "Назад";
  elements.nextBtn.textContent = state.current === questions.length - 1 ? "Собрать результат" : "Продолжить";
  updateNextState();
}

function updateStages() {
  document.querySelectorAll(".scan-stage").forEach((stage, index) => {
    stage.classList.toggle("is-done", index < state.current);
    stage.classList.toggle("is-active", index === state.current);
  });
}

function toggleOption(question, optionId) {
  if (question.type === "single") {
    state.answers[question.id] = optionId;
  } else {
    const selected = new Set(state.answers[question.id] || []);
    if (selected.has(optionId)) {
      selected.delete(optionId);
    } else {
      selected.add(optionId);
    }
    state.answers[question.id] = Array.from(selected);
  }
  renderQuestion();
}

function getAnswerArray(question) {
  const value = state.answers[question.id];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isAnswered(question) {
  const value = state.answers[question.id];
  if (question.type === "text") {
    return getContextScore(value).score >= ABOUT_MIN_SCORE;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(value);
}

function updateNextState() {
  elements.nextBtn.disabled = !isAnswered(questions[state.current]);
}

function addContextTemplate(templateId) {
  const template = contextTemplates[templateId];
  if (!template) return;
  const current = elements.aboutText.value.trim();
  const next = current ? `${current}\n\n${template}` : template;
  elements.aboutText.value = next;
  state.answers.about = next.trim();
  elements.aboutText.focus();
  elements.aboutText.setSelectionRange(elements.aboutText.value.length, elements.aboutText.value.length);
  updateContextMeter();
  updateNextState();
}

function updateContextMeter() {
  if (!elements.contextScore) return;
  const { score, hits } = getContextScore(elements.aboutText.value);
  elements.contextScore.textContent = `${score}%`;
  elements.contextMeterFill.style.width = `${score}%`;
  elements.contextMeterNote.textContent = getContextMeterNote(score, hits);
  elements.contextChecklist.querySelectorAll("[data-context-signal]").forEach((item) => {
    item.classList.toggle("is-done", hits.includes(item.dataset.contextSignal));
  });
  elements.contextPrompts.querySelectorAll("[data-context-template]").forEach((button) => {
    button.classList.toggle("is-used", hits.includes(button.dataset.contextTemplate));
  });
}

function getContextScore(value) {
  const text = normalize(value);
  const meaningfulText = text
    .replace(/деятельность:/g, "")
    .replace(/повторяющаяся рутина:/g, "")
    .replace(/жизнь вне работы:/g, "")
    .replace(/где тяжело:/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const cleanLength = meaningfulText.length;
  const hits = contextSignals
    .filter((signal) => signal.words.some((word) => meaningfulText.includes(word)))
    .map((signal) => signal.id);
  const lengthScore = Math.min(36, Math.floor(cleanLength / 4));
  const signalScore = hits.length * 13;
  const structureScore = cleanLength >= 80 && (text.match(/[.!?\n:;]/g) || []).length >= 3 ? 8 : 0;
  return {
    score: Math.min(100, lengthScore + signalScore + structureScore),
    hits
  };
}

function getContextMeterNote(score, hits) {
  const missing = contextSignals
    .filter((signal) => !hits.includes(signal.id))
    .map((signal) => ({
      work: "чем ты занимаешься в целом",
      routine: "что повторяется каждую неделю",
      life: "что есть кроме работы",
      friction: "что забирает время и силы",
      goal: "какого результата хочешь"
    })[signal.id]);
  if (score >= 86) return "Отлично: контекста достаточно для очень персонального маршрута.";
  if (score >= ABOUT_MIN_SCORE) return `Уже можно продолжать. Для точности можно добавить: ${missing.slice(0, 2).join(", ")}.`;
  if (missing.length) return `Контекста пока мало. Добавь без личных данных: ${missing.slice(0, 2).join(", ")}.`;
  return "Добавь еще пару общих деталей о задачах и целях.";
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === screenId);
  });
  elements.topbarStatus.textContent = {
    intro: "Готов к сканированию",
    scanner: questions[state.current]?.stage || "Идет диагностика",
    analysis: "Сканирование запущено",
    result: "Результат собран"
  }[screenId] || "Готово";
  scrollToTop();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showAnalysis() {
  showScreen("analysis");
  const rows = [
    "Анализируем отношение к ИИ",
    "Выделяем повторяющиеся задачи",
    "Ищем зоны экономии времени",
    "Подбираем первые инструменты",
    "Собираем цифровой экзоскелет",
    "Формируем пять ИИ-помощников"
  ];
  let index = 0;
  elements.analysisStatus.innerHTML = rows.map((row, rowIndex) => (
    `<div class="analysis-row ${rowIndex === 0 ? "is-active" : ""}" data-row="${rowIndex}">${row}</div>`
  )).join("");
  clearInterval(state.analysisTimer);
  state.analysisTimer = setInterval(() => {
    index += 1;
    document.querySelectorAll(".analysis-row").forEach((row, rowIndex) => {
      row.classList.toggle("is-done", rowIndex < index);
      row.classList.toggle("is-active", rowIndex === index);
    });
    document.querySelectorAll(".human-scene").forEach((scene) => {
      scene.style.setProperty("--scan", `${Math.min(102, 28 + index * 14)}%`);
      scene.style.setProperty("--reveal", String(Math.min(1, 0.46 + index * 0.1)));
    });
    if (index >= rows.length) {
      clearInterval(state.analysisTimer);
      renderResult();
      showScreen("result");
    }
  }, 520);
}

function renderResult() {
  const result = buildResult();
  elements.resultLead.textContent = result.lead;
  elements.levelValue.textContent = result.levelScore;
  elements.levelLabel.textContent = result.levelLabel;
  elements.timeValue.textContent = result.timeSaved;
  elements.timeNote.textContent = result.timeNote;
  elements.blockerText.textContent = result.blocker;
  elements.avoidText.textContent = result.avoid;
  elements.firstStep.textContent = result.firstStep;

  elements.routineMap.innerHTML = result.routineMap.map((item) => `
    <div class="routine-item">
      <div>
        <strong>${item.title}</strong>
        <span>${item.detail}</span>
      </div>
      <div class="routine-percent">${item.percent}%</div>
    </div>
  `).join("");

  elements.teamGrid.innerHTML = result.helpers.map((helper, index) => `
    <article class="helper-card" style="animation-delay:${index * 80}ms">
      <strong>${helper.title}</strong>
      <p>${helper.body}</p>
      <div class="helper-tools">${helper.tools.map((tool) => `<span>${tool}</span>`).join("")}</div>
    </article>
  `).join("");

  elements.toolStack.innerHTML = result.tools.map((tool) => `<span>${tool}</span>`).join("");

  elements.routeGrid.innerHTML = result.route.map((step) => `
    <article class="route-card">
      <span>${step.days}</span>
      <strong>${step.title}</strong>
      <p>${step.body}</p>
    </article>
  `).join("");
}

function buildResult() {
  const answers = state.answers;
  const helperIds = chooseHelpers(answers);
  const helpers = helperIds.map((id) => helperLibrary[id]);
  const level = getLevel(answers);
  const routineMap = getRoutineMap(answers, helperIds);
  const timeSaved = estimateTime(answers);
  const tools = chooseTools(helpers, answers);
  const primaryRoutine = answers.routine[0] || helperIds[0] || "planning";
  const aboutSignal = getAboutSignal(answers.about);

  return {
    lead: buildLead(answers, level, aboutSignal),
    levelScore: level.score,
    levelLabel: level.label,
    blocker: getBlocker(answers.attitude),
    timeSaved,
    timeNote: `Реалистичный стартовый диапазон: ${Math.max(2, timeSaved - 2)}-${timeSaved + 3} часов в неделю, если вынести в ИИ хотя бы две повторяющиеся задачи.`,
    routineMap,
    helpers,
    tools,
    avoid: getAvoidText(answers),
    firstStep: getFirstStep(primaryRoutine, answers),
    route: getRoute(primaryRoutine, tools)
  };
}

function chooseHelpers(answers) {
  const scores = new Map();
  const add = (id, score = 1) => {
    scores.set(id, (scores.get(id) || 0) + score);
  };

  answers.routine.forEach((id) => add(id, 4));
  answers.areas.forEach((area) => {
    (areaToHelper[area] || []).forEach((id, index) => add(id, 3 - index * 0.45));
  });
  answers.outcome.forEach((outcome) => {
    if (outcome === "time") add("planning", 2);
    if (outcome === "money") add("sales", 2);
    if (outcome === "order") add("order", 3);
    if (outcome === "confidence") add("research", 2);
    if (outcome === "learning") add("learning", 2);
    if (outcome === "creative") add("content", 2);
  });

  const text = normalize(answers.about);
  keywordToHelper.forEach((entry) => {
    if (entry.words.some((word) => text.includes(word))) {
      add(entry.helper, 3);
    }
  });

  ["messages", "docs", "research", "planning", "content"].forEach((id) => add(id, 0.6));

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .filter((id) => helperLibrary[id])
    .slice(0, 5);
}

function getLevel(answers) {
  const base = {
    zero: { score: 18, label: "Старт" },
    basic: { score: 36, label: "Первые пробы" },
    regular: { score: 58, label: "Пора систематизировать" },
    advanced: { score: 76, label: "Готов к связкам" }
  }[answers.level] || { score: 28, label: "Старт" };

  let bonus = Math.min(10, answers.routine.length + answers.areas.length);
  bonus += Math.min(8, (answers.knownTools || []).length);
  if (answers.attitude === "unsystem") bonus += 6;
  if (answers.attitude === "skeptic") bonus -= 4;
  return {
    score: Math.max(12, Math.min(92, base.score + bonus)),
    label: base.label
  };
}

function getRoutineMap(answers, helperIds) {
  const ids = answers.routine.length ? answers.routine : helperIds;
  return ids.slice(0, 5).map((id, index) => {
    const meta = routineMeta[id] || routineMeta.planning;
    return {
      title: meta.title,
      detail: meta.detail,
      percent: Math.max(42, 86 - index * 8)
    };
  });
}

function estimateTime(answers) {
  const routineWeight = answers.routine.reduce((sum, id) => sum + (routineMeta[id]?.weight || 2), 0);
  const areaWeight = answers.areas.length * 0.8;
  const levelFactor = {
    zero: 0.75,
    basic: 0.9,
    regular: 1.08,
    advanced: 1.18
  }[answers.level] || 0.9;
  const outcomeBoost = answers.outcome.includes("time") ? 1.15 : 1;
  return Math.max(4, Math.min(22, Math.round((routineWeight + areaWeight + 4) * levelFactor * outcomeBoost)));
}

function chooseTools(helpers, answers) {
  const selected = new Set(["ChatGPT или DeepSeek", "Perplexity", "NotebookLM"]);
  helpers.forEach((helper) => helper.tools.forEach((tool) => selected.add(tool)));
  if (answers.routine.includes("visuals") || answers.areas.includes("creative")) {
    selected.add("Gamma или Canva");
  }
  if (answers.routine.includes("data")) {
    selected.add("Google Sheets + Gemini");
  }
  if (answers.level === "advanced") {
    selected.add("Make или n8n");
  }
  return Array.from(selected).slice(0, 7);
}

function getBlocker(attitude) {
  return {
    fomo: "Главный тормоз сейчас - ощущение, что вокруг все уже убежали вперед. На деле тебе не нужно догонять все нейросети. Тебе нужна короткая личная система: две задачи, два инструмента, один повторяемый процесс.",
    tried: "Ты уже видел ИИ, но пока не встроил его в свои реальные задачи. Значит, проблема не в технологии, а в отсутствии сценариев: что отдать ИИ, как проверить результат и где применять каждый день.",
    skeptic: "Скепсис нормален: ИИ действительно ошибается, если бросать ему общие вопросы. Твоя точка роста - научиться ставить задачу, давать контекст и использовать ИИ как помощника, а не как волшебную кнопку.",
    fear: "Страх замены снижается, когда меняется рамка: ценным становится не тот, кто соревнуется с ИИ, а тот, кто умеет создавать и управлять своей цифровой командой.",
    beginner: "Тебе мешает не сложность, а отсутствие первого понятного шага. Начинать нужно не с десятков сервисов, а с одной повторяющейся задачи и одного помощника.",
    unsystem: "У тебя уже есть движение, но пока нет системы. Следующий уровень - закрепить роли помощников, шаблоны запросов и регулярные процессы, чтобы ИИ работал не случайно, а каждый день."
  }[attitude] || "Главный тормоз сейчас - не нехватка способностей, а отсутствие маршрута. Сканер уже сузил хаос до первых зон, где ИИ даст практическую пользу.";
}

function buildLead(answers, level, signal) {
  const areaText = getAreaSummary(answers.areas);
  const signalText = signal ? ` По описанию видно: сильная точка входа - ${signal}.` : "";
  return `Твой текущий уровень: ${level.label}. Сканер видит потенциал усиления в сферах: ${areaText}. Вопрос не в том, заменит ли тебя ИИ. Вопрос в том, научишься ли ты создавать и управлять своей цифровой командой.${signalText}`;
}

function getAreaSummary(areas) {
  const labels = {
    career: "работа и карьера",
    business: "бизнес и деньги",
    learning: "обучение",
    life: "личные дела",
    creative: "творчество",
    comms: "коммуникации",
    order: "порядок и решения"
  };
  if (!areas.length) return "работа, жизнь и личная эффективность";
  return areas.map((area) => labels[area]).filter(Boolean).join(", ");
}

function getAboutSignal(text) {
  const normalized = normalize(text);
  const match = keywordToHelper.find((entry) => entry.words.some((word) => normalized.includes(word)));
  const labels = {
    sales: "клиенты, продажи и коммуникации",
    docs: "документы и структура",
    data: "цифры, таблицы и выводы",
    content: "контент, тексты и идеи",
    visuals: "презентации и визуальная упаковка",
    learning: "обучение и разбор сложного",
    messages: "переписка и быстрые ответы",
    planning: "планирование и управление задачами"
  };
  return match ? labels[match.helper] : "";
}

function getAvoidText(answers) {
  if (answers.level === "advanced") {
    return "Пока не распыляйся на десятки новых моделей. Твоя зона роста - связки, шаблоны, повторяемые процессы и автоматизация там, где уже понятна ценность.";
  }
  if (answers.routine.includes("visuals") || answers.areas.includes("creative")) {
    return "Не начинай с бесконечного перебора генераторов картинок и видео. Сначала собери сценарии: какие материалы нужны, где они ускоряют работу и кто будет проверять качество.";
  }
  return "Пока не трогай сложные автономные агенты, автоматизации на пять сервисов и гонку за каждой новой моделью. Начни с базовой связки: задача, контекст, черновик, проверка, улучшение.";
}

function getFirstStep(primaryRoutine, answers) {
  const steps = {
    messages: "Сегодня открой ChatGPT или DeepSeek, вставь одно реальное сообщение, которое долго откладывал, и попроси подготовить три варианта ответа: короткий, теплый и деловой.",
    docs: "Сегодня возьми один документ или длинную заметку и попроси ИИ сделать структуру, краткую выжимку и список мест, где не хватает данных.",
    research: "Сегодня выбери один вопрос, по которому обычно открываешь десять вкладок, и попроси Perplexity или ChatGPT сравнить варианты в таблице с плюсами, минусами и рисками.",
    content: "Сегодня опиши ИИ одну тему, которую давно хочешь раскрыть, и попроси пять углов подачи, план текста и первый черновик в твоем тоне.",
    data: "Сегодня возьми одну таблицу или набор цифр и попроси ИИ объяснить, какие выводы можно сделать, какие вопросы задать и где есть аномалии.",
    planning: "Сегодня выгрузи в ИИ все текущие задачи одним списком и попроси разложить их на: срочно, важно, можно отдать, можно удалить.",
    learning: "Сегодня выбери одну сложную тему и попроси ИИ объяснить ее как наставник: простыми словами, с примером из твоей деятельности и мини-тестом.",
    sales: "Сегодня возьми один типовой вопрос клиента или возражение и попроси ИИ собрать три ответа: мягкий, экспертный и короткий для мессенджера.",
    visuals: "Сегодня возьми тему презентации и попроси Gamma или ChatGPT собрать структуру из 7 слайдов: проблема, решение, доказательство, следующий шаг.",
    life: "Сегодня отдай ИИ одно бытовое решение: покупку, поездку, план недели или семейную задачу. Попроси сравнить варианты и дать спокойный план."
  };
  if (answers.attitude === "skeptic") {
    return `${steps[primaryRoutine] || steps.planning} Сразу попроси ИИ указать, где он может ошибиться и что надо проверить вручную.`;
  }
  return steps[primaryRoutine] || steps.planning;
}

function getRoute(primaryRoutine, tools) {
  return [
    {
      days: "Дни 1-2",
      title: "Выбери одну рутину",
      body: "Не меняй всю жизнь сразу. Возьми повторяющуюся задачу и прогони ее через один понятный ИИ-инструмент."
    },
    {
      days: "Дни 3-5",
      title: "Собери первый шаблон",
      body: `Закрепи удачный запрос для задачи "${routineMeta[primaryRoutine]?.title || "Порядок задач"}" и используй его несколько раз.`
    },
    {
      days: "Дни 6-10",
      title: "Добавь второго помощника",
      body: `Подключи ${tools[1] || "Perplexity"} для поиска, проверки или объяснений, чтобы не зависеть от одного ответа.`
    },
    {
      days: "Дни 11-14",
      title: "Управляй командой",
      body: "Раздели роли: кто пишет, кто ищет, кто проверяет, кто помогает планировать. Так появляется цифровая команда, а не хаос сервисов."
    }
  ];
}

function seedDemoAnswers() {
  state.current = questions.length - 1;
  state.answers = {
    attitude: "beginner",
    areas: ["career", "business", "order"],
    about: "Веду клиентов, отвечаю в чатах, готовлю документы, иногда делаю презентации и планирую задачи.",
    routine: ["messages", "docs", "sales", "planning", "visuals"],
    outcome: ["time", "money", "order"],
    level: "basic",
    knownTools: ["chatgpt", "gemini", "perplexity", "notebooklm", "canva", "gamma"]
  };
  updateKnownToolsSummary();
}

function reset() {
  clearInterval(state.analysisTimer);
  state.current = 0;
  state.answers = {
    attitude: null,
    areas: [],
    about: "",
    routine: [],
    outcome: [],
    level: null,
    knownTools: []
  };
  updateKnownToolsSummary();
}

function normalize(value) {
  return String(value || "").toLowerCase().replaceAll("ё", "е");
}

init();
