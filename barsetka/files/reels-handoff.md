# Автомонтаж рилсов. Инструкция для Codex

Ты Codex на компьютере выпускника курса NEOVIDA. Твоя задача: поставить движок автомонтажа видео
AutoMontage-Agent и навык `reels-montage`, чтобы человек писал тебе «сделай рилс» и получал готовый ролик.
Делай всё сам, по шагам, коротко сообщая, что происходит. Человек не программист: терминал он не открывает,
файлы не раскладывает, ничего не настраивает.

Проверено 16.11.2026 на macOS (Apple Silicon): установка с нуля в чистую папку, демо-ролик, быстрый режим и режим под ключ.
Всего на диске после установки около 3 ГБ.
На Windows шаги собраны по документации движка и запуском не проверялись: там внимательнее смотри на проверки.

---

## Часть 1. Для человека (прочитай сам, 1 минута)

**Что получится.** Ты даёшь Codex видео, где ты говоришь в камеру, и пишешь «сделай рилс». Он сам расшифрует речь,
поставит субтитры с подсветкой слов, добавит плашки на ключевых мыслях, по просьбе подложит музыку и сделает
из горизонтального видео вертикальное. Всё происходит на твоём компьютере, видео никуда не загружается.
Ключи и подписки не нужны, кроме самого Codex.

**Что нужно от тебя.** Почти ничего:
- включённый VPN, как обычно для Codex;
- 5 ГБ свободного места на диске;
- отвечать «да», когда Codex просит разрешение выполнить команду или выйти в сеть;
- на Windows один раз нажать «Да» в системном окне «Разрешить этому приложению вносить изменения?».

**Сколько времени.** Установка 15-30 минут, почти всё это время качаются файлы (около 2 ГБ). Можно заниматься
своими делами, Codex напишет, когда закончит.

**Как запустить.** Положи этот файл в любую папку, открой её в Codex и отправь одну фразу:

> Прочитай файл reels-handoff.md и установи по нему автомонтаж рилсов. Иди по шагам и проверяй каждый.

**Три правила:**
- Пароли и ключи Codex не понадобятся. Если он вдруг попросит пароль или ключ, не давай и напиши ему «иди по инструкции».
- Не выключай VPN, пока идёт установка.
- Пока Codex монтирует ролик, не проси у него второй ролик в соседнем чате: движок делает по одному.

---

## Часть 2. Для агента

### 2.1. Правила. Они важнее всего остального

1. **Иди строго по шагам 0-9 по порядку.** Не пропускай шаги, не меняй порядок, не добавляй своих «улучшений».
2. **Каждый шаг кончается проверкой** из блока «Проверка». Проверка не прошла: дальше не идёшь, открываешь часть 3.
   Если подходящего признака в части 3 нет, остановись и опиши человеку в двух фразах, что видишь.
3. **Человека не грузи.** Никакой теории, никаких вариантов на выбор, никаких «можно ещё». Отчёт после шага:
   одна строка, «Шаг N готов». От человека нужно только «да» на запросы разрешений.
4. **Терминал человек не открывает.** Все команды запускаешь ты.
5. **Секретов не проси.** Ни паролей, ни API-ключей, ни токенов. Движку они не нужны. Если какая-то команда
   просит ключ или пароль, ты сошёл с маршрута: смотри часть 3.
6. **Ничего не ставь с правами администратора на macOS** (никакого `sudo`). Всё ставится в домашнюю папку:
   `~/AutoMontage-Agent` (движок), `~/.automontage-tools` (Node.js и ffmpeg, если их не было),
   `~/.local/bin` (uv), `~/.agents/skills/reels-montage` (навык).
   На Windows те же папки внутри `%USERPROFILE%`; установщик Node.js может показать системное окно, человек нажмёт «Да».
7. **Команды качают файлы и пишут в домашнюю папку:** запускай их с запросом разрешения, вне песочницы.
8. **Долгие команды не прерывай.** `npm ci`, демо-рендер и загрузка модели идут минутами. Ставь таймаут 30 минут.
   Если команда оборвалась из-за сети, запусти её же ещё раз: загрузка продолжится.
9. **Файлы навыка записывай своим инструментом записи файлов**, текст из блоков бери символ в символ, кодировка UTF-8.
   Не через `echo` и не через перенаправление в PowerShell: они портят кодировку.
10. **Код движка не правь.** Не запускай `npm audit fix`, не обновляй движок до другой версии, не ставь пакеты,
    которых нет в этой инструкции.
11. **Не проси выключить VPN.** Без него из России ты сам перестанешь отвечать.

**Строка окружения.** Каждую команду начинай с неё: приложение Codex не всегда видит программы, поставленные минуту назад.

macOS:

```bash
export PATH="$HOME/.automontage-tools/bin:$HOME/.automontage-tools/node/bin:$HOME/.local/bin:$PATH"; export PYTHONUTF8=1
```

Windows (PowerShell):

```powershell
$env:Path = "$env:USERPROFILE\.automontage-tools\bin;$env:USERPROFILE\.automontage-tools\node;$env:USERPROFILE\.local\bin;" + [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User'); $env:PYTHONUTF8 = '1'
```

### 2.2. Что ставим (для тебя, человеку не пересказывай)

| Что | Зачем | Откуда | Размер |
|---|---|---|---|
| AutoMontage-Agent v1.2.1 | движок монтажа (MIT) | архив тега с GitHub | 16 МБ |
| Node.js 20 или новее | запускает движок и рендер Remotion | уже стоит или nodejs.org | 200 МБ |
| ffmpeg и ffprobe | звук, кадры, финальная сборка | уже стоят или статическая сборка | 90 МБ |
| uv и Python 3.12 | отдельный Python для движка, систему не трогает | astral.sh | 100 МБ |
| Python-пакеты в `.venv` | распознавание речи, поиск лица | PyPI | 320 МБ |
| Node-пакеты и браузер для рендера | Remotion и Chrome Headless Shell | npm, качается при первом рендере | 590 МБ |
| Модель распознавания large-v3-turbo | расшифровка речи, работает офлайн | HuggingFace, один раз | 1,5 ГБ |

