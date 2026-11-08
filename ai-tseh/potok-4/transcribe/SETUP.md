# Инструкция для агента: расшифровка видео и аудио в текст (GigaAM v3, локально)

Ты агент (Codex, OpenCode или Claude Code) на компьютере ученика курса «AI Цех» NEOVIDA.
Твоя задача: поставить команду `neovida-transcribe`, которая превращает видео и аудио (файлы
и ссылки) в текст на русском прямо на компьютере, проверить её и записать себе правило, как ею
пользоваться. Делай всё сам, по шагам, коротко сообщая ученику, что происходит. Ученик не
программист: терминал он не открывает и файлы не раскладывает. От него нужно только «да» на твои
запросы разрешений и, по желанию, ссылка на видео для проверки.

Как устроено (так это и объясняй ученику, этой же логикой идёт урок):

1. **Двигатель расшифровки.** Модель GigaAM v3 от Сбера (`gigaam-v3-e2e-rnnt`, int8, через
   библиотеку onnx-asr). Ставим и проверяем на коротком файле.
2. **Связка для видео поверх двигателя.** Ссылка → yt-dlp скачивает → ffmpeg достаёт звук →
   GigaAM расшифровывает → рядом сохраняется `.md` с таймкодами → по желанию ты делаешь конспект.
3. **Правило в AGENTS.md.** В следующий раз ты сам знаешь, чем расшифровывать, а если команды
   нет, сам ставишь её по этой инструкции. Так работает кодер-агент: чего нет, ставит сам,
   и дальше это просто работает.

Адреса файлов (база `https://materials.neovida.ai/ai-tseh/potok-4/transcribe`):

| Файл | Адрес |
|---|---|
| скрипт | `https://materials.neovida.ai/ai-tseh/potok-4/transcribe/neovida_transcribe.py` |
| команда для Mac | `https://materials.neovida.ai/ai-tseh/potok-4/transcribe/neovida-transcribe` |
| команда для Windows | `https://materials.neovida.ai/ai-tseh/potok-4/transcribe/neovida-transcribe.cmd` |
| образец речи, 16 с | `https://materials.neovida.ai/ai-tseh/potok-4/transcribe/sample/primer.mp3` |
| эта инструкция | `https://materials.neovida.ai/ai-tseh/potok-4/transcribe/SETUP.md` |

Где что будет жить:

