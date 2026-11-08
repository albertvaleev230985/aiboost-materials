#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.14"
# dependencies = [
#     "onnx-asr[cpu,hub]>=0.12",
#     "numpy>=1.26",
#     "imageio-ffmpeg>=0.6",
#     "yt-dlp[default]>=2026.10.26",
#     "deno>=2.9; sys_platform != 'win32' or platform_machine != 'ARM64'",
# ]
# ///
"""neovida-transcribe: видео и аудио в текст на русском, локально, моделью GigaAM v3 (Сбер).

Пакет NEOVIDA для учеников курса «AI Цех». Звук никуда не отправляется: модель
скачивается один раз (около 230 МБ) и дальше работает на компьютере без интернета.

Установка (делает агент по SETUP.md): окружение ~/.neovida-transcribe/venv
(uv venv + uv pip install -r этот_файл), команда-обёртка в ~/.local/bin.
Без установки можно и так: uv run --script neovida_transcribe.py <вход>.

Примеры:
  neovida-transcribe запись.m4a                    # рядом появится запись.md
  neovida-transcribe "C:\\Видео\\урок.mp4"          # Windows
  neovida-transcribe голосовое.ogg -f txt          # только текст, без таймкодов
  neovida-transcribe https://rutube.ru/video/...   # скачать по ссылке и расшифровать
  neovida-transcribe --check                       # проверить установку и скачать модель

В консоль (stdout) печатается только путь к готовому файлу, всё остальное идёт в stderr.
Путь к последнему результату также лежит в ~/.neovida-transcribe/last.txt.

Как устроено: ffmpeg (встроенный, из imageio-ffmpeg) достаёт звук 16 кГц моно,
длинная запись режется на окна до 20 секунд по самой тихой точке (модель не берёт
куски длиннее 25 секунд), окна распознаются пачками, склеиваются в абзацы с таймкодами.
Ссылки качает yt-dlp (YouTube, VK Видео, Rutube и ещё сотни сайтов).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import wave
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterable, Optional

VERSION = "1.0.0"
TOOL = "neovida-transcribe"

MODEL_REPO = "istupakov/gigaam-v3-onnx"
MODEL_NAME = "gigaam-v3-e2e-rnnt"     # e2e: пунктуация, ё, числа цифрами; rnnt чище ctc на живой речи
MODEL_QUANT = "int8"
MODEL_FILES = [
    "config.json",
    "v3_e2e_rnnt_encoder.int8.onnx",
    "v3_e2e_rnnt_decoder.int8.onnx",
    "v3_e2e_rnnt_joint.int8.onnx",
    "v3_e2e_rnnt_vocab.txt",
]
MODEL_SIZE_MB = 230

SR = 16000
DIRECT_LIMIT_S = 24.0      # до этой длины распознаём одним куском
MAX_SEGMENT_S = 20.0       # предел окна (лимит модели 25 с)
SEARCH_S = 6.0             # в последних N секундах окна ищем самую тихую точку для разреза
FRAME_S = 0.05             # шаг оценки громкости
PARAGRAPH_GAP_S = 2.0      # пауза, по которой окна делятся на абзацы
PARAGRAPH_MAX_S = 60.0     # абзац не длиннее минуты
BATCH = 8                  # окон за один проход модели

MD_MARK = "# Расшифровка"
MEDIA_EXT = {".mp4", ".mov", ".m4a", ".mp3", ".ogg", ".oga", ".opus", ".wav", ".webm", ".mkv",
             ".avi", ".aac", ".flac", ".wma", ".m4v", ".3gp", ".ts", ".amr", ".aiff", ".aif"}

Log = Callable[[str], None]


def tool_home() -> Path:
    env = os.environ.get("NEOVIDA_TRANSCRIBE_HOME")
    return Path(env).expanduser() if env else Path.home() / ".neovida-transcribe"


@dataclass
class Segment:
    start: float
    end: float
    text: str


class UserError(Exception):
    """Понятная человеку ошибка: печатаем текст без трассировки."""


# ---------------------------------------------------------------- чистые функции

def fmt_ts(seconds: float) -> str:
    """0 -> 00:00, 65.4 -> 01:05, 3725 -> 1:02:05."""
    total = int(seconds)
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def _srt_ts(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, rem = divmod(ms, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def group_segments(segments: Iterable[Segment], gap: float = PARAGRAPH_GAP_S,
                   max_para: float = PARAGRAPH_MAX_S) -> list[Segment]:
    """Склеивает соседние окна в абзацы; новый абзац после паузы больше gap или когда абзац перерос max_para."""
    paras: list[Segment] = []
    for s in segments:
        text = (s.text or "").strip()
        if not text:
            continue
        if paras and s.start - paras[-1].end <= gap and s.end - paras[-1].start <= max_para:
            paras[-1].text = f"{paras[-1].text} {text}"
            paras[-1].end = s.end
        else:
            paras.append(Segment(s.start, s.end, text))
    return paras


def render(segments: list[Segment], fmt: str, *, title: str = "", source: str = "",
           duration: float = 0.0, today: Optional[str] = None) -> str:
    if fmt == "srt":
        items = [s for s in segments if s.text.strip()]
        return "\n".join(f"{i}\n{_srt_ts(s.start)} --> {_srt_ts(s.end)}\n{s.text.strip()}\n"
                         for i, s in enumerate(items, 1))
    paras = group_segments(segments)
    if fmt == "txt":
        return "\n\n".join(p.text for p in paras) + "\n"
    if fmt == "md":
        today = today or datetime.now().strftime("%d.%m.%Y")
        head = [
            f"{MD_MARK}: {title}",
            "",
            f"- Источник: {source}",
            f"- Длительность: {fmt_ts(duration)}",
            f"- Расшифровано: {today}, GigaAM v3 локально ({TOOL})",
            "",
            "---",
            "",
        ]
        body = "\n\n".join(f"[{fmt_ts(p.start)}] {p.text}" for p in paras) if paras else "(речь не найдена)"
        return "\n".join(head) + "\n" + body + "\n"
    raise ValueError(f"неизвестный формат: {fmt}")


_URL_RE = re.compile(r"^(https?://|www\.)", re.IGNORECASE)
_BARE_HOSTS = ("youtu.be/", "youtube.com/", "m.youtube.com/", "rutube.ru/", "vk.com/", "vkvideo.ru/",
               "vk.ru/", "ok.ru/", "dzen.ru/", "t.me/")


def normalize_url(s: str) -> Optional[str]:
    """Ссылка -> полный URL; не ссылка -> None. Принимает и ссылки без https:// (youtu.be/..., rutube.ru/...)."""
    s = s.strip().strip("'\"<>")
    if _URL_RE.match(s):
        return s if s.lower().startswith("http") else "https://" + s
    low = s.lower()
    if any(low.startswith(h) for h in _BARE_HOSTS):
        return "https://" + s
    return None