Версия движка закреплена: v1.2.1, коммит `83e8c28`. Именно она проверена. Архив вместо `git clone` взят нарочно:
git на компьютере не нужен.

---

### Шаг 0. Система и место

macOS:

```bash
uname -sm; df -h "$HOME" | tail -1; ls "$HOME/AutoMontage-Agent/scripts/build.js" 2>/dev/null
```

Windows (PowerShell):

```powershell
$env:PROCESSOR_ARCHITECTURE; Get-PSDrive C | Select-Object Free; Test-Path "$env:USERPROFILE\AutoMontage-Agent\scripts\build.js"
```

**Проверка:**
- macOS: `Darwin arm64` или `Darwin x86_64`. Windows: `AMD64`.
- свободно не меньше 5 ГБ;
- если система Linux или Windows на `ARM64`: остановись и скажи человеку, что эта инструкция для его компьютера не подходит;
- если файл `build.js` уже есть, движок ставили раньше: шаги 2-4 не повторяй вслепую, сразу иди к шагу 5 и по его результату
  доделай только то, чего не хватает.

### Шаг 1. Node.js, ffmpeg, uv

Сначала посмотри, что уже есть (строку окружения не забудь).

macOS:

```bash
node -v; ffmpeg -version | head -1; ffprobe -version | head -1; uv --version
```

Windows:

```powershell
node -v; ffmpeg -version | Select-Object -First 1; ffprobe -version | Select-Object -First 1; uv --version
```

Ставь только то, чего нет. Node.js нужен версии 20 или новее: если стоит старее, ставь свежий по блоку ниже
(он ляжет в свою папку и старый не тронет).

**macOS, нет Node.js:**

```bash
T="$HOME/.automontage-tools"; mkdir -p "$T/node"
NA=x64; if [ "$(uname -m)" = "arm64" ]; then NA=arm64; fi
F=$(curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt | grep "darwin-$NA.tar.gz" | awk '{print $2}')
curl -fsSL -o "$T/node.tar.gz" "https://nodejs.org/dist/latest-v24.x/$F"
tar -xzf "$T/node.tar.gz" -C "$T/node" --strip-components 1 && rm "$T/node.tar.gz"
```

**macOS, нет ffmpeg или ffprobe:**

```bash
T="$HOME/.automontage-tools"; mkdir -p "$T/bin"
NA=x64; if [ "$(uname -m)" = "arm64" ]; then NA=arm64; fi
curl -fsSL -o "$T/bin/ffmpeg.gz" "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-$NA.gz"
curl -fsSL -o "$T/bin/ffprobe.gz" "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffprobe-darwin-$NA.gz"
gunzip -f "$T/bin/ffmpeg.gz" "$T/bin/ffprobe.gz" && chmod +x "$T/bin/ffmpeg" "$T/bin/ffprobe"
```

**macOS, нет uv:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

На macOS не запускай команды `git` и `python3`: на чистом Mac они открывают системное окно установки
инструментов разработчика на несколько гигабайт. Здесь они не нужны, как и Homebrew.

**Windows, нет Node.js** (появится системное окно, человек нажимает «Да»):

```powershell
winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
```

**Windows, нет ffmpeg или ffprobe:**

```powershell
winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements
```

**Windows, нет uv:**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Проверка:** выполни строку окружения заново и повтори четыре команды из начала шага. Все четыре печатают версию,
`node -v` показывает v20 или выше.

### Шаг 2. Скачать движок

Если папка `AutoMontage-Agent` в домашнем каталоге уже есть, этот шаг пропусти.

macOS:

```bash
cd "$HOME" && curl -fsSL -o automontage.zip https://github.com/Ntmib/AutoMontage-Agent/archive/refs/tags/v1.2.1.zip && unzip -q automontage.zip && mv AutoMontage-Agent-1.2.1 AutoMontage-Agent && rm automontage.zip
```

Windows:

```powershell
Set-Location $env:USERPROFILE; curl.exe -fsSL -o automontage.zip https://github.com/Ntmib/AutoMontage-Agent/archive/refs/tags/v1.2.1.zip; Expand-Archive automontage.zip -DestinationPath .; Rename-Item AutoMontage-Agent-1.2.1 AutoMontage-Agent; Remove-Item automontage.zip
```

Все следующие команды выполняй из папки движка: `cd "$HOME/AutoMontage-Agent"` (Windows: `Set-Location "$env:USERPROFILE\AutoMontage-Agent"`).

**Проверка:**

```bash
node -e "console.log(require('./package.json').version)"
```

печатает `1.2.1`.

### Шаг 3. Node-пакеты

macOS:

```bash
npm ci
```

Windows (именно `npm.cmd`, обычный `npm` PowerShell может заблокировать):

```powershell
npm.cmd ci
```

Идёт 1-5 минут. Предупреждения `npm warn` и строка про `vulnerabilities` это норма, ничего не чини.

**Проверка:** существует папка `node_modules/remotion`.

### Шаг 4. Python и пакеты распознавания