- `~/.neovida-transcribe/` (Windows `%USERPROFILE%\.neovida-transcribe\`): скрипт, его Python
  с библиотеками (`venv`), модель (`model`, около 230 МБ), `last.txt` с путём к последнему результату;
- `~/.local/bin/neovida-transcribe` (Windows `%USERPROFILE%\.local\bin\neovida-transcribe.cmd`): сама команда.

## Перед началом: песочница и таймауты

- Шаги установки качают файлы из интернета и пишут в домашнюю папку. В песочнице Codex это
  закрыто, поэтому запускай их сразу с запросом разрешения (вне песочницы). Ученик ответит «да».
- Ставь командам большой таймаут: установка библиотек и первый запуск с моделью до 20 минут
  (`timeout_ms` 1200000), расшифровка часа записи до 20 минут.
- Каждую команду пиши целиком, с полными путями: переменные между командами не сохраняются.
- На Windows команды для PowerShell. Пиши `curl.exe`, а не `curl` (в PowerShell `curl` это другая команда).

## Шаг 0. Система и uv

1. Определи систему.
   - macOS: `uname -m` (`arm64` это Apple Silicon, `x86_64` это Intel) и `sw_vers -productVersion`.
     На Intel нужна macOS 13 или новее: на более старой библиотека распознавания не ставится.
     Если система старее, честно скажи ученику и остановись.
   - Windows: `$env:PROCESSOR_ARCHITECTURE` (`AMD64` или `ARM64`) и `[Environment]::OSVersion.Version`.
2. Проверь uv: `uv --version`. Если его нет, поставь:
   - macOS: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
3. Найди абсолютный путь к uv, дальше в шагах это `<uv>`:
   - macOS: `~/.local/bin/uv`, если файла нет, то `command -v uv`;
   - Windows: `$env:USERPROFILE\.local\bin\uv.exe`, если файла нет, то `where.exe uv`.
   В только что открытом терминале PATH ещё старый, поэтому uv вызывай по полному пути.

## Шаг 1. Двигатель расшифровки

**macOS:**

```bash
mkdir -p ~/.neovida-transcribe ~/.local/bin
curl -fsSL -o ~/.neovida-transcribe/neovida_transcribe.py https://materials.neovida.ai/ai-tseh/potok-4/transcribe/neovida_transcribe.py
curl -fsSL -o ~/.local/bin/neovida-transcribe https://materials.neovida.ai/ai-tseh/potok-4/transcribe/neovida-transcribe
chmod +x ~/.local/bin/neovida-transcribe ~/.neovida-transcribe/neovida_transcribe.py
"<uv>" venv --clear --python 3.12 ~/.neovida-transcribe/venv
"<uv>" pip install --python ~/.neovida-transcribe/venv --compile-bytecode "onnx-asr[cpu,hub]>=0.12" "numpy>=1.26" "imageio-ffmpeg>=0.6"
"<uv>" tool update-shell
```

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.neovida-transcribe", "$env:USERPROFILE\.local\bin" | Out-Null
curl.exe -fsSL -o "$env:USERPROFILE\.neovida-transcribe\neovida_transcribe.py" https://materials.neovida.ai/ai-tseh/potok-4/transcribe/neovida_transcribe.py
curl.exe -fsSL -o "$env:USERPROFILE\.local\bin\neovida-transcribe.cmd" https://materials.neovida.ai/ai-tseh/potok-4/transcribe/neovida-transcribe.cmd
& "<uv>" venv --clear --python 3.12 "$env:USERPROFILE\.neovida-transcribe\venv"
& "<uv>" pip install --python "$env:USERPROFILE\.neovida-transcribe\venv" --compile-bytecode "onnx-asr[cpu,hub]>=0.12" "numpy>=1.26" "imageio-ffmpeg>=0.6"
& "<uv>" tool update-shell
```

Что происходит: uv при необходимости сам скачивает Python 3.12, создаёт для команды отдельное
окружение (`venv`) и ставит в него двигатель: onnx-asr и onnxruntime (распознавание) и
imageio-ffmpeg (свой ffmpeg, отдельно его ставить не нужно). Около 60 МБ. `uv tool update-shell`
добавляет папку `.local/bin` в PATH для новых окон терминала; если она уже там, ничего не меняет.

Проверки:
- первая строка скачанного скрипта `#!/usr/bin/env -S uv run --script` (если там HTML, ссылка не та);
- последняя команда установки закончилась без `error`.

Теперь первый запуск. Он скачивает модель GigaAM v3 с huggingface.co, около 230 МБ, один раз:

- macOS: `~/.local/bin/neovida-transcribe --check`
- Windows: `& "$env:USERPROFILE\.local\bin\neovida-transcribe.cmd" --check`

Успех: строка про ffmpeg, строка «yt-dlp (ссылки): ещё не поставлен» (это нормально, он будет
на шаге 3) и в конце `Модель GigaAM v3 загружена за ... Всё готово.`, код выхода 0.
Если обрыв, просто запусти ещё раз: докачка продолжится.

## Шаг 2. Проверка двигателя на коротком файле

Скачай образец (16 секунд речи) и расшифруй его:

- macOS:
  ```bash
  curl -fsSL -o ~/.neovida-transcribe/primer.mp3 https://materials.neovida.ai/ai-tseh/potok-4/transcribe/sample/primer.mp3
  ~/.local/bin/neovida-transcribe ~/.neovida-transcribe/primer.mp3
  ```
- Windows:
  ```powershell
  curl.exe -fsSL -o "$env:USERPROFILE\.neovida-transcribe\primer.mp3" https://materials.neovida.ai/ai-tseh/potok-4/transcribe/sample/primer.mp3
  & "$env:USERPROFILE\.local\bin\neovida-transcribe.cmd" "$env:USERPROFILE\.neovida-transcribe\primer.mp3"
  ```

Последняя строка вывода это путь к `primer.md`. Открой файл и покажи ученику текст. Это 16 секунд
записи урока Альберта про настройки Codex, должно быть примерно: «Диагностика, проблема в рабочей
области… Персонализация. Смотрите, включить память Codex включаем обязательно…»
Обрати внимание ученика: знаки препинания модель ставит сама.

Если у ученика под рукой есть своё голосовое или запись, предложи расшифровать и её: это
самая наглядная проверка.

## Шаг 3. Связка для видео поверх двигателя

Ставим скачивание по ссылкам: yt-dlp и deno (deno нужен yt-dlp для YouTube). Команда берёт
полный список библиотек из шапки скрипта и доставляет недостающее, около 60 МБ:

- macOS: `"<uv>" pip install --python ~/.neovida-transcribe/venv --compile-bytecode -r ~/.neovida-transcribe/neovida_transcribe.py`
- Windows: `& "<uv>" pip install --python "$env:USERPROFILE\.neovida-transcribe\venv" --compile-bytecode -r "$env:USERPROFILE\.neovida-transcribe\neovida_transcribe.py"`

Проверка: `--check` (шаг 1) теперь показывает версию yt-dlp и путь к deno. Дальше проверка на ссылке:

1. Спроси ученика: «Пришли ссылку на любое короткое видео на русском (2–10 минут) с YouTube,
   VK Видео или Rutube. Если нет под рукой, возьму пример». Пример по умолчанию (Rutube, 3:41,
   работает без VPN): `https://rutube.ru/video/ac4c42a002c96417c21967f845955432/`
2. Запусти (ссылку всегда бери в кавычки):
   - macOS: `~/.local/bin/neovida-transcribe "<ссылка>"`
   - Windows: `& "$env:USERPROFILE\.local\bin\neovida-transcribe.cmd" "<ссылка>"`. На Windows
     отрежь в ссылке всё, начиная с первого знака `&` (это параметры времени и плейлиста, они
     не нужны, а `&` ломает запуск .cmd).
3. Скрипт скачает звук (или лёгкое видео до 360p) в папку «Загрузки», достанет звук, расшифрует
   и сохранит рядом `.md` с таймкодами. Путь печатается последней строкой.
4. Покажи ученику первые 3 абзаца и предложи: «Сделать конспект?». Если да, сделай его по
   файлу `.md`: 5–7 главных мыслей с таймкодами и что из этого можно применить.

YouTube из России качается только с включённым VPN. Если YouTube не скачался, скажи ученику
включить VPN и повтори. VK Видео и Rutube лучше качать без VPN.

## Шаг 4. Правило в AGENTS.md

Допиши правило (не перезаписывая файл) туда, где его прочитает агент ученика:

- Codex: глобальный `~/.codex/AGENTS.md` (Windows `%USERPROFILE%\.codex\AGENTS.md`), создай, если нет;
- плюс `AGENTS.md` в текущей рабочей папке ученика, если это его рабочая папка, а не домашняя
  (создай, если нет): так ученик увидит правило рядом со своими файлами;
- если ты OpenCode: `~/.config/opencode/AGENTS.md`; если ты Claude Code: `~/.claude/CLAUDE.md`.

Если в файле уже есть раздел про `neovida-transcribe`, второй раз не добавляй. Текст правила
для macOS:

```markdown
## Расшифровка видео и аудио (neovida-transcribe)
- Любое видео или аудио в текст (запись встречи, урок, голосовое, кругляшок, ссылка на YouTube, VK Видео, Rutube) расшифровывай командой `~/.local/bin/neovida-transcribe "<файл или ссылка>"`. Это GigaAM v3 от Сбера, работает локально, звук никуда не уходит.
- Результат: файл .md с таймкодами рядом с исходным файлом, для ссылок в папке Загрузки. Путь печатается последней строкой и лежит в `~/.neovida-transcribe/last.txt`. Только текст: `-f txt`, субтитры: `-f srt`.
- Таймаут команды: на час записи ставь 20 минут. Если файл или результат вне рабочей папки или нужна сеть, запускай с разрешением (вне песочницы).
- YouTube из России качается только с VPN. VK Видео и Rutube лучше без VPN.
- Если команды нет или она пишет, что установлена не до конца, поставь её сам по инструкции https://materials.neovida.ai/ai-tseh/potok-4/transcribe/SETUP.md и повтори расшифровку.
- После расшифровки прочитай .md и предложи: конспект, главные мысли, задачи и договорённости, цитаты с таймкодами. Кто говорит, команда не размечает: авторов реплик не выдумывай.
```

Для Windows то же самое, но команда
`& "$env:USERPROFILE\.local\bin\neovida-transcribe.cmd" "<файл или ссылка>"`, файл
`%USERPROFILE%\.neovida-transcribe\last.txt` и ещё один пункт:

```markdown
- В ссылке отрезай всё, начиная с первого знака &, иначе .cmd ломает запуск. Если в выводе кракозябры, это только кодировка консоли: путь к результату возьми из last.txt, сам файл .md в UTF-8.
```

## Шаг 5. Отчёт ученику

Коротко: что поставлено, где появляются тексты (рядом с файлом, для ссылок в «Загрузках»),
что всё работает без интернета и звук никуда не уходит. Покажи 10 примеров фраз, которыми
теперь можно пользоваться:

1. «Расшифруй запись встречи из Загрузок и сделай конспект на одну страницу».
2. «Вот ссылка на вебинар, расшифруй и выпиши 10 главных мыслей с таймкодами».
3. «Расшифруй голосовое от клиента и предложи ответ».
4. «Расшифруй урок и выпиши все задания и сроки».
5. «Расшифруй созвон с командой и составь список задач: кто, что, к какому числу».
6. «Сделай из расшифровки вебинара пост для Telegram в моём стиле».
7. «Расшифруй ролик конкурента с YouTube и разбери, как он построен».
8. «Расшифруй интервью и найди 5 сильных цитат для сайта».
9. «Расшифруй все голосовые из этой папки и сведи в один список дел».
10. «Сделай субтитры .srt к моему видео».

## Что умеет команда

```
neovida-transcribe <файл или ссылка> [ещё файлы...]   # .md с таймкодами рядом с файлом
neovida-transcribe запись.m4a -f txt                    # только текст
neovida-transcribe видео.mp4 -f srt                     # субтитры
neovida-transcribe запись.m4a -o итог.md                # свой путь результата
neovida-transcribe <ссылка> --out-dir <папка>           # ссылку скачать в другую папку
neovida-transcribe <ссылка> --delete-media              # после расшифровки удалить скачанное видео
neovida-transcribe --check                              # проверка установки
```

Входы: mp4, mov, m4a, mp3, ogg и opus (голосовые Telegram и WhatsApp), wav, webm, mkv и почти
любой другой формат со звуком; ссылки YouTube, VK Видео, Rutube и сотен других сайтов.
В консоль (stdout) печатается только путь к результату, ход работы идёт в stderr.
Длинные записи режутся на куски до 20 секунд по тихим местам: час записи на Mac с чипом M
расшифровывается примерно за минуту, на обычном ноутбуке дольше. Свою прошлую расшифровку
команда перезаписывает, чужой файл с тем же именем не трогает и пишет «имя (2).md».

## Если что-то не так

| Симптом | Что делать |
|---|---|
| `uv: command not found` | шаг 0, пункты 2–3; дальше uv только по полному пути |
| `установлен не до конца` | повторить шаг 1 целиком, потом установку из шага 3 |
| `для ссылок нужна связка для видео` | шаг 3 (установка yt-dlp) |
| модель не скачивается | проверить интернет; если huggingface.co не открывается, включить VPN и повторить `--check` |
| Python или библиотеки не скачиваются | повторить шаги 1 и 3 с включённым VPN |
| Windows: `DLL load failed` при `--check` | поставить Visual C++ Redistributable: `winget install --id Microsoft.VCRedist.2015+.x64 -e` (с разрешением), повторить |
| Intel Mac: onnxruntime не ставится | нужна macOS 13 или новее |
| YouTube: ошибка или висит | включить VPN; «not a bot» значит сменить сервер VPN |
| YouTube перестал качаться через месяц | обновить yt-dlp: `"<uv>" pip install --python ~/.neovida-transcribe/venv -U "yt-dlp[default]"` (Windows: путь к venv через `$env:USERPROFILE`) |
| VK или Rutube: «недоступно в стране» | выключить VPN и повторить |
| `нет доступа в интернет` у ссылки | ты запустил в песочнице без сети: повтори с разрешением |
| `нет прав на запись` | файл вне рабочей папки: повтори с разрешением или добавь `--out-dir` |
| кракозябры в выводе на Windows | это кодировка консоли; путь к результату в `last.txt`, файл `.md` в UTF-8 |
| `не получилось достать звук` | в файле нет звуковой дорожки или файл битый |

Обновить скрипт до новой версии: заново скачать `neovida_transcribe.py` (шаг 1, вторая строка)
и повторить установку из шага 3: она доставит всё по шапке скрипта. Модель второй раз не скачивается.

NEOVIDA · neovida.ai · AI Цех