def pick_output(target: Path) -> Path:
    """Куда писать результат, не затирая чужие файлы.

    Свою прошлую расшифровку (.md с нашей шапкой) перезаписываем; чужой файл с тем же
    именем не трогаем и берём «имя (2).md», «имя (3).md»...
    """
    def ours(p: Path) -> bool:
        if p.suffix.lower() != ".md":
            return False
        try:
            with p.open(encoding="utf-8") as f:
                return f.readline().startswith(MD_MARK)
        except (OSError, UnicodeDecodeError):
            return False

    if not target.exists() or ours(target):
        return target
    for i in range(2, 1000):
        cand = target.with_name(f"{target.stem} ({i}){target.suffix}")
        if not cand.exists() or ours(cand):
            return cand
    raise UserError(f"слишком много файлов с именем {target.stem}")


def energy_cuts(pcm, sr: int = SR, max_len: float = MAX_SEGMENT_S, search: float = SEARCH_S,
                frame_s: float = FRAME_S) -> list[int]:
    """Границы окон (в отсчётах): окно не длиннее max_len, разрез в самой тихой точке последних search секунд.

    Громкость считается по кадрам 50 мс кусками, без копии всей записи во float:
    час звука занимает в памяти 115 МБ (int16), а не гигабайты.
    """
    import numpy as np

    n = len(pcm)
    fl = max(int(frame_s * sr), 1)
    if n <= max_len * sr:
        return [0, n]
    nframes = n // fl
    energy = np.empty(nframes, dtype=np.float32)
    chunk = 20_000  # кадров за раз (~17 минут)
    for i in range(0, nframes, chunk):
        j = min(i + chunk, nframes)
        block = pcm[i * fl:j * fl].astype(np.float32).reshape(j - i, fl)
        energy[i:j] = np.mean(block * block, axis=1)
    cuts = [0]
    pos = 0
    while n - pos > max_len * sr:
        lo_f = (pos + int((max_len - search) * sr)) // fl
        hi_f = min((pos + int(max_len * sr)) // fl, nframes)
        if hi_f <= lo_f:
            cut = pos + int(max_len * sr)
        else:
            cut = (lo_f + int(np.argmin(energy[lo_f:hi_f]))) * fl + fl // 2
            cut = min(max(cut, pos + sr), pos + int(max_len * sr))
        cuts.append(cut)
        pos = cut
    cuts.append(n)
    return cuts


# ---------------------------------------------------------------- окружение

def setup_console() -> None:
    """Кириллица в консоли: на Windows при выводе в трубу (агент) пишем UTF-8, неизвестные знаки не роняют скрипт."""
    for stream in (sys.stdout, sys.stderr):
        try:
            if os.name == "nt" and not stream.isatty():
                stream.reconfigure(encoding="utf-8", errors="replace")
            else:
                stream.reconfigure(errors="replace")
        except (AttributeError, ValueError, OSError):
            pass


def find_ffmpeg() -> tuple[str, str]:
    """ffmpeg: встроенный из imageio-ffmpeg (ставится вместе со скриптом), иначе системный."""
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).exists():
            return exe, "встроенный"
    except Exception:  # noqa: BLE001
        pass
    exe = shutil.which("ffmpeg")
    if exe:
        return exe, "системный"
    raise UserError("не нашёл ffmpeg. Переустанови зависимости по SETUP.md (шаг 2).")