macOS:

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt "av<19" "opencv-python<5"
```

Windows:

```powershell
uv venv --python 3.12 .venv
uv pip install --python .venv\Scripts\python.exe -r requirements.txt "av<19" "opencv-python<5"
```

Идёт 2-5 минут. Три вещи здесь закреплены не случайно, не «улучшай» их:
- Python именно 3.12. На самом новом Python пакеты распознавания не ставятся;
- `av<19`: с av 19 распознавание речи падает с ошибкой `metadata_errors`;
- `opencv-python<5`: с OpenCV 5 не работает слежение за лицом (`CascadeClassifier`).

**Проверка** (на Windows путь `.venv\Scripts\python.exe`):

```bash
.venv/bin/python -c "import cv2; print(cv2.__version__, hasattr(cv2, 'CascadeClassifier'))"
```

печатает версию, которая начинается с `4.`, и `True`.

### Шаг 5. Проверка окружения движка

```bash
node scripts/doctor.js
```

**Проверка (PASS):**
- нет ни одной строки `FAIL`;
- строка `Python 3 (Python 3.12...)` показывает интерпретатор внутри `AutoMontage-Agent/.venv`;
- есть строки `OK` про `ffmpeg`, `ffprobe`, `faster-whisper`, `node_modules`;
- одна строка `WARN Chromium не найден` это норма, чинить не надо;
- последняя строка: «Всё основное на месте, 1 предупрежд. Базовый монтаж заработает.» или «Всё готово. Можно монтировать.»

### Шаг 6. Демо-ролик

```bash
node scripts/cli.js demo
```

При первом запуске движок сам докачает браузер для рендера (около 190 МБ), поэтому первый раз идёт 1-5 минут.

**Проверка:** в конце вывода строка `✅ готово:` и существует файл `out/demo.mp4`. Команда

```bash
ffprobe -v error -show_entries stream=codec_type,width,height:format=duration -of default=nw=1 out/demo.mp4
```

показывает `codec_type=video`, `width=1080`, `height=1920`, `codec_type=audio` и `duration=14.000000`.

### Шаг 7. Модель распознавания речи

```bash
ffmpeg -v error -y -i examples/demo-source.mp4 -vn -ar 16000 -ac 1 out/smoke.wav
.venv/bin/python scripts/transcribe.py out/smoke.wav out/smoke.json large-v3-turbo
```

На Windows вторая команда начинается с `.venv\Scripts\python.exe`.
Первый запуск качает модель 1,5 ГБ, это самая долгая часть: 3-20 минут. Скажи человеку одной строкой, что идёт
загрузка модели и что это один раз. Оборвалось: запусти ту же команду снова.

**Проверка:** в выводе есть строка `model=large-v3-turbo segments=0`, команда завершилась без ошибки. Строка `[ctranslate2] ... warning` рядом это норма.

### Шаг 8. Навык для Codex

Создай два файла своим инструментом записи файлов. Папка навыка:
`~/.agents/skills/reels-montage/` (Windows: `%USERPROFILE%\.agents\skills\reels-montage\`).

**Файл 1: `SKILL.md`** в папке навыка. Текст целиком из блока ниже, от строки `---` до последней строки блока:

`````markdown
---
name: reels-montage
description: >-
  Автомонтаж роликов из видео с говорящим человеком на локальном движке AutoMontage-Agent:
  субтитры-караоке, плашки, сцены с тезисами и цифрами, музыка с приглушением под голос,
  горизонтальное видео в вертикаль. Используй, когда человек просит: «сделай рилс»,
  «смонтируй ролик», «нарежь вертикалку», «собери ролик из этого видео», Reels, Shorts,
  «смонтируй эфир», «смонтируй урок». Не используй для других задач с видео и не запускай
  движок, пока человек сам не попросил ролик.
---

# Рилс из видео (AutoMontage-Agent)

Движок стоит на компьютере человека и работает локально: видео никуда не загружается.
Ключи LLM не нужны: ТЗ и монтажный лист пишешь ты сам по расшифровке речи.

- Папка движка: `~/AutoMontage-Agent` (Windows: `%USERPROFILE%\AutoMontage-Agent`). Версия v1.2.1, лицензия MIT.
- Помощник навыка: `scripts/reels-tool.js` рядом с этим файлом. Ниже он называется `TOOL`.
- Все команды запускай сам. Человек терминал не открывает.

## Перед каждой командой

Каждый запуск начинай с этой строки, иначе движок не найдёт `node`, `ffmpeg` и Python.

macOS:

```bash
export PATH="$HOME/.automontage-tools/bin:$HOME/.automontage-tools/node/bin:$HOME/.local/bin:$PATH"; export PYTHONUTF8=1; cd "$HOME/AutoMontage-Agent"
```

Windows (PowerShell):

```powershell
$env:Path = "$env:USERPROFILE\.automontage-tools\bin;$env:USERPROFILE\.automontage-tools\node;$env:USERPROFILE\.local\bin;" + [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User'); $env:PYTHONUTF8 = '1'; Set-Location "$env:USERPROFILE\AutoMontage-Agent"
```

Python движка: `.venv/bin/python` (Windows: `.venv\Scripts\python.exe`). Движок находит его сам.
`TOOL` на macOS: `"$HOME/.agents/skills/reels-montage/scripts/reels-tool.js"`,
на Windows: `"$env:USERPROFILE\.agents\skills\reels-montage\scripts\reels-tool.js"`.

## Когда не использовать

- Человек не просил ролик. Молчи, движок не запускай.
- Нужна простая обрезка, склейка или смена формата без оформления. Это делается одним ffmpeg.
- Нужна анимация без исходного видео, заставка, презентация. Этот движок монтирует только снятое видео с речью.

## Шаг 0. Проверка перед работой

```bash
node scripts/doctor.js
```

Нужно: ни одной строки `FAIL`. Предупреждение `WARN Chromium не найден` нормальное, не чини его.
Если есть `FAIL`, скажи человеку одной фразой, что не так, и предложи заново пройти установку по файлу `reels-handoff.md`.

## Шаг 1. Понять задачу