def _no_window() -> dict:
    return {"creationflags": 0x08000000} if os.name == "nt" else {}  # CREATE_NO_WINDOW


def to_wav16k(src: Path, work: Path, ffmpeg: str) -> Path:
    """Любой аудио или видео файл -> wav 16 кГц моно PCM16 (то, что ест модель)."""
    dst = work / "audio.16k.wav"
    r = subprocess.run(
        [ffmpeg, "-nostdin", "-y", "-loglevel", "error", "-i", str(src), "-vn", "-map_metadata", "-1",
         "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(dst)],
        capture_output=True, text=True, encoding="utf-8", errors="replace", **_no_window(),
    )
    if r.returncode != 0 or not dst.exists() or dst.stat().st_size <= 44:
        tail = (r.stderr or "").strip().splitlines()[-3:]
        raise UserError(f"не получилось достать звук из {src.name}: " + (" | ".join(tail) or "в файле нет звуковой дорожки"))
    return dst


def read_pcm(wav: Path):
    import numpy as np
    with wave.open(str(wav)) as w:
        if w.getframerate() != SR or w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise UserError("внутренняя ошибка: ожидался wav 16 кГц моно")
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)


# ---------------------------------------------------------------- модель

def model_dir() -> Path:
    return tool_home() / "model" / f"{MODEL_NAME}-{MODEL_QUANT}"


def model_ready(d: Optional[Path] = None) -> bool:
    d = d or model_dir()
    return all((d / f).is_file() and (d / f).stat().st_size > 0 for f in MODEL_FILES)


def ensure_model(log: Log) -> Path:
    """Скачивает модель один раз в ~/.neovida-transcribe/model. Дальше интернет не нужен."""
    d = model_dir()
    if model_ready(d):
        return d
    log(f"Первый запуск: скачиваю модель GigaAM v3 с huggingface.co (около {MODEL_SIZE_MB} МБ, один раз)...")
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    try:
        from huggingface_hub import snapshot_download
        d.mkdir(parents=True, exist_ok=True)
        snapshot_download(MODEL_REPO, local_dir=str(d), allow_patterns=MODEL_FILES)
    except Exception as e:  # noqa: BLE001
        raise UserError(
            f"модель не скачалась: {type(e).__name__}: {e}\n"
            "Проверь интернет. Если huggingface.co не открывается, включи VPN и запусти ещё раз "
            "(докачка продолжится с места обрыва)."
        ) from e
    if not model_ready(d):
        raise UserError(f"модель скачалась не полностью, запусти ещё раз. Папка: {d}")
    log(f"Модель на месте: {d}")
    return d