1. Нужен путь к видео. Если человек не дал файл, попроси перетащить видео в чат или назвать папку.
2. Проверь исходник:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size -of default=nw=1 "<видео>"
```

   Должны быть поток `video` и поток `audio`. Без звука субтитры не из чего делать: скажи об этом человеку.
3. Выбери режим:
   - **Быстрый**: «просто смонтируй», «сделай рилс», короткое видео. Субтитры-караоке и плашки, без согласования.
   - **Под ключ**: урок, эфир, продающий ролик, «по сценам», «покажи план». Сначала ТЗ на утверждение, потом рендер.
4. Задай не больше одного вопроса и только если без ответа нельзя начать. Остальное бери по умолчанию: формат как у исходника, полная длина, без музыки.

Если просят рилс, а видео длиннее 3 минут, целиком его не монтируй. Сначала сделай расшифровку (`prepare` из режима под ключ), предложи 3-5 сильных кусков по 30-60 секунд с таймкодами и первыми фразами, дай человеку выбрать. Выбранный кусок вырежи в отдельный файл и монтируй его:

```bash
ffmpeg -v error -y -ss <начало в секундах> -to <конец в секундах> -i "<видео>" -c:v libx264 -c:a aac "<кусок>.mp4"
```

Длинный урок или эфир целиком монтируй только в режиме под ключ и только если человек прямо просит весь ролик. Предупреди, что расшифровка и рендер часовой записи идут долго.

## Быстрый режим

Два прохода: короткий черновой и полный.

**1. Черновой проход** (расшифровка речи и черновой монтажный лист, рендерит только первые 2 секунды):

```bash
node scripts/build.js "<видео>" --project "<короткое название>" --frames 60
```

Добавь флаги по задаче:

- `--reframe` если исходник горизонтальный, а нужен вертикальный ролик (кадр следит за лицом);
- `--tighten` если просили вырезать паузы и слова-паразиты;
- `--theme cyber` если просили тёмный неоновый стиль (по умолчанию тёплый `craft`);
- `--model small` если компьютер слабый или интернет медленный (модель легче, распознаёт хуже).

В выводе найди строку `черновой лист → <путь>`. Папка проекта: `projects/ГГГГ.ММ.ДД_название/`. Запомни её полный путь, дальше это `<проект>`.

**2. Допиши монтажный лист.** Прочитай `<проект>/transcript/words.json` (речь с таймкодами) и поправь `<проект>/brief/v01-draft.scenario.json`:

- в блоке `LabelTop` замени текст `>_ ВИДЕО` на короткую тему ролика;
- блок `CaptionsAuto` не удаляй и не перестраивай, это субтитры. В нём можно только исправить слова, которые распознались с ошибкой (имена, термины);
- добавь в массив `blocks` плашки по смыслу речи, примерно 4-8 на минуту:

| Блок | Для чего | Поля |
|---|---|---|
| `SubtitleCard` | ключевая мысль | `text`, `sub`, `accent` (true или false) |
| `InfoCard` | тезис с пунктами | `tag`, `title`, `pills` (массив коротких строк) |
| `CounterCard` | число, которое прозвучало | `label`, `value` (число), `unit` |
| `CTACard` | призыв в конце | `head`, `btn` |
| `BrollFullscreen` | картинка на весь экран | `image` (файл из `public/broll/`, например `broll/growth.png`), `caption` |

У каждого блока есть `start` и `end` в секундах (у `CTACard` хватит `start`). Правила:

- тексты, цифры и цитаты только из речи, ничего не выдумывай;
- плашка держится 2-4 секунды, в тексте 3-5 слов;
- плашкам ставь `"pos": "top"`, иначе они ложатся на субтитры внизу;
- первая плашка в первые 3 секунды, две плашки одновременно не показывай.

**3. Полный проход:**

```bash
node scripts/build.js "<проект>/input/source.mp4" --project-dir "<проект>" --scenario brief/v01-draft.scenario.json --version-label plashki
```

Повтори те же флаги `--reframe`, `--tighten`, `--theme`, `--model`, что были в черновом проходе. По просьбе добавь `--beat` (ритмичный зум, новый план каждые 3 секунды).
Готовый файл лежит в `<проект>/final/`, точный путь печатается в строке `✅ готово:`. Каждая правка идёт с новым `--version-label` (`pravka-2`, `bez-plashek`), старые версии остаются в `<проект>/renders/`.

Если плашки сверху закрывают лицо, есть флаг `--autopos`: движок сам расставит плашки по кадру. Он перекрывает твой `pos` и может положить плашку на субтитры, поэтому после него смотри стоп-кадры особенно внимательно.

**Только субтитры, без плашек:** в шаге 2 поправь только текст в `LabelTop` и сразу делай полный проход.

## Режим под ключ

В этом режиме ролик собирается из сцен с крупным текстом. Субтитров-караоке в нём нет. Рендер только после явного «ок» или «утверждаю» от человека.

**1. Подготовка** (папка проекта, расшифровка, пустой черновик ТЗ):

```bash
node TOOL prepare "<видео>" "<короткое название>" --aspect source
```

`--aspect`: `source` (как исходник), `vertical` (1080x1920) или `horizontal` (1920x1080). Для слабого компьютера добавь `--model small`. В конце вывода команда печатает JSON: `projectDir`, `transcript`, `draft`, размер и длительность. Дальше `<проект>` это путь из `projectDir`.

**2. Напиши ТЗ.** Прочитай расшифровку и заполни в черновике `<проект>/brief/v01-draft.lesson.json` поля `title`, `corrections` и `scenes`. Поля `source`, `output`, `status`, `version` не трогай.

Сцены только из этого списка, новых не придумывай:

| Сцена | Для чего | Обязательные поля | Ещё можно |
|---|---|---|---|
| `fullscreen` | заход, связка, человек на весь экран | `caption` | |
| `split` | основное объяснение | `headCream`, `headOrange`, `bullets` (до 4) | `num` |
| `bottom-diagram` | шаги по порядку | `headCream`, `headOrange`, `steps` (1-4) | |
| `blur-overlay` | сильный акцент | `big`, `headCream`, `headOrange` | `label`, `sub` |
| `text-only` | дословная цитата | `quoteCream`, `quoteOrange` | `label`, `author` |
| `stat` | цифра, которая прозвучала | `statCream`, `statOrange`, `headCream`, `headOrange` | `label`, `sub` |
| `broll` | картинка-пример | `brollSrc`, `headCream`, `headOrange` | `sub` |

У каждой сцены `scene`, `start`, `end` в секундах. Пары `...Cream` и `...Orange` это две части одной фразы: первая светлая, вторая цветная. Правила:

- сцены идут подряд, не пересекаются, `end` не больше длины ролика;
- тексты и цифры только из речи, заголовки короткие, заглавными буквами;
- `big` это одно короткое слово или число (до 6 знаков), длинное обрежется по краям;
- смена сцены каждые 2-8 секунд, одинаковые сцены подряд не ставь, в последней трети чаще `fullscreen` с лицом;
- `broll` только если человек дал картинку: скопируй её в `public/broll/` движка и укажи `broll/имя-файла`;
- в `corrections` запиши исправления распознавания: `{"from": "как распознано", "to": "как правильно", "reason": "почему"}`;
- лицо не в центре кадра: добавь в корень ТЗ `"facePos": {"x": 0.5, "y": 0.4}` (доли от 0 до 1) и при нужде `"faceZoom": 1.1` (от 1 до 2).

Музыка (только если просили): добавь в корень ТЗ

```json
"music": { "file": "<полный путь к файлу музыки>", "gainDb": -20,
  "ducking": { "thresholdDb": -26, "ratio": 6, "attackMs": 10, "releaseMs": 220 } }
```

**3. Проверь и зарегистрируй ТЗ:**

```bash
node TOOL register "<проект>" brief/v01-draft.lesson.json
```

Команда проверяет ТЗ по схеме движка и пишет рядом читаемый `brief/v01-draft.lesson.md`. Ошибки исправь и запусти снова.

**4. Покажи ТЗ человеку одним сообщением:** формат и длительность, таблица сцен (время, что на экране), исправления распознавания, музыка. Закончи фразой: «Напиши "утверждаю" или пришли правки одним списком». Остановись и жди. До ответа ничего не рендери. Правки до утверждения вноси в тот же черновик и снова запускай `register`.

**5. После «утверждаю»:**

```bash
node scripts/project/approve-brief.js "<проект>" brief/v01-draft.lesson.json
node scripts/build.js "<проект>/input/source.mp4" --template lesson --project-dir "<проект>" --brief brief/v01-approved.lesson.json --version-label first-render
```

Во второй команде не добавляй `--aspect` и `--theme`: формат и тема уже записаны в утверждённом ТЗ.
Готовый файл лежит в `<проект>/final/`, точный путь печатается в строке `✅ готово по утверждённому ТЗ:`.

**6. Правки после рендера.** Утверждённое ТЗ менять нельзя. Сделай новую версию:

```bash
node TOOL prepare --project-dir "<проект>"
```

Она скопирует прошлое ТЗ в `brief/v02-draft.lesson.json`. Внеси правки, дальше снова шаги 3, 4, 5 с номером `v02` и новым `--version-label` (например `pravka-2`).

## Музыка в быстром режиме

Своей музыки в движке нет. Варианты: файл человека (на который у него есть права) или простой бит, который движок генерирует сам:

```bash
.venv/bin/python scripts/gen-lofi.py "<проект>/assets/music/lofi.wav" --dur <длина ролика в секундах>
node scripts/mix-music.js "<готовый ролик>" "<музыка>" "<проект>/final/s-muzykoy.mp4" --gain -20
```

На Windows вместо `.venv/bin/python` пиши `.venv\Scripts\python.exe`. Есть второй генератор, ритмичнее: `scripts/gen-beat.py` с теми же аргументами.
Музыка сама приглушается под голосом. Если она слишком громкая, ставь `--gain -24`. Если слишком тихая, `--gain -16`.

## Проверка результата (обязательно, до показа человеку)

Успешный рендер ещё не готовый ролик. Проверь сам:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size -of default=nw=1 "<ролик>"
ffmpeg -v error -i "<ролик>" -f null -
ffmpeg -v error -y -ss <секунда> -i "<ролик>" -frames:v 1 "<проект>/previews/kadr-<секунда>.jpg"
```

1. `ffprobe`: есть видео и звук, размер и длительность ожидаемые.
2. Вторая команда ничего не печатает: файл читается целиком без ошибок.
3. Сними стоп-кадры: начало, середина, конец и по одному на каждую плашку или сцену. Открой каждый кадр и посмотри сам.
4. На кадрах: текст не закрывает лицо, не обрезан краем, плашки не лежат на субтитрах, слова без ошибок распознавания.

Нашёл дефект: исправь лист или ТЗ и пересобери с новым `--version-label`. Сырой результат человеку не показывай. Если исправление меняет утверждённый текст, покажи изменение на утверждение.

## Отдать результат

1. Скопируй финальный MP4 в папку, где лежит исходное видео, с понятным именем: `<имя исходника>-reels.mp4`.
2. Открой папку с файлом (macOS: `open -R "<файл>"`, Windows: `explorer /select,"<файл>"`).
3. Напиши человеку: полный путь к файлу, формат, длительность, размер. Одной строкой, что сделано (субтитры, сколько плашек, музыка).
4. Подскажи: в Telegram отправлять как файл, иначе вертикальное видео сожмётся.

## Чего движок не умеет

- Генерировать картинки. Вставляет только готовые файлы.
- Собирать два ролика одновременно. Строго по одному: дождись конца рендера.
- Монтировать видео без речи: всё оформление строится по словам.
- Распознаёт только русскую речь.