_ASR = None


def load_asr(log: Log):
    global _ASR
    if _ASR is None:
        d = ensure_model(log)
        import onnx_asr
        import onnxruntime as rt
        rt.set_default_logger_severity(3)
        # Только CPU: на Apple Silicon CoreML режет граф на сотни кусков и работает медленнее.
        _ASR = onnx_asr.load_model(MODEL_NAME, str(d), quantization=MODEL_QUANT,
                                   providers=["CPUExecutionProvider"])
    return _ASR


def transcribe_pcm(asr, pcm, log: Log) -> list[Segment]:
    import numpy as np
    duration = len(pcm) / SR
    if duration <= DIRECT_LIMIT_S:
        text = asr.recognize(pcm.astype(np.float32) / 32768.0, sample_rate=SR)
        return [Segment(0.0, duration, text)]
    cuts = energy_cuts(pcm, SR)
    windows = list(zip(cuts[:-1], cuts[1:]))
    segs: list[Segment] = []
    t0 = time.time()
    last_report = t0
    for i in range(0, len(windows), BATCH):
        batch = windows[i:i + BATCH]
        texts = asr.recognize([pcm[a:b].astype(np.float32) / 32768.0 for a, b in batch], sample_rate=SR)
        segs.extend(Segment(a / SR, b / SR, t) for (a, b), t in zip(batch, texts))
        now = time.time()
        if now - last_report >= 10 or i + BATCH >= len(windows):
            done = batch[-1][1] / SR
            log(f"  расшифровано {fmt_ts(done)} из {fmt_ts(duration)} ({100 * done / duration:.0f}%)")
            last_report = now
    return segs


# ---------------------------------------------------------------- ссылки

def downloads_dir() -> Path:
    d = Path.home() / "Downloads"
    d.mkdir(parents=True, exist_ok=True)
    return d


class _YdlLogger:
    def __init__(self, log: Log):
        self.log = log

    def debug(self, msg: str) -> None:
        pass

    def info(self, msg: str) -> None:
        pass

    def warning(self, msg: str) -> None:
        if "JavaScript runtime" in msg or "ffprobe" in msg.lower():
            return
        self.log(f"  yt-dlp: {msg}")

    def error(self, msg: str) -> None:
        pass  # ошибку печатаем один раз сами, с подсказкой


def _ydl_hint(url: str, err: str) -> str:
    low = err.lower()
    yt = "youtu" in url.lower()
    if any(k in low for k in ("failed to resolve", "nodename", "getaddrinfo", "network is unreachable",
                              "operation not permitted")):
        return ("нет доступа в интернет. Если команду запустил агент, повтори её с разрешением "
                "(вне песочницы, там нет сети). Иначе проверь интернет.")
    if "unsupported url" in low:
        return "этот сайт не поддерживается. Скачай видео вручную и дай путь к файлу."
    if "sign in to confirm" in low or "not a bot" in low:
        return "YouTube просит подтвердить, что ты не робот. Смени сервер VPN или попробуй позже."
    if "geo" in low or "not available in your country" in low or "недоступ" in low:
        return "видео недоступно из твоей страны. Для VK и Rutube выключи VPN, для YouTube включи."
    if "private" in low or "log in" in low or "login" in low or "members" in low:
        return "видео закрытое или только для подписчиков: скачать его без входа нельзя."
    if yt:
        return "YouTube из России без VPN не скачивается: включи VPN и запусти ещё раз."
    return "проверь ссылку и интернет. Если сайт открывается только с VPN, включи VPN."