## Если что-то сломалось

Список типовых поломок с признаками и лечением лежит в файле установки `reels-handoff.md`, часть 3. Главные:

- `ffmpeg не найден` или `FAIL` в doctor: не выполнена строка из раздела «Перед каждой командой».
- `нужен ANTHROPIC_API_KEY или OPENAI_API_KEY`: ты запустил `--template lesson` без `--brief`. Ключи не нужны, черновик ТЗ делает `TOOL prepare`.
- `черновик не зарегистрирован в project.json`: сначала `TOOL register`, потом `approve-brief.js`.
- Загрузка модели распознавания оборвалась: проверь VPN и запусти ту же команду ещё раз.
`````

**Файл 2: `scripts/reels-tool.js`** в папке навыка (подпапка `scripts`). Текст целиком из блока ниже:

```javascript
#!/usr/bin/env node
// Помощник навыка reels-montage для режима «под ключ» без ключей LLM.
// Движок AutoMontage-Agent v1.2.1 умеет сам писать ТЗ только с API-ключом.
// Здесь ТЗ пишет агент, а помощник делает механическую часть через модули движка.
//
//   node reels-tool.js check
//   node reels-tool.js prepare <видео> "<название>" [--aspect source|vertical|horizontal] [--model large-v3-turbo]
//   node reels-tool.js prepare --project-dir <папка проекта> [--aspect ...]
//   node reels-tool.js register <папка проекта> <brief/vNN-draft.lesson.json>
//
// Папка движка: переменная AUTOMONTAGE_ROOT или ~/AutoMontage-Agent.
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(process.env.AUTOMONTAGE_ROOT || path.join(os.homedir(), 'AutoMontage-Agent'));
if (!fs.existsSync(path.join(ROOT, 'scripts', 'build.js'))) {
  console.error(`Движок не найден в ${ROOT}. Задай AUTOMONTAGE_ROOT или переустанови по хендоффу.`);
  process.exit(1);
}
const engine = (file) => require(path.join(ROOT, 'scripts', file));
const { python, tmp } = engine('env');
const { audioExtractionCommand, videoProbeCommand } = engine('build-commands');
const { parseVideoProbe } = engine('media-probe');
const { captureTool, runTool } = engine('process');
const { resolveOutputGeometry } = engine('lesson/aspect');
const { formatBriefMarkdown, validateLessonBrief } = engine('lesson/brief');
const { createOrOpenProject, nextBriefPaths, recordBrief } = engine('project/workspace');

const args = process.argv.slice(2);
const command = args.shift();
const opt = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const rel = (project, file) => path.relative(project.dir, file).split(path.sep).join('/');

function probe(video) {
  const cmd = videoProbeCommand(video);
  return parseVideoProbe(captureTool(cmd.command, cmd.args, {
    cwd: ROOT, stage: 'source ffprobe', maxBuffer: 4 * 1024 * 1024,
  }), 'source ffprobe');
}

function prepare() {
  const projectDir = opt('project-dir', null);
  const positional = args.filter((value, index) => !value.startsWith('--')
    && !(index > 0 && args[index - 1].startsWith('--')));
  let project;
  if (projectDir) {
    project = createOrOpenProject({ projectDir: path.resolve(projectDir) });
  } else {
    const [video, name] = positional;
    if (!video || !name) throw new Error('нужно: prepare <видео> "<название>"');
    project = createOrOpenProject({
      baseDir: path.join(ROOT, 'projects'),
      name,
      sourcePath: path.resolve(video),
    });
  }
  const source = project.sourcePath;
  const info = probe(source);
  const words = path.join(project.dir, project.manifest.transcript.words);
  if (!fs.existsSync(words)) {
    const wav = tmp(`reels_${process.pid}_audio.wav`);
    const extract = audioExtractionCommand(source, wav);
    runTool(extract.command, extract.args, { cwd: ROOT, stage: 'audio extraction' });
    fs.mkdirSync(path.dirname(words), { recursive: true });
    runTool(python(), [
      path.join(ROOT, 'scripts', 'transcribe.py'), wav, words, opt('model', 'large-v3-turbo'),
    ], { cwd: ROOT, stage: 'transcription' });
    fs.rmSync(wav, { force: true });
  }
  const previous = [...project.manifest.briefs].reverse()
    .find((brief) => /\.lesson\.json$/.test(brief.jsonPath));
  const base = previous
    ? JSON.parse(fs.readFileSync(path.join(project.dir, previous.jsonPath), 'utf8'))
    : null;
  const aspect = opt('aspect', base ? base.output.aspect : 'source');
  const geometry = resolveOutputGeometry({
    sourceWidth: info.width, sourceHeight: info.height, sourceFps: info.fps, aspect,
  });
  const next = nextBriefPaths(project, 'lesson');
  const draft = {
    version: 1,
    status: 'draft',
    source,
    theme: base ? base.theme : 'lesson-neutral',
    title: base ? base.title : project.manifest.name,
    output: {
      aspect: geometry.aspect,
      width: geometry.width,
      height: geometry.height,
      fps: geometry.fps,
      durationInFrames: Math.max(1, Math.ceil(info.duration * geometry.fps)),
    },
    corrections: base ? base.corrections : [],
    scenes: base ? base.scenes : [],
  };
  for (const key of ['facePos', 'faceZoom', 'music']) {
    if (base && base[key] != null) draft[key] = base[key];
  }
  const kept = fs.existsSync(next.jsonPath);
  if (!kept) fs.writeFileSync(next.jsonPath, `${JSON.stringify(draft, null, 2)}\n`);
  console.log(JSON.stringify({
    note: kept ? 'черновик уже был, не перезаписан' : 'создан новый черновик',
    projectDir: project.dir,
    source,
    sourceVideo: { width: info.width, height: info.height, fps: info.fps, durationSec: info.duration },
    output: draft.output,
    transcript: words,
    draft: rel(project, next.jsonPath),
    copiedFrom: previous ? previous.jsonPath : null,
    next: 'заполни scenes и corrections в черновике, затем register',
  }, null, 2));
}