def download(url: str, out_dir: Path, ffmpeg: str, log: Log) -> tuple[Path, str]:
    """Скачивает звук (или лёгкое видео со звуком) по ссылке. Возвращает (файл, название)."""
    try:
        import yt_dlp
    except ImportError as e:
        raise UserError("для ссылок нужна связка для видео (yt-dlp), она ещё не поставлена. "
                        "Агенту: SETUP.md, шаг 3, https://materials.neovida.ai/ai-tseh/potok-4/transcribe/SETUP.md") from e

    state = {"last": 0.0}

    def hook(d: dict) -> None:
        if d.get("status") == "downloading":
            now = time.time()
            if now - state["last"] >= 5:
                state["last"] = now
                got = d.get("downloaded_bytes") or 0
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                pct = f" ({100 * got / total:.0f}%)" if total else ""
                log(f"  скачано {got / 1e6:.1f} МБ{pct}")

    js = {"deno": {}}
    try:
        import deno
        js = {"deno": {"path": deno.find_deno_bin()}}
    except Exception:  # noqa: BLE001
        pass

    opts = {
        # сначала только звук; если отдельного звука нет, лёгкое видео до 360p со звуком (звук там тот же)
        "format": "bestaudio/best[height<=360]/worst",
        "paths": {"home": str(out_dir), "temp": str(out_dir)},
        "outtmpl": {"default": "%(title).120B [%(id)s].%(ext)s"},
        "windowsfilenames": True,
        "noplaylist": True,
        "noprogress": True,
        "quiet": True,
        "no_warnings": False,
        "logger": _YdlLogger(log),
        "progress_hooks": [hook],
        "ffmpeg_location": ffmpeg,
        "socket_timeout": 30,
        "retries": 5,
        "fragment_retries": 10,
        "js_runtimes": js,
        "overwrites": False,
    }
    log(f"Скачиваю по ссылке: {url}")
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if info is None:
                raise UserError("yt-dlp ничего не вернул по этой ссылке")
            if info.get("_type") == "playlist":
                entries = [e for e in (info.get("entries") or []) if e]
                if not entries:
                    raise UserError("по ссылке плейлист без видео")
                info = entries[0]
            reqs = info.get("requested_downloads") or []
            path = Path(reqs[0]["filepath"]) if reqs and reqs[0].get("filepath") else Path(ydl.prepare_filename(info))
    except UserError:
        raise
    except Exception as e:  # noqa: BLE001
        msg = str(e)
        first = (msg.splitlines()[0] if msg else type(e).__name__)[:300]
        raise UserError(f"не скачалось: {first}\n{_ydl_hint(url, msg)}") from e
    if not path.exists():
        raise UserError(f"yt-dlp сообщил об успехе, но файла нет: {path}")
    title = info.get("title") or path.stem
    log(f"Скачано: {path.name} ({path.stat().st_size / 1e6:.1f} МБ)")
    return path, title


# ---------------------------------------------------------------- один вход

def process(item: str, args, ffmpeg: str, log: Log) -> Path:
    url = normalize_url(item)
    if url:
        out_dir = Path(args.out_dir).expanduser() if args.out_dir else downloads_dir()
        out_dir.mkdir(parents=True, exist_ok=True)
        src, title = download(url, out_dir, ffmpeg, log)
        source = url
    else:
        src = Path(item.strip().strip("'\"")).expanduser()
        if not src.exists():
            raise UserError(f"нет такого файла: {src}")
        if src.is_dir():
            raise UserError(f"это папка, а нужен файл: {src}")
        src = src.resolve()
        out_dir = Path(args.out_dir).expanduser() if args.out_dir else src.parent
        title, source = src.stem, str(src)
        if src.suffix.lower() not in MEDIA_EXT:
            log(f"Расширение {src.suffix or '(нет)'} необычное, пробую как аудио или видео.")

    t0 = time.time()
    with tempfile.TemporaryDirectory(prefix="neovida-transcribe-") as tmp:
        log(f"Достаю звук: {src.name}")
        wav = to_wav16k(src, Path(tmp), ffmpeg)
        pcm = read_pcm(wav)
    duration = len(pcm) / SR
    if duration < 0.3:
        raise UserError(f"в файле {src.name} нет звука или он короче полсекунды")
    asr = load_asr(log)
    log(f"Расшифровываю {fmt_ts(duration)} записи моделью GigaAM v3...")
    segs = transcribe_pcm(asr, pcm, log)
    text = render(segs, args.format, title=title, source=source, duration=duration)

    if args.out and len(args.inputs) == 1:
        dst = Path(args.out).expanduser()
    else:
        dst = pick_output(out_dir / f"{src.stem}.{args.format}")
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(text, encoding="utf-8")
    except OSError as e:
        raise UserError(f"не получилось сохранить {dst}: {e}\n"
                        "Нет прав на запись в эту папку. Агенту: повтори команду с разрешением "
                        "(вне песочницы) или укажи другую папку через --out-dir.") from e
    elapsed = time.time() - t0
    speed = duration / elapsed if elapsed else 0
    log(f"Готово за {elapsed:.0f} с (запись {fmt_ts(duration)}, в {speed:.0f} раз быстрее реального времени).")
    if url and args.delete_media:
        try:
            src.unlink()
        except OSError:
            pass
    return dst.resolve()