function register() {
  const [projectDir, draftInput] = args;
  if (!projectDir || !draftInput) throw new Error('нужно: register <папка проекта> <brief/vNN-draft.lesson.json>');
  const project = createOrOpenProject({ projectDir: path.resolve(projectDir) });
  const draftPath = path.resolve(project.dir, draftInput);
  const draftRel = rel(project, draftPath);
  const match = /^brief\/v(\d+)-draft\.lesson\.json$/.exec(draftRel);
  if (!match) throw new Error('черновик должен лежать в brief/ и называться vNN-draft.lesson.json');
  const brief = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
  const errors = [...validateLessonBrief(brief).errors];
  if (brief.status !== 'draft') errors.push('status должен быть draft');
  if (path.resolve(String(brief.source)) !== project.sourcePath) {
    errors.push(`source должен быть ${project.sourcePath}`);
  }
  const duration = brief.output ? brief.output.durationInFrames / brief.output.fps : 0;
  (brief.scenes || []).forEach((scene, index) => {
    if (scene.end > duration + 0.05) {
      errors.push(`scenes[${index}]: end ${scene.end} больше длины ролика ${duration.toFixed(2)}`);
    }
  });
  if (brief.music && !fs.existsSync(path.resolve(brief.music.file))) {
    errors.push(`музыка не найдена: ${brief.music.file} (нужен абсолютный путь)`);
  }
  if (errors.length) {
    console.error('ТЗ не прошло проверку:');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  const markdownPath = draftPath.replace(/\.json$/, '.md');
  fs.writeFileSync(markdownPath, formatBriefMarkdown(brief));
  const registered = project.manifest.briefs.some((entry) => entry.jsonPath === draftRel);
  if (!registered) {
    recordBrief(project, {
      revision: Number(match[1]),
      jsonPath: draftPath,
      markdownPath,
      status: 'draft',
      theme: typeof brief.theme === 'string' ? brief.theme : null,
      aspect: brief.output.aspect,
    });
  }
  console.log(JSON.stringify({
    ok: true,
    draft: draftRel,
    markdown: rel(project, markdownPath),
    scenes: brief.scenes.length,
    next: `после «утверждаю»: node scripts/project/approve-brief.js "${project.dir}" ${draftRel}`,
  }, null, 2));
}

try {
  if (command === 'prepare') prepare();
  else if (command === 'register') register();
  else if (command === 'check') {
    const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
    console.log(`reels-tool OK: движок ${version} в ${ROOT}`);
    const skillFile = path.join(__dirname, '..', 'SKILL.md');
    const skillText = fs.existsSync(skillFile) ? fs.readFileSync(skillFile, 'utf8') : '';
    if (!skillText.includes('name: reels-montage') || !skillText.includes('## Если что-то сломалось')) {
      console.error('SKILL.md не найден рядом или записан не целиком: запиши его заново из хендоффа');
      process.exit(1);
    }
    console.log('SKILL.md OK');
  } else {
    console.error('Команды: check | prepare | register. Описание в начале файла.');
    process.exit(1);
  }
} catch (error) {
  console.error(`reels-tool: ${error.message}`);
  process.exit(1);
}
```

**Проверка** (на Windows путь `"$env:USERPROFILE\.agents\skills\reels-montage\scripts\reels-tool.js"`):

```bash
node "$HOME/.agents/skills/reels-montage/scripts/reels-tool.js" check
```

печатает две строки: `reels-tool OK: движок 1.2.1 в ...` и `SKILL.md OK`. И первая строка файла `SKILL.md` это `---`, вторая `name: reels-montage`.

### Шаг 9. Убрать за собой и сказать человеку

1. Удали пробные файлы: `out/smoke.wav`, `out/smoke.json`. Папку `out` с `demo.mp4` оставь.
2. Отправь человеку сообщение из части 4, дословно.

---

## Часть 3. Только если сломалось

Открывай эту часть, когда проверка шага не прошла или команда упала. Ищи свой признак, делай только то, что написано.

| № | Признак | Лечение |
|---|---|---|
| 1 | `command not found: node` (или `ffmpeg`, `uv`), на Windows «не является внутренней или внешней командой» | Не выполнена строка окружения из раздела 2.1. Выполни её и повтори команду. Не помогло: вернись к шагу 1 |
| 2 | doctor: `FAIL ffmpeg не найден` или `FAIL ffprobe не найден` | То же: строка окружения, потом шаг 1 для ffmpeg |
| 3 | doctor: `FAIL node_modules нет` | Шаг 3 не дошёл до конца. Запусти `npm ci` ещё раз из папки движка |
| 4 | doctor: `FAIL Python 3 не найден` или `WARN faster-whisper не установлен` | Нет `.venv` или пакеты не встали. Повтори шаг 4 целиком |
| 5 | doctor: `FAIL Node.js ... слишком старый` | Поставь свежий Node.js по шагу 1 и выполни строку окружения: папка `.automontage-tools` стоит в PATH первой |
| 6 | doctor: `WARN Chromium не найден` | Это норма. Ничего не делай |
| 7 | `No matching distribution found for onnxruntime` при установке пакетов | `.venv` создан не на Python 3.12. Удали папку `.venv` и повтори шаг 4 строго с `--python 3.12` |
| 8 | `TypeError: open() got an unexpected keyword argument 'metadata_errors'` | Встал av 19. Выполни вторую команду шага 4 ещё раз (в ней `"av<19"`) |
| 9 | `AttributeError: module 'cv2' has no attribute 'CascadeClassifier'` | Встал OpenCV 5. Выполни вторую команду шага 4 ещё раз (в ней `"opencv-python<5"`) |
| 10 | `❌ для шаблона lesson нужен ANTHROPIC_API_KEY или OPENAI_API_KEY` | Ключи не нужны и у человека их не проси. Ты запустил `build.js --template lesson` без `--brief`. Черновик ТЗ делает `reels-tool.js prepare`, смотри навык |
| 11 | `Не удалось утвердить brief: черновик не зарегистрирован в project.json` | Сначала `reels-tool.js register`, потом `approve-brief.js` |
| 12 | `approved brief JSON path already exists` | Это ТЗ уже утверждено. Для правок сделай новую версию: `reels-tool.js prepare --project-dir "<проект>"` |
| 13 | `проект не подготовлен: проект уже использует другой исходник` | В команды с `--project-dir` передавай видео этого проекта: `<проект>/input/source.mp4`. Для другого видео заводи новый проект |
| 14 | `aspect отличается от утверждённого ТЗ` или `тема отличается от утверждённого ТЗ` | Убери `--aspect` и `--theme` из команды рендера с `--brief` |
| 15 | Загрузка стоит или обрывается: модель (шаг 7), браузер для рендера (шаг 6), архив с GitHub (шаги 1-2) | Спроси человека, включён ли VPN. Запусти ту же команду ещё раз, загрузка продолжится. Модель не качается совсем: в шаге 7 замени `large-v3-turbo` на `small` (460 МБ, распознаёт хуже) и потом в командах навыка добавляй `--model small` |
| 16 | Рендер длинного ролика в быстром режиме упал посередине | Запусти ту же команду ещё раз: длинные ролики рендерятся порциями и продолжаются с места сбоя |
| 17 | Два ролика рендерились одновременно, результат битый | Движок собирает строго по одному ролику. Дождись конца первого, потом запускай второй |
| 18 | Windows: `выполнение сценариев отключено в этой системе` при запуске `npm` | Пиши `npm.cmd` вместо `npm` |
| 19 | Windows: `winget` не найден | Node.js: скачай `node-v24...-win-x64.zip` из `https://nodejs.org/dist/latest-v24.x/` (точное имя в файле `SHASUMS256.txt` там же), распакуй так, чтобы `node.exe` лежал в `%USERPROFILE%\.automontage-tools\node\`. ffmpeg: скачай `ffmpeg-win32-x64` и `ffprobe-win32-x64` из `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/` в `%USERPROFILE%\.automontage-tools\bin\` под именами `ffmpeg.exe` и `ffprobe.exe`. Строка окружения эти папки уже учитывает |
| 20 | Windows: в субтитрах кракозябры вместо русских букв | В окружении нет `PYTHONUTF8=1`. Выполни строку окружения и пересобери ролик с начала (с чернового прохода или с `prepare`) |
| 21 | На плашке или в сцене обрезан текст, плашка легла на субтитры или на лицо | Это не поломка установки. Правила в навыке: короче текст, `"pos": "top"`, `facePos`. Поправь лист и пересобери |

Нет своего признака: остановись, покажи человеку последние строки ошибки и напиши двумя фразами, на каком шаге ты встал.

---

## Часть 4. После установки

### Что сказать человеку (дословно)

> Готово, автомонтаж установлен и проверен: я собрал пробный ролик, всё работает.
>
> Как пользоваться: открой новый чат, перетащи в него видео, где ты говоришь в камеру, и напиши «сделай рилс». Я расшифрую речь, поставлю субтитры и плашки и положу готовый файл рядом с твоим видео. Минутный ролик собирается за 3-10 минут, зависит от компьютера.
>
> Три подсказки:
> 1. Лучше всего получаются видео до 3 минут, где хорошо слышно голос. Из длинной записи я сначала предложу лучшие куски.
> 2. Если хочешь сначала увидеть план ролика, добавь «покажи план до рендера».
> 3. Готовый ролик в Telegram отправляй файлом, а не как видео, иначе он сожмётся.
>
> Если навык не включился сам, начни сообщение с `$reels-montage`.

### 12 готовых просьб для первого ролика

Человек копирует, перетаскивает видео в чат и отправляет:

1. `Сделай рилс из этого видео. Просто смонтируй на свой вкус.`
2. `Сделай рилс: субтитры с подсветкой слов и плашки на ключевых мыслях.`
3. `Нарежь вертикалку из этого горизонтального видео, следи за лицом.`
4. `Смонтируй ролик и вырежи паузы и слова-паразиты, чтобы речь была плотной.`
5. `Сделай рилс только с субтитрами, без плашек. Формат оставь как в исходнике.`
6. `Смонтируй ролик под ключ: разложи по сценам и покажи план до рендера.`
7. `Сделай продающий рилс. В конце карточка с призывом «Записаться на консультацию».`
8. `Смонтируй ролик и подложи спокойную музыку, чтобы голос было хорошо слышно.`
9. `Сделай рилс в тёмном неоновом стиле.`
10. `Из этой длинной записи найди 5 самых сильных кусков по 40-60 секунд. Покажи таймкоды и первые фразы, я выберу.`
11. `Я не умею монтировать. Сделай из этого видео нормальный рилс, но сначала простыми словами покажи, что задумал.`
12. `Музыка громкая, перебивает голос. Пересобери тише, старую версию не удаляй.`

### Где что лежит и как удалить

- Движок и все ролики: `~/AutoMontage-Agent`, проекты роликов в подпапке `projects`.
- Инструменты: `~/.automontage-tools`. Навык: `~/.agents/skills/reels-montage`.
- uv и его Python: `~/.local/bin/uv`, `~/.local/share/uv`.
- Модель распознавания: `~/.cache/huggingface/hub`.

Удалить всё: стереть эти папки. На Windows Node.js и ffmpeg, если их ставил winget, удаляются как обычные программы.