# ---------------------------------------------------------------- проверка установки

def check(log: Log) -> int:
    import platform
    log(f"{TOOL} {VERSION}, Python {platform.python_version()}, {platform.system()} {platform.machine()}")
    ffmpeg, kind = find_ffmpeg()
    r = subprocess.run([ffmpeg, "-version"], capture_output=True, text=True, encoding="utf-8",
                       errors="replace", **_no_window())
    log(f"ffmpeg ({kind}): {(r.stdout.splitlines() or ['?'])[0]}")
    try:
        import yt_dlp.version
        log(f"yt-dlp (ссылки): {yt_dlp.version.__version__}")
        try:
            import deno
            log(f"deno для YouTube: {deno.find_deno_bin()}")
        except Exception:  # noqa: BLE001
            log("deno для YouTube: нет (YouTube может качаться хуже, остальные сайты работают)")
    except Exception:  # noqa: BLE001
        log("yt-dlp (ссылки): ещё не поставлен, это связка для видео, следующий шаг. Файлы уже работают.")
    t0 = time.time()
    load_asr(log)
    log(f"Модель GigaAM v3 загружена за {time.time() - t0:.1f} с. Всё готово.")
    print(str(model_dir()))
    return 0


# ---------------------------------------------------------------- CLI

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog=TOOL,
        description="Видео и аудио в текст на русском, локально, моделью GigaAM v3 (Сбер). NEOVIDA, AI Цех.",
    )
    p.add_argument("inputs", nargs="*", help="файлы (mp4, mov, m4a, mp3, ogg, wav...) или ссылки (YouTube, VK Видео, Rutube...)")
    p.add_argument("-f", "--format", choices=["md", "txt", "srt"], default="md",
                   help="md: абзацы с таймкодами (по умолчанию), txt: только текст, srt: субтитры")
    p.add_argument("-o", "--out", help="куда сохранить результат (только для одного входа)")
    p.add_argument("--out-dir", help="папка для результатов (по умолчанию рядом с файлом, для ссылок: Загрузки)")
    p.add_argument("--delete-media", action="store_true", help="для ссылок: удалить скачанное видео после расшифровки")
    p.add_argument("--check", action="store_true", help="проверить установку и скачать модель")
    p.add_argument("--quiet", action="store_true", help="без сообщений о ходе работы")
    p.add_argument("--version", action="version", version=f"{TOOL} {VERSION}")
    return p


def main(argv: Optional[list[str]] = None) -> int:
    setup_console()
    args = build_parser().parse_args(argv)
    log: Log = (lambda m: None) if args.quiet else (lambda m: print(m, file=sys.stderr, flush=True))
    try:
        if args.check:
            return check(log)
        if not args.inputs:
            build_parser().print_help(sys.stderr)
            return 2
        if args.out and len(args.inputs) > 1:
            raise UserError("-o работает только с одним входом, для нескольких используй --out-dir")
        ffmpeg, _ = find_ffmpeg()
        results: list[Path] = []
        failed = 0
        for item in args.inputs:
            try:
                dst = process(item, args, ffmpeg, log)
                results.append(dst)
                print(str(dst), flush=True)
            except UserError as e:
                failed += 1
                print(f"Ошибка: {e}", file=sys.stderr, flush=True)
        if results:
            try:  # в песочнице агента папка может быть только для чтения: это не ошибка
                home = tool_home()
                home.mkdir(parents=True, exist_ok=True)
                (home / "last.txt").write_text("\n".join(str(r) for r in results) + "\n", encoding="utf-8")
            except OSError:
                pass
        return 1 if failed else 0
    except UserError as e:
        print(f"Ошибка: {e}", file=sys.stderr, flush=True)
        return 1
    except KeyboardInterrupt:
        print("Остановлено.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
